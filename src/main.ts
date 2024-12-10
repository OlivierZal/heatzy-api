import 'source-map-support/register.js'

export { UNIT } from './constants.ts'
export { syncDevices } from './decorators/sync-devices.ts'
export { updateDevice } from './decorators/update-device.ts'
export { DerogMode, Mode, Switch, TemperatureCompensation } from './enums.ts'
export {
  supportsGlow,
  supportsPro,
  supportsV2,
  type DerogSettings,
  type IDeviceFacade,
  type IDeviceFacadeAny,
  type IDeviceGlowFacade,
  type IDeviceProFacade,
  type IDeviceV2Facade,
  type IFacadeManager,
} from './facades/interfaces.ts'
export { FacadeManager } from './facades/manager.ts'
export { DeviceModel } from './models/device.ts'
export { API as HeatzyAPI } from './services/api.ts'
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
  PostAttrs,
} from './types.ts'
