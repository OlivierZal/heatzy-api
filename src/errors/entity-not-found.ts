import { APIError } from './base.ts'

/**
 * Thrown when a facade resolves its underlying registry device by id and
 * finds nothing — the registry was rebuilt (a re-login, a sign-out, or a
 * sync that pruned the device) and no entry exists under that id any
 * more.
 *
 * Recovery is to WAIT, not to rebuild: a facade binds by id, so the one
 * you hold resolves again by itself the moment a sync puts that id back
 * in the registry. Treat the throw as "this device is absent right now"
 * — surface it and leave the reference alone. `DeviceFacade.exists`
 * answers the same question without a `try`/`catch`.
 * @example
 * ```ts
 * try {
 *   await facade.values()
 * } catch (error) {
 *   if (error instanceof EntityNotFoundError) {
 *     this.setUnavailable('Device not found')
 *     return
 *   }
 *   throw error
 * }
 * ```
 * @category Errors
 */
export class EntityNotFoundError extends APIError {
  /**
   * The Gizwits device id (`did`) that could not be resolved.
   */
  public readonly entityId: string

  public override readonly name = 'EntityNotFoundError'

  /**
   * Builds the error from the unresolved device id.
   * @param entityId - The `did` no registry entry answers to.
   * @param options - Optional bag carrying the underlying cause.
   * @param options.cause - Original error that triggered this one.
   */
  public constructor(entityId: string, options?: { cause?: unknown }) {
    super(`Device with id ${entityId} not found`, options)
    this.entityId = entityId
  }
}
