import type { Mode, TemperatureCompensation } from '../enums.ts'
import type {
  IBaseDeviceModel,
  IDeviceModel,
  Product,
} from '../models/interfaces.ts'
import type { Attrs } from '../types.ts'

export interface DerogSettings {
  derogEnd: string | null
  derogTimeBoost: number
  derogTimeVacation: number
}

export interface IDeviceFacade extends IBaseDeviceModel {
  device: IDeviceModel
  isOn: boolean
  mode: Mode
  product: Product
  onSync: () => Promise<void>
  setValues: (data: Attrs) => Promise<Attrs>
  values: () => Promise<Attrs>
}

export interface IDeviceGlowFacade extends IDeviceV2Facade {
  comfortTemperature: number
  currentTemperature: number
  ecoTemperature: number
  product: Exclude<Product, 'v1' | 'v2' | 'v4'>
  temperatureCompensation: TemperatureCompensation
}

export interface IDeviceProFacade extends IDeviceGlowFacade {
  currentHumidity: number
  currentMode: Mode
  currentSignal: Mode
  heatingState: boolean
  product: Exclude<Product, 'glow' | 'v1' | 'v2' | 'v4'>
  temperatureStep: boolean
  windowSwitch: boolean
}

export interface IDeviceV2Facade extends IDeviceFacade {
  derogSettings: DerogSettings
  lockSwitch: boolean
  product: Exclude<Product, 'v1'>
  timerSwitch: boolean
}

export interface IFacadeManager {
  get: (instance?: IDeviceModel) => IDeviceFacade | undefined
}

export type IDeviceFacadeAny =
  | IDeviceFacade
  | IDeviceGlowFacade
  | IDeviceProFacade
  | IDeviceV2Facade
