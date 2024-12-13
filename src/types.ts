import type { UNIT } from './constants.ts'
import type {
  DerogMode,
  Mode,
  ModeV1,
  Switch,
  TemperatureCompensation,
} from './enums.ts'

export interface Attrs extends PostAttrs {
  readonly mode: Mode
  // Product: 'glow'
  readonly cur_tempH?: number
  readonly cur_tempL?: number
  // Product: 'pro'
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
  readonly attr: Attrs
}

export interface DevicePostData {
  readonly attrs: PostAttrs
}

export interface DeviceV1PostData {
  readonly raw: [typeof UNIT, typeof UNIT, mode: ModeV1]
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

export interface PostAttrs {
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
  readonly eco_tempH?: number
  readonly eco_tempL?: number
  readonly lock_c?: Switch
  readonly on_off?: Switch
  // Product: 'pro'
  readonly cft_temp?: number
  readonly eco_temp?: number
  readonly window_switch?: Switch
}

export type Data = Record<string, never>

export type DevicePostDataAny = DevicePostData | DeviceV1PostData
