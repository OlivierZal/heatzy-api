import {
  Product,
  type IBaseDeviceModel,
  type IDeviceModel,
} from '../models/interfaces.ts'

import type { DateTime } from 'luxon'

import type { DerogMode, Mode, TemperatureCompensation } from '../enums.ts'
import type { Attrs, PostAttrs } from '../types.ts'

export interface IDeviceFacade extends IBaseDeviceModel {
  isOn: boolean
  mode: Mode
  onSync: () => Promise<void>
  setValues: (data: PostAttrs) => Promise<Partial<Attrs>>
  values: () => Promise<Attrs>
}

export interface IDeviceGlowFacade extends IDeviceV2Facade {
  comfortTemperature: number
  currentTemperature: number
  ecoTemperature: number
  temperatureCompensation: TemperatureCompensation
}

export interface IDeviceProFacade extends IDeviceGlowFacade {
  currentHumidity: number
  currentMode: Mode
  isDetectingOpenWindow: boolean
  isPresence: boolean
}

export interface IDeviceV2Facade extends IDeviceFacade {
  derogEndDate: DateTime | null
  derogEndString: string | null
  derogMode: DerogMode
  derogTime: number
  isLocked: boolean
  isTimer: boolean
}

export interface IFacadeManager {
  get: (instance?: IDeviceModel) => IDeviceFacade | undefined
}

export type IDeviceFacadeAny =
  | IDeviceFacade
  | IDeviceGlowFacade
  | IDeviceProFacade
  | IDeviceV2Facade

export const supportsV2 = (
  device: IDeviceFacadeAny,
): device is IDeviceV2Facade => device.product >= Product.v2

export const supportsGlow = (
  device: IDeviceFacadeAny,
): device is IDeviceGlowFacade => device.product >= Product.glow

export const supportsPro = (
  device: IDeviceFacadeAny,
): device is IDeviceProFacade => device.product >= Product.pro
