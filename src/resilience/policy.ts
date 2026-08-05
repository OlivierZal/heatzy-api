/**
 * Unit of cross-cutting resilience logic around a request attempt.
 *
 * Each policy owns exactly one concern (rate-limiting, auth retry,
 * transient-error retry…) and wraps the caller's `attempt` with its
 * own semantics. The client composes policies directly — the outer
 * policy's `run` receives a closure over the inner one's.
 *
 * Implementations MUST:
 * - run the caller's `attempt` at most once per `run` invocation per
 *   success path (retries are explicit loops the policy owns);
 * - propagate errors they don't own — a policy handles only the
 *   concern it was built for; anything else flows through untouched;
 * - be stateless across `run` calls (shared state — guards, gates —
 *   goes through constructor injection so it's visible + swappable).
 */
export interface ResiliencePolicy {
  run: <T>(attempt: () => Promise<T>) => Promise<T>
}
