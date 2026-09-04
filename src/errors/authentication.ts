// Thin binding over @olivierzal/api-core's AuthenticationError
// (formerly this repo's own class): ONE class family wide, so the
// core's login-backoff gate and refusal record — which judge by
// `instanceof` — see the very errors `toAuthFailure` constructs, and a
// consumer's `instanceof` holds across this SDK and the core alike.
// A const + type PAIR rather than a bare re-export, deliberately: the
// core class's own doc comment hard-links the subclass it adds for a
// server-announced sign-in pause, which this dialect does not
// re-export (no such code on Gizwits — see the Ledger), and typedoc
// cannot resolve a d.ts comment link to a symbol outside this
// package's documentation. The pair keeps the runtime identity (same
// class object, so `instanceof` is unchanged in both directions) while
// seating this dialect's own documentation.
import { AuthenticationError as CoreAuthenticationError } from '@olivierzal/api-core'

/**
 * The server rejected the credentials (Gizwits answers HTTP 400 or 401
 * on the login path), or the reactive re-authentication that followed
 * an expired-token 400/401 failed in turn. The core's own class — the
 * login-backoff gate and the refusal record judge by `instanceof`, so
 * the exported name must BE the class the core tests. The subclass the
 * core adds for a server-announced sign-in pause is deliberately not
 * re-exported here: Gizwits has never surfaced such a code, so every
 * `AuthenticationError` on this wire is definitive.
 * @category Errors
 */
export const AuthenticationError: typeof CoreAuthenticationError =
  CoreAuthenticationError

/**
 * Instance type of the class above, so the one name keeps serving both
 * positions — construction and annotation (`error: AuthenticationError`)
 * — exactly as the class declaration did.
 * @category Errors
 */
export type AuthenticationError = CoreAuthenticationError
