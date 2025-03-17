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
export {
  FacadeManager,
  supportsGlow,
  supportsPro,
  supportsV2,
  type IDeviceFacade,
  type IDeviceFacadeAny,
  type IDeviceGlowFacade,
  type IDeviceProFacade,
  type IDeviceV2Facade,
  type IFacadeManager,
} from './facades/index.ts'
export {
  DeviceModel,
  Product,
  type IDeviceModel,
  type PreviousMode,
} from './models/index.ts'
export {
  API as HeatzyAPI,
  type APIConfig,
  type APISettings,
  type IAPI,
  type Logger,
  type OnSyncFunction,
  type SettingManager,
} from './services/index.ts'
export { getTargetTemperature } from './utils.ts'
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
