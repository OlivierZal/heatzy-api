import { APIError } from './base.ts'

/**
 * The server rejected the credentials (Gizwits answers HTTP 400 or 401
 * on the login path).
 * @category Errors
 */
export class AuthenticationError extends APIError {
  public override readonly name: string = 'AuthenticationError'
}
