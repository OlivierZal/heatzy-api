// Thin vocabulary module over @olivierzal/api-core: the redaction
// MECHANISM lives in the core (shared with melcloud-api); this file
// owns only the Gizwits vocabulary — the credential keys and the
// personal-data keys, two tiers declared apart — and the bound engine
// every redaction seat in this SDK shares — the `HttpClient` subclass
// seats it into every thrown snapshot, and `HeatzyAPI` hands it to the
// core's `SessionAPI`, which seats it into the request/response log
// lines its inherited dispatch emits.
import { type Redaction, createRedaction } from '@olivierzal/api-core'

// Every key that names a credential on the Gizwits wire beyond the
// core's base vocabulary (authorization, cookie, set-cookie, password,
// username, email, token): the header the issued user token rides on,
// and the device `passcode` every `/bindings` entry carries (vendor 2020
// contract) — the core logs each `/bindings` response body, and a
// device's binding secret has no business in a diagnostic report.
// Extend this ONE vocabulary when a new wire field names a credential;
// never re-declare it elsewhere.
const EXTRA_SENSITIVE_KEYS = ['passcode', 'x-gizwits-user-token']

// Every key that carries what a PERSON typed on the Gizwits wire — the
// second tier of the same engine, declared apart because it answers a
// different rule: a credential stays out of a log because it opens an
// account, a personal-data field because its owner wrote it and a
// diagnostic report pasted into a public issue reproduces it. The
// core's dispatch prints every `/bindings` body whole, on purpose (a
// report needs it), so a device's name stays out of a pasted report
// only because its key is declared here; the engine matches keys in
// any casing. Declared: `dev_alias`, the device name its owner typed
// in the Heatzy app (`Device.name`). Kept, by the rule "type and id
// only": `did` and `product_key` are identifiers and `product_name` is
// the vendor's product label — a report needs all three to tell a
// Pilote from a Glow. Not declared: `remark`, the free-text "device
// remark" the vendor's 2020 API document lists on a binding beside
// `dev_alias` — and takes as free text on the alias-update endpoint,
// so a person CAN write it — and `dev_label`, the voice-control tags
// listed beside them. This SDK types neither, no fixture or scrubbed
// dump in this repo has ever carried either, and the vendor's own
// listing example holds a machine-written `range=…|gid=…|groupname=…`
// string (the `groupname=` slot is where a user-named group would
// ride) and an empty tag list — so both stay unverified until a field
// `/bindings` answer shows them. Extend this ONE tier when a wire field
// carries a user-entered string, never the credential tier above: the
// two answer different rules.
const PERSONAL_DATA_KEYS = ['dev_alias']

/**
 * The redaction engine bound to the Gizwits vocabulary — the ONE
 * engine shared by the call loggers, the `HttpClient` transport and
 * the `HttpError` snapshot, so neither a secret nor a device's name
 * can reach a log through any route.
 */
export const redaction: Redaction = createRedaction(EXTRA_SENSITIVE_KEYS, {
  personalDataKeys: PERSONAL_DATA_KEYS,
})
