// Thin re-export of @olivierzal/api-core's ValidationError (formerly
// this repo's own class, melcloud-api's byte-identical twin): the class
// names no validator — the `ZodError` rides its `cause` chain as
// `unknown` — so it crossed into the core in 1.3.0, while
// `parseOrThrow`, the zod boundary that constructs it, stays here. The
// exported name IS the core's class, so a consumer's `instanceof` holds
// across this SDK and the core alike, and the `RegistrySyncError` wrap
// of a failed enforced cycle keeps carrying it as `cause` unchanged.
export { ValidationError } from '@olivierzal/api-core'
