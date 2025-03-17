import 'source-map-support/register.js'

export { UNIT } from './constants.ts'
export { syncDevices, updateDevice } from './decorators/index.ts'
export {
  DerogationMode,
  Mode,
  ModeV1,
  Switch,
  TemperatureCompensation,
} from './enums.ts'
export { supportsGlow, supportsPro, supportsV2 } from './facades/interfaces.ts'
export { FacadeManager } from './facades/manager.ts'
export { DeviceModel } from './models/device.ts'
export {
  Product,
  type IDeviceModel,
  type PreviousMode,
} from './models/interfaces.ts'
export { API as HeatzyAPI } from './services/api.ts'
export { getTargetTemperature } from './utils.ts'
export type {
  IDeviceFacade,
  IDeviceFacadeAny,
  IDeviceGlowFacade,
  IDeviceProFacade,
  IDeviceV2Facade,
  IFacadeManager,
} from './facades/interfaces.ts'
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
  DeviceV1PostData,
  ErrorData,
  LoginData,
  LoginPostData,
  PostAttrs,
} from './types.ts'
