import 'source-map-support/register.js'

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
  type IDeviceFacade,
  type IDeviceFacadeAny,
  type IDeviceGlowFacade,
  type IDeviceProFacade,
  type IDeviceV2Facade,
  type IFacadeManager,
  FacadeManager,
  supportsGlow,
  supportsPro,
  supportsV2,
} from './facades/index.ts'
export {
  type IDeviceModel,
  type PreviousMode,
  DeviceModel,
  Product,
} from './models/index.ts'
export {
  type APIConfig,
  type APISettings,
  type IAPI,
  type Logger,
  type OnSyncFunction,
  type SettingManager,
  API as HeatzyAPI,
} from './services/index.ts'
export { getTargetTemperature } from './utils.ts'
