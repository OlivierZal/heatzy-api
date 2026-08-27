// Thin re-export of @olivierzal/api-core (the mechanism formerly
// duplicated here as melcloud-api's twin). The optional IANA `zone`
// parameter arrived with the extraction (melcloud-api's Classic
// dialect needs it); this SDK's offset-bearing expiry strings never
// exercise it.
export { isSessionExpired } from '@olivierzal/api-core'
