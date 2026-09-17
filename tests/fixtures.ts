import type {
  Attributes,
  DeviceBinding,
  LoginData,
} from '../src/types/index.ts'
import { DerogationMode, Mode, Switch } from '../src/constants.ts'

/**
 * One known `product_key` hash per product generation.
 */
export const PRODUCT_KEYS = {
  glow: '2fd622e45283470f9e27e8e6167d7533',
  pro: 'a77a929fcf0d4631bc4f669080376891',
  v1: '9420ae048da545c88fc6274d204dd25f',
  v2: '4fc968a21e7243b390e9ede6f1c6465d',
  v4: '46409c7f29d4411c85a3a46e5ee3703e',
} as const

/**
 * Build a `/bindings` entry for the given generation.
 * @param product - Product generation key.
 * @param overrides - Field overrides.
 * @returns The wire binding.
 */
export const buildBinding = (
  product: keyof typeof PRODUCT_KEYS = 'pro',
  overrides: Partial<DeviceBinding> = {},
): DeviceBinding => ({
  dev_alias: `Radiator ${product}`,
  did: `did-${product}`,
  product_key: PRODUCT_KEYS[product],
  product_name: product,
  ...overrides,
})

/**
 * Minimal V1 attribute payload (mode only).
 */
export const v1Attributes: Attributes = { mode: Mode.comfort }

/**
 * Typical V2/V4 attribute payload.
 */
export const v2Attributes: Attributes = {
  derog_mode: DerogationMode.off,
  derog_time: 0,
  lock_switch: Switch.off,
  mode: Mode.comfort,
  timer_switch: Switch.off,
}

/**
 * Typical Glow attribute payload (split temperature registers).
 */
export const glowAttributes: Attributes = {
  cft_tempH: 2,
  cft_tempL: 10,
  com_temp: 50,
  cur_tempH: 1,
  cur_tempL: 95,
  derog_mode: DerogationMode.off,
  derog_time: 0,
  eco_tempH: 1,
  eco_tempL: 70,
  LOCK_C: Switch.off,
  mode: Mode.comfort,
  on_off: Switch.on,
  timer_switch: Switch.off,
}

/**
 * Typical Pro attribute payload (single registers + measures).
 */
export const proAttributes: Attributes = {
  cft_temp: 210,
  cur_humi: 45,
  cur_mode: Mode.comfort,
  cur_temp: 195,
  derog_mode: DerogationMode.off,
  derog_time: 0,
  eco_temp: 170,
  lock_switch: Switch.off,
  mode: Mode.comfort,
  timer_switch: Switch.off,
  window_switch: Switch.off,
}

/**
 * A Glow_Simple's `/devdata` attributes as a real account answered
 * them, verbatim (cyr-ius/heatzypy `tests/fixtures/devices_rest.json`,
 * 2024-05-08): `cur_mode` is a number and `com_temp` a calibration of
 * 5, the payload 10.0.0's closed literals refused as a whole.
 */
export const fieldGlowAttributes: Attributes = {
  cft_tempH: 0,
  cft_tempL: 130,
  com_temp: 5,
  cur_mode: 1,
  cur_tempH: 0,
  cur_tempL: 117,
  derog_mode: DerogationMode.off,
  derog_time: 0,
  eco_tempH: 0,
  eco_tempL: 110,
  LOCK_C: Switch.off,
  mode: Mode.eco,
  on_off: Switch.on,
  timer_switch: Switch.off,
}

/**
 * An Onyx's field attributes from the same fixture, running a vacation
 * derogation.
 */
export const fieldOnyxAttributes: Attributes = {
  ...fieldGlowAttributes,
  cft_tempL: 190,
  cur_tempL: 199,
  derog_mode: DerogationMode.vacation,
  eco_tempL: 180,
}

/**
 * The V1 Pilote's field payload from the same fixture: its Gizwits
 * datapoint declares the mode enum in Chinese, and `/devdata` answers
 * the declared label.
 */
export const fieldV1Payload = { mode: '舒适' } as const

/**
 * `/login` payload with a one-hour-away expiry (epoch seconds).
 */
export const buildLoginData = (
  expireAt: number = Math.trunc(Date.now() / 1000) + 3600,
): LoginData => ({ expire_at: expireAt, token: 'user-token' })
