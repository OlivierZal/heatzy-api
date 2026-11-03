// The core's one-line failure log, exported under unchanged names so a
// consumer logs its OWN cloud failures the way the core logs the sync
// cycle's and the resume's — a known failure as one line naming its
// cause chain, a programming error as the object that keeps its stack —
// through its one SDK pin: this package is the apps' only API boundary,
// and `@olivierzal/api-core` must never become a direct dependency of
// theirs. The three are `const` re-bindings of the core's functions —
// the same objects, never wrappers — rather than bare forwards, because
// typedoc reads an export specifier's comment only where the declaration
// has none, and the core's docs cannot be rendered from here as they
// stand: `failureCauseChain`'s links `failureReason`, which this package
// does not export, and none of the three carries a category. Each
// re-binding therefore carries this SDK's own doc, and spells its type
// (an exported binding must, under isolated declarations) — which is
// also what gives the rendered page its parameters; the day the core's
// docs resolve here, this barrel returns to a bare forward. The bound
// `redaction` engine (`./context.ts`) stays module-private: it is a
// seat, not a surface.
import {
  type Logger,
  failureCauseChain as coreFailureCauseChain,
  isKnownFailure as coreIsKnownFailure,
  logFailure as coreLogFailure,
} from '@olivierzal/api-core'

/**
 * A failure and its causes on one line, outermost first — `TypeError:
 * fetch failed — caused by ConnectTimeoutError: Connect Timeout Error
 * (UND_ERR_CONNECT_TIMEOUT)` — where a host logger printing the error as
 * its message says `fetch failed` and names nothing. Each link is its
 * message plus its string `code` when it carries one; a message spanning
 * lines (a validator's issue list) is folded onto the one line; a thrown
 * primitive is spelled by its value.
 * @param error - What the call threw.
 * @returns The chain, joined by ` — caused by `.
 * @category Errors
 */
export const failureCauseChain: (error: unknown) => string =
  coreFailureCauseChain

/**
 * Whether a failure is one this family has a class for — an
 * {@link HttpError}, the {@link APIError} family, or a transport failure
 * (undici's `fetch failed`, a request timeout, a caller's abort) —
 * anywhere in its `cause` chain; a {@link RegistrySyncError} is judged
 * by what it wraps. Such a failure is an expected condition of the wire,
 * and its cause chain says everything; anything else is a programming
 * error, whose stack is the one thing that locates it.
 * @param error - What the call threw.
 * @returns `true` for a failure whose cause chain says everything.
 * @category Errors
 */
export const isKnownFailure: (error: unknown) => boolean = coreIsKnownFailure

/**
 * Write a failure to the log the way a diagnostic report can read it —
 * the form of this SDK's own `Failed to fetch devices:` and streak
 * lines: a {@link isKnownFailure | known failure} as ONE line, the label
 * then its {@link failureCauseChain}, with no stack, since a transient's
 * transport frames read as a crash in a report; anything else as the
 * label followed by the error object, so a programming error keeps the
 * stack that locates it. The seat for a consumer's own cloud-failure
 * lines — `logFailure(this, 'Write failed:', error)` in a host whose
 * `error` and `log` are a {@link Logger}'s — so they read like the SDK's
 * without a dependency on the core.
 * @param logger - The sink.
 * @param label - What failed, ending in a colon (`Write failed:`).
 * @param error - What it threw.
 * @category Errors
 */
export const logFailure: (
  logger: Logger,
  label: string,
  error: unknown,
) => void = coreLogFailure
