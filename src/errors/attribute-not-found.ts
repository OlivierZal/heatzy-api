import { APIError } from './base.ts'

/**
 * Thrown when a facade reads an attribute its device's last-synced
 * payload does not carry — either the product generation does not
 * support it (narrow with `supportsV2` / `supportsGlow` / `supportsPro`
 * before reading) or the wire dropped a field the SDK consumes.
 * @category Errors
 */
export class AttributeNotFoundError extends APIError {
  /** The missing attribute key (wire name, e.g. `derog_mode`). */
  public readonly attribute: string

  public override readonly name = 'AttributeNotFoundError'

  /**
   * Builds the error from the missing attribute's wire name.
   * @param attribute - The attribute key that was absent.
   * @param options - Optional bag carrying the underlying cause.
   * @param options.cause - Original error that triggered this one.
   */
  public constructor(attribute: string, options?: { cause?: unknown }) {
    super(`${attribute} not found`, options)
    this.attribute = attribute
  }
}
