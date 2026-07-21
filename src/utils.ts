import type { PostAttributes } from './types/index.ts'
import { type Mode, Product, Switch, TEMPERATURE_SCALE } from './constants.ts'

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
 * Build the control attributes that set a target temperature, in the
 * register layout the product generation expects: Glow splits the
 * value across `tempH`/`tempL` (hundreds bit + remainder in tenths),
 * every other generation takes a single `temp` register in tenths.
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
  const scaled = value * TEMPERATURE_SCALE
  if (product === Product.glow) {
    const high = scaled > BYTE_MAX ? Switch.on : Switch.off
    return {
      [`${mode}_tempH`]: high,
      [`${mode}_tempL`]: scaled - high * TEMPERATURE_SCALE * TEMPERATURE_SCALE,
    }
  }
  return { [`${mode}_temp`]: scaled }
}
