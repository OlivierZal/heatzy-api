// Thin re-export of @olivierzal/api-core's HttpError: ONE class family
// wide, so `instanceof`/`isHttpError` hold across the SDK and the core
// mechanisms alike. A direct construction inside this SDK passes the
// Gizwits `redaction` engine from `../observability/context.ts` —
// without it, only the core's base vocabulary applies.
export type { HttpErrorRequestConfig } from '@olivierzal/api-core'

export { HttpError, isHttpError } from '@olivierzal/api-core'
