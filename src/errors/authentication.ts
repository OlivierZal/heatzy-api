// Thin binding over @olivierzal/api-core's AuthenticationError: ONE
// class family wide, so the core's login-backoff gate and refusal
// record — which judge by `instanceof` — see the very errors its
// `toAuthFailure` template helper constructs on this dialect's sign-in
// path, and a consumer's `instanceof` holds across this SDK and the
// core alike. A plain re-export since api-core 1.2.0 names its throttle
// subclass (which Gizwits never surfaces) in code font rather than a
// doc link this package could not resolve.
export { AuthenticationError } from '@olivierzal/api-core'
