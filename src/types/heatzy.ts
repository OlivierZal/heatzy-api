import type {
  CommonDerogationMode,
  DerogationMode,
  Mode,
  POST_DATA_UNIT,
  Switch,
} from '../constants.ts'

/**
 * Live attribute payload returned by `/devdata/{did}/latest`. Extends
 * the writable set with the read-only measures; field names mirror the
 * Gizwits wire verbatim (`cur_tempH`, `cft_temp`…) — do not rename
 * them to satisfy style rules.
 *
 * The read types are as WIDE as the wire: a value this SDK predates is
 * read, never refused, and the facades answer `null` for it. Writes
 * stay strict in {@link PostAttributes}.
 * @category Types
 */
export interface Attributes extends Omit<PostAttributes, 'derog_mode'> {
  readonly mode: Mode
  // Pro
  readonly cur_humi?: number | undefined
  // A Latin label on the Pro, a number on the Glow family
  readonly cur_mode?: number | string | null | undefined
  // The pilot-wire order the Pro is sending right now: its own
  // regulation switches between comfort and eco under one `mode`
  readonly cur_signal?: number | string | null | undefined
  readonly cur_temp?: number | undefined
  // Glow
  readonly cur_tempH?: number | undefined
  readonly cur_tempL?: number | undefined
  // Not V1; the wire declares codes up to 5, documents 0–3
  readonly derog_mode?: number | undefined
}

/**
 * `/bindings` response envelope, as it comes off the wire: a device
 * LIST whose entries are still unknown. They are validated one by one
 * at the listing boundary (`HeatzyAPI.list`, which answers
 * {@link DeviceBinding}s) rather than atomically inside the array, so
 * one entry this SDK cannot model never invalidates its siblings.
 * @category Types
 */
export interface Bindings {
  readonly devices: readonly unknown[]
}

/**
 * Everything `/control/{did}` itself accepts — {@link PostAttributes}
 * plus the presence detection only the Pilote Pro owns. It is the
 * TRANSPORT's shape, not an invitation: a consumer writes through a
 * facade, and only `DeviceProFacade` widens its `setValues` to this.
 * @category Types
 */
export interface ControlAttributes extends Omit<PostAttributes, 'derog_mode'> {
  readonly derog_mode?: DerogationMode | undefined
}

/**
 * One `/bindings` entry — the wire identity of a bound device.
 * @category Types
 */
export interface DeviceBinding {
  readonly dev_alias: string
  readonly did: string
  readonly product_key: string
  readonly product_name: string
}

/**
 * `/devdata/{did}/latest` response envelope.
 * @category Types
 */
export interface DeviceData {
  readonly attr: Attributes
}

/**
 * `/control/{did}` body for every product generation but V1.
 * @category Types
 */
export interface DevicePostData {
  readonly attrs: ControlAttributes
}

/**
 * Union of both `/control/{did}` body dialects.
 * @category Types
 */
export type DevicePostDataAny = DevicePostData | DeviceV1PostData

/**
 * `/control/{did}` body for V1 products, which speak a positional
 * `raw` triplet instead of named attributes: two constant fillers,
 * then the positional mode.
 * @category Types
 */
export interface DeviceV1PostData {
  readonly raw: [typeof POST_DATA_UNIT, typeof POST_DATA_UNIT, number]
}

/**
 * The body of every non-2xx Gizwits response: the reason the wire gives
 * for a refusal — a code, and two messages of which the detail wins.
 * @category Types
 */
export interface ErrorData {
  readonly detail_message: string | null
  readonly error_code: number
  readonly error_message: string | null
}

/**
 * `/login` response: the user token and its expiry (epoch seconds).
 * @category Types
 */
export interface LoginData {
  readonly expire_at: number
  readonly token: string
}

/**
 * What EVERY product accepts as a write. Availability is
 * product-dependent — the comments group fields by the generations
 * that support them — and one field is narrowed rather than
 * commented: `derog_mode` carries {@link CommonDerogationMode}, the
 * three derogations the vendor documents on every generation. The
 * presence detection is the Pilote Pro's own capability and is offered
 * where it belongs, on `DeviceProFacade.setValues`, which takes the
 * wider {@link ControlAttributes}.
 * @category Types
 */
export interface PostAttributes {
  // Pro
  readonly cft_temp?: number | undefined
  // Glow
  readonly cft_tempH?: number | undefined
  readonly cft_tempL?: number | undefined
  // Not V1, V2, V4: a calibration register (see TemperatureCompensation)
  readonly com_temp?: number | undefined
  // Not V1
  readonly derog_mode?: CommonDerogationMode | undefined
  readonly derog_time?: number | undefined
  // Pro
  readonly eco_temp?: number | undefined
  // Glow
  readonly eco_tempH?: number | undefined
  readonly eco_tempL?: number | undefined
  // Glow
  readonly LOCK_C?: Switch | undefined
  // Not V1, Glow
  readonly lock_switch?: Switch | undefined
  readonly mode?: Mode | undefined
  // Glow
  readonly on_off?: Switch | undefined
  // Not V1
  readonly timer_switch?: Switch | undefined
  // Pro
  readonly window_switch?: Switch | undefined
}
