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
