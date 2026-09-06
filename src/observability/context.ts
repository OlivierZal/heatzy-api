// Thin vocabulary module over @olivierzal/api-core: the redaction
// MECHANISM lives in the core (shared with melcloud-api); this file
// owns only the Gizwits sensitive-key vocabulary and the bound engine
// every redaction seat in this SDK shares — the `HttpClient` subclass
// seats it into every thrown snapshot, and `HeatzyAPI` hands it to the
// core's `SessionAPI`, which seats it into the request/response log
// lines its inherited dispatch emits.
import { type Redaction, createRedaction } from '@olivierzal/api-core'

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
