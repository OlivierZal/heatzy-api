import { randomUUID } from 'node:crypto'

import type { z } from 'zod'

import type {
  Attributes,
  Bindings,
  DeviceBinding,
  DevicePostDataAny,
  LoginCredentials,
  LoginData,
} from '../types/index.ts'
import { isModelledProduct } from '../constants.ts'
import { setting, syncDevices } from '../decorators/index.ts'
import { DeviceRegistry } from '../entities/index.ts'
import { AuthenticationError, RegistrySyncError } from '../errors/index.ts'
import { fireAndForget } from '../fire-and-forget.ts'
import {
  type HttpResponse,
  HttpClient,
  HttpStatus,
  isHttpError,
} from '../http/index.ts'
import {
  APICallRequestData,
  APICallResponseData,
  createAPICallErrorData,
  LifecycleEmitter,
} from '../observability/index.ts'
import {
  type ResiliencePolicy,
  AuthRetryPolicy,
  isSessionExpired,
  RetryGuard,
  TransientRetryPolicy,
} from '../resilience/index.ts'
import { Temporal } from '../temporal.ts'
import {
  MS_PER_MINUTE,
  MS_PER_SECOND,
  SESSION_REFRESH_AHEAD_MS,
} from '../time-units.ts'
import {
  BindingsSchema,
  DeviceBindingSchema,
  DeviceDataSchema,
  LoginDataSchema,
  parseOrThrow,
} from '../validation/index.ts'
import type {
  HeatzyAPIAdapter,
  HeatzyAPIConfig,
  Logger,
  SettingManager,
  SyncCallback,
  TransportConfig,
} from './types.ts'
import { SyncManager } from './sync-manager.ts'

const API_BASE_URL = 'https://euapi.gizwits.com/app'
const APPLICATION_ID_HEADER = 'X-Gizwits-Application-Id'
const APPLICATION_ID = 'c70a66ff039d41b4a220e198b0fcc8b3'
const USER_TOKEN_HEADER = 'X-Gizwits-User-token'
const LOGIN_PATH = '/login'

const DEFAULT_SYNC_INTERVAL_MINUTES = 5
const DEFAULT_TIMEOUT_MS = 30_000

// Cool-down between consecutive auth-retry consumptions on the same
// RetryGuard. Deliberately hardcoded — no caller has needed to tune it.
const DEFAULT_AUTH_RETRY_COOLDOWN_MS = 1000

// Automatic re-login backoff after a REJECTED sign-in: hammering the
// Gizwits login endpoint with a stale credential would only prolong a
// lockout. Transport failures do not arm it (the normal retry paths
// handle those); an explicit `authenticate()` — the user re-submitting
// credentials — bypasses the gate and resets it on success. The
// deadline persists through the SettingManager so host restarts
// respect it too.
const LOGIN_BACKOFF_FAILURE_MS = 900_000

const buildTransport = (transport: TransportConfig | undefined): HttpClient =>
  transport instanceof HttpClient
    ? transport
    : new HttpClient({
        baseURL: API_BASE_URL,
        headers: { [APPLICATION_ID_HEADER]: APPLICATION_ID },
        timeout: transport?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      })

/**
 * Narrow a login rejection surfaced by the HTTP client into the shared
 * {@link AuthenticationError} domain type. Gizwits rejects credentials
 * with HTTP 400 (error codes in the body), so both 400 and 401 read as
 * an authentication failure on the `/login` path; any other rejection
 * yields `null` and the caller rethrows its original error.
 * @param error - The error to inspect.
 * @returns An {@link AuthenticationError} for a 400/401 `HttpError`; `null` otherwise.
 */
export const toAuthFailure = (error: unknown): AuthenticationError | null =>
  isHttpError(error) &&
  (error.response.status === HttpStatus.BadRequest ||
    error.response.status === HttpStatus.Unauthorized)
    ? new AuthenticationError('Heatzy rejected the credentials', {
        cause: error,
      })
    : null

/**
 * One `/bindings` entry the listing boundary dropped. The two verdicts
 * are worded APART because they call for opposite responses: a
 * malformed entry is a wire regression (fix the schema), an unresolved
 * `product_key` is a radiator Heatzy shipped after this release
 * (extend the product map in `constants.ts`, with its PDF in
 * `references/`). A silent or undifferentiated drop would leave one
 * indistinguishable symptom — "a device disappeared".
 */
interface DroppedBinding {
  /**
   * The entry's `did`, or `null` when the wire did not spell a string
   * one — the entry is still reported, unnamed.
   */
  readonly did: string | null
  /**
   * Which verdict the entry failed, pre-worded — the unmodelled form
   * names the offending `product_key`, so the report says which map
   * entry is missing.
   */
  readonly verdict: string
}

/**
 * The one filter of a listing cycle: it keeps the entries this SDK
 * models and remembers what it rejected, so the boundary can name the
 * drops instead of performing them in silence.
 */
interface DroppedBindingCollector {
  /**
   * The modelled form of one raw `/bindings` entry, or `null` when the
   * boundary drops it. Rejections are recorded, never merely returned.
   */
  readonly keep: (device: unknown) => DeviceBinding | null
  /**
   * The cycle's one report line, or `null` when nothing was dropped.
   */
  readonly summarize: () => string | null
}

const UNREADABLE_ENTRY_VERDICT = 'an entry this SDK cannot read'

const describeDroppedBinding = ({ did, verdict }: DroppedBinding): string =>
  `device ${did ?? 'unknown'} (${verdict})`

// The `did` of an entry the schema refused, salvaged so the report can
// still name the device: a drop is only actionable when the user can
// tell WHICH radiator went missing.
const salvageDid = (device: unknown): string | null =>
  typeof device === 'object' &&
  device !== null &&
  'did' in device &&
  typeof device.did === 'string'
    ? device.did
    : null

/**
 * Opens a collector for ONE listing cycle.
 *
 * An entry is kept only when this SDK can model it: the shape has to
 * validate AND the `product_key` has to resolve, because
 * `new Device(...)` calls `getProduct`, which throws on a key this SDK
 * predates — inside the registry sync, after the wire answered 200 and
 * after the sign-in stored its token. The registry runs no guard of
 * its own; this boundary is what it relies on.
 *
 * The volume verdict lives here: `/bindings` carries every device of
 * the account and runs on every sync cycle, so a line per dropped
 * entry would storm the host's logger — hardest exactly when a wire
 * regression takes the whole payload down and the diagnostic report
 * most needs to stay readable. The collector emits ONE aggregated line
 * per cycle instead, bounded by the cycle rather than by the listing's
 * size, and that line still names every dropped entry with its
 * verdict: the ids are what makes it actionable, since a consumer
 * degrades a pruned device to a warning over frozen values and the
 * report has to say WHICH device went stale and why.
 * @returns A collecting filter plus the cycle's report line.
 */
const createDroppedBindingCollector = (): DroppedBindingCollector => {
  const dropped: DroppedBinding[] = []
  let total = 0
  return {
    keep: (device: unknown): DeviceBinding | null => {
      total += 1
      const parsed = DeviceBindingSchema.safeParse(device)
      if (!parsed.success) {
        dropped.push({
          did: salvageDid(device),
          verdict: UNREADABLE_ENTRY_VERDICT,
        })
        return null
      }
      const { did, product_key: productKey } = parsed.data
      if (!isModelledProduct(productKey)) {
        dropped.push({ did, verdict: `unknown product_key ${productKey}` })
        return null
      }
      return parsed.data
    },
    summarize: (): string | null =>
      dropped.length === 0
        ? null
        : `Dropped ${String(dropped.length)} of ${String(total)} /bindings entries: ${dropped
            .map((entry) => describeDroppedBinding(entry))
            .join(', ')}`,
  }
}

/**
 * Heatzy (Gizwits) API client. Handles authentication, session
 * persistence and restore, device syncing, and the `/bindings`,
 * `/devdata` and `/control` endpoint calls. Uses a private
 * constructor — create instances via {@link HeatzyAPI.create}.
 * @category API Clients
 */
export class HeatzyAPI implements Disposable, HeatzyAPIAdapter {
  public readonly logger: Logger

  public readonly settingManager?: SettingManager | undefined

  /**
   * BCP-47 locale supplied via {@link HeatzyAPIConfig.locale}, or
   * `undefined` when unset. Surfaced through {@link HeatzyAPIAdapter}
   * so facades render `derogationEndString` labels consistently with
   * the configured locale without a mutable global.
   * @returns The configured BCP-47 locale tag, or `undefined`.
   */
  public get locale(): string | undefined {
    return this.#config.locale
  }

  /**
   * In-memory device registry populated by {@link fetch}.
   * @returns The registry instance.
   */
  public get registry(): DeviceRegistry {
    return this.#registry
  }

  /**
   * IANA timezone supplied via {@link HeatzyAPIConfig.timezone}, or
   * `undefined` when unset. Surfaced through {@link HeatzyAPIAdapter}
   * so derogation end dates anchor to the account timezone rather
   * than the host runtime timezone.
   * @returns The configured IANA timezone identifier, or `undefined`.
   */
  public get timezone(): string | undefined {
    return this.#config.timezone
  }

  // Bumped the instant `#doAuthenticate` resolves — the one moment at
  // which the SIGN-IN ROUND-TRIP is known accepted, whatever the
  // enforced post-auth sync goes on to do. `resumeSession` compares it
  // across the call, which is what lets it tell an accepted sign-in
  // from a refused one when BOTH leave a live session behind.
  #acceptedSignIns = 0

  readonly #api: HttpClient

  readonly #authRetryPolicy: AuthRetryPolicy

  // The config slice consulted after construction (shutdown signal,
  // display locale, account timezone).
  readonly #config: Pick<HeatzyAPIConfig, 'abortSignal' | 'locale' | 'timezone'>

  readonly #events: LifecycleEmitter

  // One event per loss episode: rearmed by any cycle observed
  // authenticated again (including the post-auth sync of a re-login).
  #hasEmittedAuthenticationLost = false

  // Verdict recorded against the STORED credential: the server
  // definitively refused it (a real rejection — on this dialect any
  // `AuthenticationError`, since no throttle error type exists to
  // exclude and a transport blip is never mapped to one) and no
  // sign-in has been accepted since. The stored token deliberately
  // stays — a refusal changes the verdict, never the session (the
  // 12.0.1 rule; only the REACTIVE `#reauthenticate` clears, because
  // the 400/9004 names the token itself) — so this record is what
  // lets `#settleSyncCycle` stop serving a token whose account died
  // server-side, where `isAuthenticated()` keeps reading `true` for
  // the token's remaining life. In-memory on purpose, like the loss
  // episode marker above: a restart re-witnesses the refusal on its
  // first gated sign-in.
  #isCredentialRefused = false

  // Bumped by every logOut so async work that was in flight when the
  // user signed out (a background resume, a sync cycle) can detect the
  // sign-out on completion and discard what it stored — the explicit
  // sign-out always wins over work it overlapped.
  #logOutEpoch = 0

  // Single in-flight session refresh — deduplication semantics on
  // `#ensureSession`.
  #refreshPromise: Promise<void> | null = null

  readonly #registry: DeviceRegistry

  // Baseline of `#acceptedSignIns` when the in-flight resume began:
  // lets a caller joining the flight read the verdict the instant the
  // sign-in round-trip is accepted, without awaiting the enforced
  // registry cycle still running behind it (see `resumeSession`).
  #resumeAcceptedBefore = 0

  // Single in-flight resume handle — the `#refreshPromise` pattern
  // one lifecycle layer up: concurrent resume paths share ONE sign-in
  // round-trip and read the shared attempt's verdict.
  #resumePromise: Promise<boolean> | null = null

  readonly #retryGuard = new RetryGuard(DEFAULT_AUTH_RETRY_COOLDOWN_MS)

  readonly #syncManager: SyncManager

  @setting
  private accessor expiry = ''

  // Epoch-ms deadline before which automatic re-logins are refused;
  // `''` means no pause. Persisted like the credentials so the gate
  // survives a host restart.
  @setting
  private accessor loginBackoffUntil = ''

  @setting
  private accessor password = ''

  @setting
  private accessor token = ''

  @setting
  private accessor username = ''

  private constructor(config: HeatzyAPIConfig = {}) {
    const {
      abortSignal,
      events,
      locale,
      logger = console,
      password,
      settingManager,
      syncIntervalMinutes,
      timezone,
      transport,
      username,
    } = config
    this.logger = logger
    this.settingManager = settingManager
    this.#config = { abortSignal, locale, timezone }
    this.#events = new LifecycleEmitter(events, logger)
    this.#registry = new DeviceRegistry({ timezone })
    this.#api = buildTransport(transport)
    this.#syncManager = new SyncManager(
      async () => this.fetch(),
      logger,
      syncIntervalMinutes ?? DEFAULT_SYNC_INTERVAL_MINUTES,
    )
    // Gizwits reports an invalid or expired user token as HTTP 400
    // (error code 9004 in the body), never 401 — both statuses arm the
    // reactive re-auth, mirroring the field-proven Axios interceptor.
    this.#authRetryPolicy = new AuthRetryPolicy(
      this.#retryGuard,
      async () => this.#reauthenticate(),
      [HttpStatus.Unauthorized, HttpStatus.BadRequest],
    )
    this.#applyCredentials(username, password)
  }

  /**
   * Create and initialize a Heatzy API instance.
   *
   * Post-construction, the initial session restore runs — in the
   * background when `shouldResumeSessionInBackground` is set. On
   * return, either the registry is populated or the instance is in a
   * documented empty state (no credentials, no persisted session);
   * check {@link isAuthenticated} to distinguish.
   * @param config - Optional configuration for the API client.
   * @returns The initialized HeatzyAPI instance.
   */
  public static async create(config?: HeatzyAPIConfig): Promise<HeatzyAPI> {
    const api = new HeatzyAPI(config)
    await api.start(config?.shouldResumeSessionInBackground === true)
    return api
  }

  /**
   * Sign in with explicit credentials. Refused credentials come back as
   * Gizwits HTTP 400 with error codes in the body. Successful return
   * guarantees the registry reflects server state — the post-auth sync
   * is enforced here.
   *
   * Use {@link resumeSession} for a best-effort restore from persisted
   * credentials that logs + swallows errors.
   *
   * A rejected sign-in leaves the previously persisted credentials and
   * session untouched: only server-accepted credentials reach the
   * settings store.
   * "Reflects server state" means what this SDK MODELS of it: an entry
   * the SDK cannot read and a device whose live attributes the wire
   * would not answer are dropped by {@link list} and the fan-out, each
   * against a log line, and the sign-in still succeeds over the rest.
   * One radiator never denies the account.
   * @param credentials - Explicit username/password.
   * @throws {@link AuthenticationError} when credentials are rejected.
   * @throws {@link RegistrySyncError} when the sign-in succeeded but
   * the registry could not be populated AT ALL (a refused `/bindings`
   * call, an envelope that is not a device list) — the cycle's own
   * failure rides its `cause`. The guarantee above is the reason:
   * resolving here would report success over an empty registry. The
   * credential check happened FIRST, so the session is left signed in
   * and the credentials persisted: this rejection says "signed in,
   * but the registry could not be verified", never "sign-in refused".
   * The dedicated type is what lets callers branch on that difference
   * without re-deriving it from `isAuthenticated()` — a discriminator
   * that misreads a transport blip during an account switch over a
   * pre-existing live token as "signed in, stale list".
   */
  public async authenticate(credentials: LoginCredentials): Promise<void> {
    const epoch = this.#logOutEpoch
    try {
      await this.#doAuthenticate(credentials)
    } catch (error) {
      this.#armLoginBackoff(error)
      throw error
    }
    // The sign-in round-trip is ACCEPTED from here on, and nothing
    // below can un-accept it: `#finishLogin` may still reject, but on
    // the registry, never on the credential.
    this.#acceptedSignIns += 1
    // An accepted pair also closes any recorded refusal episode: the
    // stored credential is the one the server just took.
    this.#isCredentialRefused = false
    // Persisted only now, so a rejected pair can never displace working
    // stored credentials. No session clear is needed either:
    // `#doAuthenticate` overwrites both session keys wholesale, and the
    // paths that know a session is dead (`logOut`, the reactive
    // `#reauthenticate`, a raced log-out in `#finishLogin`) each clear
    // it themselves.
    this.#applyCredentials(credentials.username, credentials.password)
    await this.#finishLogin(epoch)
  }

  /**
   * Cancels any pending auto-sync timer; subsequent `setSyncInterval` or `fetch` calls re-arm it.
   */
  public clearSync(): void {
    this.#syncManager.clear()
  }

  /**
   * Fetch all bindings and their live attributes, sync the device
   * registry, and schedule the next auto-sync. Failures are logged
   * and swallowed (the next cycle retries); the returned list is
   * empty on failure and no sync notification fires. An empty list is
   * indistinguishable from an account with no bindings, so a caller
   * that needs to know the registry is current must not use this
   * entry point — {@link authenticate} enforces its sync instead.
   *
   * The list is the ledger of what this cycle modelled: an entry
   * {@link list} dropped is absent from it, and a device whose live
   * attributes failed to read is present here while
   * `registry.devices.getById` answers `undefined` (never seen) or a
   * model still carrying its previous data (seen before). Both leave a
   * log line, both are retried by the next cycle.
   * @returns The `/bindings` entries this SDK models.
   */
  public async fetch(): Promise<readonly DeviceBinding[]> {
    try {
      return await this.#syncCycle()
    } catch (error) {
      this.logger.error('Failed to fetch devices:', error)
      return []
    }
  }

  /**
   * Read the live attribute payload of a single device, Zod-validated.
   * @param root0 - Destructured options.
   * @param root0.id - Device identifier (wire `did`).
   * @returns The live attributes.
   */
  public async getValues({ id }: { id: string }): Promise<Attributes> {
    const { attr } = await this.#requestData('get', `/devdata/${id}/latest`, {
      schema: DeviceDataSchema,
    })
    return attr
  }

  /**
   * Post-construction lifecycle hook driven by {@link create}. Never
   * rejects by design — probe and resume failures are swallowed and
   * surfaced through the lifecycle events.
   *
   * Two-branch template:
   * 1. Reuse — when a persisted token exists, one registry sync
   *    verifies it (the request pipeline self-heals an expired token
   *    from stored credentials); success means done.
   * 2. Otherwise, {@link resumeSession} runs — best-effort restore
   *    from persisted credentials. Does nothing (silently) if no
   *    credentials are persisted, so the "no creds + no session"
   *    case falls through to a documented empty state.
   */
  public async initialize(): Promise<void> {
    if (await this.#tryReuseSession()) {
      return
    }
    if (!(await this.resumeSession()) && this.#hasRecoverableState()) {
      this.#emitAuthenticationLostOnce()
    }
  }

  /**
   * Whether a Gizwits user token has been issued.
   * @returns `true` once authenticated.
   */
  public isAuthenticated(): boolean {
    return this.token !== ''
  }

  /**
   * Fetches the `/bindings` payload without touching the registry, and
   * keeps the entries this SDK can model.
   *
   * The envelope is validated as a whole — a body that is not a device
   * list stays a hard {@link ValidationError} — but the entries are
   * validated ONE BY ONE: this call opens the registry cycle, and the
   * post-auth cycle propagates, so an atomic array would let a single
   * unreadable entry read as "cannot sign in at all". The drops are
   * reported as ONE aggregated line per cycle naming every dropped
   * entry with its verdict, because a wire regression and a Heatzy
   * product newer than this SDK call for opposite answers and must
   * stay distinguishable in the diagnostic reports users paste into
   * issues — while a listing-wide regression must not storm the host
   * logger exactly when that report most needs to stay readable.
   * @returns Every device bound to the account that this SDK models.
   */
  public async list(): Promise<readonly DeviceBinding[]> {
    const { devices } = await this.#requestData<Bindings>('get', '/bindings', {
      schema: BindingsSchema,
    })
    const { keep, summarize } = createDroppedBindingCollector()
    const bindings = devices.flatMap((device) => keep(device) ?? [])
    const summary = summarize()
    if (summary !== null) {
      // `error`, not `log`: a device the account owns has left the
      // registry, and the consumer degrades it to a warning over
      // frozen values without being told why. This line is the only
      // trace of the drop, and it lands verbatim in the diagnostic
      // report a user pastes into an issue.
      this.logger.error(summary)
    }
    return bindings
  }

  /**
   * Low-level POST to `/login`. Prefer {@link authenticate}, which
   * adds the login backoff, persists the resulting token/expiry, and
   * is triggered automatically on an expired token.
   * @param root0 - Destructured options.
   * @param root0.postData - Login credentials (the verbatim wire body).
   * @returns The raw login payload, Zod-validated.
   */
  public async login({
    postData,
  }: {
    postData: LoginCredentials
  }): Promise<LoginData> {
    const { data } = await this.#dispatch<LoginData>('post', LOGIN_PATH, {
      data: postData,
    })
    return parseOrThrow(LoginDataSchema, data, 'login')
  }

  /**
   * Log out: the inverse of {@link authenticate}. Clears the persisted
   * session (token/expiry), the stored username/password and the
   * automatic-login backoff, stops the auto-sync timer, and empties
   * the registry — so {@link isAuthenticated} reads `false` and no
   * stale devices linger.
   *
   * User-initiated, so unlike a rejected sign-in it neither arms the
   * backoff nor emits `onAuthenticationLost`. A subsequent
   * {@link authenticate} is the only way back in.
   */
  public logOut(): void {
    this.#logOutEpoch += 1
    this.#clearPersistedSession()
    this.username = ''
    this.password = ''
    this.#setLoginBackoffUntil(null)
    this.clearSync()
    this.#clearRegistry()
  }

  /**
   * Notify any registered `events.onSyncComplete` observer that a
   * sync just landed. Routed through the lifecycle emitter so a
   * misbehaving callback cannot break the caller. Invoked by the
   * `@syncDevices` decorator after each decorated mutation.
   * @param args - {@link SyncCallback}-shaped payload (`ids`).
   */
  public async notifySync(...args: Parameters<SyncCallback>): Promise<void> {
    await this.#events.emitSyncComplete(...args)
  }

  /**
   * Best-effort session restore from persisted credentials.
   *
   * Reads `username`/`password` from the SettingManager and signs
   * in. Unlike {@link authenticate}, failures are **logged and
   * swallowed** — the method never throws. That covers the enforced
   * post-auth sync too: `authenticate` surfaces what the enforced
   * registry cycle raises as a {@link RegistrySyncError}, and this
   * method catches it like any other rejection rather than letting a
   * registry failure reach a lifecycle caller. Use it from lifecycle
   * hooks (init, auth retry, `#ensureSession`) where a stale or
   * missing persisted credential must not crash the caller.
   *
   * SINGLE-FLIGHT: concurrent calls share one attempt — the lifecycle
   * paths that race at boot (a background `initialize`, the first
   * request's `#ensureSession`, a reactive token failure) collapse
   * onto ONE sign-in round-trip, and every caller's verdict describes
   * that shared attempt. Without the memo, two callers could both
   * pass the login-backoff gate before either refusal armed it,
   * spending two sign-ins against a login endpoint whose lockout
   * hammering only prolongs.
   *
   * A refusal it swallows is also RECORDED (a definitive rejection —
   * never a transport failure): the stored token stays untouched, but
   * the sync-cycle epilogue stops reading the session as signed-in
   * until a sign-in is accepted again.
   *
   * On success, the registry is populated (delegates to
   * {@link authenticate}).
   * @returns `true` when the sign-in round-trip was ACCEPTED —
   * including one whose enforced post-auth sync then failed, because
   * the session it established stands; `false` for "no persisted
   * credentials", "sign-ins are backed off" and "the server refused
   * the credentials" (indistinguishable by the return value alone —
   * check the logger / `isAuthenticated` if the distinction matters).
   */
  public async resumeSession(): Promise<boolean> {
    if (this.#resumePromise !== null) {
      // Joining a flight whose sign-in round-trip is ALREADY accepted
      // (the counter moved past the flight's baseline): the verdict is
      // determined — an accepted sign-in stays a resume whatever its
      // enforced registry cycle goes on to do — so answer it without
      // awaiting. The one caller that arrives here DURING that cycle
      // is the reactive token-failure path the cycle itself triggered,
      // and awaiting the shared promise would have it wait on its own
      // caller.
      if (this.#acceptedSignIns !== this.#resumeAcceptedBefore) {
        return true
      }
      return this.#resumePromise
    }
    this.#resumeAcceptedBefore = this.#acceptedSignIns
    this.#resumePromise = this.#attemptResumeSession()
    try {
      return await this.#resumePromise
    } finally {
      this.#resumePromise = null
    }
  }

  /**
   * Releases the auto-sync timer; the instance must not be reused after disposal.
   */
  public [Symbol.dispose](): void {
    this.#syncManager[Symbol.dispose]()
  }

  /**
   * Reschedules the auto-sync timer.
   *
   * The timer is `unref`'d, so it never keeps the Node event loop alive
   * on its own — auto-sync still fires on cadence whenever the host
   * application has another reason to stay running (HTTP server, other
   * timers, open streams). Apps that must run indefinitely should
   * provide their own keep-alive rather than relying on this timer.
   * @param minutes - Cadence in minutes; pass `false` to disable.
   */
  public setSyncInterval(minutes: number | false): void {
    this.#syncManager.setInterval(minutes)
  }

  /**
   * Run the initial session restore, honoring the configured mode.
   * `initialize()` never rejects by design (probe and resume failures
   * are swallowed and surfaced through the lifecycle events), so the
   * background variant only needs the fire-and-forget form.
   * @param shouldResumeInBackground - When `true`, the restore runs off
   * the caller's critical path and `create()` resolves immediately.
   */
  public async start(shouldResumeInBackground = false): Promise<void> {
    if (shouldResumeInBackground) {
      fireAndForget(
        this.initialize(),
        this.logger,
        'Background session resume failed:',
      )
      return
    }
    await this.initialize()
  }

  /**
   * Send a control payload to a single device. The server's response
   * body is empty by contract and is not consumed.
   * @param root0 - Destructured options.
   * @param root0.id - Device identifier (wire `did`).
   * @param root0.postData - Named attributes, or the V1 `raw` triplet.
   */
  public async updateValues({
    id,
    postData,
  }: {
    id: string
    postData: DevicePostDataAny
  }): Promise<void> {
    await this.#request('post', `/control/${id}`, { data: postData })
  }

  // The registry refresh both entry points share, without a
  // best-effort guard: `fetch` downgrades a failure to a logged empty
  // list, the post-auth path must not. What still surfaces here is what
  // no partial answer can survive — an envelope that is not a device
  // list, a `/bindings` call the wire refused outright, a registry bug:
  // permanent failures retrying cannot clear, so a sign-in that
  // resolved over one would report success on an empty registry. What a
  // SINGLE device causes never reaches this point — the listing
  // boundary and the fan-out degrade per entry, so one radiator this
  // SDK predates costs that radiator, never the account.
  @syncDevices
  async #syncCycle(): Promise<readonly DeviceBinding[]> {
    const epoch = this.#logOutEpoch
    this.clearSync()
    try {
      return await this.#fetch()
    } finally {
      this.#settleSyncCycle(epoch)
    }
  }

  #applyCredentials(username?: string, password?: string): void {
    if (username !== undefined) {
      this.username = username
    }
    if (password !== undefined) {
      this.password = password
    }
  }

  #armLoginBackoff(error: unknown): void {
    if (!(error instanceof AuthenticationError)) {
      // A transport failure is not a rejected login: the normal retry
      // paths own those, and pausing sign-ins would mask a mere blip.
      return
    }
    this.#setLoginBackoffUntil(
      Temporal.Now.instant().epochMilliseconds + LOGIN_BACKOFF_FAILURE_MS,
    )
    this.logger.error(
      `Automatic sign-ins paused for ${String(Math.round(LOGIN_BACKOFF_FAILURE_MS / MS_PER_MINUTE))} minutes after a rejected login`,
    )
  }

  // The resume attempt proper — `resumeSession` memoizes it so that
  // concurrent lifecycle paths share one sign-in round-trip instead of
  // racing the login-backoff gate.
  async #attemptResumeSession(): Promise<boolean> {
    if (this.#isLoginBackedOff()) {
      return false
    }
    const credentials = this.#resolvePersistedCredentials()
    if (credentials === null) {
      return false
    }
    const acceptedBefore = this.#acceptedSignIns
    try {
      await this.authenticate(credentials)
      return true
    } catch (error) {
      return this.#reportResumeFailure(error, acceptedBefore)
    }
  }

  /**
   * Build the per-request resilience pipeline. Order matters — outer
   * policies see the attempt first: auth-retry handles token failures
   * after the inner retries give up, and the optional transient retry
   * (GET-only) is the innermost wrapper around the raw dispatch.
   * @param context - Per-request correlation context used by the
   * transient-retry telemetry when it fires.
   * @param context.correlationId - UUID for cross-emission linkage.
   * @param context.method - HTTP method (uppercased) of the request.
   * @param context.url - URL of the request being dispatched.
   * @returns The composite policy ready to run the attempt.
   */
  #buildPolicy(context: {
    correlationId: string
    method: string
    url: string
  }): ResiliencePolicy {
    if (context.method !== 'GET') {
      return this.#authRetryPolicy
    }
    const transientPolicy = new TransientRetryPolicy(
      {
        onRetry: (
          retryAttempt: number,
          error: unknown,
          delayMs: number,
        ): void => {
          this.logger.log(
            `Transient server error on ${context.url}: retry ${String(retryAttempt)} in ${String(delayMs)} ms`,
          )
          this.#events.emitRetry({
            ...context,
            attempt: retryAttempt,
            delayMs,
            error,
          })
        },
      },
      this.#config.abortSignal,
    )
    return {
      run: async <T>(attempt: () => Promise<T>): Promise<T> =>
        this.#authRetryPolicy.run(async () => transientPolicy.run(attempt)),
    }
  }

  #clearPersistedSession(): void {
    this.token = ''
    this.expiry = ''
  }

  #clearRegistry(): void {
    this.#registry.syncDevices([], {})
  }

  async #dispatch<T = unknown>(
    method: string,
    url: string,
    config: { readonly data?: unknown } = {},
  ): Promise<HttpResponse<T>> {
    // No heatzy endpoint sends per-call headers, so auth headers are
    // the only ones — a config.headers merge would be an uncovered
    // dead branch (see the melcloud dispatch for the general form).
    const requestConfig = {
      ...config,
      headers: this.#getAuthHeaders(),
      method,
      ...(this.#config.abortSignal !== undefined && {
        signal: this.#config.abortSignal,
      }),
      url,
    }
    this.logger.log(String(new APICallRequestData(requestConfig)))
    const response = await this.#api.request<T>(requestConfig)
    this.logger.log(String(new APICallResponseData(response, requestConfig)))
    return response
  }

  async #doAuthenticate(credentials: LoginCredentials): Promise<void> {
    let data: LoginData
    try {
      data = await this.login({ postData: credentials })
    } catch (error) {
      const failure = toAuthFailure(error)
      if (failure !== null) {
        throw failure
      }
      throw error
    }
    // Only the session artifacts are stored here — both keys, a
    // wholesale replacement of any prior session; `authenticate`
    // persists the credentials once this resolves. `expire_at`
    // arrives as epoch seconds — persisted as ISO 8601 so the shared
    // session-expiry check reads it back absolutely.
    this.token = data.token
    this.expiry = Temporal.Instant.fromEpochMilliseconds(
      data.expire_at * MS_PER_SECOND,
    ).toString()
  }

  #emitAuthenticationLostOnce(): void {
    if (this.#hasEmittedAuthenticationLost) {
      return
    }

    this.#hasEmittedAuthenticationLost = true
    this.#events.emitAuthenticationLost()
  }

  /**
   * Ensure the persisted session is fresh before letting a request
   * hit the transport.
   *
   * Two guarantees:
   * 1. **Pre-emptive refresh** — expiry is checked with a forward
   *    window, so the refresh fires before the token actually expires
   *    and no request ever pays the full re-auth round-trip on its
   *    critical path.
   * 2. **Concurrent-refresh deduplication** — the single in-flight
   *    refresh handle (`#refreshPromise`) prevents the thundering-herd
   *    pattern where N concurrent requests each trigger their own
   *    refresh. Only the first caller kicks off the round-trip; the
   *    rest await the same promise.
   */
  async #ensureSession(): Promise<void> {
    if (!this.#needsSessionRefresh()) {
      return
    }
    // eslint-disable-next-line unicorn/prefer-await -- single-flight memoization: the cleanup must be attached to the shared promise, not awaited here
    this.#refreshPromise ??= this.#performSessionRefresh().finally(() => {
      this.#refreshPromise = null
    })
    await this.#refreshPromise
  }

  async #fetch(): Promise<readonly DeviceBinding[]> {
    const bindings = await this.list()
    this.#registry.syncDevices(bindings, await this.#readAttributes(bindings))
    return bindings
  }

  // Post-`#doAuthenticate` epilogue, split on the logOut epoch: a
  // logOut that landed while the sign-in round-trip was in flight
  // (e.g. the user signed out during a background resume) wins —
  // discard what the login just stored and stay signed out. Otherwise
  // clear the backoff gate and run the enforced post-auth sync.
  async #finishLogin(epoch: number): Promise<void> {
    if (this.#logOutEpoch !== epoch) {
      this.#clearPersistedSession()
      this.username = ''
      this.password = ''
      return
    }
    this.#setLoginBackoffUntil(null)
    try {
      await this.#syncCycle()
    } catch (error) {
      // The credential check succeeded FIRST, so this rejection must
      // stay distinguishable BY TYPE from a refused sign-in — the
      // wrap is what spares consumers the judge-by-the-session
      // fallback (`isAuthenticated()`), whose false positive is a
      // transport blip during an account switch over a pre-existing
      // live token.
      throw new RegistrySyncError(
        'Signed in, but the registry could not be verified',
        { cause: error },
      )
    }
  }

  #getAuthHeaders(): Record<string, string> {
    return this.token === '' ? {} : { [USER_TOKEN_HEADER]: this.token }
  }

  // A loss is only a loss when there was something to restore — a
  // persisted session or persisted credentials. Probing an API that was
  // never configured must neither notify nor look like an expiry.
  #hasRecoverableState(): boolean {
    return this.token !== '' || this.#resolvePersistedCredentials() !== null
  }

  // A corrupt persisted value reads as "no pause" — never lock the
  // user out on bad data.
  #isLoginBackedOff(): boolean {
    const raw = this.loginBackoffUntil
    if (raw === '') {
      return false
    }
    const until = Number(raw)
    return (
      Number.isFinite(until) && Temporal.Now.instant().epochMilliseconds < until
    )
  }

  // The composite verdict the sync-cycle epilogue consults: a session
  // only counts as signed-in while no definitive refusal stands
  // against the stored credential. `isAuthenticated()` alone cannot
  // say that, because a refusal deliberately leaves the token in
  // place — the token answers "a session stands", never "the
  // credential does".
  #isSessionServable(): boolean {
    return this.isAuthenticated() && !this.#isCredentialRefused
  }

  #logError(error: unknown): void {
    if (isHttpError(error)) {
      this.logger.error(String(createAPICallErrorData(error)))
    }
  }

  // A live session marks any earlier loss episode as recovered —
  // announced once per episode, so the two events always alternate.
  #markLossRecovered(): void {
    if (!this.#hasEmittedAuthenticationLost) {
      return
    }

    this.#hasEmittedAuthenticationLost = false
    this.#events.emitAuthenticationRestored()
  }

  // The token needs refreshing when absent or within the forward
  // window of its expiry, so the renewal stays off the critical path.
  #needsSessionRefresh(): boolean {
    return (
      this.token === '' ||
      isSessionExpired(this.expiry, SESSION_REFRESH_AHEAD_MS)
    )
  }

  // The only refresh path Gizwits offers is a full re-login from
  // persisted credentials; `resumeSession` logs + swallows on failure
  // so the triggering request can still attempt its own retry path.
  async #performSessionRefresh(): Promise<void> {
    await this.resumeSession()
  }

  // The registry cycle's fan-out half, settled leg by leg: one device
  // the wire cannot answer for — a transient 5xx that outlived the
  // retry rung, an attribute payload naming a mode this SDK predates —
  // must not deny the whole account. A failed leg is logged with its
  // device id and simply left out of the record, which is the
  // `undefined` `DeviceRegistry.syncDevices` documents: an existing
  // model keeps its last-known data, a new one waits for the next
  // cycle. `Promise.allSettled` rather than a caught `Promise.all`
  // because it also absorbs the ONE line that cannot be guarded — a
  // host logger that throws while reporting the skip then costs that
  // one device instead of the account.
  async #readAttributes(
    bindings: readonly DeviceBinding[],
  ): Promise<Record<string, Attributes>> {
    const settled = await Promise.allSettled(
      bindings.map(async ({ did }) => {
        try {
          return [did, await this.getValues({ id: did })] as const
        } catch (error) {
          this.logger.error(
            `Skipping device ${did}: its live attributes could not be read`,
            error,
          )
          throw error
        }
      }),
    )
    return Object.fromEntries(
      settled.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : [],
      ),
    )
  }

  // Reactive refresh after an expired-token 400/401, before
  // `AuthRetryPolicy` replays the request: the only recovery path is a
  // best-effort re-login from persisted credentials. The rejected
  // token is cleared first — the server just refused it.
  async #reauthenticate(): Promise<boolean> {
    this.#clearPersistedSession()
    return this.resumeSession()
  }

  // The verdict `resumeSession` puts on a rejection it swallowed:
  // judged by the SIGN-IN ROUND-TRIP — not by the throw, and not by
  // the session either, because BOTH failures can leave a live session
  // standing and only the round-trip separates them.
  // - ACCEPTED, then the enforced registry cycle threw: the session
  //   was established, so a `false` here would have `initialize()`
  //   emit a spurious `onAuthenticationLost`, prompting the user to
  //   sign in again over credentials that had just worked.
  // - REFUSED, over a session that predates the attempt: nothing was
  //   refreshed, so a `true` here hands the caller the credential the
  //   server has just rejected. No internal path ever consumed that
  //   wrong `true` — the reactive `#reauthenticate` clears the token
  //   FIRST, Gizwits naming it in the 400/9004 — but `resumeSession`
  //   is PUBLIC, and a host calling it over a live token with refused
  //   stored credentials was told "resumed".
  #reportResumeFailure(error: unknown, acceptedBefore: number): boolean {
    this.logger.error('Session resume failed:', error)
    if (this.#acceptedSignIns !== acceptedBefore) {
      return true
    }
    // A DEFINITIVE refusal — any `AuthenticationError` on this
    // dialect, which maps only the 400/401 login rejections and has
    // no throttle type to exclude; a transport blip never qualifies —
    // is recorded as a verdict on the stored credential. The record
    // is what lets the cycle epilogue see a dead credential behind a
    // token the refusal deliberately did not clear; the next ACCEPTED
    // sign-in lifts it.
    if (error instanceof AuthenticationError) {
      this.#isCredentialRefused = true
    }
    return false
  }

  async #request<T = unknown>(
    method: string,
    url: string,
    config: { readonly data?: unknown } = {},
  ): Promise<HttpResponse<T>> {
    await this.#ensureSession()
    const context = {
      correlationId: randomUUID(),
      method: method.toUpperCase(),
      url,
    }
    const policy = this.#buildPolicy(context)
    const attempt = async (): Promise<HttpResponse<T>> => {
      try {
        return await this.#dispatch<T>(method, url, config)
      } catch (error) {
        this.#logError(error)
        throw error
      }
    }
    return this.#runWithEvents(context, async () => policy.run(attempt))
  }

  // Strip the envelope and parse the body against the endpoint's
  // schema; throw on transport failure — the contract every
  // required-path endpoint (sync, mutations) wants. Responses nothing
  // consumes (`/control`) go through `#request` directly.
  async #requestData<T>(
    method: string,
    url: string,
    options: { readonly schema: z.ZodType<T>; readonly data?: unknown },
  ): Promise<T> {
    const { schema, ...config } = options
    const { data } = await this.#request<T>(method, url, config)
    return parseOrThrow(schema, data, `${method.toUpperCase()} ${url}`)
  }

  #resolvePersistedCredentials(): LoginCredentials | null {
    const { password, username } = this
    if (username === '' || password === '') {
      return null
    }
    return { password, username }
  }

  async #runWithEvents<T>(
    context: { correlationId: string; method: string; url: string },
    runner: () => Promise<HttpResponse<T>>,
  ): Promise<HttpResponse<T>> {
    const startedAt = Temporal.Now.instant().epochMilliseconds
    this.#events.emitStart(context)
    try {
      const response = await runner()
      this.#events.emitComplete({
        ...context,
        durationMs: Temporal.Now.instant().epochMilliseconds - startedAt,
        status: response.status,
      })
      return response
    } catch (error) {
      this.#events.emitError({
        ...context,
        durationMs: Temporal.Now.instant().epochMilliseconds - startedAt,
        error,
      })
      throw error
    }
  }

  // `''` is the cleared sentinel: the `@setting` accessor persists the
  // value and deletes the key outright when the host delegates `unset`.
  #setLoginBackoffUntil(until: number | null): void {
    this.loginBackoffUntil = until === null ? '' : String(until)
  }

  // Sync-cycle epilogue, split on the logOut epoch. A logOut that
  // landed while the cycle was in flight: its request completed with
  // the pre-sign-out session and repopulated the registry — re-run the
  // wipe so the sign-out sticks, and leave the timer disarmed.
  // Unauthenticated with nothing to recover from (e.g. a settings page
  // probing a never-configured API) stays silent AND disarmed. The
  // signed-in read is the RECORDED verdict, not the bare session: a
  // stored credential the server has definitively refused falls
  // through to the loss branch even while a still-standing token keeps
  // `isAuthenticated()` reading `true`.
  #settleSyncCycle(epoch: number): void {
    if (this.#logOutEpoch !== epoch) {
      this.#clearPersistedSession()
      this.#clearRegistry()
      return
    }
    if (this.#isSessionServable()) {
      this.#markLossRecovered()
      this.#syncManager.planNext()
      return
    }
    if (this.#hasRecoverableState()) {
      // Rescheduling would hammer the account with a doomed sign-in
      // every cycle: stay disarmed and surface the loss instead — a
      // successful authenticate() re-arms the sync through its
      // enforced post-auth registry sync.
      this.#emitAuthenticationLostOnce()
    }
  }

  // Try to reuse a persisted token without a full re-authentication:
  // skip when nothing is persisted, otherwise run one registry sync
  // and judge by the credential — the request pipeline self-heals an
  // expired token from stored credentials, so a transiently-failed
  // probe with a valid token stays authenticated and lets the
  // auto-sync heal the registry instead of paying a full re-login on
  // a boot-time blip.
  async #tryReuseSession(): Promise<boolean> {
    if (this.token === '') {
      return false
    }
    await this.fetch()
    return this.isAuthenticated()
  }
}
