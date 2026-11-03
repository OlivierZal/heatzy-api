export type {
  Attributes,
  Bindings,
  ControlAttributes,
  DeviceBinding,
  DeviceData,
  DevicePostData,
  DevicePostDataAny,
  DeviceV1PostData,
  ErrorData,
  LoginData,
  PostAttributes,
} from './heatzy.ts'
// The credential pair is the core's: its `doAuthenticate` hook is typed
// with it, and its doc already names the Gizwits fact — the pair is
// also the verbatim `/login` body — which `HeatzyAPI.login`'s own doc
// repeats where the body is posted. A specifier comment would render
// nowhere: typedoc reads one only where the declaration has none.
export type { LoginCredentials, UndefinedTolerant } from '@olivierzal/api-core'
