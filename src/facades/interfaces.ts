import type { DateTime } from 'luxon'

import type { DerogationMode, Mode, TemperatureCompensation } from '../enums.ts'
import type { Attributes, PostAttributes } from '../types.ts'

import {
  type IBaseDeviceModel,
  type IDeviceModel,
  Product,
} from '../models/index.ts'

export interface IDeviceFacade extends IBaseDeviceModel {
  readonly isOn: boolean
  readonly mode: Mode
  readonly onSync: () => Promise<void>
  readonly setValues: (data: PostAttributes) => Promise<Partial<Attributes>>
  readonly values: () => Promise<Attributes>
}

export interface IDeviceGlowFacade extends IDeviceV2Facade {
  readonly comfortTemperature: number
  readonly currentTemperature: number
  readonly ecoTemperature: number
  readonly temperatureCompensation: TemperatureCompensation
}

export interface IDeviceProFacade extends IDeviceGlowFacade {
  readonly currentHumidity: number
  readonly currentMode: Mode
  readonly isDetectingOpenWindow: boolean
  readonly isPresence: boolean
}

export interface IDeviceV2Facade extends IDeviceFacade {
  readonly derogationEndDate: DateTime | null
  readonly derogationEndString: string | null
  readonly derogationMode: DerogationMode
  readonly derogationTime: number
  readonly isLocked: boolean
  readonly isTimer: boolean
}

export interface IFacadeManager {
  readonly get: (instance?: IDeviceModel) => IDeviceFacade | null
}

export type IDeviceFacadeAny =
  | IDeviceFacade
  | IDeviceGlowFacade
  | IDeviceProFacade
  | IDeviceV2Facade

export const supportsV2 = (
  device: IDeviceFacadeAny,
): device is IDeviceV2Facade => device.product >= Product.V2

export const supportsGlow = (
  device: IDeviceFacadeAny,
): device is IDeviceGlowFacade => device.product >= Product.Glow

export const supportsPro = (
  device: IDeviceFacadeAny,
): device is IDeviceProFacade => device.product >= Product.Pro
