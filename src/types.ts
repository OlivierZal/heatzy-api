import type { POST_DATA_UNIT } from './constants.ts'
import type {
  DerogationMode,
  Mode,
  Switch,
  TemperatureCompensation,
} from './enums.ts'

export interface Attributes extends PostAttributes {
  readonly mode: Mode
  // Glow
  readonly cur_tempH?: number
  readonly cur_tempL?: number
  // Pro
  readonly cur_humi?: number
  readonly cur_mode?: Mode
  readonly cur_temp?: number
}

export interface Bindings {
  readonly devices: readonly Device[]
}

export interface Device {
  readonly dev_alias: string
  readonly did: string
  readonly product_key: string
  readonly product_name: string
}

export interface DeviceData {
  readonly attr: Attributes
}

export interface DevicePostData {
  readonly attrs: PostAttributes
}

export interface DeviceV1PostData {
  readonly raw: [typeof POST_DATA_UNIT, typeof POST_DATA_UNIT, mode: number]
}

export interface ErrorData {
  readonly detail_message: string | null
  readonly error_message: string | null
}

export interface LoginData {
  readonly expire_at: number
  readonly token: string
}

export interface LoginPostData {
  readonly password: string
  readonly username: string
}

export interface PostAttributes {
  readonly mode?: Mode
  // Not V1
  readonly derog_mode?: DerogationMode
  readonly derog_time?: number
  readonly timer_switch?: Switch
  // Not V1, Glow
  readonly lock_switch?: Switch
  // Not V1, V2, V4
  readonly com_temp?: TemperatureCompensation
  // Glow
  readonly cft_tempH?: number
  readonly cft_tempL?: number
  readonly eco_tempH?: number
  readonly eco_tempL?: number
  readonly LOCK_C?: Switch
  readonly on_off?: Switch
  // Pro
  readonly cft_temp?: number
  readonly eco_temp?: number
  readonly window_switch?: Switch
}

export type Data = Record<string, never>

export type DevicePostDataAny = DevicePostData | DeviceV1PostData
