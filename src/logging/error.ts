import { APICallRequestData } from './request.js'
import { APICallResponseData } from './response.js'

import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'

import type { ErrorData } from '../types.js'

import type { APICallContextData } from './context.js'

export interface APICallContextDataWithErrorMessage extends APICallContextData {
  readonly errorMessage: string
}

const getMessage = (error: AxiosError): string => {
  const data = error.response?.data as ErrorData | null | undefined
  if (data !== undefined && data) {
    const { detail_message: detailMessage, error_message: errorMessage } = data
    const message = detailMessage ?? errorMessage ?? ''
    if (message) {
      return message
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