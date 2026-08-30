import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest'

import type { HeatzyAPISettings } from '../../src/api/types.ts'
import type { HttpResponse } from '../../src/http/index.ts'
import { HeatzyAPI, toAuthFailure } from '../../src/api/heatzy.ts'
import { AuthenticationError } from '../../src/errors/index.ts'
import { Temporal } from '../../src/temporal.ts'
import { buildBinding, buildLoginData, proAttributes } from '../fixtures.ts'
import {
  createApi,
  createAuthedApi,
  createExplodingSettingManager,
  LOGIN_BACKOFF_MS,
  loginCalls,
  mockDriftedWire,
  mockRejectedWire,
  mockRequest,
  mockWire,
  wireSetup,
  wireTeardown,
} from '../heatzy-api-harness.ts'
import {
  createLogger,
  createServerError,
  createSettingStore,
  mockResponse,
} from '../helpers.ts'

const SETTING_KEYS = [
  'expiry',
  'loginBackoffUntil',
  'password',
  'token',
  'username',
] as const satisfies readonly (keyof HeatzyAPISettings)[]

describe(HeatzyAPI, () => {
  beforeEach(wireSetup)

  afterEach(wireTeardown)

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
      const { settingManager } = createSettingStore({ token: 'rejected-token' })
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
      // A rejected attempt persists no credential or session artifact —
      // neither the refused pair nor a token; the login backoff IS
      // stored, that being its job.
      expect(settingManager.get('username')).toBeNull()
      expect(settingManager.get('password')).toBeNull()
      expect(settingManager.get('token')).toBeNull()
      expect(Number(settingManager.get('loginBackoffUntil'))).toBe(
        Date.now() + LOGIN_BACKOFF_MS,
      )
    })

    it('keeps the previously persisted credentials and session on a rejected sign-in', async () => {
      const { settingManager } = createSettingStore({
        expiry: '2099-01-01T00:00:00Z',
        password: 'right',
        token: 'live-token',
        username: 'good@test.com',
      })
      const api = await createApi({ settingManager })
      mockRejectedWire()

      await expect(
        api.authenticate({ password: 'typo', username: 'good@test.com' }),
      ).rejects.toBeInstanceOf(AuthenticationError)

      // Only a server-accepted pair may displace the stored one: a
      // typo'd retry must not destroy a working login.
      expect(settingManager.get('username')).toBe('good@test.com')
      expect(settingManager.get('password')).toBe('right')
      expect(settingManager.get('token')).toBe('live-token')
      expect(settingManager.get('expiry')).toBe('2099-01-01T00:00:00Z')
    })

    // The registry guarantee above is only worth as much as its failure
    // mode: the post-auth sync must not resolve over a registry it could
    // not build. What still qualifies is an ENVELOPE the cycle cannot
    // read at all — anything a single entry or a single device read can
    // be wrong about is now absorbed per device, and pinned as such in
    // the session-lifecycle kernel.
    it('rejects when the enforced post-auth sync cannot build the registry', async () => {
      const { settingManager } = createSettingStore()
      const api = await createApi({ settingManager })
      mockDriftedWire()

      await expect(
        api.authenticate({ password: 'secret', username: 'user@test.com' }),
      ).rejects.toThrow('Invalid API response shape (GET /bindings)')

      // The sign-in half succeeded, so the session stands: the caller
      // must see the sync failure, not a bogus credential problem.
      expect(api.isAuthenticated()).toBe(true)
      expect(api.registry.devices.getById('did-pro')).toBeUndefined()
    })

    it('reports a resume whose sign-in worked but whose sync failed as still authenticated', async () => {
      const onAuthenticationLost = vi.fn<() => void>()
      const { settingManager } = createSettingStore()
      const api = await createApi({
        events: { onAuthenticationLost },
        settingManager,
      })
      settingManager.set('password', 'secret')
      settingManager.set('username', 'user@test.com')
      mockDriftedWire()

      await expect(api.resumeSession()).resolves.toBe(true)

      // Prompting the user to sign in again over credentials that just
      // worked would be the wrong signal entirely.
      expect(onAuthenticationLost).not.toHaveBeenCalled()
      expect(api.isAuthenticated()).toBe(true)
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

  describe('published settings contract', () => {
    it('mirrors every HeatzyAPISettings key in the bridge tuple', () => {
      expectTypeOf<(typeof SETTING_KEYS)[number]>().toEqualTypeOf<
        keyof HeatzyAPISettings
      >()
    })

    it('persists exactly the published settings keys over a cycle', async () => {
      const { setSpy, settingManager } = createSettingStore()
      mockWire()
      const api = await createApi({ settingManager })

      await api.authenticate({ password: 'pw', username: 'user' })

      mockRejectedWire()

      await expect(
        api.authenticate({ password: 'bad', username: 'user' }),
      ).rejects.toBeInstanceOf(AuthenticationError)

      const written = new Set(setSpy.mock.calls.map(([key]) => key))

      expect(written).toStrictEqual(new Set(SETTING_KEYS))

      const readBack = SETTING_KEYS.map((key) => settingManager.get(key))

      expect(readBack).not.toContain(null)
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
  beforeEach(wireSetup)

  afterEach(wireTeardown)

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
