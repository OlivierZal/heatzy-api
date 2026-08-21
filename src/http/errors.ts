import { isSensitive, REDACTED } from '../observability/context.ts'

// The snapshot travels inside a thrown error, so it reaches every
// logger a host happens to run — including the diagnostic reports users
// paste into issues. Redacting at construction removes the leak as a
// class: no call site can retain a Gizwits token by forgetting to
// sanitize.
const redactHeaders = (
  headers: Record<string, string>,
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key,
      isSensitive(key) ? REDACTED : value,
    ]),
  )

/**
 * Snapshot of the request that triggered an {@link HttpError}. Header
 * values naming a secret read as `******`.
 * @category HTTP
 */
export interface HttpErrorRequestConfig {
  readonly data?: unknown
  readonly headers?: Record<string, string> | undefined
  readonly method?: string | undefined
  readonly params?: Record<string, unknown> | undefined
  readonly url?: string | undefined
}

/**
 * Thrown by {@link HttpClient} whenever an upstream response has a non-2xx
 * status. The shape mirrors what downstream code needs: `response.status`,
 * `response.headers`, and `response.data`.
 * @template T - Type of the parsed body of the failed response, exposed as
 * `response.data`.
 * @category HTTP
 */
export class HttpError<T = unknown> extends Error {
  public readonly config?: HttpErrorRequestConfig | undefined

  public readonly response: {
    readonly data: T
    readonly headers: Record<string, string | string[]>
    readonly status: number
  }

  /**
   * Builds the error from the response triplet plus an optional snapshot
   * of the request that produced it.
   * @param message - Human-readable error description.
   * @param options - Response triplet plus an optional request snapshot.
   * @param options.response - Normalized response that carried the non-2xx status.
   * @param options.response.data - Parsed (or raw text) response body.
   * @param options.response.headers - HTTP headers, multi-valued `set-cookie` preserved as an array.
   * @param options.response.status - HTTP status code.
   * @param options.config - Snapshot of the request that triggered the error.
   * @param options.cause - Original error that triggered this one.
   */
  public constructor(
    message: string,
    options: {
      response: {
        data: T
        headers: Record<string, string | string[]>
        status: number
      }
      cause?: unknown
      config?: HttpErrorRequestConfig
    },
  ) {
    super(message, options)
    const { config, response } = options
    this.name = 'HttpError'
    this.response = response
    this.config =
      config?.headers === undefined
        ? config
        : { ...config, headers: redactHeaders(config.headers) }
  }
}

/**
 * Type guard for HTTP errors thrown by the internal HTTP client.
 * @param error - Value caught from a failed HTTP request.
 * @returns Whether the value is an HttpError.
 * @category HTTP
 */
export const isHttpError = (error: unknown): error is HttpError =>
  error instanceof HttpError
