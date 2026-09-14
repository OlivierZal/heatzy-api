export type {
  HttpClientConfig,
  HttpRequestConfig,
  HttpResponse,
} from './client.ts'

export { HttpClient } from './client.ts'
export {
  type HttpErrorRequestConfig,
  HttpError,
  HttpStatus,
  isHttpError,
} from '@olivierzal/api-core'
