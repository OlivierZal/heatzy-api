import {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  HttpStatusCode,
  type InternalAxiosRequestConfig,
  create as createAxiosInstance,
} from 'axios'
import type {
  Bindings,
  Data,
  DeviceData,
  DevicePostDataAny,
  LoginCredentials,
  LoginData,
  LoginPostData,
} from '..'
import { DateTime, Duration } from 'luxon'
import APICallRequestData from './APICallRequestData'
import APICallResponseData from './APICallResponseData'
import createAPICallErrorData from './createAPICallErrorData'
import https from 'https'

export interface APISettings {
  readonly expireAt?: number | null
  readonly password?: string | null
  readonly token?: string | null
  readonly username?: string | null
}

export interface Logger {
  readonly error: Console['error']
  readonly log: Console['log']
}

export interface SettingManager {
  get: <K extends keyof APISettings>(
    key: K,
  ) => APISettings[K] | null | undefined
  set: <K extends keyof APISettings>(key: K, value: APISettings[K]) => void
}

const APPLICATION_ID = 'X-Gizwits-Application-Id'
const LOGIN_URL = '/login'
const NUMBER_0 = 0

export default class {
  readonly #settingManager?: SettingManager

  #expireAt = NUMBER_0

  #password = ''

  #retry = true

  #retryTimeout!: NodeJS.Timeout

  #token = ''

  #username = ''

  readonly #api: AxiosInstance

  readonly #logger: Logger

  public constructor(
    config: {
      logger?: Logger
      settingManager?: SettingManager
      shouldVerifySSL?: boolean
    } = {},
  ) {
    const { logger = console, settingManager, shouldVerifySSL = true } = config
    this.#logger = logger
    this.#settingManager = settingManager
    this.#api = createAxiosInstance({
      baseURL: 'https://euapi.gizwits.com/app',
      headers: { [APPLICATION_ID]: 'c70a66ff039d41b4a220e198b0fcc8b3' },
      httpsAgent: new https.Agent({ rejectUnauthorized: shouldVerifySSL }),
    })
    this.#setupAxiosInterceptors()
  }

  private get expireAt(): number {
    return this.#settingManager?.get('expireAt') ?? this.#expireAt
  }

  private set expireAt(value: number) {
    this.#expireAt = value
    this.#settingManager?.set('expireAt', this.#expireAt)
  }

  private get password(): string {
    return this.#settingManager?.get('password') ?? this.#password
  }

  private set password(value: string) {
    this.#password = value
    this.#settingManager?.set('password', this.#password)
  }

  private get token(): string {
    return this.#settingManager?.get('token') ?? this.#token
  }

  private set token(value: string) {
    this.#token = value
    this.#settingManager?.set('token', this.#token)
  }

  private get username(): string {
    return this.#settingManager?.get('username') ?? this.#username
  }

  private set username(value: string) {
    this.#username = value
    this.#settingManager?.set('username', this.#username)
  }

  public async applyLogin(data?: LoginCredentials): Promise<boolean> {
    const { username = this.username, password = this.password } = data ?? {}
    if (username && password) {
      try {
        await this.login({ password, username })
        return true
      } catch (error) {
        if (typeof data !== 'undefined') {
          throw error
        }
      }
    }
    return false
  }

  public async bindings(): Promise<{ data: Bindings }> {
    return this.#api.get<Bindings>('/bindings')
  }

  public async control(
    id: string,
    postData: DevicePostDataAny,
  ): Promise<{ data: Data }> {
    return this.#api.post<Data>(`/control/${id}`, postData)
  }

  public async deviceData(id: string): Promise<{ data: DeviceData }> {
    return this.#api.get<DeviceData>(`/devdata/${id}/latest`)
  }

  public async login({
    username,
    password,
  }: LoginPostData): Promise<{ data: LoginData }> {
    const response = await this.#api.post<LoginData>(LOGIN_URL, {
      password,
      username,
    } satisfies LoginPostData)
    this.username = username
    this.password = password
    this.token = response.data.token
    this.expireAt = response.data.expire_at
    return response
  }

  async #handleError(error: AxiosError): Promise<AxiosError> {
    const errorData = createAPICallErrorData(error)
    this.#logger.error(String(errorData))
    if (
      error.response?.status === HttpStatusCode.BadRequest &&
      this.#retry &&
      error.config?.url !== LOGIN_URL
    ) {
      this.#handleRetry()
      if ((await this.applyLogin()) && error.config) {
        return this.#api.request(error.config)
      }
    }
    throw new Error(errorData.errorMessage)
  }

  async #handleRequest(
    config: InternalAxiosRequestConfig,
  ): Promise<InternalAxiosRequestConfig> {
    const newConfig = { ...config }
    if (newConfig.url !== LOGIN_URL) {
      const { expireAt, token } = this
      if (expireAt && DateTime.fromSeconds(expireAt) < DateTime.now()) {
        await this.applyLogin()
      }
      newConfig.headers.set('X-Gizwits-User-token', token)
    }
    this.#logger.log(String(new APICallRequestData(newConfig)))
    return newConfig
  }

  #handleResponse(response: AxiosResponse): AxiosResponse {
    this.#logger.log(String(new APICallResponseData(response)))
    return response
  }

  #handleRetry(): void {
    this.#retry = false
    clearTimeout(this.#retryTimeout)
    this.#retryTimeout = setTimeout(
      () => {
        this.#retry = true
      },
      Duration.fromObject({ minutes: 1 }).as('milliseconds'),
    )
  }

  #setupAxiosInterceptors(): void {
    this.#api.interceptors.request.use(
      async (
        config: InternalAxiosRequestConfig,
      ): Promise<InternalAxiosRequestConfig> => this.#handleRequest(config),
      async (error: AxiosError): Promise<AxiosError> =>
        this.#handleError(error),
    )
    this.#api.interceptors.response.use(
      (response: AxiosResponse): AxiosResponse =>
        this.#handleResponse(response),
      async (error: AxiosError): Promise<AxiosError> =>
        this.#handleError(error),
    )
  }
}
