// The reason Gizwits gives for a refusal. Every non-2xx body carries the
// pair below (`error_code` too, which the message does not need); this
// reader seats `detail_message ?? error_message` through
// `HttpClientConfig.describeFailure`, so a failure names the vendor's
// reason rather than the bare "Request failed with status code N".
import type { ErrorData } from '../types/index.ts'

const isReason = (value: unknown): value is string | null =>
  value === null || typeof value === 'string'

// Presence AND type: a body that carries the three keys with something
// other than a number and two strings-or-null is not the wire's shape,
// and the status line stands in rather than a non-string message.
const isErrorData = (data: unknown): data is ErrorData =>
  data !== null &&
  typeof data === 'object' &&
  'detail_message' in data &&
  'error_code' in data &&
  'error_message' in data &&
  isReason(data.detail_message) &&
  typeof data.error_code === 'number' &&
  isReason(data.error_message)

/**
 * The message a failed Gizwits response is thrown with: the wire's own
 * reason when the body carries one, the status line otherwise.
 * @param status - The HTTP status the response carried.
 * @param data - The parsed response body.
 * @returns The human-readable description of the failure.
 */
export const describeFailure = (status: number, data: unknown): string => {
  const reason = isErrorData(data)
    ? (data.detail_message ?? data.error_message ?? '')
    : ''
  return reason === ''
    ? `Request failed with status code ${String(status)}`
    : reason
}

/**
 * Gizwits' own failure vocabulary (https://api.gizwits.com/errors) for
 * the codes this SDK branches on. The wire answers all of them with HTTP
 * `400`, so the status alone cannot tell a token verdict from a refused
 * credential from a server hiccup — only the body's `error_code` can.
 */
export const GizwitsErrorCode = {
  /**
   * The session's token has run out (`token expired!`).
   */
  tokenExpired: 9006,
  /**
   * The session's token is not one the server honours (`token invalid!`).
   */
  tokenInvalid: 9004,
  /**
   * No account answers to the username (`user does not exist!`).
   */
  userDoesNotExist: 9005,
  /**
   * The account exists but may not sign in (`user invalid!`).
   */
  userInvalid: 9026,
  /**
   * The password does not match the username (`username or password
   * error!`).
   */
  wrongCredentials: 9020,
} as const

/**
 * The Gizwits error code a failed response carries.
 * @param data - The parsed response body.
 * @returns The `error_code`, or `null` when the body is not the wire's
 * failure shape.
 */
export const gizwitsErrorCode = (data: unknown): number | null =>
  isErrorData(data) ? data.error_code : null
