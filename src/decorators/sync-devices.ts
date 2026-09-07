// Thin re-export of @olivierzal/api-core's `syncDevices` method
// decorator FACTORY (formerly this repo's own bare decorator): the
// post-method sync notification is one concern in both SDKs — await the
// method, then call the host's `notifySync`, the core's own and generic
// in the sync params — and the core carries melcloud-api's factory form,
// forwarding its payload verbatim. This dialect applies it bare,
// `@syncDevices()`, so the host's `notifySync` receives `undefined`:
// `HeatzyAPI` emits that through the lifecycle emitter, a facade
// enriches it with its own `id` before delegating. The shape change —
// `@syncDevices` to `@syncDevices()` — is what made 17.0.0 a major.
export { syncDevices } from '@olivierzal/api-core'
