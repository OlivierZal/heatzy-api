import type { InternalAxiosRequestConfig } from 'axios'

import { APICallContextData } from './context.ts'

export class APICallRequestData extends APICallContextData {
  public readonly dataType = 'API request'

  public readonly requestData: InternalAxiosRequestConfig['data']

  public readonly headers?: InternalAxiosRequestConfig['headers']

  public constructor(config?: InternalAxiosRequestConfig) {
    super(config)
    this.headers = config?.headers
    this.requestData = config?.data as unknown
  }
}
