import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'

import type { ErrorData } from '../types.js'

import type { APICallContextData } from './context.js'

import { APICallRequestData } from './request.ts'
import { APICallResponseData } from './response.ts'

export interface APICallContextDataWithErrorMessage extends APICallContextData {
  readonly errorMessage: string
}

const isErrorData = (data: unknown): data is ErrorData =>
  data !== null &&
  typeof data === 'object' &&
  'detail_message' in data &&
  'error_message' in data

const getMessage = (error: AxiosError): string => {
  if (error.response) {
    const {
      response: { data },
    } = error
    if (isErrorData(data)) {
      const { detail_message: detailMessage, error_message: errorMessage } =
        data
      const message = detailMessage ?? errorMessage ?? ''
      if (message) {
        return message
      }
    }
  }
  return error.message
}

const withErrorMessage = <T extends AxiosResponse | InternalAxiosRequestConfig>(
  base: new (arg?: T) => APICallContextData,
  error: AxiosError,
): new (arg?: T) => APICallContextDataWithErrorMessage =>
  class extends base {
    public readonly errorMessage = getMessage(error)
  }

export const createAPICallErrorData = (
  error: AxiosError,
): APICallContextDataWithErrorMessage =>
  error.response ?
    new (withErrorMessage(APICallResponseData, error))(error.response)
  : new (withErrorMessage(APICallRequestData, error))(error.config)
