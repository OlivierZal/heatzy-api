import {
  type APICallContextData,
  APICallRequestData,
  APICallResponseData,
  type ErrorData,
} from '..'
import type { AxiosError } from 'axios'

interface APICallContextDataWithErrorMessage extends APICallContextData {
  readonly errorMessage: string
}

const getMessage = (error: AxiosError): string => {
  const data = error.response?.data as ErrorData | null | undefined
  if (typeof data !== 'undefined' && data) {
    const { error_message: errorMessage, detail_message: detailMessage } = data
    const message = detailMessage ?? errorMessage ?? ''
    if (message) {
      return message
    }
  }
  return error.message
}

const withErrorMessage = <T extends new (...args: any[]) => APICallContextData>(
  base: T,
  error: AxiosError,
): new (
  ...args: ConstructorParameters<T>
) => APICallContextDataWithErrorMessage =>
  class extends base {
    public readonly errorMessage = getMessage(error)
  }

const createAPICallErrorData = (
  error: AxiosError,
): APICallContextDataWithErrorMessage =>
  typeof error.response === 'undefined' ?
    new (withErrorMessage(APICallRequestData, error))(error.config)
  : new (withErrorMessage(APICallResponseData, error))(error.response)

export default createAPICallErrorData
