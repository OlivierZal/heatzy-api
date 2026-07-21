/**
 * HTTP status codes used across the SDK. Single source so callers
 * don't redefine them per file.
 *
 * Restricted to the codes the SDK actually branches on — adding more
 * here without a real call site is dead weight.
 */
export const HttpStatus = {
  /** HTTP 502 — transient upstream failure. Eligible for retry on GET. */
  BadGateway: 502,
  /**
   * HTTP 400 — how Gizwits reports an invalid or expired user token
   * (error code 9004 in the body), *not* 401. Triggers session re-auth
   * alongside {@link HttpStatus.Unauthorized}.
   */
  BadRequest: 400,
  /** HTTP 504 — transient upstream timeout. Eligible for retry on GET. */
  GatewayTimeout: 504,
  /** HTTP 503 — transient service unavailability. Eligible for retry on GET. */
  ServiceUnavailable: 503,
  /** HTTP 401 — authentication required or rejected. Triggers session re-auth. */
  Unauthorized: 401,
} as const
