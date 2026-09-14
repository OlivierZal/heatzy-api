// Thin binding over @olivierzal/api-core's transport: same client, the
// Gizwits redaction vocabulary and the Gizwits failure reader seated in
// the constructor so every thrown HttpError — including one thrown from
// a host-prebuilt transport — carries the vocabulary and says why.
import {
  type HttpClientConfig as CoreHttpClientConfig,
  HttpClient as CoreHttpClient,
} from '@olivierzal/api-core'

import { redaction } from '../observability/context.ts'
import { describeFailure } from './failure.ts'

export type { HttpRequestConfig, HttpResponse } from '@olivierzal/api-core'

/**
 * Construction options for {@link HttpClient}. Neither the redaction
 * engine nor the failure reader is configurable here: this SDK's
 * vocabulary is seated by the subclass, so a transport cannot be built
 * without it.
 * @category HTTP
 */
export type HttpClientConfig = Omit<
  CoreHttpClientConfig,
  'describeFailure' | 'redaction'
>

/**
 * Thin fetch-based HTTP client used internally by the SDK — the core
 * transport with the Gizwits redaction vocabulary and failure reader
 * pre-seated.
 * @category HTTP
 */
export class HttpClient extends CoreHttpClient {
  /**
   * Builds an HTTP client pinned to a base URL, request-timeout budget,
   * and optional default headers / undici dispatcher.
   * @param config - Client configuration.
   */
  public constructor(config: HttpClientConfig) {
    super({ ...config, describeFailure, redaction })
  }
}
