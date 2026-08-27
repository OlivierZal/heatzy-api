// Thin re-export of @olivierzal/api-core (the mechanism formerly
// duplicated here as melcloud-api's twin; this SDK composes policies
// by nesting `run` calls directly, so `CompositePolicy` stays
// unimported here).
export type { ResiliencePolicy } from '@olivierzal/api-core'
