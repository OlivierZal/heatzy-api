import type {
  LifecycleEvents as CoreLifecycleEvents,
  SyncCallback as CoreSyncCallback,
  Logger,
  SettingManager,
} from '@olivierzal/api-core'

import type { HttpClient } from '../http/index.ts'
import type {
  Attributes,
  DeviceBinding,
  DevicePostDataAny,
  LoginCredentials,
  UndefinedTolerant,
} from '../types/index.ts'

/**
 * Parameters carried by this SDK's sync notification: any device ids
 * the cascade was scoped to.
 * @category Configuration
 */
interface SyncParams {
  ids?: string[] | undefined
}

/**
 * The API surface facades depend on — a structural slice of
 * {@link HeatzyAPI} that keeps the facade layer decoupled from the
 * client's lifecycle machinery (and trivially mockable in tests).
 * @category Configuration
 */
export interface HeatzyAPIAdapter {
  /**
   * BCP-47 locale tag the instance was configured with
   * ({@link HeatzyAPIConfig.locale}), or `undefined` when unset.
   * Facades use it to render `derogationEndString` labels without a
   * mutable global locale.
   */
  readonly locale: string | undefined
  /**
   * Notify any registered `events.onSyncComplete` observer that a sync
   * just landed. Routed through the lifecycle emitter so a misbehaving
   * observer cannot break the caller.
   */
  readonly notifySync: SyncCallback
  /**
   * IANA timezone identifier the instance was configured with
   * ({@link HeatzyAPIConfig.timezone}), or `undefined` when unset.
   * Facades use it to anchor derogation end dates to the account
   * timezone instead of the host runtime timezone.
   */
  readonly timezone: string | undefined
  /**
   * Fetch all bindings and sync the device registry.
   */
  readonly fetch: () => Promise<readonly DeviceBinding[]>
  /**
   * Read the live attribute payload of a single device.
   */
  readonly getValues: ({ id }: { id: string }) => Promise<Attributes>
  /**
   * Send a control payload to a single device.
   */
  readonly updateValues: ({
    id,
    postData,
  }: {
    id: string
    postData: DevicePostDataAny
  }) => Promise<void>
}

/**
 * Configuration accepted by {@link HeatzyAPI.create}. Every property —
 * including the inherited {@link LoginCredentials} pair — may be
 * absent or explicitly `undefined`, interchangeably: the runtime
 * applies the same default either way (credentials can also arrive
 * later via `authenticate` or the {@link SettingManager}).
 * @category Configuration
 */
export interface HeatzyAPIConfig extends UndefinedTolerant<LoginCredentials> {
  /**
   * Optional shutdown signal applied to every outgoing request.
   *
   * When the signal fires, all in-flight HTTP requests abort with a
   * DOMException of name `AbortError`. Subsequent calls from the same
   * client instance will also abort immediately. Use this to tie the
   * SDK lifetime to a host process lifetime — e.g. pass the Homey
   * app's shutdown signal so outstanding requests don't dangle across
   * a reload.
   */
  readonly abortSignal?: AbortSignal | undefined
  /**
   * Structured-events callbacks invoked around SDK lifecycle moments.
   * Useful to plug the SDK into a host observability stack
   * (pino / winston / OpenTelemetry / custom metrics).
   */
  readonly events?: LifecycleEvents | undefined
  /**
   * BCP-47 locale tag used by facades to render derogation end labels
   * (`derogationEndString`). Defaults to the runtime locale.
   */
  readonly locale?: string | undefined
  /**
   * Custom logger. Defaults to `console`.
   */
  readonly logger?: Logger | undefined
  /**
   * External setting manager for persisting credentials and session data.
   */
  readonly settingManager?: SettingManager | undefined
  /**
   * Restore the persisted session in the background instead of awaiting
   * it inside `create()`. Session probing and full logins can take tens
   * of seconds on slow networks, which blows a host app's init budget
   * (e.g. Homey's 30 s `ready` timeout). The lifecycle contract is
   * unchanged — auto-sync arming, `onAuthenticationLost`, login
   * backoff — it just runs off the critical path; `isAuthenticated()`
   * may report `false` until the background restore lands.
   */
  readonly shouldResumeSessionInBackground?: boolean | undefined
  /**
   * Auto-sync timer in minutes. `false` disables the timer entirely
   * (manual `fetch()` only). Omit to use the default (5 minutes).
   */
  readonly syncIntervalMinutes?: number | false | undefined
  /**
   * IANA timezone identifier anchoring derogation end dates. Defaults
   * to the runtime system timezone.
   */
  readonly timezone?: string | undefined
  /**
   * HTTP transport: pre-built {@link HttpClient} or build options.
   */
  readonly transport?: TransportConfig | undefined
}

/**
 * Persisted-settings surface the SDK reads and writes through the
 * {@link SettingManager}. Hosts that render or migrate stored values
 * can type their storage against this shape.
 * @category Configuration
 */
export interface HeatzyAPISettings {
  /**
   * Session expiry timestamp in ISO 8601 format.
   */
  readonly expiry?: string | null
  /**
   * Epoch-ms deadline before which automatic re-logins are refused.
   */
  readonly loginBackoffUntil?: string | null
  /**
   * Heatzy account password.
   */
  readonly password?: string | null
  /**
   * Gizwits user token.
   */
  readonly token?: string | null
  /**
   * Heatzy account username (email).
   */
  readonly username?: string | null
}

/**
 * Callback bundle invoked around SDK lifecycle moments — the core's
 * `LifecycleEvents` instantiated with this SDK's `SyncParams`. All
 * callbacks are optional and non-throwing.
 * @category Configuration
 */
export type LifecycleEvents = CoreLifecycleEvents<SyncParams>

/**
 * Callback invoked after sync operations — the core's `SyncCallback`
 * instantiated with this SDK's `SyncParams`.
 * @category Configuration
 */
export type SyncCallback = CoreSyncCallback<SyncParams>

/**
 * Transport configuration. Discriminated by presence of an
 * {@link HttpClient} instance — the SDK either reuses your wired client
 * (with its own dispatcher, headers, timeout) or builds a fetch-backed
 * default whose timeout you can tweak via `timeoutMs`.
 * @category Configuration
 */
export type TransportConfig =
  | HttpClient
  | {
      /**
       * Maximum time in milliseconds for a single HTTP request before
       * it is aborted. Defaults to 30 000 ms (30 s). Pass `0` to
       * disable the timeout (not recommended).
       */
      readonly timeoutMs?: number | undefined
    }

export type {
  Logger,
  RequestCompleteEvent,
  RequestErrorEvent,
  RequestLifecycleContext,
  RequestRetryEvent,
  RequestStartEvent,
  SettingManager,
} from '@olivierzal/api-core'
