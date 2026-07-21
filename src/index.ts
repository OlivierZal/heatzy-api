export type {
  Attributes,
  Bindings,
  Data,
  DeviceBinding,
  DeviceData,
  DevicePostData,
  DevicePostDataAny,
  DeviceV1PostData,
  ErrorData,
  LoginCredentials,
  LoginData,
  PostAttributes,
  Resolved,
  UndefinedTolerant,
} from './types/index.ts'

export {
  type HeatzyAPIAdapter,
  type HeatzyAPIConfig,
  type HeatzyAPISettings,
  type LifecycleEvents,
  type Logger,
  type RequestCompleteEvent,
  type RequestErrorEvent,
  type RequestLifecycleContext,
  type RequestRetryEvent,
  type RequestStartEvent,
  type SettingManager,
  type SyncCallback,
  HeatzyAPI,
  toAuthFailure,
} from './api/index.ts'
export {
  DerogationMode,
  getProduct,
  Mode,
  Product,
  Switch,
  TemperatureCompensation,
} from './constants.ts'
export { setting, syncDevices, updateDevice } from './decorators/index.ts'
export {
  type PreviousMode,
  Device,
  DeviceRegistry,
  syncDevice,
} from './entities/index.ts'
export {
  APIError,
  AttributeNotFoundError,
  AuthenticationError,
  isAPIError,
  ValidationError,
} from './errors/index.ts'
export {
  type DeviceFacadeAny,
  DeviceFacade,
  DeviceGlowFacade,
  DeviceProFacade,
  DeviceV2Facade,
  FacadeManager,
  supportsGlow,
  supportsPro,
  supportsV2,
} from './facades/index.ts'
export {
  type HttpClientConfig,
  type HttpRequestConfig,
  type HttpResponse,
  HttpClient,
  HttpError,
  isHttpError,
} from './http/index.ts'
export { Temporal } from './temporal.ts'
export { getTargetTemperature } from './utils.ts'
