import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  HeatzyAPIConfig,
  RequestCompleteEvent,
  RequestErrorEvent,
  RequestRetryEvent,
  RequestStartEvent,
  SettingManager,
  SyncCallback,
} from '../../src/api/types.ts'
import type { HttpResponse } from '../../src/http/index.ts'
import type {
  Attributes,
  DeviceBinding,
  DevicePostDataAny,
  LoginData,
} from '../../src/types/index.ts'
import { HeatzyAPI, toAuthFailure } from '../../src/api/heatzy.ts'
import { Mode } from '../../src/constants.ts'
import { AuthenticationError, ValidationError } from '../../src/errors/index.ts'
import { Temporal } from '../../src/temporal.ts'
import { buildBinding, buildLoginData, proAttributes } from '../fixtures.ts'
import {
  createLogger,
  createMockHttpClient,
  createServerError,
  createSettingStore,
  mockResponse,
  mockTemporalNowInstant,
} from '../helpers.ts'

const { client: mockHttpClient, requestSpy: mockRequest } =
  createMockHttpClient('https://euapi.gizwits.com/app')

const LOGIN_BACKOFF_MS = 900_000

// Routes the three Heatzy endpoints to canned success responses so
// multi-request flows (login → bindings → devdata per binding) resolve
// without per-call mock choreography.
const mockWire = ({
  attributes = proAttributes,
  bindings = [buildBinding()],
  loginData,
}: {
  attributes?: Attributes
  bindings?: readonly DeviceBinding[]
  loginData?: LoginData
} = {}): void => {
  mockRequest.mockImplementation(async (config) => {
    await Promise.resolve()
    if (config.url === '/login') {
      return mockResponse(loginData ?? buildLoginData())
    }
    if (config.url === '/bindings') {
      return mockResponse({ devices: bindings })
    }
    if (config.url?.startsWith('/devdata/') === true) {
      return mockResponse({ attr: attributes })
    }
    return mockResponse({})
  })
}

// Rejects every endpoint with the HTTP 400 Gizwits answers for an
// invalid token and rejected credentials alike.
const mockRejectedWire = (): void => {
  mockRequest.mockImplementation(async (config) => {
    await Promise.resolve()
    throw createServerError(400, config.url ?? '/')
  })
}

const loginCalls = (): number =>
  mockRequest.mock.calls.filter(([config]) => config.url === '/login').length

const createApi = async (config: HeatzyAPIConfig = {}): Promise<HeatzyAPI> =>
  HeatzyAPI.create({
    logger: createLogger(),
    syncIntervalMinutes: false,
    transport: mockHttpClient,
    ...config,
  })

// Builds an api over an initially-empty store, then persists a token —
// authenticated without any create-time wire traffic.
const createAuthedApi = async (
  config: HeatzyAPIConfig = {},
): Promise<{ api: HeatzyAPI; settingManager: SettingManager }> => {
  const { settingManager } = createSettingStore()
  const api = await createApi({ settingManager, ...config })
  settingManager.set('token', 'user-token')
  return { api, settingManager }
}

// A store whose reads blow up — drives the fire-and-forget failure
// path of the background session restore.
const createExplodingSettingManager = (): SettingManager => ({
  get: vi.fn<SettingManager['get']>().mockImplementation(() => {
    throw new Error('storage exploded')
  }),
  set: vi.fn<SettingManager['set']>(),
})

describe(HeatzyAPI, () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockTemporalNowInstant()
    mockRequest.mockReset()
    mockRequest.mockResolvedValue(mockResponse({}))
  })

  afterEach(() => {
    vi.mocked(Temporal.Now.instant).mockRestore()
    vi.useRealTimers()
  })

  describe('construction and configuration', () => {
    it('builds a fetch-backed transport when none is injected', async () => {
      const api = await HeatzyAPI.create()

      expect(api.isAuthenticated()).toBe(false)
      expect(api.registry.getDevices()).toHaveLength(0)
      expect(mockRequest).not.toHaveBeenCalled()
    })

    it.each([
      { label: 'the default timeout', transport: {} },
      { label: 'a custom timeout', transport: { timeoutMs: 1000 } },
    ])('builds a fetch-backed transport with $label', async ({ transport }) => {
      const api = await HeatzyAPI.create({
        syncIntervalMinutes: false,
        transport,
      })

      expect(api.isAuthenticated()).toBe(false)
    })

    it('exposes the configured locale and timezone', async () => {
      const api = await createApi({
        locale: 'fr-FR',
        timezone: 'Europe/Paris',
      })

      expect(api.locale).toBe('fr-FR')
      expect(api.timezone).toBe('Europe/Paris')
    })

    it('exposes undefined locale and timezone when unset', async () => {
      const api = await createApi()

      expect(api.locale).toBeUndefined()
      expect(api.timezone).toBeUndefined()
      expect(api.registry.getDevices()).toHaveLength(0)
    })
  })

  describe('session restore at create()', () => {
    it('restores the persisted session before create() returns', async () => {
      const { settingManager } = createSettingStore({ token: 'user-token' })
      mockWire()
      const api = await createApi({ settingManager })

      expect(api.isAuthenticated()).toBe(true)
      expect(api.registry.getDevices()).toHaveLength(1)
      expect(loginCalls()).toBe(0)
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: { 'X-Gizwits-User-token': 'user-token' },
          method: 'get',
          url: '/bindings',
        }),
      )
    })

    it('defers the session restore to the background when configured', async () => {
      const { settingManager } = createSettingStore({ token: 'user-token' })
      mockWire()
      const bindingsGate: PromiseWithResolvers<HttpResponse> =
        Promise.withResolvers()
      mockRequest.mockImplementationOnce(async () => bindingsGate.promise)
      const api = await createApi({
        settingManager,
        shouldResumeSessionInBackground: true,
      })

      // The reuse probe is still awaiting `/bindings`, yet create()
      // already resolved — the restore runs off the critical path.
      expect(api.registry.getDevices()).toHaveLength(0)

      bindingsGate.resolve(mockResponse({ devices: [buildBinding()] }))
      await vi.advanceTimersByTimeAsync(0)

      expect(api.registry.getDevices()).toHaveLength(1)
      expect(loginCalls()).toBe(0)
    })

    it('logs a background restore failure instead of throwing', async () => {
      const logger = createLogger()
      const api = await createApi({
        logger,
        settingManager: createExplodingSettingManager(),
        shouldResumeSessionInBackground: true,
      })
      await vi.advanceTimersByTimeAsync(0)

      expect(api.registry.getDevices()).toHaveLength(0)
      expect(logger.error).toHaveBeenCalledWith(
        'Background session resume failed:',
        expect.any(Error),
      )
    })

    it('runs the restore when start() is called without arguments', async () => {
      const { api } = await createAuthedApi()
      mockWire()
      await api.start()

      expect(api.registry.getDevices()).toHaveLength(1)
      expect(loginCalls()).toBe(0)
    })

    it('keeps the session when the boot-time probe fails transiently', async () => {
      const logger = createLogger()
      const onAuthenticationLost = vi.fn<() => void>()
      const { settingManager } = createSettingStore({ token: 'user-token' })
      mockRequest.mockRejectedValue(createServerError(500, '/bindings'))
      const api = await createApi({
        events: { onAuthenticationLost },
        logger,
        settingManager,
      })

      expect(api.isAuthenticated()).toBe(true)
      expect(loginCalls()).toBe(0)
      expect(onAuthenticationLost).not.toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to fetch devices:',
        expect.any(Error),
      )
    })

    it('signs out silently when the persisted token is rejected without credentials', async () => {
      const onAuthenticationLost = vi.fn<() => void>()
      const { settingManager } = createSettingStore({
        token: 'rejected-token',
      })
      mockRejectedWire()
      const api = await createApi({
        events: { onAuthenticationLost },
        settingManager,
      })

      expect(api.isAuthenticated()).toBe(false)
      expect(settingManager.get('token')).toBe('')
      expect(onAuthenticationLost).not.toHaveBeenCalled()
      expect(api.registry.getDevices()).toHaveLength(0)
    })

    it('falls back to a full sign-in from persisted credentials', async () => {
      const { settingManager } = createSettingStore({
        password: 'secret',
        username: 'user@test.com',
      })
      mockWire()
      const api = await createApi({ settingManager })

      expect(api.isAuthenticated()).toBe(true)
      expect(loginCalls()).toBe(1)
      expect(api.registry.getDevices()).toHaveLength(1)
    })

    it('emits onAuthenticationLost once when the boot-time restore fails', async () => {
      const onAuthenticationLost = vi.fn<() => void>()
      const { settingManager } = createSettingStore({
        password: 'secret',
        username: 'user@test.com',
      })
      mockRejectedWire()
      const api = await createApi({
        events: { onAuthenticationLost },
        settingManager,
      })

      expect(api.isAuthenticated()).toBe(false)
      expect(onAuthenticationLost).toHaveBeenCalledTimes(1)
      expect(Number(settingManager.get('loginBackoffUntil'))).toBe(
        Date.now() + LOGIN_BACKOFF_MS,
      )
    })

    it('stays in a documented empty state with nothing persisted', async () => {
      const onAuthenticationLost = vi.fn<() => void>()
      const api = await createApi({
        events: { onAuthenticationLost },
        settingManager: createSettingStore().settingManager,
      })

      expect(api.isAuthenticated()).toBe(false)
      expect(api.registry.getDevices()).toHaveLength(0)
      expect(onAuthenticationLost).not.toHaveBeenCalled()
      expect(mockRequest).not.toHaveBeenCalled()
    })

    it.each([
      { missing: 'password', partial: { username: 'user@test.com' } },
      { missing: 'username', partial: { password: 'secret' } },
    ])(
      'stays signed out when the $missing is not configured',
      async ({ partial }) => {
        const api = await createApi(partial)

        expect(api.isAuthenticated()).toBe(false)
        expect(mockRequest).not.toHaveBeenCalled()
      },
    )
  })

  describe('authenticate()', () => {
    it('signs in with verbatim credentials and persists the session', async () => {
      vi.setSystemTime(
        Temporal.Instant.from('2023-11-01T00:00:00Z').epochMilliseconds,
      )
      const { setSpy, settingManager } = createSettingStore()
      const api = await createApi({ settingManager })
      mockWire({
        loginData: { expire_at: 1_700_000_000, token: 'fresh-token' },
      })

      await api.authenticate({ password: 'secret', username: 'user@test.com' })

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { password: 'secret', username: 'user@test.com' },
          headers: {},
          method: 'post',
          url: '/login',
        }),
      )
      expect(setSpy).toHaveBeenCalledWith('username', 'user@test.com')
      expect(setSpy).toHaveBeenCalledWith('password', 'secret')
      expect(settingManager.get('token')).toBe('fresh-token')
      // `expire_at` arrives in epoch seconds and must be persisted as
      // an absolute ISO 8601 instant.
      expect(settingManager.get('expiry')).toBe('2023-11-14T22:13:20Z')
      expect(api.isAuthenticated()).toBe(true)
      // The post-auth registry sync is enforced by authenticate().
      expect(api.registry.devices.getById('did-pro')?.name).toBe('Radiator pro')
    })

    it('throws AuthenticationError and arms the backoff when the sign-in is rejected', async () => {
      const { settingManager } = createSettingStore()
      const api = await createApi({ settingManager })
      mockRejectedWire()

      await expect(
        api.authenticate({ password: 'wrong', username: 'user@test.com' }),
      ).rejects.toBeInstanceOf(AuthenticationError)

      expect(api.isAuthenticated()).toBe(false)
      expect(settingManager.get('token')).toBe('')
      expect(Number(settingManager.get('loginBackoffUntil'))).toBe(
        Date.now() + LOGIN_BACKOFF_MS,
      )
    })
  })

  describe('automatic login backoff', () => {
    it('pauses automatic sign-ins for 15 minutes after a rejected login', async () => {
      const { settingManager } = createSettingStore()
      const api = await createApi({ settingManager })
      settingManager.set('password', 'secret')
      settingManager.set('username', 'user@test.com')
      mockRejectedWire()

      await expect(api.resumeSession()).resolves.toBe(false)

      expect(Number(settingManager.get('loginBackoffUntil'))).toBe(
        Date.now() + LOGIN_BACKOFF_MS,
      )

      mockRequest.mockClear()

      await expect(api.resumeSession()).resolves.toBe(false)

      expect(mockRequest).not.toHaveBeenCalled()
    })

    it('retries automatic sign-ins once the pause has elapsed', async () => {
      const { settingManager } = createSettingStore()
      const api = await createApi({ settingManager })
      settingManager.set('password', 'secret')
      settingManager.set('username', 'user@test.com')
      mockRejectedWire()

      await expect(api.resumeSession()).resolves.toBe(false)

      mockWire()
      vi.advanceTimersByTime(LOGIN_BACKOFF_MS + 1)

      await expect(api.resumeSession()).resolves.toBe(true)

      expect(api.isAuthenticated()).toBe(true)
    })

    it('does not arm the pause on a transport failure', async () => {
      const { settingManager } = createSettingStore()
      const api = await createApi({ settingManager })
      settingManager.set('password', 'secret')
      settingManager.set('username', 'user@test.com')
      mockRequest.mockRejectedValue(createServerError(500, '/login'))

      await expect(api.resumeSession()).resolves.toBe(false)

      expect(settingManager.get('loginBackoffUntil')).toBeNull()

      await expect(api.resumeSession()).resolves.toBe(false)

      expect(loginCalls()).toBe(2)
    })

    it('reads a corrupt persisted pause as no pause', async () => {
      const { settingManager } = createSettingStore()
      const api = await createApi({ settingManager })
      settingManager.set('loginBackoffUntil', 'garbage')
      settingManager.set('password', 'secret')
      settingManager.set('username', 'user@test.com')
      mockWire()

      await expect(api.resumeSession()).resolves.toBe(true)

      expect(loginCalls()).toBe(1)
    })

    it('lets an explicit sign-in through the pause and clears it on success', async () => {
      const { settingManager } = createSettingStore()
      const api = await createApi({ settingManager })
      mockRejectedWire()

      await expect(
        api.authenticate({ password: 'wrong', username: 'user@test.com' }),
      ).rejects.toBeInstanceOf(AuthenticationError)
      await expect(api.resumeSession()).resolves.toBe(false)

      mockWire()
      await api.authenticate({ password: 'right', username: 'user@test.com' })

      expect(api.isAuthenticated()).toBe(true)
      expect(settingManager.get('loginBackoffUntil')).toBe('')

      await expect(api.resumeSession()).resolves.toBe(true)
    })
  })

  describe('logOut()', () => {
    it('clears the session, credentials, backoff and registry through unset', async () => {
      const { settingManager, unsetSpy } = createSettingStore(
        {
          loginBackoffUntil: '123',
          password: 'secret',
          token: 'user-token',
          username: 'user@test.com',
        },
        { hasUnset: true },
      )
      mockWire()
      const api = await createApi({ settingManager, syncIntervalMinutes: 1 })

      expect(api.registry.getDevices()).toHaveLength(1)
      expect(vi.getTimerCount()).toBe(1)

      api.logOut()

      expect(api.isAuthenticated()).toBe(false)
      expect(api.registry.getDevices()).toHaveLength(0)
      expect(vi.getTimerCount()).toBe(0)
      expect(unsetSpy).toHaveBeenCalledWith('token')
      expect(unsetSpy).toHaveBeenCalledWith('expiry')
      expect(unsetSpy).toHaveBeenCalledWith('username')
      expect(unsetSpy).toHaveBeenCalledWith('password')
      expect(unsetSpy).toHaveBeenCalledWith('loginBackoffUntil')
      expect(settingManager.get('username')).toBeNull()
    })

    it('falls back to storing empty strings when the host has no unset', async () => {
      const { setSpy, settingManager } = createSettingStore({
        password: 'secret',
        token: 'user-token',
        username: 'user@test.com',
      })
      mockWire()
      const api = await createApi({ settingManager })
      setSpy.mockClear()
      api.logOut()

      expect(setSpy).toHaveBeenCalledWith('token', '')
      expect(setSpy).toHaveBeenCalledWith('username', '')
      expect(setSpy).toHaveBeenCalledWith('password', '')
      expect(settingManager.get('password')).toBe('')

      mockRequest.mockClear()

      await expect(api.resumeSession()).resolves.toBe(false)

      expect(mockRequest).not.toHaveBeenCalled()
    })

    it('discards a sign-in that was in flight when logOut ran', async () => {
      const { settingManager } = createSettingStore()
      const api = await createApi({ settingManager })
      const loginGate: PromiseWithResolvers<HttpResponse> =
        Promise.withResolvers()
      mockRequest.mockImplementationOnce(async () => loginGate.promise)
      const loginPromise = api.authenticate({
        password: 'secret',
        username: 'user@test.com',
      })
      api.logOut()
      loginGate.resolve(mockResponse(buildLoginData()))
      await loginPromise

      // The explicit sign-out wins: the landed login is discarded and
      // the enforced post-auth fetch never runs.
      expect(api.isAuthenticated()).toBe(false)
      expect(settingManager.get('username')).toBe('')
      expect(settingManager.get('token')).toBe('')
      expect(mockRequest).toHaveBeenCalledTimes(1)
    })

    it('re-wipes the registry when logOut lands during an in-flight fetch', async () => {
      const { api, settingManager } = await createAuthedApi()
      mockWire()
      await api.fetch()

      expect(api.registry.getDevices()).toHaveLength(1)

      const bindingsGate: PromiseWithResolvers<HttpResponse> =
        Promise.withResolvers()
      mockRequest.mockImplementationOnce(async () => bindingsGate.promise)
      const fetchPromise = api.fetch()
      api.logOut()
      bindingsGate.resolve(mockResponse({ devices: [buildBinding()] }))
      const bindings = await fetchPromise

      // The cycle completed with the pre-sign-out session and
      // repopulated the registry — the settle re-runs the wipe.
      expect(bindings).toHaveLength(1)
      expect(api.registry.getDevices()).toHaveLength(0)
      expect(api.isAuthenticated()).toBe(false)
      expect(settingManager.get('token')).toBe('')
    })
  })

  describe('fetch()', () => {
    it('fetches bindings and live attributes and syncs the registry', async () => {
      const { api } = await createAuthedApi()
      const binding = buildBinding('pro')
      mockWire({ bindings: [binding] })
      const bindings = await api.fetch()

      expect(bindings).toStrictEqual([binding])
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'get', url: '/bindings' }),
      )
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'get',
          url: '/devdata/did-pro/latest',
        }),
      )

      const device = api.registry.devices.getById('did-pro')

      expect(device?.name).toBe('Radiator pro')
      expect(device?.data).toStrictEqual(proAttributes)
    })

    it('logs and returns an empty list when the fetch fails', async () => {
      const logger = createLogger()
      const { api } = await createAuthedApi({ logger })
      mockRequest.mockRejectedValue(new Error('network down'))

      await expect(api.fetch()).resolves.toStrictEqual([])

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to fetch devices:',
        expect.any(Error),
      )
    })

    it('notifies onSyncComplete after each fetch', async () => {
      const onSyncComplete = vi.fn<SyncCallback>().mockResolvedValue(undefined)
      const { api } = await createAuthedApi({ events: { onSyncComplete } })
      mockWire()
      await api.fetch()

      expect(onSyncComplete).toHaveBeenCalledTimes(1)
      expect(onSyncComplete).toHaveBeenCalledWith()
    })

    it('re-arms the auto-sync timer after an authenticated cycle', async () => {
      const { settingManager } = createSettingStore({ token: 'user-token' })
      mockWire()
      const api = await createApi({ settingManager, syncIntervalMinutes: 1 })
      mockRequest.mockClear()
      await vi.advanceTimersByTimeAsync(60_000)

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'get', url: '/bindings' }),
      )

      api[Symbol.dispose]()
    })

    it('emits onAuthenticationLost once per loss episode and disarms the auto-sync', async () => {
      const onAuthenticationLost = vi.fn<() => void>()
      const { settingManager } = createSettingStore()
      const api = await createApi({
        events: { onAuthenticationLost },
        settingManager,
        syncIntervalMinutes: 1,
      })
      settingManager.set('password', 'secret')
      settingManager.set('username', 'user@test.com')
      mockRejectedWire()

      await expect(api.fetch()).resolves.toStrictEqual([])
      await expect(api.fetch()).resolves.toStrictEqual([])

      expect(onAuthenticationLost).toHaveBeenCalledTimes(1)

      mockRequest.mockClear()
      await vi.advanceTimersByTimeAsync(120_000)

      expect(mockRequest).not.toHaveBeenCalled()
    })

    it('alternates onAuthenticationLost and onAuthenticationRestored across episodes', async () => {
      const onAuthenticationLost = vi.fn<() => void>()
      const onAuthenticationRestored = vi.fn<() => void>()
      const { settingManager } = createSettingStore()
      const api = await createApi({
        events: { onAuthenticationLost, onAuthenticationRestored },
        settingManager,
      })
      settingManager.set('password', 'secret')
      settingManager.set('username', 'user@test.com')
      mockRejectedWire()

      await expect(api.fetch()).resolves.toStrictEqual([])

      expect(onAuthenticationLost).toHaveBeenCalledTimes(1)
      expect(onAuthenticationRestored).not.toHaveBeenCalled()

      mockWire()
      await api.authenticate({ password: 'secret', username: 'user@test.com' })

      expect(onAuthenticationRestored).toHaveBeenCalledTimes(1)

      await api.fetch()

      expect(onAuthenticationRestored).toHaveBeenCalledTimes(1)

      // Refill the auth-retry guard, then fail a new cycle: a fresh
      // loss episode announces itself again.
      vi.advanceTimersByTime(1500)
      mockRejectedWire()

      await expect(api.fetch()).resolves.toStrictEqual([])

      expect(onAuthenticationLost).toHaveBeenCalledTimes(2)
    })
  })

  describe('session freshness', () => {
    it('re-signs in pre-emptively and deduplicates concurrent refreshes', async () => {
      const { api, settingManager } = await createAuthedApi()
      settingManager.set('expiry', '2000-01-01T00:00:00Z')
      settingManager.set('password', 'secret')
      settingManager.set('username', 'user@test.com')
      mockWire({ bindings: [] })
      const [first, second] = await Promise.all([
        api.getValues({ id: 'did-a' }),
        api.getValues({ id: 'did-b' }),
      ])

      expect(first).toStrictEqual(proAttributes)
      expect(second).toStrictEqual(proAttributes)
      // Single-flight: the two concurrent calls share one refresh.
      expect(loginCalls()).toBe(1)
      expect(mockRequest.mock.calls[0]?.[0].url).toBe('/login')
    })

    it('does not refresh a fresh session before a request', async () => {
      const { api, settingManager } = await createAuthedApi()
      settingManager.set('expiry', '2999-01-01T00:00:00Z')
      mockWire()
      const attributes = await api.getValues({ id: 'did-pro' })

      expect(attributes).toStrictEqual(proAttributes)
      expect(loginCalls()).toBe(0)
      expect(mockRequest).toHaveBeenCalledTimes(1)
    })
  })

  describe('auth-retry pipeline', () => {
    it('re-authenticates from persisted credentials and replays once on HTTP 400', async () => {
      const { api, settingManager } = await createAuthedApi()
      settingManager.set('password', 'secret')
      settingManager.set('username', 'user@test.com')
      mockWire({ bindings: [] })
      mockRequest.mockRejectedValueOnce(
        createServerError(400, '/devdata/did-pro/latest'),
      )
      const attributes = await api.getValues({ id: 'did-pro' })

      expect(attributes).toStrictEqual(proAttributes)
      expect(loginCalls()).toBe(1)
      // Failed read, login, post-auth /bindings, replayed read.
      expect(mockRequest).toHaveBeenCalledTimes(4)
    })

    it('does not re-authenticate on a plain 500 failure', async () => {
      const logger = createLogger()
      const { api, settingManager } = await createAuthedApi({ logger })
      settingManager.set('password', 'secret')
      settingManager.set('username', 'user@test.com')
      mockRequest.mockRejectedValue(
        createServerError(500, '/devdata/did-pro/latest'),
      )

      await expect(api.getValues({ id: 'did-pro' })).rejects.toThrow(
        'Status 500',
      )

      expect(mockRequest).toHaveBeenCalledTimes(1)
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Status 500'),
      )
    })

    it('propagates non-HTTP errors without API-call error logging', async () => {
      const logger = createLogger()
      const { api } = await createAuthedApi({ logger })
      mockRequest.mockRejectedValue(new Error('socket hang up'))

      await expect(api.getValues({ id: 'did-pro' })).rejects.toThrow(
        'socket hang up',
      )

      expect(logger.error).not.toHaveBeenCalled()
    })
  })

  describe('endpoints and validation', () => {
    it('lists bindings without touching the registry', async () => {
      const { api } = await createAuthedApi()
      const binding = buildBinding('v2')
      mockRequest.mockResolvedValue(mockResponse({ devices: [binding] }))
      const devices = await api.list()

      expect(devices).toStrictEqual([binding])
      expect(api.registry.getDevices()).toHaveLength(0)
    })

    it('rejects a malformed /bindings payload with a ValidationError', async () => {
      const { api } = await createAuthedApi()
      mockRequest.mockResolvedValue(mockResponse({ bindings: 'nope' }))
      const listPromise = api.list()

      await expect(listPromise).rejects.toBeInstanceOf(ValidationError)
      await expect(listPromise).rejects.toMatchObject({
        context: 'GET /bindings',
      })
    })

    it('rejects a malformed /devdata payload with a ValidationError', async () => {
      const { api } = await createAuthedApi()
      mockRequest.mockResolvedValue(mockResponse({ attr: { mode: 'nope' } }))
      const valuesPromise = api.getValues({ id: 'did-pro' })

      await expect(valuesPromise).rejects.toBeInstanceOf(ValidationError)
      await expect(valuesPromise).rejects.toMatchObject({
        context: 'GET /devdata/did-pro/latest',
      })
    })

    it.each<{ dialect: string; postData: DevicePostDataAny }>([
      { dialect: 'named-attributes', postData: { attrs: { mode: Mode.eco } } },
      { dialect: 'V1 raw-triplet', postData: { raw: [1, 1, 3] } },
    ])(
      'posts the $dialect dialect to /control verbatim',
      async ({ postData }) => {
        const { api } = await createAuthedApi()
        mockRequest.mockResolvedValue(mockResponse({}))
        const data = await api.updateValues({ id: 'did-pro', postData })

        expect(data).toStrictEqual({})
        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            data: postData,
            method: 'post',
            url: '/control/did-pro',
          }),
        )
      },
    )

    it('returns the parsed login payload', async () => {
      const api = await createApi()
      const loginData = buildLoginData(1_700_000_000)
      mockRequest.mockResolvedValue(mockResponse(loginData))

      await expect(
        api.login({
          postData: { password: 'secret', username: 'user@test.com' },
        }),
      ).resolves.toStrictEqual(loginData)
    })

    it('rejects a malformed login payload with a ValidationError', async () => {
      const api = await createApi()
      mockRequest.mockResolvedValue(mockResponse({ token: 'user-token' }))
      const loginPromise = api.login({
        postData: { password: 'secret', username: 'user@test.com' },
      })

      await expect(loginPromise).rejects.toBeInstanceOf(ValidationError)
      await expect(loginPromise).rejects.toMatchObject({ context: 'login' })
    })
  })

  describe('request lifecycle events', () => {
    it('emits onRequestStart and onRequestComplete with a shared correlationId', async () => {
      const onRequestComplete = vi.fn<(event: RequestCompleteEvent) => void>()
      const onRequestStart = vi.fn<(event: RequestStartEvent) => void>()
      const { api } = await createAuthedApi({
        events: { onRequestComplete, onRequestStart },
      })
      mockRequest.mockResolvedValue(mockResponse({ attr: proAttributes }))
      await api.getValues({ id: 'did-pro' })

      expect(onRequestStart).toHaveBeenCalledTimes(1)
      expect(onRequestComplete).toHaveBeenCalledTimes(1)

      const startEvent = onRequestStart.mock.calls[0]?.[0]
      const completeEvent = onRequestComplete.mock.calls[0]?.[0]

      expect(startEvent?.correlationId).toBeTypeOf('string')
      expect(startEvent?.method).toBe('GET')
      expect(startEvent?.url).toBe('/devdata/did-pro/latest')
      expect(completeEvent?.correlationId).toBe(startEvent?.correlationId)
      expect(completeEvent?.status).toBe(200)
      expect(completeEvent?.durationMs).toBeTypeOf('number')
    })

    it('emits onRequestError when a request fails permanently', async () => {
      const onRequestError = vi.fn<(event: RequestErrorEvent) => void>()
      const { api } = await createAuthedApi({ events: { onRequestError } })
      const failure = createServerError(500, '/devdata/did-pro/latest')
      mockRequest.mockRejectedValue(failure)

      await expect(api.getValues({ id: 'did-pro' })).rejects.toThrow(
        'Status 500',
      )

      expect(onRequestError).toHaveBeenCalledTimes(1)

      const errorEvent = onRequestError.mock.calls[0]?.[0]

      expect(errorEvent?.error).toBe(failure)
      expect(errorEvent?.durationMs).toBeTypeOf('number')
    })

    it('emits onRequestRetry for a transient 502 GET with the same correlationId', async () => {
      const logger = createLogger()
      const onRequestRetry = vi.fn<(event: RequestRetryEvent) => void>()
      const onRequestStart = vi.fn<(event: RequestStartEvent) => void>()
      const { api } = await createAuthedApi({
        events: { onRequestRetry, onRequestStart },
        logger,
      })
      mockRequest
        .mockRejectedValueOnce(createServerError(502, '/bindings'))
        .mockResolvedValueOnce(mockResponse({ devices: [] }))
      const listPromise = api.list()
      await vi.advanceTimersByTimeAsync(2000)

      await expect(listPromise).resolves.toStrictEqual([])

      expect(onRequestRetry).toHaveBeenCalledTimes(1)

      const retryEvent = onRequestRetry.mock.calls[0]?.[0]

      expect(retryEvent?.attempt).toBe(1)
      expect(retryEvent?.delayMs).toBeTypeOf('number')
      expect(retryEvent?.correlationId).toBe(
        onRequestStart.mock.calls[0]?.[0]?.correlationId,
      )
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('Transient server error on /bindings'),
      )
    })

    it('does not retry transient failures on POST', async () => {
      const onRequestRetry = vi.fn<(event: RequestRetryEvent) => void>()
      const { api } = await createAuthedApi({ events: { onRequestRetry } })
      mockRequest.mockRejectedValue(createServerError(502, '/control/did-pro'))

      await expect(
        api.updateValues({
          id: 'did-pro',
          postData: { attrs: { mode: Mode.eco } },
        }),
      ).rejects.toThrow('Status 502')

      expect(onRequestRetry).not.toHaveBeenCalled()
      expect(mockRequest).toHaveBeenCalledTimes(1)
    })

    it('forwards the notifySync payload to events.onSyncComplete', async () => {
      const onSyncComplete = vi.fn<SyncCallback>().mockResolvedValue(undefined)
      const api = await createApi({ events: { onSyncComplete } })
      await api.notifySync({ ids: ['did-pro'] })

      expect(onSyncComplete).toHaveBeenCalledWith({ ids: ['did-pro'] })
    })

    it('swallows a misbehaving onSyncComplete callback', async () => {
      const logger = createLogger()
      const onSyncComplete = vi.fn<SyncCallback>().mockImplementation(() => {
        throw new Error('observer rogue')
      })
      const api = await createApi({ events: { onSyncComplete }, logger })

      await expect(api.notifySync()).resolves.toBeUndefined()

      expect(logger.error).toHaveBeenCalledWith(
        'LifecycleEvents.onSyncComplete callback threw — ignoring',
        expect.any(Error),
      )
    })

    it('swallows an onSyncComplete rejection', async () => {
      const logger = createLogger()
      const onSyncComplete = vi
        .fn<SyncCallback>()
        .mockRejectedValue(new Error('observer rejected'))
      const api = await createApi({ events: { onSyncComplete }, logger })

      await expect(api.notifySync()).resolves.toBeUndefined()

      expect(logger.error).toHaveBeenCalledWith(
        'LifecycleEvents.onSyncComplete callback threw — ignoring',
        expect.any(Error),
      )
    })
  })

  describe('abortSignal wiring', () => {
    it('applies the configured abortSignal to outgoing requests', async () => {
      const controller = new AbortController()
      const { api } = await createAuthedApi({ abortSignal: controller.signal })
      mockRequest.mockResolvedValue(mockResponse({ attr: proAttributes }))
      await api.getValues({ id: 'did-pro' })

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({ signal: controller.signal }),
      )
    })

    it('omits the signal when no abortSignal is configured', async () => {
      const { api } = await createAuthedApi()
      mockRequest.mockResolvedValue(mockResponse({ attr: proAttributes }))
      await api.getValues({ id: 'did-pro' })

      expect(mockRequest.mock.lastCall?.[0]).not.toHaveProperty('signal')
    })
  })

  describe('timers and disposal', () => {
    it('arms and disarms the auto-sync timer via setSyncInterval', async () => {
      const api = await createApi()
      api.setSyncInterval(10)

      expect(vi.getTimerCount()).toBe(1)

      api.setSyncInterval(false)

      expect(vi.getTimerCount()).toBe(0)
    })

    it('clearSync cancels a pending auto-sync', async () => {
      const api = await createApi()
      api.setSyncInterval(10)
      api.clearSync()

      expect(vi.getTimerCount()).toBe(0)
    })

    it('releases the auto-sync timer on disposal', async () => {
      const { settingManager } = createSettingStore({ token: 'user-token' })
      mockWire()
      const api = await createApi({ settingManager, syncIntervalMinutes: 1 })
      api[Symbol.dispose]()
      mockRequest.mockClear()
      await vi.advanceTimersByTimeAsync(120_000)

      expect(mockRequest).not.toHaveBeenCalled()
      expect(vi.getTimerCount()).toBe(0)
    })
  })
})

describe(toAuthFailure, () => {
  it.each([{ status: 400 }, { status: 401 }])(
    'wraps an HTTP $status login rejection into AuthenticationError',
    ({ status }) => {
      const error = createServerError(status, '/login')
      const failure = toAuthFailure(error)

      expect(failure).toBeInstanceOf(AuthenticationError)
      expect(failure).toMatchObject({ cause: error })
    },
  )

  it('returns null for other HTTP errors', () => {
    expect(toAuthFailure(createServerError(500, '/login'))).toBeNull()
  })

  it('returns null for non-HTTP errors', () => {
    expect(toAuthFailure(new Error('network'))).toBeNull()
  })
})

describe('in-memory persistence (no setting manager)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockTemporalNowInstant()
    mockRequest.mockReset()
    mockRequest.mockResolvedValue(mockResponse({}))
  })

  afterEach(() => {
    vi.mocked(Temporal.Now.instant).mockRestore()
    vi.useRealTimers()
  })

  it('keeps the token and expiry in memory across requests', async () => {
    mockWire()
    const api = await createApi()

    await api.authenticate({ password: 'pw', username: 'user' })

    expect(api.isAuthenticated()).toBe(true)

    await api.getValues({ id: 'did-pro' })

    expect(loginCalls()).toBe(1)
  })

  it('arms the in-memory login backoff after a rejected sign-in', async () => {
    mockRejectedWire()
    const api = await createApi()

    await expect(
      api.authenticate({ password: 'pw', username: 'user' }),
    ).rejects.toBeInstanceOf(AuthenticationError)

    mockRequest.mockClear()

    await expect(api.resumeSession()).resolves.toBe(false)

    expect(mockRequest).not.toHaveBeenCalled()
  })
})
