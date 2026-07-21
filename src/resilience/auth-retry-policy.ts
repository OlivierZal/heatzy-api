import { HttpStatus, isHttpError } from '../http/index.ts'
import type { ResiliencePolicy } from './policy.ts'
import type { RetryGuard } from './retry-guard.ts'

/**
 * Reactive authentication retry. On an auth-failure status:
 * 1. **Gate** the retry via a shared {@link RetryGuard} — only one
 *    retry per guard window, so a repeatedly-rejected credential
 *    doesn't spin forever.
 * 2. **Reauthenticate** through the injected hook. The hook returns
 *    `true` if the session was successfully refreshed (full
 *    `resumeSession`) and `false` if it failed.
 * 3. **Replay** the original attempt exactly once on a successful
 *    reauth. Any other outcome re-throws the original error.
 *
 * Ownership: 401 **and 400** — Gizwits reports an invalid or expired
 * user token as HTTP 400 (error code 9004 in the body), never 401. A
 * genuine bad request pays one guarded re-login round-trip before its
 * 400 propagates, mirroring the field-proven behavior of the previous
 * Axios interceptor. Other HTTP errors, network errors, and anything
 * not from `HttpError` propagate unchanged so inner / outer policies
 * can handle them in isolation.
 */
export class AuthRetryPolicy implements ResiliencePolicy {
  readonly #guard: RetryGuard

  readonly #reauthenticate: () => Promise<boolean>

  public constructor(
    guard: RetryGuard,
    reauthenticate: () => Promise<boolean>,
  ) {
    this.#guard = guard
    this.#reauthenticate = reauthenticate
  }

  public async run<T>(attempt: () => Promise<T>): Promise<T> {
    try {
      return await attempt()
    } catch (error) {
      if (!this.#shouldRetry(error)) {
        throw error
      }
      if (!(await this.#reauthenticate())) {
        throw error
      }
      return attempt()
    }
  }

  #shouldRetry(error: unknown): boolean {
    if (!isHttpError(error)) {
      return false
    }
    const { status } = error.response
    return (
      (status === HttpStatus.Unauthorized ||
        status === HttpStatus.BadRequest) &&
      this.#guard.tryConsume()
    )
  }
}
