import 'source-map-support/register.js'

export { UNIT } from './constants.ts'
export { syncDevices } from './decorators/sync-devices.ts'
export { updateDevice } from './decorators/update-device.ts'
export { DerogMode, Mode, Switch, TemperatureCompensation } from './enums.ts'
export { FacadeManager } from './facades/manager.ts'
export { DeviceModel } from './models/device.ts'
export { API as HeatzyAPI } from './services/api.ts'
export type {
  DerogSettings,
  IDeviceFacade,
  IDeviceFacadeAny,
  IDeviceGlowFacade,
  IDeviceProFacade,
  IDeviceV2Facade,
  IFacadeManager,
  supportsGlow,
  supportsPro,
  supportsV2,
} from './facades/interfaces.ts'
export type { IDeviceModel, Product } from './models/interfaces.ts'
export type {
  APIConfig,
  APISettings,
  IAPI,
  Logger,
  OnSyncFunction,
  SettingManager,
} from './services/interfaces.ts'
export type {
  Attrs,
  Bindings,
  Data,
  Device,
  DeviceData,
  DevicePostData,
  DevicePostDataAny,
  ErrorData,
  FirstGenDevicePostData,
  LoginData,
  LoginPostData,
} from './types.ts'
