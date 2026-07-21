import { randomUUID } from 'node:crypto'

import type { z } from 'zod'

import type {
  Attributes,
  Bindings,
  Data,
  DeviceBinding,
  DevicePostDataAny,
  LoginCredentials,
  LoginData,
} from '../types/index.ts'
import { setting, syncDevices } from '../decorators/index.ts'
import { DeviceRegistry } from '../entities/index.ts'
import { AuthenticationError } from '../errors/index.ts'
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
  CompositePolicy,
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
// RetryGuard. Hardcoded because no caller has ever needed to tune it —
// the value carries over from the field-proven Axios interceptor's
// retry window, and adjusting it is more likely to mask bugs than
// reflect a real product need.
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
  transport instanceof HttpClient ? transport : (
    new HttpClient({
      baseURL: API_BASE_URL,
      headers: { [APPLICATION_ID_HEADER]: APPLICATION_ID },
      timeout: transport?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    })
  )

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
  (
    isHttpError(error) &&
    (error.response.status === HttpStatus.BadRequest ||
      error.response.status === HttpStatus.Unauthorized)
  ) ?
    new AuthenticationError('Heatzy rejected the credentials', {
      cause: error,
    })
  : null

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

  readonly #api: HttpClient

  // Policy instances are created once in the constructor and reused
  // for every request. Stateless w.r.t. individual calls — the shared
  // state (retry guard) lives in the policy's injected dependencies,
  // not in the policy itself.
  readonly #authRetryPolicy: AuthRetryPolicy

  // The config slice consulted after construction (shutdown signal,
  // display locale, account timezone).
  readonly #config: Pick<HeatzyAPIConfig, 'abortSignal' | 'locale' | 'timezone'>

  readonly #events: LifecycleEmitter

  // One event per loss episode: rearmed by any cycle observed
  // authenticated again (including the post-auth sync of a re-login).
  #hasEmittedAuthenticationLost = false

  // Bumped by every logOut so async work that was in flight when the
  // user signed out (a background resume, a sync cycle) can detect the
  // sign-out on completion and discard what it stored — the explicit
  // sign-out always wins over work it overlapped.
  #logOutEpoch = 0

  // Single in-flight refresh handle. Set when the first `#ensureSession`
  // call detects an expired session, cleared when the refresh resolves
  // (success or failure). Subsequent concurrent callers await the same
  // promise instead of each triggering their own round-trip — prevents
  // the thundering-herd pattern on token expiry.
  #refreshPromise: Promise<void> | null = null

  readonly #registry: DeviceRegistry

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
    this.#authRetryPolicy = new AuthRetryPolicy(this.#retryGuard, async () =>
      this.#reauthenticate(),
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
   * Fetch all bindings and their live attributes, sync the device
   * registry, and schedule the next auto-sync. Failures are logged
   * and swallowed (the next cycle retries); the returned list is
   * empty on failure.
   * @returns The fetched `/bindings` entries.
   */
  @syncDevices
  public async fetch(): Promise<readonly DeviceBinding[]> {
    const epoch = this.#logOutEpoch
    this.clearSync()
    try {
      return await this.#fetch()
    } catch (error) {
      this.logger.error('Failed to fetch devices:', error)
      return []
    } finally {
      this.#settleSyncCycle(epoch)
    }
  }

  /**
   * Sign in with explicit credentials. Throws
   * {@link AuthenticationError} on rejection (Gizwits answers HTTP 400
   * with error codes in the body). Successful return guarantees the
   * registry reflects server state — the post-auth sync is enforced
   * here.
   *
   * Use {@link resumeSession} for a best-effort restore from persisted
   * credentials that logs + swallows errors.
   * @param credentials - Explicit username/password.
   * @throws {AuthenticationError} when credentials are rejected.
   */
  public async authenticate(credentials: LoginCredentials): Promise<void> {
    const epoch = this.#logOutEpoch
    this.#applyCredentials(credentials.username, credentials.password)
    // Explicit login starts from a clean slate — enforced here
    // (mirrors the post-auth sync below).
    this.#clearPersistedSession()
    try {
      await this.#doAuthenticate(credentials)
    } catch (error) {
      this.#armLoginBackoff(error)
      throw error
    }
    await this.#finishLogin(epoch)
  }

  /** Cancels any pending auto-sync timer; subsequent `setSyncInterval` or `fetch` calls re-arm it. */
  public clearSync(): void {
    this.#syncManager.clear()
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
   * Fetches the raw `/bindings` payload (validated against the
   * envelope schema) without touching the registry.
   * @returns Every device bound to the account.
   */
  public async list(): Promise<readonly DeviceBinding[]> {
    const { devices } = await this.#requestData<Bindings>('get', '/bindings', {
      schema: BindingsSchema,
    })
    return devices
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
   * swallowed** — the method never throws. Use this from lifecycle
   * hooks (init, auth retry, `#ensureSession`) where a stale or
   * missing persisted credential must not crash the caller.
   *
   * On success, the registry is populated (delegates to
   * {@link authenticate}).
   * @returns `true` when a sign-in round-trip succeeded and the
   * instance is now authenticated; `false` for "no persisted
   * credentials" or "sign-in failed" (both indistinguishable by
   * the return value alone — check the logger / `isAuthenticated`
   * if the distinction matters).
   */
  public async resumeSession(): Promise<boolean> {
    if (this.#isLoginBackedOff()) {
      return false
    }
    const credentials = this.#resolvePersistedCredentials()
    if (credentials === null) {
      return false
    }
    try {
      await this.authenticate(credentials)
      return true
    } catch (error) {
      this.logger.error('Session resume failed:', error)
      return false
    }
  }

  /** Releases the auto-sync timer and any retry-guard timers; the instance must not be reused after disposal. */
  public [Symbol.dispose](): void {
    this.#syncManager[Symbol.dispose]()
    this.#retryGuard[Symbol.dispose]()
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
   * Send a control payload to a single device.
   * @param root0 - Destructured options.
   * @param root0.id - Device identifier (wire `did`).
   * @param root0.postData - Named attributes, or the V1 `raw` triplet.
   * @returns The (empty) server response.
   */
  public async updateValues({
    id,
    postData,
  }: {
    id: string
    postData: DevicePostDataAny
  }): Promise<Data> {
    return this.#requestData<Data>('post', `/control/${id}`, {
      data: postData,
    })
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
    const policies: ResiliencePolicy[] = [this.#authRetryPolicy]
    if (context.method === 'GET') {
      policies.push(
        new TransientRetryPolicy(
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
        ),
      )
    }
    return new CompositePolicy(policies)
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
    config: Record<string, unknown> = {},
  ): Promise<HttpResponse<T>> {
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
    // Credentials are already persisted by `authenticate` before this
    // runs; only the session artifacts are stored here. `expire_at`
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
    const attributes = Object.fromEntries(
      await Promise.all(
        bindings.map(
          async ({ did }) => [did, await this.getValues({ id: did })] as const,
        ),
      ),
    )
    this.#registry.syncDevices(bindings, attributes)
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
    await this.fetch()
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

  // Reactive refresh after an expired-token 400/401, before
  // `AuthRetryPolicy` replays the request: the only recovery path is a
  // best-effort re-login from persisted credentials. The rejected
  // token is cleared first — the server just refused it.
  async #reauthenticate(): Promise<boolean> {
    this.#clearPersistedSession()
    return this.resumeSession()
  }

  async #request<T = unknown>(
    method: string,
    url: string,
    config: Record<string, unknown> = {},
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

  // Strip the envelope and parse the body when a `schema` peer key is
  // supplied; throw on transport failure — the contract every
  // required-path endpoint (sync, mutations) wants.
  async #requestData<T>(
    method: string,
    url: string,
    options: Record<string, unknown> & { readonly schema?: z.ZodType<T> } = {},
  ): Promise<T> {
    const { schema, ...config } = options
    const { data } = await this.#request<T>(method, url, config)
    return schema === undefined ? data : (
        parseOrThrow(schema, data, `${method.toUpperCase()} ${url}`)
      )
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
    const startedAt = Date.now()
    this.#events.emitStart(context)
    try {
      const response = await runner()
      this.#events.emitComplete({
        ...context,
        durationMs: Date.now() - startedAt,
        status: response.status,
      })
      return response
    } catch (error) {
      this.#events.emitError({
        ...context,
        durationMs: Date.now() - startedAt,
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
  // probing a never-configured API) stays silent AND disarmed.
  #settleSyncCycle(epoch: number): void {
    if (this.#logOutEpoch !== epoch) {
      this.#clearPersistedSession()
      this.#clearRegistry()
      return
    }
    if (this.isAuthenticated()) {
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
