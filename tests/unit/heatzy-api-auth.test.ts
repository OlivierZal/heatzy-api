import {
  createServerError,
  createSettingStore,
  mockHttpResponse,
} from '@olivierzal/api-core/testing'
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
import { HeatzyAPI } from '../../src/api/heatzy.ts'
import {
  AuthenticationError,
  RegistrySyncError,
} from '../../src/errors/index.ts'
import { GizwitsErrorCode } from '../../src/http/failure.ts'
import { type HttpResponse, HttpStatus } from '../../src/http/index.ts'
import { Temporal } from '../../src/temporal.ts'
import {
  buildBinding,
  buildLoginData,
  gizwitsFailure,
  serverErrorFailure,
  tokenInvalidFailure,
  wrongCredentialsFailure,
} from '../fixtures.ts'
import {
  BINDINGS_PATH,
  createApi,
  LOGIN_PATH,
  loginCalls,
  mockDriftedWire,
  mockRejectedWire,
  mockRequest,
  mockWire,
  stageHeatzyWire,
  wireSetup,
  wireTeardown,
} from '../heatzy-api-harness.ts'

// Thin AUTH WIRING suite since the SessionAPI adoption: the session
// lifecycle mechanism — the login backoff, the resume single-flight,
// the refresh dedup, the logOut epochs, the loss episodes — lives in
// @olivierzal/api-core with its own suite, and its behavior through
// the REAL client is the session-lifecycle kernel's business. What
// this file pins is the Gizwits half the hooks supply: the verbatim
// `/login` exchange and its `expire_at` epoch-seconds conversion, the
// user-token header, the persisted-key vocabulary, the RegistrySyncError
// cause this dialect's cycle produces, and the `[401, 400]` vocabulary
// the core's `toAuthFailure` reads on the sign-in path.

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

      bindingsGate.resolve(mockHttpResponse({ devices: [buildBinding()] }))
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

// The sign-in reads the CODE Gizwits puts in the body, not the status:
// the wire answers a refused credential, a dead token, a server hiccup
// and a throttle alike with HTTP 400, and only a refused credential may
// park the pair and ask the user to sign in again. Every other login
// failure surfaces verbatim — the core retries it a minute later — and
// a `/login` POST goes through `dispatch`, below every policy rung, so
// nothing else re-maps it.
const stageRefusedLogin = (rejection: Error): Error => {
  stageHeatzyWire(mockRequest, {
    login: () => {
      throw rejection
    },
    rest: () => mockHttpResponse({}),
  })
  return rejection
}

describe('the sign-in normalization', () => {
  beforeEach(wireSetup)

  afterEach(wireTeardown)

  it.each([
    { label: 'a 401', rejection: createServerError(HttpStatus.Unauthorized) },
    {
      label: 'a 400 naming wrong credentials (9020)',
      rejection: wrongCredentialsFailure(LOGIN_PATH),
    },
    {
      label: 'a 400 naming an unknown user (9005)',
      rejection: gizwitsFailure({
        code: GizwitsErrorCode.userDoesNotExist,
        message: 'user does not exist!',
        url: LOGIN_PATH,
      }),
    },
    {
      label: 'a 400 naming an invalid user (9026)',
      rejection: gizwitsFailure({
        code: GizwitsErrorCode.userInvalid,
        message: 'user invalid!',
        url: LOGIN_PATH,
      }),
    },
  ])(
    'rejects authenticate() with AuthenticationError on $label, the rejection as cause',
    async ({ rejection }) => {
      const api = await createApi()
      stageRefusedLogin(rejection)

      const signIn = api.authenticate({ password: 'bad', username: 'user' })

      await expect(signIn).rejects.toBeInstanceOf(AuthenticationError)
      await expect(signIn).rejects.toMatchObject({
        cause: rejection,
        message: 'Heatzy rejected the credentials',
      })
      expect(api.isAuthenticated()).toBe(false)
    },
  )

  // Field report 2026-11-07: a server hiccup read as a refused credential
  // parked the pair and told the user to sign in again over credentials
  // a restart accepted at once.
  it.each([
    {
      label: 'a 400 naming a server error (9008)',
      rejection: serverErrorFailure(LOGIN_PATH),
    },
    {
      label: 'a 400 naming a throttle (9041)',
      rejection: gizwitsFailure({
        code: 9041,
        message: 'request was throttled',
        url: LOGIN_PATH,
      }),
    },
    {
      label: 'a 400 naming a dead token (9004)',
      rejection: tokenInvalidFailure(LOGIN_PATH),
    },
    {
      label: 'an off-vocabulary 503',
      rejection: createServerError(HttpStatus.ServiceUnavailable, LOGIN_PATH),
    },
  ])('propagates $label on /login verbatim', async ({ rejection }) => {
    const api = await createApi()
    stageRefusedLogin(rejection)

    const signIn = api.authenticate({ password: 'pw', username: 'user' })

    await expect(signIn).rejects.toBe(rejection)
    expect(api.isAuthenticated()).toBe(false)
  })

  // Gizwits checks a user token BEFORE the credentials and refuses a
  // login carrying a stale one with "token invalid" (9004), however
  // valid the credentials (measured 2026-11-07): no session rides it.
  it('signs in without the stored user token', async () => {
    const { settingManager } = createSettingStore({
      expiry: Temporal.Now.instant().add({ hours: 1 }).toString(),
      token: 'stale-token',
    })
    mockWire()
    const api = await createApi({ settingManager })

    await api.authenticate({ password: 'pw', username: 'user' })

    const login = mockRequest.mock.calls.find(
      ([config]) => config.url === LOGIN_PATH,
    )?.[0]

    expect(login?.headers).not.toHaveProperty('X-Gizwits-User-token')
  })
})

// The reactive re-auth owns a 400 only when Gizwits names the TOKEN in
// the body (9004 token invalid, 9006 token expired): any other 400 is no
// verdict on the session, and reading every 400 as an expired token
// cleared a session valid until January on a server hiccup (field
// report 2026-11-07).
// The rejection is armed AFTER the sign-in, whose enforced cycle reads
// `/bindings` too: it answers the next registry cycle, once.
const stageWire = (): { arm: (rejection: Error) => void } => {
  let pending: Error | undefined
  stageHeatzyWire(mockRequest, {
    login: () => mockHttpResponse(buildLoginData()),
    rest: (config) => {
      if (pending !== undefined && config.url === BINDINGS_PATH) {
        const rejection = pending
        pending = undefined
        throw rejection
      }
      return mockHttpResponse({ devices: [] })
    },
  })
  return {
    arm: (rejection): void => {
      pending = rejection
    },
  }
}

describe('the token-failure vocabulary', () => {
  beforeEach(wireSetup)

  afterEach(wireTeardown)

  it('signs in again and replays on a 400 naming an expired token (9006)', async () => {
    const wire = stageWire()
    const api = await createApi()
    await api.authenticate({ password: 'pw', username: 'user' })
    wire.arm(
      gizwitsFailure({
        code: GizwitsErrorCode.tokenExpired,
        message: 'token expired!',
        url: BINDINGS_PATH,
      }),
    )
    const before = loginCalls()

    await api.fetch()

    expect(loginCalls()).toBe(before + 1)
    expect(api.isAuthenticated()).toBe(true)
  })

  it('keeps the token, signing in again never, on a 400 naming a server error', async () => {
    const wire = stageWire()
    const api = await createApi()
    await api.authenticate({ password: 'pw', username: 'user' })
    wire.arm(serverErrorFailure(BINDINGS_PATH))
    const before = loginCalls()

    await api.fetch()

    expect(loginCalls()).toBe(before)
    expect(api.isAuthenticated()).toBe(true)
  })
})
