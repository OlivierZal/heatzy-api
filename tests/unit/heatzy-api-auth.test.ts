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
import {
  AuthenticationError,
  RegistrySyncError,
} from '../../src/errors/index.ts'
import { Temporal } from '../../src/temporal.ts'
import { buildBinding } from '../fixtures.ts'
import {
  createApi,
  loginCalls,
  mockDriftedWire,
  mockRejectedWire,
  mockRequest,
  mockWire,
  wireSetup,
  wireTeardown,
} from '../heatzy-api-harness.ts'
import {
  createServerError,
  createSettingStore,
  mockResponse,
} from '../helpers.ts'

// Thin AUTH WIRING suite since the SessionAPI adoption: the session
// lifecycle mechanism — the login backoff, the resume single-flight,
// the refresh dedup, the logOut epochs, the loss episodes — lives in
// @olivierzal/api-core with its own suite, and its behavior through
// the REAL client is the session-lifecycle kernel's business. What
// this file pins is the Gizwits half the hooks supply: the verbatim
// `/login` exchange and its `expire_at` epoch-seconds conversion, the
// user-token header, the persisted-key vocabulary, the RegistrySyncError
// cause this dialect's cycle produces, and `toAuthFailure`'s mapping.

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

    // The registry guarantee is only worth as much as its failure
    // mode: the post-auth sync must not resolve over a registry it could
    // not build. What still qualifies is an ENVELOPE the cycle cannot
    // read at all — anything a single entry or a single device read can
    // be wrong about is now absorbed per device, and pinned as such in
    // the session-lifecycle kernel. The failure surfaces as a
    // `RegistrySyncError` carrying the cycle's own error as `cause`, so
    // a caller can branch on "signed in, stale list" by type.
    it('rejects with RegistrySyncError when the enforced post-auth sync cannot build the registry', async () => {
      const { settingManager } = createSettingStore()
      const api = await createApi({ settingManager })
      mockDriftedWire()

      const signIn = api.authenticate({
        password: 'secret',
        username: 'user@test.com',
      })

      await expect(signIn).rejects.toBeInstanceOf(RegistrySyncError)
      // The cause is the cycle's own `ValidationError`, boundary label
      // intact — the wrap adds the type without eating the evidence.
      await expect(signIn).rejects.toHaveProperty(
        ['cause', 'name'],
        'ValidationError',
      )
      await expect(signIn).rejects.toHaveProperty(
        ['cause', 'context'],
        'GET /bindings',
      )
      // The sign-in half succeeded, so the session stands: the caller
      // must see the sync failure, not a bogus credential problem.
      expect(api.isAuthenticated()).toBe(true)
      expect(api.registry.devices.getById('did-pro')).toBeUndefined()
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

// The in-memory half of this SDK's decorated `token` accessor: with no
// SettingManager configured, the (core) `setting` decorator falls back
// to the accessor's own storage — a real host mode the public config
// allows, and the one path the kernel's store-backed clauses never
// drive.
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
