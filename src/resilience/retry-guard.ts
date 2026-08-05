/**
 * One-shot retry budget limiter.
 *
 * Allows at most one retry per configured window. `tryConsume()` returns
 * `true` when the budget is available (and opens a new window), `false`
 * otherwise. Used by API clients to cap reactive re-authentication
 * attempts on 401 responses and prevent tight retry loops.
 */
export class RetryGuard {
  readonly #delay: number

  // Monotonic-ms deadline of the current window; consuming before it is
  // refused. A plain deadline needs no timer to expire, and the
  // monotonic clock keeps the window immune to system-clock
  // adjustments — a wall-clock deadline would stretch it across a
  // backwards jump.
  #until = 0

  public constructor(delayMs: number) {
    this.#delay = delayMs
  }

  /**
   * Attempt to consume the retry budget.
   * @returns `true` if the caller may proceed with a retry, `false` if the
   *   budget is exhausted for the current window.
   */
  public tryConsume(): boolean {
    const now = performance.now()
    if (now < this.#until) {
      return false
    }
    this.#until = now + this.#delay
    return true
  }
}
