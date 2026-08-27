// Thin vocabulary module over @olivierzal/api-core: the redaction
// MECHANISM lives in the core (shared with melcloud-api); this file
// owns only the Gizwits sensitive-key vocabulary and the bound engine
// every redaction seat in this SDK shares.
import { type Redaction, createRedaction } from '@olivierzal/api-core'

export type { LoggableRequestConfig } from '@olivierzal/api-core'

export { APICallLogData, REDACTED } from '@olivierzal/api-core'

// Every key that names a credential on the Gizwits wire beyond the
// core's base vocabulary (authorization, cookie, set-cookie, password,
// username, email, token): the header the issued user token rides on.
// Extend this ONE vocabulary when a new wire field names a credential;
// never re-declare it elsewhere.
const EXTRA_SENSITIVE_KEYS = ['x-gizwits-user-token']

/**
 * The redaction engine bound to the Gizwits vocabulary — the ONE
 * engine shared by the call loggers, the `HttpClient` transport and
 * the `HttpError` snapshot, so a secret cannot reach a log through
 * any route.
 */
export const redaction: Redaction = createRedaction(EXTRA_SENSITIVE_KEYS)

/**
 * Whether a header or payload key names a secret under the Gizwits
 * vocabulary.
 * @param key - Header or payload key, in any casing.
 * @returns `true` when the value behind the key must be redacted.
 */
export const isSensitive = (key: string): boolean => redaction.isSensitive(key)

/**
 * Deep-redacts a payload under the Gizwits vocabulary.
 * @param value - Any payload: object, array, string or primitive.
 * @returns The value with sensitive entries replaced by `******`.
 */
export const redactValue = (value: unknown): unknown =>
  redaction.redactValue(value)
