// The reason Gizwits gives for a refusal. Every non-2xx body carries the
// pair below (`error_code` too, which the message does not need); June's
// error path surfaced `detail_message ?? error_message`, and the
// extraction onto the core's transport dropped it — every failure read
// "Request failed with status code N" until 18.1.0 seated this reader
// through `HttpClientConfig.describeFailure`.
import type { ErrorData } from '../types/index.ts'

const isErrorData = (data: unknown): data is ErrorData =>
  data !== null &&
  typeof data === 'object' &&
  'detail_message' in data &&
  'error_message' in data

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
