import { HttpClient as CoreHttpClient } from '@olivierzal/api-core'
import {
  type MockInstance,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  onTestFinished,
  vi,
} from 'vitest'

import type { HeatzyAPI } from '../../src/api/heatzy.ts'
import type {
  HeatzyAPIConfig,
  LifecycleEvents,
  SettingManager,
  SyncCallback,
} from '../../src/api/types.ts'
import { Mode } from '../../src/constants.ts'
import {
  AuthenticationError,
  RegistrySyncError,
  ValidationError,
} from '../../src/errors/index.ts'
import {
  type HttpRequestConfig,
  type HttpResponse,
  HttpStatus,
} from '../../src/http/index.ts'
import { RetryGuard } from '../../src/resilience/index.ts'
import { buildBinding, buildLoginData, proAttributes } from '../fixtures.ts'
import {
  BINDINGS_PATH,
  createApi,
  DEVDATA_PREFIX,
  heatzyRegistryResponse,
  LOGIN_PATH,
  mockRequest,
  stageHeatzyWire,
  wireSetup,
  wireTeardown,
} from '../heatzy-api-harness.ts'
import {
  createLogger,
  createServerError,
  createSettingStore,
  mockResponse,
} from '../helpers.ts'

// The session lifecycle and the request pipeline of `src/api/heatzy.ts`,
// pinned against the REAL client rather than a synthetic subclass. The
// `tests/unit/heatzy-api-*.test.ts` suites exercise the same code path
// endpoint by endpoint — invaluable for branch coverage, useless as an
// extraction witness: they prove each entry point does its own job, not
// that the SESSION behaves the same once the template moves into
// `@olivierzal/api-core` as `SessionAPI`. This kernel is that witness,
// so it must cross the move byte-identical and stay green.
//
// It is the twin of melcloud-api's `tests/contracts/session-lifecycle.test.ts`:
// the same clause table, worded for this dialect. The two SDKs are about
// to share one extracted mechanism, and a clause that only one of them
// holds is a clause the extraction can quietly break in the other.
//
// PORTABILITY PRECONDITION — the kernel STAYS while the mechanism
// leaves, so it can only cross byte-identical while `src/api/heatzy.ts`,
// `src/api/types.ts`, `src/errors/index.ts`, `src/http/index.ts` and
// `src/resilience/index.ts` SURVIVE as this repo's own paths over
// `@olivierzal/api-core` (the shape `src/http/`, `src/resilience/` and
// `src/observability/` already took). Every import above resolves
// through them; swapping one for a direct `@olivierzal/api-core` import
// would force an edit here, and an edited witness proves nothing about
// the move it was meant to witness. The one deliberate exception is the
// core `HttpClient` imported above: it is the FOREIGN class the
// transport-resolution clause needs, and naming it here is the point of
// that clause.
//
// Every clause is worded about THE REGISTRY CYCLE — and on this dialect
// the cycle is PER-DEVICE, not bulk: `#fetch` reads the `/bindings`
// envelope, then fans out one `/devdata/{did}/latest` read per binding
// before handing both to the registry. A clause that counted only the
// envelope would miss half the cycle, so the driver counts the two hops
// separately (`registryCycleCount` / `deviceReadCount`) and the clauses
// that care about the fan-out say so.

const UNAVAILABLE_STATUS = 503

const CONCURRENT_CALLERS = 4
const ONE_HOUR_MS = 3_600_000
const SYNC_INTERVAL_MINUTES = 1
const SYNC_TICK_MS = 90_000
const TRANSIENT_RETRY_WINDOW_MS = 30_000

// The marker a refused registry cycle carries. Deliberately an
// `AuthenticationError`: the login backoff must key off the SIGN-IN
// round-trip, never off what the post-auth cycle happened to throw.
const REGISTRY_REFUSED = 'registry cycle refused'

// A sign-in no scenario staged. Loud on purpose — a clause that signs
// in without saying so is a clause that pins the wrong thing.
const UNEXPECTED_SIGN_IN = 'unexpected sign-in'

// A host logger that throws while reporting a failure — the only crack
// through which a best-effort registry cycle can reject its caller.
const REPORTER_REFUSED = 'diagnostic sink refused'

// A generation Heatzy ships after this SDK: `getProduct` throws on the
// unknown hash, which is why the listing boundary refuses to hand such
// an entry to the registry at all.
const UNSHIPPED_PRODUCT_KEY = 'unshipped-generation'

// A heating mode this SDK predates: `AttributesSchema.mode` is a closed
// literal union, so the device read carrying it fails validation while
// its 200 says nothing about the session.
const UNSHIPPED_MODE = 'cft3'

// The device whose live attributes come back unreadable in the
// fan-out clause — the SIBLING of a device that answers normally.
const UNREADABLE_DEVICE_ID = 'did-v2'

const CREDENTIALS = { password: 'pass', username: 'user@test.com' }

// The keys the client persists on top of its session material (see
// `SessionLifecycleDriver.sessionKeys`).
const BASE_PERSISTED_KEYS = [
  'expiry',
  'loginBackoffUntil',
  'password',
  'username',
]

const REGISTRY_BINDINGS = [buildBinding('pro')]

// A 200 the session survives and the registry does not — the shape that
// separates "the session stands" from "the cycle landed". It has to be
// an ENVELOPE failure: everything a single ENTRY can be wrong about is
// now absorbed per entry, so only a body that is not a device list at
// all leaves the cycle nothing to salvage.
const DRIFTED_ENVELOPE = { devices: 'not-a-device-list' }

// A listing this SDK models in part: one entry it reads, one wire
// regression (no `did`), one radiator Heatzy shipped after this
// release. The two drops must cost themselves and nothing else.
const PARTIAL_BINDINGS = [
  buildBinding('pro'),
  { dev_alias: 'Malformed', product_name: 'v2' },
  { ...buildBinding('v2'), product_key: UNSHIPPED_PRODUCT_KEY },
]

// Two entries this SDK models in full — the fan-out is where one of
// them then comes back unreadable.
const FAN_OUT_BINDINGS = [buildBinding('pro'), buildBinding('v2')]

const bindingsFor = (outcome: WireOutcome): readonly unknown[] => {
  if (outcome === 'partial-listing') {
    return PARTIAL_BINDINGS
  }
  return outcome === 'partial-fan-out' ? FAN_OUT_BINDINGS : REGISTRY_BINDINGS
}

/**
 * What the sign-in round-trip answers. Gizwits rejects a credential
 * with HTTP 400 (error codes in the body); `unreachable` is the
 * transport blip that must NOT be read as a rejection.
 */
type LoginOutcome = 'accept' | 'refuse' | 'unreachable'

interface SessionLifecycleDriver {
  /**
   * Persisted keys the dialect owns on top of {@link BASE_PERSISTED_KEYS}.
   */
  readonly sessionKeys: readonly string[]
  /**
   * Answers one hop of a successful registry cycle. Exposed so a clause
   * can hand it to a transport of its own making.
   */
  readonly answerRegistryCycle: (config: HttpRequestConfig) => HttpResponse
  readonly create: (config: HeatzyAPIConfig) => Promise<SessionUnderTest>
  /**
   * Per-device reads the transport has seen — the cycle's fan-out half.
   */
  readonly deviceReadCount: () => number
  /**
   * Sign-in round-trips the transport has seen.
   */
  readonly loginCount: () => number
  /**
   * Session material a reuse probe accepts, keyed as the dialect
   * persists it. The expiry is far-future on purpose: the probe must
   * spend a registry cycle, never a session refresh.
   */
  readonly persistedSession: () => Record<string, string>
  /**
   * Registry cycles the transport has seen, counted at the `/bindings`
   * envelope — the hop that OPENS a cycle, so an attempt is counted
   * even when the fan-out never happens.
   */
  readonly registryCycleCount: () => number
  readonly reset: () => void
  readonly stage: (outcome: {
    authFailureStatus?: number | undefined
    login?: LoginOutcome | undefined
    wire?: WireOutcome | undefined
  }) => void
  /**
   * Persisted state that makes the next request refresh the session: a
   * token whose recorded expiry has passed.
   */
  readonly staleSession: () => Record<string, string>
}

interface SessionUnderTest {
  readonly api: HeatzyAPI
  /**
   * How many devices the registry currently holds.
   */
  readonly deviceCount: () => number
  /**
   * One mutation through the request pipeline — a POST to `/control`.
   * Only the verb matters to the clauses here.
   */
  readonly sendMutation: () => Promise<unknown>
}

/**
 * What the transport answers for every non-sign-in call — the registry
 * cycle's two hops and, where the clause needs one, a mutation.
 *
 * Three of them answer 200 and still deny the cycle something:
 * `drifted-registry` denies it everything (the envelope is not a device
 * list), while `partial-listing` and `partial-fan-out` deny it exactly
 * one device — at the listing boundary and in the fan-out respectively.
 */
type WireOutcome =
  | 'drifted-registry'
  | 'ok'
  | 'partial-fan-out'
  | 'partial-listing'
  | 'refuse-registry'
  | 'unauthorized-once'
  | 'unavailable'

interface WireState {
  authFailureStatus: number
  baseline: number
  outcome: WireOutcome
  login?: LoginOutcome | undefined
}

const byName = (left: string, right: string): number =>
  left.localeCompare(right)

const seedCredentials = (settingManager: SettingManager): void => {
  settingManager.set('password', CREDENTIALS.password)
  settingManager.set('username', CREDENTIALS.username)
}

/**
 * Opens the observation every loss/recovery clause shares: a store
 * seeded with credentials, both lifecycle spies wired, and the client
 * created under the given staging.
 * @param driver - The dialect leg under test.
 * @param stage - Wire staging active while the client boots.
 * @returns The client and the two lifecycle spies.
 */
const createObservedSession = async (
  driver: SessionLifecycleDriver,
  stage: Parameters<SessionLifecycleDriver['stage']>[0],
): Promise<{
  api: HeatzyAPI
  onAuthenticationLost: ReturnType<
    typeof vi.fn<NonNullable<LifecycleEvents['onAuthenticationLost']>>
  >
  onAuthenticationRestored: ReturnType<
    typeof vi.fn<NonNullable<LifecycleEvents['onAuthenticationRestored']>>
  >
}> => {
  const onAuthenticationLost =
    vi.fn<NonNullable<LifecycleEvents['onAuthenticationLost']>>()
  const onAuthenticationRestored =
    vi.fn<NonNullable<LifecycleEvents['onAuthenticationRestored']>>()
  const { settingManager } = createSettingStore(CREDENTIALS)
  driver.stage(stage)
  const { api } = await driver.create({
    events: { onAuthenticationLost, onAuthenticationRestored },
    settingManager,
  })
  return { api, onAuthenticationLost, onAuthenticationRestored }
}

const standingSessionKeys = (
  driver: SessionLifecycleDriver,
  settingManager: SettingManager,
): readonly string[] =>
  driver.sessionKeys.filter((key) => (settingManager.get(key) ?? '') !== '')

/**
 * Read back the keys a fixture wrote, so a clause can compare the whole
 * persisted session against what it seeded in one assertion.
 * @param settingManager - Store to read.
 * @param seeded - Keys and values the fixture put there.
 * @returns The same keys, carrying whatever the store holds now.
 */
const readBack = (
  settingManager: SettingManager,
  seeded: Record<string, string>,
): Record<string, string | null | undefined> =>
  Object.fromEntries(
    Object.keys(seeded).map((key) => [key, settingManager.get(key)]),
  )

/**
 * Every key a persistence host was asked to touch, however it was
 * asked: `''` reaches `set` on a host without `unset`, and `unset` on
 * one that has it (setting.ts:39-43).
 * @param calls - Recorded calls of the store's spies, key first.
 * @returns The touched keys, deduplicated and sorted.
 */
const touchedKeys = (
  ...calls: readonly (readonly (readonly [string, ...unknown[]])[])[]
): readonly string[] =>
  [...new Set(calls.flat().map(([key]) => key))].toSorted(byName)

// A duration the SDK measured, as opposed to one it invented: the
// extraction moves this clock from `Temporal.Now.instant()` to
// `performance.now()`, so the SHAPE is the contract — a value a fake
// clock controls is not.
const isMeasuredDuration = (durationMs: number): boolean =>
  Number.isFinite(durationMs) && durationMs >= 0

/**
 * A transport this SDK does not own: the CORE client, without the
 * Gizwits redaction vocabulary its subclass seats. Answers a full
 * registry cycle, so an adopted one would be visible in the registry it
 * populated.
 * @param answerCycle - Responder for each hop of the cycle.
 * @returns The foreign client and the spy proving whether it was used.
 */
const createForeignTransport = (
  answerCycle: (config: HttpRequestConfig) => HttpResponse,
): {
  client: CoreHttpClient
  requestSpy: MockInstance<CoreHttpClient['request']>
} => {
  const client = new CoreHttpClient({
    baseURL: 'https://foreign.transport.test',
    timeout: 0,
  })
  return {
    client,
    requestSpy: vi
      .spyOn(client, 'request')
      .mockImplementation(async (config) => {
        await Promise.resolve()
        return answerCycle(config)
      }),
  }
}

// ---------------------------------------------------------------------------
// The Heatzy leg
// ---------------------------------------------------------------------------

const heatzyWire: WireState = {
  authFailureStatus: HttpStatus.Unauthorized,
  baseline: 0,
  outcome: 'ok',
}

const urlCount = (predicate: (url: string) => boolean): number =>
  mockRequest.mock.calls.filter(
    ([{ url }]) => url !== undefined && predicate(url),
  ).length

const registryCycleCount = (): number =>
  urlCount((url) => url === BINDINGS_PATH)

const deviceReadCount = (): number =>
  urlCount((url) => url.startsWith(DEVDATA_PREFIX))

const answerLogin = (): HttpResponse => {
  if (heatzyWire.login === undefined) {
    throw new Error(UNEXPECTED_SIGN_IN)
  }
  if (heatzyWire.login === 'unreachable') {
    throw createServerError(UNAVAILABLE_STATUS, LOGIN_PATH)
  }
  // A refused Gizwits sign-in is an HTTP 400 carrying an error code in
  // the body, not a 401 — `toAuthFailure` turns both into the shared
  // `AuthenticationError`.
  if (heatzyWire.login === 'refuse') {
    throw createServerError(HttpStatus.BadRequest, LOGIN_PATH)
  }
  return mockResponse(buildLoginData())
}

/**
 * The 200s that deny the cycle something: the whole registry, or
 * exactly one device. Scoped to the hop each one is about — the
 * envelope for the drifted body, one leg of the fan-out for the
 * unreadable device, whose sibling must keep answering normally.
 * @param url - URL the call targeted.
 * @returns The degraded response, or `null` when this hop is ordinary.
 */
const answerDegraded = (url: string): HttpResponse | null => {
  if (url === BINDINGS_PATH && heatzyWire.outcome === 'drifted-registry') {
    return mockResponse(DRIFTED_ENVELOPE)
  }
  return url === `${DEVDATA_PREFIX}${UNREADABLE_DEVICE_ID}/latest` &&
    heatzyWire.outcome === 'partial-fan-out'
    ? mockResponse({ attr: { mode: UNSHIPPED_MODE } })
    : null
}

/**
 * The transport answer a staged {@link WireOutcome} produces. A refusal
 * is thrown, which the client's async wrapper turns into a rejected
 * round-trip.
 * @param config - The call being answered.
 * @returns The successful response, when the outcome allows one.
 */
const answerWire = (config: HttpRequestConfig): HttpResponse => {
  const url = config.url ?? BINDINGS_PATH
  if (heatzyWire.outcome === 'unavailable') {
    throw createServerError(UNAVAILABLE_STATUS, url)
  }
  if (heatzyWire.outcome === 'refuse-registry') {
    throw new AuthenticationError(REGISTRY_REFUSED)
  }
  // Scoped to the `/bindings` hop: the fan-out reads share the counter,
  // so a bare cycle-count test would refuse them too and no replay
  // could ever land.
  if (
    url === BINDINGS_PATH &&
    heatzyWire.outcome === 'unauthorized-once' &&
    registryCycleCount() === heatzyWire.baseline + 1
  ) {
    throw createServerError(heatzyWire.authFailureStatus, url)
  }
  return (
    answerDegraded(url) ??
    heatzyRegistryResponse(config, {
      attributes: proAttributes,
      bindings: bindingsFor(heatzyWire.outcome),
    })
  )
}

const stageHeatzy = ({
  authFailureStatus = HttpStatus.Unauthorized,
  login,
  wire = 'ok',
}: {
  authFailureStatus?: number | undefined
  login?: LoginOutcome | undefined
  wire?: WireOutcome | undefined
}): void => {
  heatzyWire.authFailureStatus = authFailureStatus
  heatzyWire.baseline = registryCycleCount()
  heatzyWire.login = login
  heatzyWire.outcome = wire
  stageHeatzyWire(mockRequest, { login: answerLogin, rest: answerWire })
}

const heatzyDriver: SessionLifecycleDriver = {
  deviceReadCount,
  registryCycleCount,
  sessionKeys: ['token'],
  stage: stageHeatzy,
  answerRegistryCycle: (config) =>
    heatzyRegistryResponse(config, {
      attributes: proAttributes,
      bindings: REGISTRY_BINDINGS,
    }),
  create: async (config) => {
    const api = await createApi(config)
    return {
      api,
      deviceCount: (): number => api.registry.getDevices().length,
      sendMutation: async (): Promise<void> => {
        await api.updateValues({
          id: 'did-pro',
          postData: { attrs: { mode: Mode.eco } },
        })
      },
    }
  },
  loginCount: () => urlCount((url) => url === LOGIN_PATH),
  persistedSession: () => ({
    expiry: '2999-01-01T00:00:00Z',
    token: 'persisted-token',
  }),
  reset: () => {
    mockRequest.mockReset()
    stageHeatzy({})
  },
  staleSession: () => ({
    expiry: '2000-01-01T00:00:00Z',
    token: 'expired-token',
  }),
}

// ---------------------------------------------------------------------------
// The clause table
// ---------------------------------------------------------------------------

// Gizwits reports an invalid or expired user token as HTTP 400 (error
// code 9004 in the body) as well as 401, which is why `HeatzyAPI` hands
// `AuthRetryPolicy` the pair `[401, 400]` (heatzy.ts:341-345). Both rows
// run the same reactive recovery: drop the status the wire actually uses
// and every expired Gizwits token becomes a hard failure the user has to
// resolve by signing in again.
const AUTH_FAILURE_CASES = [
  { label: '401', status: HttpStatus.Unauthorized },
  {
    label: '400, the status Gizwits itself uses for an expired token',
    status: HttpStatus.BadRequest,
  },
] as const

// The two persistence hosts a consumer can be: `setting.ts:39-43`
// routes a `''` write to `unset` when the host provides one, so the
// keys a session declares reach a different spy on each.
const PERSISTENCE_HOSTS = [
  { hasUnset: false, label: 'a host that stores the cleared sentinel' },
  { hasUnset: true, label: 'a host that deletes the cleared key' },
] as const

// The two branches of `initialize()` (heatzy.ts:473-480), in the order
// its doc insists on: probe a persisted token first, spend a sign-in
// only when there is nothing to probe. Both end authenticated over a
// populated registry, and the counts are what tell them apart.
const INITIALIZE_RUNGS = [
  {
    expectedCycles: 1,
    expectedDeviceReads: 1,
    expectedLogins: 0,
    label:
      'probes, reuses, and never signs in when the persisted session answers',
    seed: (driver: SessionLifecycleDriver): Record<string, string> => ({
      ...CREDENTIALS,
      ...driver.persistedSession(),
    }),
  },
  {
    expectedCycles: 1,
    expectedDeviceReads: 1,
    expectedLogins: 1,
    label:
      'signs in for real when no persisted session makes the probe worth attempting',
    seed: (): Record<string, string> => ({ ...CREDENTIALS }),
  },
] as const

// The transient-retry rung is the innermost policy and is mounted for
// GET only (heatzy.ts:730-732): replaying a POST that may have landed
// server-side is a duplicate write in disguise. Both rows run against
// the same 503.
const TRANSIENT_RUNG_CASES = [
  {
    label: 'retries the registry cycle, a GET',
    retriedMethods: ['GET'],
    send: async ({ api }: SessionUnderTest): Promise<void> => {
      const cycle = api.fetch()
      await vi.advanceTimersByTimeAsync(TRANSIENT_RETRY_WINDOW_MS)
      await cycle
    },
  },
  {
    label: 'never retries a mutation, a POST',
    retriedMethods: [],
    send: async ({ sendMutation }: SessionUnderTest): Promise<void> => {
      await Promise.allSettled([sendMutation()])
    },
  },
] as const

/**
 * Runs the session-lifecycle + request-pipeline contract against the
 * real client.
 * @param name - Implementation label used in the test titles.
 * @param driver - Stages the wire and builds the client.
 */
const describeSessionLifecycleContract = (
  name: string,
  driver: SessionLifecycleDriver,
): void => {
  describe(`sessionLifecycle — ${name}`, () => {
    beforeEach(() => {
      wireSetup()
      driver.reset()
    })

    afterEach(wireTeardown)

    it('leaves the credentials and the standing session untouched when a sign-in is refused, and arms the backoff', async () => {
      const { settingManager } = createSettingStore()
      driver.stage({ login: 'accept', wire: 'ok' })
      const { api } = await driver.create({ settingManager })
      await api.authenticate(CREDENTIALS)
      driver.stage({ login: 'refuse', wire: 'ok' })

      await expect(
        api.authenticate({ password: 'wrong', username: 'other@test.com' }),
      ).rejects.toThrow(AuthenticationError)

      expect(settingManager.get('username')).toBe(CREDENTIALS.username)
      expect(settingManager.get('password')).toBe(CREDENTIALS.password)
      expect(api.isAuthenticated()).toBe(true)
      expect(settingManager.get('loginBackoffUntil')).not.toBe('')
    })

    it('persists the credentials and clears the backoff when a sign-in is accepted', async () => {
      const { settingManager } = createSettingStore({
        loginBackoffUntil: String(Date.now() + ONE_HOUR_MS),
      })
      driver.stage({ login: 'accept', wire: 'ok' })
      const { api } = await driver.create({ settingManager })

      await api.authenticate(CREDENTIALS)

      expect(settingManager.get('username')).toBe(CREDENTIALS.username)
      expect(settingManager.get('password')).toBe(CREDENTIALS.password)
      expect(settingManager.get('loginBackoffUntil')).toBe('')
      expect(api.isAuthenticated()).toBe(true)
    })

    it('runs the enforced registry cycle on an accepted sign-in and rejects when it fails', async () => {
      const { settingManager } = createSettingStore()
      driver.stage({ login: 'accept', wire: 'refuse-registry' })
      const { api } = await driver.create({ settingManager })

      await expect(api.authenticate(CREDENTIALS)).rejects.toThrow(
        RegistrySyncError,
      )

      expect(driver.registryCycleCount()).toBe(1)
    })

    // The enforced-sync failure carries its own TYPE because consumers
    // could not tell it from a refused credential without re-deriving
    // the verdict from `isAuthenticated()` — the judge-by-the-session
    // discriminator this repo already retired once, with a real false
    // positive: a transport failure during a sign-in over a
    // PRE-EXISTING live token (a user switching accounts) reads
    // "signed in, stale list" while the new pair was never accepted.
    it('wraps an enforced-sync failure in RegistrySyncError, the cycle failure preserved as its cause', async () => {
      const { settingManager } = createSettingStore()
      driver.stage({ login: 'accept', wire: 'refuse-registry' })
      const { api } = await driver.create({ settingManager })

      const signIn = api.authenticate(CREDENTIALS)

      await expect(signIn).rejects.toBeInstanceOf(RegistrySyncError)
      // The wrap adds the type without eating the evidence: the
      // cycle's own failure stays readable on `cause`. What the
      // established session goes on to answer is the drifted-registry
      // clause's business, not this one's.
      await expect(signIn).rejects.toMatchObject({
        cause: new AuthenticationError(REGISTRY_REFUSED),
      })
    })

    it('never wraps a refused credential in RegistrySyncError', async () => {
      const { settingManager } = createSettingStore()
      driver.stage({ login: 'refuse', wire: 'ok' })
      const { api } = await driver.create({ settingManager })

      const signIn = api.authenticate(CREDENTIALS)

      await expect(signIn).rejects.toBeInstanceOf(AuthenticationError)
      await expect(signIn).rejects.not.toBeInstanceOf(RegistrySyncError)
    })

    it('never arms the login backoff when only the registry cycle failed', async () => {
      const { settingManager } = createSettingStore()
      driver.stage({ login: 'accept', wire: 'refuse-registry' })
      const { api } = await driver.create({ settingManager })

      await expect(api.authenticate(CREDENTIALS)).rejects.toThrow(
        RegistrySyncError,
      )

      expect(settingManager.get('loginBackoffUntil')).toBe('')
    })

    // The account-denial property, listing half — this dialect's form of
    // melcloud-api 54.0.0. The enforced cycle PROPAGATES, so an entry
    // this SDK cannot model used to read as "cannot sign in at all": a
    // malformed sibling took the atomic array down with it, and an
    // unresolved `product_key` threw out of the `Device` constructor
    // mid-sync. Both are now dropped at the boundary, and dropped
    // LOUDLY — as ONE aggregated line per cycle (a listing-wide
    // regression must not storm the host logger exactly when the
    // diagnostic report most needs to stay readable), with the two
    // verdicts worded apart inside it because they call for opposite
    // answers (fix the schema vs. extend the product map): a silent or
    // undifferentiated drop would leave one indistinguishable symptom.
    it('signs in over a listing it only partly models, naming every drop in one line', async () => {
      const logger = createLogger()
      const { settingManager } = createSettingStore()
      driver.stage({ login: 'accept', wire: 'partial-listing' })
      const { api, deviceCount } = await driver.create({
        logger,
        settingManager,
      })

      await expect(api.authenticate(CREDENTIALS)).resolves.toBeUndefined()

      expect(deviceCount()).toBe(1)
      expect(logger.error).toHaveBeenCalledWith(
        `Dropped 2 of 3 /bindings entries: device unknown (an entry this SDK cannot read), device ${UNREADABLE_DEVICE_ID} (unknown product_key ${UNSHIPPED_PRODUCT_KEY})`,
      )
      // An entry that was never going to be modelled costs no wire call
      // either: only the surviving binding was fanned out to.
      expect(driver.deviceReadCount()).toBe(1)
    })

    // The same property, fan-out half — the one this dialect owns
    // alone, because only a PER-DEVICE cycle can lose a single device
    // after the listing succeeded. The legs settle independently, so
    // the device that answered is modelled and the one that did not is
    // named in the log with the error it failed on.
    it('signs in when one device read comes back unreadable, keeping the devices that answered', async () => {
      const logger = createLogger()
      const { settingManager } = createSettingStore()
      driver.stage({ login: 'accept', wire: 'partial-fan-out' })
      const { api, deviceCount } = await driver.create({
        logger,
        settingManager,
      })

      await expect(api.authenticate(CREDENTIALS)).resolves.toBeUndefined()

      // Both legs were spent — the failure is the leg's, not the
      // cycle's — and exactly one of them produced a model.
      expect(driver.deviceReadCount()).toBe(2)
      expect(deviceCount()).toBe(1)
      expect(logger.error).toHaveBeenCalledWith(
        `Skipping device ${UNREADABLE_DEVICE_ID}: its live attributes could not be read`,
        expect.any(ValidationError),
      )
    })

    // The gate's negative half (heatzy.ts:699-704). A transport failure
    // is not a rejected credential: the retry paths own those, and
    // pausing sign-ins over a blip would lock a working account out for
    // fifteen minutes at a time.
    it('never arms the login backoff when the sign-in round-trip failed at transport', async () => {
      const { settingManager } = createSettingStore(CREDENTIALS)
      driver.stage({ login: 'unreachable', wire: 'ok' })
      const { api } = await driver.create({ settingManager })
      const attempted = driver.loginCount()

      await expect(api.resumeSession()).resolves.toBe(false)

      expect(attempted).toBe(1)
      // The gate stayed open: the next automatic resume tried again
      // instead of being refused locally.
      expect(driver.loginCount()).toBe(2)
      expect(settingManager.get('loginBackoffUntil') ?? '').toBe('')
    })

    it('lets a racing logOut win the sign-in epoch', async () => {
      const { settingManager } = createSettingStore()
      driver.stage({ login: 'accept', wire: 'ok' })
      const { api } = await driver.create({ settingManager })

      // The sign-in is suspended on its transport round-trip when the
      // sign-out lands, so `#finishLogin` resumes on a stale epoch.
      const signIn = api.authenticate(CREDENTIALS)
      api.logOut()
      await signIn

      expect(settingManager.get('username') ?? '').toBe('')
      expect(settingManager.get('password') ?? '').toBe('')
      expect(standingSessionKeys(driver, settingManager)).toStrictEqual([])
      expect(driver.registryCycleCount()).toBe(0)
    })

    // One of the two shapes `resumeSession` catches, and the one a
    // session cannot judge: the server REFUSED the credentials while a
    // session established before the attempt is still standing. A
    // `true` there reports a re-sign-in that never happened, and the
    // caller spends the credential Gizwits has just rejected. This
    // dialect's own reactive path never consumed that wrong `true` —
    // its `#reauthenticate` clears the refused token FIRST, so the
    // session it left behind never stood — but `resumeSession` is
    // PUBLIC, and a host calling it over a live token with refused
    // stored credentials was told "resumed". The session itself is
    // untouched: only the VERDICT is at stake, which is what makes the
    // two shapes distinguishable by the sign-in round-trip alone.
    it('reports a refused re-sign-in as a failed resume, standing session or not', async () => {
      const logger = createLogger()
      const { settingManager } = createSettingStore(CREDENTIALS)
      driver.stage({ login: 'accept', wire: 'ok' })
      const { api } = await driver.create({ logger, settingManager })
      driver.stage({ login: 'refuse', wire: 'ok' })

      await expect(api.resumeSession()).resolves.toBe(false)

      // The refusal left the previous session alone — this clause is
      // about the verdict, never about clearing.
      expect(api.isAuthenticated()).toBe(true)
      expect(logger.error).toHaveBeenCalledWith(
        'Session resume failed:',
        expect.any(AuthenticationError),
      )
    })

    // The refusal is RECORDED even though the stored token is not
    // cleared — the refusal path clears nothing (the 12.0.1 rule);
    // only the REACTIVE `#reauthenticate` wipes, and that is a
    // different path. Without the record, the cycle epilogue keyed on
    // `isAuthenticated()` alone, so a server-side password change left
    // the host reading "signed in" over a dead account for the
    // token's remaining life — `onAuthenticationLost` could never fire
    // while the token stood.
    it('surfaces onAuthenticationLost once per episode when a cycle settles on a refused credential over a standing token', async () => {
      const { api, onAuthenticationLost } = await createObservedSession(
        driver,
        { login: 'accept', wire: 'ok' },
      )
      driver.stage({ login: 'refuse', wire: 'ok' })

      await expect(api.resumeSession()).resolves.toBe(false)
      // The cycle epilogue owns the surfacing, so nothing has been
      // announced yet.
      expect(onAuthenticationLost).not.toHaveBeenCalled()

      await api.fetch()
      await api.fetch()

      expect(api.isAuthenticated()).toBe(true)
      expect(onAuthenticationLost).toHaveBeenCalledTimes(1)
      // The boot sign-in, the refused one — and nothing more: the rung
      // that could spend a third is held by the backoff the refusal
      // armed.
      expect(driver.loginCount()).toBe(2)
    })

    // The episode the clause above opens is closed by an ACCEPTED
    // sign-in and nothing else: `authenticate` lifts the record before
    // its enforced cycle settles, so that cycle's epilogue is the one
    // that announces the recovery. Distinct from the alternation
    // clause below, whose loss episode never had a standing token.
    it('serves the session again and announces the recovery once a sign-in is accepted after a refusal', async () => {
      const { api, onAuthenticationLost, onAuthenticationRestored } =
        await createObservedSession(driver, { login: 'accept', wire: 'ok' })
      driver.stage({ login: 'refuse', wire: 'ok' })

      await expect(api.resumeSession()).resolves.toBe(false)

      await api.fetch()
      driver.stage({ login: 'accept', wire: 'ok' })

      await api.authenticate(CREDENTIALS)

      expect(api.isAuthenticated()).toBe(true)
      expect(onAuthenticationLost).toHaveBeenCalledTimes(1)
      expect(onAuthenticationRestored).toHaveBeenCalledTimes(1)
    })

    // The record's negative half: a transport failure is not a verdict
    // on the pair, so it must neither be recorded nor surface a loss
    // over a session that still works. (melcloud's twin clause also
    // holds a throttle row; this dialect has no throttle error type to
    // stage — see DECLARED ABSENCES, entry 1.)
    it('keeps serving the standing session when a re-sign-in merely failed at transport', async () => {
      const { api, onAuthenticationLost } = await createObservedSession(
        driver,
        { login: 'accept', wire: 'ok' },
      )
      driver.stage({ login: 'unreachable', wire: 'ok' })

      await expect(api.resumeSession()).resolves.toBe(false)

      await api.fetch()

      expect(api.isAuthenticated()).toBe(true)
      expect(onAuthenticationLost).not.toHaveBeenCalled()
    })

    // The other shape `resumeSession` catches, and the one that must
    // still answer `true` — an ACCEPTED credential whose enforced
    // registry cycle then threw, the shape 11.0.0 was cut for. Its
    // session stands for a reason the refused shape above cannot
    // claim: this sign-in round-trip really did happen. The token is
    // stored by `#doAuthenticate` BEFORE `#finishLogin` spends the
    // cycle, so the client is signed in while the registry stays
    // empty; reporting that as a lost session would prompt the user to
    // log back in over credentials that just worked. The verdict is
    // the round-trip counter's, not a re-reading of the session — the
    // 11.0.0 shorthand "judge by the session" claimed BOTH shapes for
    // one `isAuthenticated()` reading and shipped the refused one
    // wrong.
    it('returns true from resumeSession when the session was established before the enforced cycle threw', async () => {
      const { settingManager } = createSettingStore()
      driver.stage({ login: 'accept', wire: 'drifted-registry' })
      const { api, deviceCount } = await driver.create({ settingManager })
      seedCredentials(settingManager)

      await expect(api.resumeSession()).resolves.toBe(true)

      expect(api.isAuthenticated()).toBe(true)
      expect(driver.registryCycleCount()).toBe(1)
      // The cycle really did fail: signed in over nothing at all, which
      // is what makes the `true` above a statement about the SESSION.
      expect(deviceCount()).toBe(0)
    })

    it('returns false from resumeSession when the sign-in is refused and no session stands', async () => {
      const { settingManager } = createSettingStore()
      driver.stage({ login: 'refuse', wire: 'ok' })
      const { api } = await driver.create({ settingManager })
      seedCredentials(settingManager)

      await expect(api.resumeSession()).resolves.toBe(false)

      expect(api.isAuthenticated()).toBe(false)
    })

    it.each(INITIALIZE_RUNGS)(
      '$label',
      async ({ expectedCycles, expectedDeviceReads, expectedLogins, seed }) => {
        const { settingManager } = createSettingStore(seed(driver))
        driver.stage({ login: 'accept', wire: 'ok' })
        const { api, deviceCount } = await driver.create({ settingManager })

        expect(api.isAuthenticated()).toBe(true)
        expect(driver.loginCount()).toBe(expectedLogins)
        expect(driver.registryCycleCount()).toBe(expectedCycles)
        // The cycle's fan-out half: one live read per binding the
        // envelope carried.
        expect(driver.deviceReadCount()).toBe(expectedDeviceReads)
        expect(deviceCount()).toBeGreaterThan(0)
      },
    )

    // The probe is BEST-EFFORT by contract (heatzy.ts:1091-1104): it runs
    // `fetch()`, never the propagating `#syncCycle`. Nothing else pins
    // that choice, yet `initialize()` has no try/catch (:473-480) and
    // `create()` awaits it through `start()` — so the propagating hook
    // would turn a boot-time blip into a REJECTED `create()`, and a
    // probe that cleared on failure would destroy a session that was
    // merely unexercised.
    it('keeps the boot-time probe non-destructive when the wire is unavailable', async () => {
      const persisted = { ...CREDENTIALS, ...driver.persistedSession() }
      const { setSpy, settingManager } = createSettingStore(persisted)
      driver.stage({ login: 'refuse', wire: 'unavailable' })

      const booting = driver.create({ settingManager })
      await vi.advanceTimersByTimeAsync(TRANSIENT_RETRY_WINDOW_MS)
      const { deviceCount } = await booting

      expect(deviceCount()).toBe(0)
      expect(readBack(settingManager, persisted)).toStrictEqual(persisted)
      // `#clearPersistedSession` writes the cleared sentinel to every
      // key it owns; not one key was cleared.
      expect(
        setSpy.mock.calls.filter(([, value]) => value === ''),
      ).toStrictEqual([])
    })

    it('fires onAuthenticationLost exactly once per episode', async () => {
      const onAuthenticationLost =
        vi.fn<NonNullable<LifecycleEvents['onAuthenticationLost']>>()
      const { settingManager } = createSettingStore(CREDENTIALS)
      driver.stage({ login: 'refuse', wire: 'refuse-registry' })
      const { api } = await driver.create({
        events: { onAuthenticationLost },
        settingManager,
      })

      await api.fetch()
      await api.fetch()

      expect(onAuthenticationLost).toHaveBeenCalledTimes(1)
    })

    it('alternates onAuthenticationLost and onAuthenticationRestored, never repeating either', async () => {
      const onAuthenticationLost =
        vi.fn<NonNullable<LifecycleEvents['onAuthenticationLost']>>()
      const onAuthenticationRestored =
        vi.fn<NonNullable<LifecycleEvents['onAuthenticationRestored']>>()
      const { settingManager } = createSettingStore(CREDENTIALS)
      driver.stage({ login: 'refuse', wire: 'refuse-registry' })
      const { api } = await driver.create({
        events: { onAuthenticationLost, onAuthenticationRestored },
        settingManager,
      })
      driver.stage({ login: 'accept', wire: 'ok' })

      await api.authenticate(CREDENTIALS)
      await api.fetch()

      expect(onAuthenticationLost).toHaveBeenCalledTimes(1)
      expect(onAuthenticationRestored).toHaveBeenCalledTimes(1)
    })

    it('clears the session and the registry when a cycle outlives its epoch', async () => {
      const { settingManager } = createSettingStore({
        ...CREDENTIALS,
        ...driver.persistedSession(),
      })
      driver.stage({ wire: 'ok' })
      const { api, deviceCount } = await driver.create({ settingManager })

      // The cycle repopulates what the sign-out just wiped; the
      // epilogue re-runs the wipe so the sign-out sticks.
      const cycle = api.fetch()
      api.logOut()
      await cycle

      expect(api.isAuthenticated()).toBe(false)
      expect(deviceCount()).toBe(0)
    })

    it('reschedules the next sync when a cycle ends authenticated', async () => {
      const { settingManager } = createSettingStore({
        ...CREDENTIALS,
        ...driver.persistedSession(),
      })
      driver.stage({ wire: 'ok' })
      const { api } = await driver.create({
        settingManager,
        syncIntervalMinutes: SYNC_INTERVAL_MINUTES,
      })
      const settled = driver.registryCycleCount()

      await vi.advanceTimersByTimeAsync(SYNC_TICK_MS)
      const ticked = driver.registryCycleCount()
      api[Symbol.dispose]()

      expect(ticked).toBeGreaterThan(settled)
    })

    it('disarms the timer and reports the loss when a cycle ends unauthenticated with recoverable state', async () => {
      const onAuthenticationLost =
        vi.fn<NonNullable<LifecycleEvents['onAuthenticationLost']>>()
      const { settingManager } = createSettingStore()
      driver.stage({ login: 'refuse', wire: 'refuse-registry' })
      const { api } = await driver.create({
        events: { onAuthenticationLost },
        settingManager,
        syncIntervalMinutes: SYNC_INTERVAL_MINUTES,
      })
      // Credentials arrive AFTER construction, so the boot-time restore
      // emitted nothing: the loss below is the cycle epilogue's own.
      seedCredentials(settingManager)

      await api.fetch()
      const settled = driver.registryCycleCount()
      await vi.advanceTimersByTimeAsync(SYNC_TICK_MS)
      const ticked = driver.registryCycleCount()
      api[Symbol.dispose]()

      expect(onAuthenticationLost).toHaveBeenCalledTimes(1)
      expect(ticked).toBe(settled)
    })

    it('logs the failure and answers an empty list when a best-effort cycle fails', async () => {
      const logger = createLogger()
      const { settingManager } = createSettingStore({
        ...CREDENTIALS,
        ...driver.persistedSession(),
      })
      driver.stage({ wire: 'ok' })
      const { api } = await driver.create({ logger, settingManager })
      driver.stage({ wire: 'refuse-registry' })

      await expect(api.fetch()).resolves.toStrictEqual([])

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to fetch devices:',
        expect.any(AuthenticationError),
      )
    })

    it('emits no sync notification when the registry cycle fails', async () => {
      const onSyncComplete = vi.fn<SyncCallback>()
      const { settingManager } = createSettingStore({
        ...CREDENTIALS,
        ...driver.persistedSession(),
      })
      driver.stage({ wire: 'ok' })
      const { api } = await driver.create({
        events: { onSyncComplete },
        settingManager,
      })
      onSyncComplete.mockClear()
      driver.stage({ wire: 'refuse-registry' })

      await api.fetch()

      expect(onSyncComplete).not.toHaveBeenCalled()
    })

    it('collapses concurrent callers onto a single session refresh', async () => {
      const { settingManager } = createSettingStore(driver.staleSession())
      driver.stage({ login: 'accept', wire: 'ok' })
      const { api } = await driver.create({ settingManager })
      seedCredentials(settingManager)

      const cycles = await Promise.all([
        api.fetch(),
        api.fetch(),
        api.fetch(),
        api.fetch(),
      ])

      expect(cycles).toHaveLength(CONCURRENT_CALLERS)
      expect(driver.loginCount()).toBe(1)
    })

    // `resumeSession` itself is single-flight, one lifecycle layer
    // above the refresh handle: com.heatzy boots with
    // `shouldResumeSessionInBackground`, so the background
    // `initialize()` and the first request's `#ensureSession` used to
    // race it — two sign-ins could pass the backoff gate before either
    // refusal armed it, against a login endpoint whose lockout
    // hammering only prolongs. Every caller's verdict describes the
    // one shared attempt.
    it.each([
      { expectedCycles: 1, isResumed: true, login: 'accept' },
      { expectedCycles: 0, isResumed: false, login: 'refuse' },
    ] as const)(
      'collapses concurrent resumeSession calls onto one sign-in round-trip (login: $login)',
      async ({ expectedCycles, isResumed, login }) => {
        const { settingManager } = createSettingStore()
        driver.stage({ login, wire: 'ok' })
        const { api } = await driver.create({ settingManager })
        seedCredentials(settingManager)

        const verdicts = await Promise.all([
          api.resumeSession(),
          api.resumeSession(),
          api.resumeSession(),
          api.resumeSession(),
        ])

        expect(verdicts).toStrictEqual(
          Array.from({ length: CONCURRENT_CALLERS }, () => isResumed),
        )
        expect(driver.loginCount()).toBe(1)
        expect(driver.registryCycleCount()).toBe(expectedCycles)
      },
    )

    it.each(AUTH_FAILURE_CASES)(
      'runs one guarded reauth on an HTTP $label and replays the request exactly once',
      async ({ status }) => {
        const { settingManager } = createSettingStore({
          ...CREDENTIALS,
          ...driver.persistedSession(),
        })
        driver.stage({ wire: 'ok' })
        const { api, deviceCount } = await driver.create({ settingManager })
        const probed = driver.registryCycleCount()
        driver.stage({
          authFailureStatus: status,
          login: 'accept',
          wire: 'unauthorized-once',
        })

        const bindings = await api.fetch()

        expect(bindings.length).toBeGreaterThan(0)
        expect(driver.loginCount()).toBe(1)
        // The rejected attempt, the enforced post-auth sync of the
        // re-login the reauth spends, and exactly one replay.
        expect(driver.registryCycleCount() - probed).toBe(3)
        expect(deviceCount()).toBeGreaterThan(0)
      },
    )

    // The same rung when the recovery FAILS. `AuthRetryPolicy` replays
    // on the strength of `#reauthenticate()` alone, so a hook that
    // answered `true` over a refused re-sign-in would replay the
    // request with a credential the server just rejected. This dialect
    // holds the shield twice over, and both halves are pinned here:
    // `#reauthenticate` clears the refused token FIRST — the
    // DIALECT-SPECIFIC half, right on Gizwits because the 400/9004
    // names the token itself, where melcloud's Classic deliberately
    // does NOT clear (its 401 can name an endpoint rather than the
    // session) — and the resume verdict is the round-trip's, so the
    // refusal reads `false` with or without that clearing.
    it('never replays an expired-token failure when the re-sign-in was refused, and clears the refused token', async () => {
      const { settingManager } = createSettingStore({
        ...CREDENTIALS,
        ...driver.persistedSession(),
      })
      driver.stage({ wire: 'ok' })
      const { api } = await driver.create({ settingManager })
      const probed = driver.registryCycleCount()
      driver.stage({
        authFailureStatus: HttpStatus.BadRequest,
        login: 'refuse',
        wire: 'unauthorized-once',
      })

      await expect(api.fetch()).resolves.toStrictEqual([])

      // The rejected cycle, and nothing after it.
      expect(driver.registryCycleCount() - probed).toBe(1)
      expect(driver.loginCount()).toBe(1)
      expect(standingSessionKeys(driver, settingManager)).toStrictEqual([])
    })

    it.each(TRANSIENT_RUNG_CASES)(
      '$label',
      async ({ retriedMethods, send }) => {
        const onRequestRetry =
          vi.fn<NonNullable<LifecycleEvents['onRequestRetry']>>()
        const { settingManager } = createSettingStore({
          ...CREDENTIALS,
          ...driver.persistedSession(),
        })
        driver.stage({ wire: 'ok' })
        const session = await driver.create({
          events: { onRequestRetry },
          settingManager,
        })
        driver.stage({ wire: 'unavailable' })

        await send(session)

        expect([
          ...new Set(onRequestRetry.mock.calls.map(([event]) => event.method)),
        ]).toStrictEqual(retriedMethods)
      },
    )

    it('lets an explicit sign-in through the backoff gate and resets it on success', async () => {
      const { settingManager } = createSettingStore({
        ...CREDENTIALS,
        loginBackoffUntil: String(Date.now() + ONE_HOUR_MS),
      })
      driver.stage({ login: 'accept', wire: 'ok' })
      const { api } = await driver.create({ settingManager })

      const isResumed = await api.resumeSession()
      const gatedLogins = driver.loginCount()
      await api.authenticate(CREDENTIALS)

      expect(isResumed).toBe(false)
      expect(gatedLogins).toBe(0)
      expect(driver.loginCount()).toBe(1)
      expect(settingManager.get('loginBackoffUntil')).toBe('')
    })

    it('reads a corrupt persisted backoff as no pause at all', async () => {
      const { settingManager } = createSettingStore({
        ...CREDENTIALS,
        loginBackoffUntil: 'not-a-deadline',
      })
      driver.stage({ login: 'accept', wire: 'ok' })
      const { api } = await driver.create({ settingManager })

      expect(api.isAuthenticated()).toBe(true)
      expect(driver.loginCount()).toBe(1)
    })

    // The per-request lifecycle (`#runWithEvents`, heatzy.ts:1035-1057).
    // `durationMs` is asserted by SHAPE and never by value: the
    // extraction moves this clock to `performance.now()`, which no fake
    // timer controls — but a measurement that came back `NaN` or
    // negative is not a duration under either clock.
    it('emits the request lifecycle around every round-trip, with a measured duration', async () => {
      const onRequestComplete =
        vi.fn<NonNullable<LifecycleEvents['onRequestComplete']>>()
      const onRequestError =
        vi.fn<NonNullable<LifecycleEvents['onRequestError']>>()
      const onRequestStart =
        vi.fn<NonNullable<LifecycleEvents['onRequestStart']>>()
      const { settingManager } = createSettingStore({
        ...CREDENTIALS,
        ...driver.persistedSession(),
      })
      driver.stage({ wire: 'ok' })
      const { api } = await driver.create({
        events: { onRequestComplete, onRequestError, onRequestStart },
        settingManager,
      })
      driver.stage({ wire: 'refuse-registry' })

      await api.fetch()

      const durations = [
        ...onRequestComplete.mock.calls.map(([event]) => event.durationMs),
        ...onRequestError.mock.calls.map(([event]) => event.durationMs),
      ]

      // The probe's TWO round-trips — the `/bindings` envelope and the
      // one device read it fanned out to — plus the refused one.
      expect(onRequestStart).toHaveBeenCalledTimes(3)
      expect(onRequestComplete).toHaveBeenCalledTimes(2)
      expect(onRequestError).toHaveBeenCalledTimes(1)
      expect(
        durations.filter((durationMs) => isMeasuredDuration(durationMs)),
      ).toStrictEqual(durations)
    })

    // The transport-resolution gate (heatzy.ts:82-89) adopts a
    // pre-built client only when it IS this repo's `HttpClient` — the
    // subclass that seats the Gizwits redaction vocabulary. Anything
    // else, the bare core client included, is re-wrapped. The
    // distinction survives the move only if the gate keeps binding the
    // SUBCLASS: bound to the core class instead, the client below would
    // newly be adopted, and every `HttpError` it threw would carry an
    // unredacted snapshot — the exact leak 13.0.1 was cut for.
    //
    // The already-aborted signal keeps the clause off the network: the
    // re-wrapped client is a REAL transport pointed at Gizwits, and a
    // witness that dials the internet is a witness that fails on a
    // sandboxed runner.
    it("re-wraps a transport that is not this SDK's own HttpClient", async () => {
      const { client, requestSpy } = createForeignTransport(
        driver.answerRegistryCycle,
      )
      const { settingManager } = createSettingStore(driver.persistedSession())
      driver.stage({ wire: 'ok' })
      const { api, deviceCount } = await driver.create({
        abortSignal: AbortSignal.abort(),
        settingManager,
        transport: client,
      })

      await api.fetch()

      expect(requestSpy).not.toHaveBeenCalled()
      // Had it been adopted, this very payload would have filled the
      // registry.
      expect(deviceCount()).toBe(0)
    })

    it('emits nothing on an explicit logOut', async () => {
      const onAuthenticationLost =
        vi.fn<NonNullable<LifecycleEvents['onAuthenticationLost']>>()
      const onAuthenticationRestored =
        vi.fn<NonNullable<LifecycleEvents['onAuthenticationRestored']>>()
      const onSyncComplete = vi.fn<SyncCallback>()
      const { settingManager } = createSettingStore({
        ...CREDENTIALS,
        ...driver.persistedSession(),
      })
      driver.stage({ wire: 'ok' })
      const { api } = await driver.create({
        events: {
          onAuthenticationLost,
          onAuthenticationRestored,
          onSyncComplete,
        },
        settingManager,
      })
      onSyncComplete.mockClear()

      api.logOut()

      expect(onAuthenticationLost).not.toHaveBeenCalled()
      expect(onAuthenticationRestored).not.toHaveBeenCalled()
      expect(onSyncComplete).not.toHaveBeenCalled()
    })

    it.each(PERSISTENCE_HOSTS)(
      'writes exactly the persisted keys the session material declares, on $label',
      async ({ hasUnset }) => {
        const { setSpy, settingManager, unsetSpy } = createSettingStore(
          {},
          { hasUnset },
        )
        driver.stage({ login: 'accept', wire: 'ok' })
        const { api } = await driver.create({ settingManager })

        await api.authenticate(CREDENTIALS)

        expect(
          touchedKeys(setSpy.mock.calls, unsetSpy.mock.calls),
        ).toStrictEqual(
          [...BASE_PERSISTED_KEYS, ...driver.sessionKeys].toSorted(byName),
        )
      },
    )

    // This SDK passes NO log label: `this.logger` IS the host logger
    // (heatzy.ts:327), handed unwrapped to every seat including the
    // `SyncManager` (:333-337). So every line it writes arrives
    // unprefixed — and those strings land verbatim in the diagnostic
    // reports users paste into issues. The extracted class makes the
    // label OPTIONAL, and a default would rewrite this SDK's whole log
    // output as a side effect of a change whose entire purpose is
    // behavioural neutrality. Pinned as it IS, so a label announces
    // itself.
    //
    // Reaching the SyncManager's logger takes some doing: `fetch()` is
    // best-effort and never rejects on its own, so the tick is made to
    // reject through the one thing that wrapper does not guard — the
    // failure line itself, on a host logger that throws.
    it('hands every seat the host logger verbatim, so no line carries a label', async () => {
      const logger = createLogger()
      const { settingManager } = createSettingStore({
        ...CREDENTIALS,
        ...driver.persistedSession(),
      })
      driver.stage({ wire: 'ok' })
      const { api } = await driver.create({
        logger,
        settingManager,
        syncIntervalMinutes: SYNC_INTERVAL_MINUTES,
      })
      driver.stage({ wire: 'refuse-registry' })
      vi.mocked(logger.error).mockImplementationOnce(() => {
        throw new Error(REPORTER_REFUSED)
      })

      await vi.advanceTimersByTimeAsync(SYNC_TICK_MS)
      api[Symbol.dispose]()

      expect(api.logger).toBe(logger)
      expect(logger.error).toHaveBeenLastCalledWith(
        'Auto-sync failed:',
        expect.any(Error),
      )
    })

    // The timer half is behavioural: the cycle that settled
    // authenticated armed the auto-sync, and nothing may survive the
    // dispose. The GUARD half is the deliberate divergence from the
    // twin — melcloud-api releases its `RetryGuard` on dispose, this
    // SDK does not (heatzy.ts:614-616). The extraction adopts
    // melcloud's superset, so this is exactly the clause that must then
    // be updated DELIBERATELY, in a commit that says so, rather than
    // flipping silently inside a neutrality-critical move. The spy is
    // restored here because the vitest config clears mocks, never
    // restores them.
    it('releases the sync timer on dispose and leaves the retry guard alone', async () => {
      const releaseGuard = vi.spyOn(RetryGuard.prototype, Symbol.dispose)
      onTestFinished(() => {
        releaseGuard.mockRestore()
      })
      const { settingManager } = createSettingStore({
        ...CREDENTIALS,
        ...driver.persistedSession(),
      })
      driver.stage({ wire: 'ok' })
      const { api } = await driver.create({
        settingManager,
        syncIntervalMinutes: SYNC_INTERVAL_MINUTES,
      })
      const armed = vi.getTimerCount()
      const settled = driver.registryCycleCount()

      api[Symbol.dispose]()
      const remaining = vi.getTimerCount()
      await vi.advanceTimersByTimeAsync(SYNC_TICK_MS)

      expect(armed).toBeGreaterThan(0)
      expect(remaining).toBe(0)
      expect(releaseGuard).not.toHaveBeenCalled()
      expect(driver.registryCycleCount()).toBe(settled)
    })
  })
}

describeSessionLifecycleContract('HeatzyAPI', heatzyDriver)

// ---------------------------------------------------------------------------
// DECLARED ABSENCES
// ---------------------------------------------------------------------------
//
// Three clauses of the melcloud-api kernel have no form here. Each is a
// property of THIS dialect, not of this harness — the distinction the
// twin got wrong once and had to repair, so every entry below names the
// two expressions that decide it. Read them; if either has changed, the
// clause belongs back in the table above.
//
// 1. THE LOGIN-THROTTLE WINDOW (melcloud's three `THROTTLE_CASES`: the
//    fallback window, the announced one, and the cap on an absurd one).
//    No throttle type exists here to carry a window, and none can be
//    constructed. Decide it by reading:
//      - `toAuthFailure` (heatzy.ts:100-107) — whose `new
//        AuthenticationError(…)` at :104 is the ONLY one in `src/`
//        (`grep -rn 'new AuthenticationError' src/` returns that single
//        line). Its whole body is `status === BadRequest || status ===
//        Unauthorized ? new AuthenticationError(…) : null`: one type,
//        no window argument, no throttle branch — and `grep -rni
//        throttl src/` returns nothing at all.
//      - `#armLoginBackoff` (heatzy.ts:705-707) — the ONLY writer of the
//        gate: `Temporal.Now.instant().epochMilliseconds +
//        LOGIN_BACKOFF_FAILURE_MS`, a bare constant sum. Nothing reads a
//        server-announced duration, so there is no window to honour, no
//        default to fall back to, and no cap to enforce.
//    The same two expressions also decide the missing throttle rung of
//    the refusal RECORD (melcloud excludes its
//    `AuthenticationThrottledError` from the recorded verdict, a
//    lockout saying nothing about the pair): with one error type and
//    no window, every `AuthenticationError` here IS definitive, so
//    `#reportResumeFailure`'s guard needs no exclusion.
//    Should Gizwits ever surface a throttle code, the three rows — and
//    the exclusion — come back with it.
//
// 2. THE RATE-LIMIT GATE (melcloud's 429 clause: arm on `Retry-After`,
//    refuse the next request locally, reopen on the announced window).
//    Decide it by reading:
//      - `HeatzyAPI`'s public surface — there is no `isRateLimited`
//        member to observe, and `RateLimitGate` is imported nowhere in
//        `src/`.
//      - `#buildPolicy` (heatzy.ts:725-757) — the complete pipeline is
//        `#authRetryPolicy` alone on a mutation, and
//        `#authRetryPolicy.run(() => transientPolicy.run(attempt))` on a
//        GET. Two rungs, both accounted for by clauses above; a 429
//        reaches neither and propagates as a plain `HttpError`.
//    The verdict is in CLAUDE.md's ledger: the Gizwits wire has never
//    surfaced a 429, and a gate without wire evidence is machinery no
//    test can honestly exercise.
//
// 3. THE MID-LADDER PROBE (melcloud's Home-only clause: a client not yet
//    authenticated that still holds session material worth probing
//    before a sign-in is spent). Unrepresentable here for the same
//    reason it is on melcloud's Classic leg — the two hooks are ONE
//    expression. Decide it by reading:
//      - `isAuthenticated()` (heatzy.ts:486-488) — `return this.token
//        !== ''`.
//      - `#tryReuseSession`'s guard (heatzy.ts:1099) — `if (this.token
//        === '')`.
//    One cannot read false while the other reads true, so the state that
//    clause describes does not exist; `initialize()`'s two branches
//    (pinned by `INITIALIZE_RUNGS` above) are the whole ladder. Should
//    the token stop being the sole session artifact — a refresh token,
//    a device-scoped credential — the clause becomes reachable and
//    belongs back in the table.
