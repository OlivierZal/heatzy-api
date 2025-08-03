import 'source-map-support/register.js'

export type {
  Attributes,
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
  PostAttributes,
} from './types.ts'

export { syncDevices, updateDevice } from './decorators/index.ts'
export {
  DerogationMode,
  Mode,
  Product,
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
