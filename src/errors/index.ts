export { AttributeNotFoundError } from './attribute-not-found.ts'
export { EntityNotFoundError } from './entity-not-found.ts'
// The core's error family is forwarded under unchanged names so
// `instanceof` holds across the SDK and the core alike; the two classes
// declared here are the protocol's own, and they extend `APIError`
// through the package specifier — never through this barrel, which
// would form an eval-time cycle under `class extends`.
export {
  APIError,
  AuthenticationError,
  isAPIError,
  RegistrySyncError,
  ValidationError,
} from '@olivierzal/api-core'
