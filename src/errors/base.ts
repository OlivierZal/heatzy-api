// Thin re-export of @olivierzal/api-core's error base (formerly
// melcloud-api's byte-identical twin): ONE `APIError` class family
// wide, so `isAPIError` holds across this SDK's protocol errors and
// the core's mechanisms alike.
export { APIError, isAPIError } from '@olivierzal/api-core'
