import type { PostAttributes } from './types/index.ts'
import {
  type Mode,
  GLOW_SETPOINT_RANGES,
  Product,
  Switch,
  TEMPERATURE_SCALE,
} from './constants.ts'

const BYTE_MAX = 255

/**
 * Curried own-key type guard: `isKeyOf(record)(key)` narrows `key` to
 * `keyof typeof record`. Prototype-safe (`Object.hasOwn`), so inherited
 * members like `toString` never pass.
 * @template T - Object type whose own keys are tested.
 * @param record - The record whose own keys define the guard.
 * @returns A type guard checking own-key membership on `record`.
 * @category Utilities
 */
export const isKeyOf =
  <T extends object>(record: T) =>
  (key: PropertyKey): key is keyof T =>
    Object.hasOwn(record, key)

/**
 * Drop present-`undefined` keys from an attribute payload. The
 * `PostAttributes` fields are declared `| undefined`, so JS and TS
 * callers alike can hand over `{ mode: undefined }` — which must count
 * as "nothing to send", not as one attribute. Mirrors melcloud-api's
 * helper of the same name.
 * @template T - Payload type whose entries are filtered.
 * @param values - The candidate payload.
 * @returns `values` without its `undefined`-valued keys.
 * @category Utilities
 */
export function omitUndefined<T extends object>(
  values: T,
): { [K in keyof T]?: Exclude<T[K], undefined> }
export function omitUndefined(
  values: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  )
}

/**
 * Clamp `value` into the inclusive `[range.min, range.max]` range.
 * @param value - Candidate value, possibly outside the bounds.
 * @param range - Inclusive bounds.
 * @param range.max - Upper bound (inclusive).
 * @param range.min - Lower bound (inclusive).
 * @returns `value`, clamped to `[range.min, range.max]`.
 * @category Utilities
 */
export const clampToRange = (
  value: number,
  range: { max: number; min: number },
): number => Math.min(Math.max(value, range.min), range.max)

/**
 * Build the control attributes that set a target temperature, in the
 * register layout the product generation expects: Glow clamps the
 * value into the mode's accepted range — symmetric with the read
 * side — and splits it across `tempH`/`tempL` (hundreds bit +
 * remainder in tenths); every other generation takes a single `temp`
 * register in tenths, unclamped.
 * @param product - Product generation of the target device.
 * @param mode - Which setpoint to write (comfort or eco).
 * @param value - Target temperature in °C.
 * @returns The attributes to pass to `setValues`.
 * @category Utilities
 */
export const getTargetTemperature = (
  product: Product,
  mode: typeof Mode.comfort | typeof Mode.eco,
  value: number,
): PostAttributes => {
  if (product === Product.glow) {
    const scaled =
      clampToRange(value, GLOW_SETPOINT_RANGES[mode]) * TEMPERATURE_SCALE
    const high = scaled > BYTE_MAX ? Switch.on : Switch.off
    return {
      [`${mode}_tempH`]: high,
      [`${mode}_tempL`]: scaled - high * TEMPERATURE_SCALE * TEMPERATURE_SCALE,
    }
  }
  return { [`${mode}_temp`]: value * TEMPERATURE_SCALE }
}
