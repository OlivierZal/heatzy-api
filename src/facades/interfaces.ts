import type { DateTime } from 'luxon'

import type { DerogMode, Mode, TemperatureCompensation } from '../enums.ts'
import type { IBaseDeviceModel, IDeviceModel } from '../models/interfaces.ts'
import type { Attrs, PostAttrs } from '../types.ts'

export interface DerogSettings {
  derogEndDate: DateTime | null
  derogEndString: string | null
  derogMode: DerogMode
  derogModeString: string
}

export interface IDeviceFacade extends IBaseDeviceModel {
  device: IDeviceModel
  isOn: boolean
  mode: Mode
  supportsGlow: boolean
  supportsPro: boolean
  supportsV2: boolean
  onSync: () => Promise<void>
  setValues: (data: PostAttrs) => Promise<Partial<Attrs>>
  values: () => Promise<Attrs>
}

export interface IDeviceGlowFacade extends IDeviceV2Facade {
  comfortTemperature: number
  currentTemperature: number
  ecoTemperature: number
  supportsGlow: true
  temperatureCompensation: TemperatureCompensation
}

export interface IDeviceProFacade extends IDeviceGlowFacade {
  currentHumidity: number
  currentMode: Mode
  isDetectingOpenWindow: boolean
  isPresence: boolean
  supportsPro: true
}

export interface IDeviceV2Facade extends IDeviceFacade {
  derogEndDate: DateTime | null
  derogMode: DerogMode
  derogSettings: DerogSettings
  isLocked: boolean
  isTimer: boolean
  supportsV2: true
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
): device is IDeviceV2Facade => device.supportsV2

export const supportsGlow = (
  device: IDeviceFacadeAny,
): device is IDeviceGlowFacade => device.supportsGlow

export const supportsPro = (
  device: IDeviceFacadeAny,
): device is IDeviceProFacade => device.supportsPro
