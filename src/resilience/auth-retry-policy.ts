// Thin re-export of @olivierzal/api-core (the mechanism formerly
// duplicated here as melcloud-api's twin). The auth-failure statuses
// are a constructor parameter now: `HeatzyAPI` passes `[401, 400]` —
// Gizwits reports an invalid or expired user token as HTTP 400 (error
// code 9004 in the body), never 401.
export { AuthRetryPolicy } from '@olivierzal/api-core'
