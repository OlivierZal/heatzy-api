// Thin re-export of @olivierzal/api-core's temporal entry point
// (formerly melcloud-api's byte-identical twin): the single Temporal
// entry for the whole family, so exactly one polyfill copy is loaded
// and core-built Temporal values are `instanceof`-compatible with this
// SDK's.
export { Temporal } from '@olivierzal/api-core/temporal'
