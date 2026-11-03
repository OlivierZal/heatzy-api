// The core's one-line failure log is forwarded under unchanged names so
// a consumer logs its OWN cloud failures the way the core logs the sync
// cycle's and the resume's — a known failure as one line naming its
// cause chain, a programming error as the object that keeps its stack —
// through its one SDK pin: this package is the apps' only API boundary,
// and `@olivierzal/api-core` never becomes a direct dependency of
// theirs. The bound `redaction` engine (`./context.ts`) stays
// module-private: it is a seat, not a surface.
export {
  failureCauseChain,
  isKnownFailure,
  logFailure,
} from '@olivierzal/api-core'
