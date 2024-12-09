import type { UNIT } from './constants.ts'
import type {
  DerogMode,
  Mode,
  Switch,
  TemperatureCompensation,
} from './enums.ts'

export interface Attrs {
  readonly mode?: Mode
  // Product: not 'v1'
  readonly derog_mode?: DerogMode
  readonly derog_time?: number
  readonly timer_switch?: Switch
  // Product: not 'v1', 'glow'
  readonly lock_switch?: Switch
  // Product: not 'v1', 'v2', 'v4'
  readonly com_temp?: TemperatureCompensation
  // Product: 'glow'
  readonly cft_tempH?: number
  readonly cft_tempL?: number
  readonly cur_tempH?: number
  readonly cur_tempL?: number
  readonly eco_tempH?: number
  readonly eco_tempL?: number
  readonly lock_c?: Switch
  // Product: 'pro'
  readonly cft_temp?: number
  readonly cur_humi?: number
  readonly cur_mode?: Mode
  readonly cur_signal?: Mode
  readonly cur_temp?: number
  readonly eco_temp?: number
  readonly heating_state?: Switch
  readonly temp_set_step?: Switch
  readonly window_switch?: Switch
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
  readonly attr: Attrs
}

export interface DevicePostData {
  readonly attrs: Attrs
}

export interface ErrorData {
  readonly detail_message: string | null
  readonly error_message: string | null
}

export interface FirstGenDevicePostData {
  readonly raw: [typeof UNIT, typeof UNIT, Mode]
}

export interface LoginData {
  readonly expire_at: number
  readonly token: string
}

export interface LoginPostData {
  readonly password: string
  readonly username: string
}

export type Data = Record<string, never>

export type DevicePostDataAny = DevicePostData | FirstGenDevicePostData
