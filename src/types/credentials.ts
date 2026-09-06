// Thin re-export of @olivierzal/api-core's credential pair (formerly
// declared here member for member): the core's `doAuthenticate` hook
// is typed with it, so the type must be the core's. The Gizwits fact
// travels on the specifier's own doc, which typedoc reads.
export type {
  /**
   * Heatzy (Gizwits) user credentials — also the verbatim `/login`
   * body (`HeatzyAPI.login` posts the pair as is), the one fact the
   * core's doc asks this SDK to keep in its own types.
   * @category Types
   */
  LoginCredentials,
} from '@olivierzal/api-core'
