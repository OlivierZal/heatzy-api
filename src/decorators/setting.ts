// Thin re-export of @olivierzal/api-core's `setting` accessor
// decorator (formerly this repo's own implementation, byte-identical):
// the core's `SessionAPI` decorates its persisted accessors with it,
// and this SDK decorates its own `token` accessor with the same one —
// one delegation mechanism, one cleared-sentinel rule (`''` routes to
// `unset` when the host provides one).
export { setting } from '@olivierzal/api-core'
