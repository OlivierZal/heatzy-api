import type { z } from 'zod'
import { SessionAPI } from '@olivierzal/api-core'

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
import { AuthenticationError } from '../errors/index.ts'
import { HttpClient, HttpStatus, isHttpError } from '../http/index.ts'
import { redaction } from '../observability/context.ts'
import { isSessionExpired } from '../resilience/index.ts'
import { Temporal } from '../temporal.ts'
import { MS_PER_SECOND, SESSION_REFRESH_AHEAD_MS } from '../time-units.ts'
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
  SyncParams,
  TransportConfig,
} from './types.ts'

const API_BASE_URL = 'https://euapi.gizwits.com/app'
const APPLICATION_ID_HEADER = 'X-Gizwits-Application-Id'
const APPLICATION_ID = 'c70a66ff039d41b4a220e198b0fcc8b3'
const USER_TOKEN_HEADER = 'X-Gizwits-User-token'
const LOGIN_PATH = '/login'

const DEFAULT_SYNC_INTERVAL_MINUTES = 5
const DEFAULT_TIMEOUT_MS = 30_000

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
 * Heatzy (Gizwits) API client: the core's `SessionAPI` — which owns
 * the session lifecycle, the login backoff, the request pipeline and
 * the sync-cycle template — instantiated with the Gizwits dialect
 * behind its hooks: how to sign in, which header carries the user
 * token, what "persisted session" means, how the registry is
 * refreshed. Handles the `/bindings`, `/devdata` and `/control`
 * endpoint calls. Uses a private constructor — create instances via
 * {@link HeatzyAPI.create}.
 * @category API Clients
 */
export class HeatzyAPI
  extends SessionAPI<SyncParams>
  implements HeatzyAPIAdapter
{
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

  // The config slice consulted after construction (display locale,
  // account timezone); the core keeps the shutdown signal.
  readonly #config: Pick<HeatzyAPIConfig, 'locale' | 'timezone'>

  readonly #registry: DeviceRegistry

  @setting
  private accessor token = ''

  private constructor(config: HeatzyAPIConfig = {}) {
    const { locale, password, timezone, transport, username } = config
    super(config, {
      // Gizwits reports an invalid or expired user token as HTTP 400
      // (error code 9004 in the body), never 401 — both statuses arm
      // the reactive re-auth, mirroring the field-proven Axios
      // interceptor.
      authFailureStatuses: [HttpStatus.Unauthorized, HttpStatus.BadRequest],
      defaultSyncIntervalMinutes: DEFAULT_SYNC_INTERVAL_MINUTES,
      // The Gizwits-bound engine, so the core's request/response log
      // lines redact the user-token header the wire rides credentials
      // on — the base vocabulary matches keys exactly and would let
      // `X-Gizwits-User-token` through in clear.
      redaction,
      transport: buildTransport(transport),
      syncCallback: async () => this.fetch(),
      // NO logLabel: a single client — nothing to disambiguate, and a
      // default would prefix every ledger-pinned diagnostic line.
      // NO rateLimitHours: the Gizwits wire has never surfaced a 429,
      // so no rate-limit rung is built at all (ledger verdict).
    })
    this.#config = { locale, timezone }
    this.#registry = new DeviceRegistry({ timezone })
    this.applyCredentials(username, password)
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
    return this.runBestEffortSyncCycle(async () => this.#syncCycle())
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
   * Whether a Gizwits user token has been issued.
   * @returns `true` once authenticated.
   */
  public override isAuthenticated(): boolean {
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
    const { data } = await this.dispatch<LoginData>('post', LOGIN_PATH, {
      data: postData,
    })
    return parseOrThrow(LoginDataSchema, data, 'login')
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
    await this.request('post', `/control/${id}`, { data: postData })
  }

  // Clears both session keys — the whole persisted session on this
  // dialect. Ownership stays the core's narrow contract: an accepted
  // login replacing the session wholesale, the reactive
  // `reauthenticate` (the 400/9004 names the token itself), an
  // explicit logOut, and a raced sign-out epilogue.
  protected override clearPersistedSession(): void {
    this.token = ''
    this.expiry = ''
  }

  protected override clearRegistry(): void {
    this.#registry.syncDevices([], {})
  }

  // One protocol sign-in round-trip. On success only the session
  // artifacts are stored here — both keys, a wholesale replacement of
  // any prior session; the core persists the credentials once this
  // resolves. On failure every store is left untouched: the login
  // rejection is narrowed to `AuthenticationError` where the wire
  // means one, and rethrown verbatim otherwise.
  protected override async doAuthenticate(
    credentials: LoginCredentials,
  ): Promise<void> {
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
    // `expire_at` arrives as epoch seconds — persisted as ISO 8601 so
    // the shared session-expiry check reads it back absolutely.
    this.token = data.token
    this.expiry = Temporal.Instant.fromEpochMilliseconds(
      data.expire_at * MS_PER_SECOND,
    ).toString()
  }

  // The registry refresh of the enforced post-auth sync, WITHOUT a
  // best-effort guard: what surfaces here is what no partial answer
  // can survive — an envelope that is not a device list, a `/bindings`
  // call the wire refused outright, a registry bug: permanent failures
  // retrying cannot clear, so a sign-in that resolved over one would
  // report success on an empty registry. What a SINGLE device causes
  // never reaches this point — the listing boundary and the fan-out
  // degrade per entry, so one radiator this SDK predates costs that
  // radiator, never the account.
  protected override async enforceRegistrySync(): Promise<void> {
    await this.#syncCycle()
  }

  protected override getAuthHeaders(): Record<string, string> {
    return this.token === '' ? {} : { [USER_TOKEN_HEADER]: this.token }
  }

  // The token is the sole session artifact on this dialect, so it is
  // also the whole answer to "is the reuse probe worth attempting" —
  // and to `isAuthenticated()`, which is why the mid-ladder state the
  // core's `initialize()` could otherwise probe does not exist here
  // (see the kernel's DECLARED ABSENCES, entry 3).
  protected override hasPersistedSession(): boolean {
    return this.token !== ''
  }

  // The token needs refreshing when absent or within the forward
  // window of its expiry, so the renewal stays off the critical path.
  protected override needsSessionRefresh(): boolean {
    return (
      this.token === '' ||
      isSessionExpired(this.expiry, SESSION_REFRESH_AHEAD_MS)
    )
  }

  // The only refresh path Gizwits offers is a full re-login from
  // persisted credentials; `resumeSession` logs + swallows on failure
  // so the triggering request can still attempt its own retry path.
  protected override async performSessionRefresh(): Promise<void> {
    await this.resumeSession()
  }

  // Reactive refresh after an expired-token 400/401, before
  // `AuthRetryPolicy` replays the request: the only recovery path is a
  // best-effort re-login from persisted credentials. The rejected
  // token is cleared FIRST — the server just refused it, Gizwits
  // naming it in the 400/9004 — the dialect-specific half OPPOSITE
  // melcloud's non-clearing Classic, kernel-pinned as such.
  protected override async reauthenticate(): Promise<boolean> {
    this.clearPersistedSession()
    return this.resumeSession()
  }

  // Judged by the credential, not by the probe's cycle: the request
  // pipeline self-heals an expired token from stored credentials, so a
  // transiently-failed probe with a valid token stays authenticated
  // and lets the auto-sync heal the registry instead of paying a full
  // re-login on a boot-time blip.
  protected override reuseSucceeded(): boolean {
    return this.isAuthenticated()
  }

  // The best-effort registry refresh the reuse probe spends — `fetch`
  // logs and swallows, exactly the non-destructive contract the
  // core's probe requires.
  protected override async syncRegistry(): Promise<void> {
    await this.fetch()
  }

  // The registry cycle both entry points share, run through the core's
  // template (pause the auto-sync, do the work, settle the epilogue:
  // reschedule, re-apply a raced sign-out, or surface a lost session).
  // `fetch` downgrades its failure to a logged empty list, the
  // post-auth path propagates.
  @syncDevices
  async #syncCycle(): Promise<readonly DeviceBinding[]> {
    return this.runSyncCycle(async () => this.#fetch())
  }

  async #fetch(): Promise<readonly DeviceBinding[]> {
    const bindings = await this.list()
    this.#registry.syncDevices(bindings, await this.#readAttributes(bindings))
    return bindings
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

  // Strip the envelope and parse the body against the endpoint's
  // schema; throw on transport failure — the contract every
  // required-path endpoint (sync, mutations) wants. Responses nothing
  // consumes (`/control`) go through the core's `request` directly.
  async #requestData<T>(
    method: string,
    url: string,
    options: { readonly schema: z.ZodType<T>; readonly data?: unknown },
  ): Promise<T> {
    const { schema, ...config } = options
    const { data } = await this.request<T>(method, url, config)
    return parseOrThrow(schema, data, `${method.toUpperCase()} ${url}`)
  }
}
