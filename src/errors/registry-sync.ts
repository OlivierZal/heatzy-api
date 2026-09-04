// Thin re-export of @olivierzal/api-core's RegistrySyncError (formerly
// this repo's own class): the core's `authenticate()` is what throws
// it now — the sign-in round-trip was ACCEPTED but the enforced
// post-auth registry cycle failed, the cycle's own failure preserved
// as `cause` — so the exported name must BE the core's class for a
// consumer's `instanceof` branch ("signed in, stale list" vs a refused
// credential) to keep holding. A refused credential is never wrapped
// in this type: it stays `AuthenticationError`.
export { RegistrySyncError } from '@olivierzal/api-core'
