/**
 * Disposable wrapper around `setTimeout` for internal background
 * bookkeeping (the auto-sync cadence). Auto-clears the previous
 * timeout when rescheduled and unrefs the underlying handle so a
 * scheduled callback never keeps the Node event loop alive on its
 * own — callers are still notified on the regular loop, but a script
 * that has nothing left to do can exit immediately.
 */
export class DisposableTimeout implements Disposable {
  #timeout?: ReturnType<typeof setTimeout> | undefined

  /**
   * Cancel the current timeout if one is active.
   */
  public clear(): void {
    if (this.#timeout === undefined) {
      return
    }

    clearTimeout(this.#timeout)
    this.#timeout = undefined
  }

  /**
   * Clear the timeout on disposal, preventing leaked timers.
   */
  public [Symbol.dispose](): void {
    this.clear()
  }

  /**
   * Schedule a callback after `ms` milliseconds, replacing any existing timeout.
   * @param callback - The function to invoke when the timeout fires.
   * @param ms - The delay in milliseconds before invoking the callback.
   */
  public schedule(callback: () => void, ms: number): void {
    this.clear()
    this.#timeout = setTimeout(callback, ms)
    this.#timeout.unref()
  }
}
