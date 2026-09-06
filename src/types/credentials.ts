// Thin re-export of @olivierzal/api-core's credential pair (formerly
// declared here member for member): the core's `doAuthenticate` hook
// is typed with it, so the type must be the core's. On Gizwits the
// pair is also the verbatim `/login` body (`HeatzyAPI.login`) — the
// one fact the core's doc asks this SDK to keep in its own types.
export type { LoginCredentials } from '@olivierzal/api-core'
