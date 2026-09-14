export type {
  Attributes,
  Bindings,
  DeviceBinding,
  DeviceData,
  DevicePostData,
  DevicePostDataAny,
  DeviceV1PostData,
  LoginData,
  PostAttributes,
} from './heatzy.ts'
// The credential pair is the core's: its `doAuthenticate` hook is typed
// with it. The Gizwits fact travels on the specifier's own doc, which
// typedoc reads.
export type {
  /**
   * Heatzy (Gizwits) user credentials — also the verbatim `/login`
   * body (`HeatzyAPI.login` posts the pair as is), the one fact the
   * core's doc asks this SDK to keep in its own types.
   * @category Types
   */
  LoginCredentials,
  UndefinedTolerant,
} from '@olivierzal/api-core'
