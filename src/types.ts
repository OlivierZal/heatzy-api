import type { UNIT } from './constants.js'
import type { DerogMode, Mode, Switch } from './enums.js'

export type Data = Record<string, never>

export interface ErrorData {
  readonly detail_message: string | null
  readonly error_message: string | null
}

export interface LoginPostData {
  readonly password: string
  readonly username: string
}

export interface LoginData {
  readonly expire_at: number
  readonly token: string
}

export interface Device {
  readonly dev_alias: string
  readonly did: string
  readonly product_key: string
  readonly product_name: string
}

export interface Bindings {
  readonly devices: readonly Device[]
}

export interface FirstGenDevicePostData {
  readonly raw: [typeof UNIT, typeof UNIT, Mode]
}

export interface BaseAttrs {
  readonly cft_tempH?: number
  readonly cft_tempL?: number
  readonly derog_mode?: DerogMode
  readonly derog_time?: number
  readonly lock_switch?: Switch
  readonly mode?: Mode | keyof typeof Mode
  readonly timer_switch?: Switch
}

export interface DevicePostData {
  readonly attrs: BaseAttrs
}

export type DevicePostDataAny = DevicePostData | FirstGenDevicePostData

export type Attrs = Omit<BaseAttrs, 'mode'> & {
  readonly mode: keyof typeof Mode
}
export interface DeviceData {
  readonly attr: Attrs
}
