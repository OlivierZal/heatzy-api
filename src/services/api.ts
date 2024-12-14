import https from 'https'

import axios, {
  HttpStatusCode,
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { DateTime, Duration, Settings as LuxonSettings } from 'luxon'

import { syncDevices } from '../decorators/sync-devices.ts'
import { createAPICallErrorData } from '../logging/error.ts'
import { APICallRequestData } from '../logging/request.ts'
import { APICallResponseData } from '../logging/response.ts'
import { DeviceModel } from '../models/device.ts'

import {
  isAPISetting,
  type APIConfig,
  type IAPI,
  type Logger,
  type SettingManager,
} from './interfaces.ts'

import type {
  Attrs,
  Bindings,
  Data,
  Device,
  DeviceData,
  DevicePostDataAny,
  LoginData,
  LoginPostData,
} from '../types.ts'

const APPLICATION_ID = 'X-Gizwits-Application-Id'
const LOGIN_PATH = '/login'

const DEFAULT_SYNC_INTERVAL = 1
const NO_SYNC_INTERVAL = 0
const RETRY_DELAY = 1000

const setting = <This extends API>(
  target: ClassAccessorDecoratorTarget<This, string>,
  context: ClassAccessorDecoratorContext<This, string>,
): ClassAccessorDecoratorResult<This, string> => ({
  get(this: This): string {
    const key = String(context.name)
    if (!isAPISetting(key)) {
      throw new Error(`Invalid setting: ${key}`)
    }
    return this.settingManager?.get(key) ?? target.get.call(this)
  },
  set(this: This, value: string): void {
    const key = String(context.name)
    if (!isAPISetting(key)) {
      throw new Error(`Invalid setting: ${key}`)
    }
    if (this.settingManager) {
      this.settingManager.set(key, value)
      return
    }
    target.set.call(this, value)
  },
})

export class API implements IAPI {
  public readonly onSync?: () => Promise<void>

  protected readonly settingManager?: SettingManager

  readonly #api: AxiosInstance

  readonly #autoSyncInterval: number

  readonly #logger: Logger

  #retryTimeout: NodeJS.Timeout | null = null

  #syncTimeout: NodeJS.Timeout | null = null

  public constructor(config: APIConfig = {}) {
    const {
      autoSyncInterval = DEFAULT_SYNC_INTERVAL,
      language,
      logger = console,
      onSync,
      password,
      settingManager,
      shouldVerifySSL = true,
      timezone,
      username,
    } = config
    this.#autoSyncInterval = Duration.fromObject({
      minutes: autoSyncInterval ?? NO_SYNC_INTERVAL,
    }).as('milliseconds')
    this.#logger = logger
    this.onSync = onSync
    this.settingManager = settingManager
    this.#setOptionalProperties({
      language,
      password,
      timezone,
      username,
    })
    this.#api = this.#createAPI(shouldVerifySSL)
  }

  @setting
  private accessor expireAt = ''

  @setting
  private accessor password = ''

  @setting
  private accessor token = ''

  @setting
  private accessor username = ''

  public static async create(config: APIConfig = {}): Promise<API> {
    const api = new API(config)
    await api.fetch()
    return api
  }

  @syncDevices
  public async fetch(): Promise<readonly Device[]> {
    this.clearSync()
    try {
      const {
        data: { devices },
      } = await this.bindings()
      await this.#sync(devices)
      return devices
    } catch {
      return []
    } finally {
      this.#planNextSync()
    }
  }

  public async authenticate(data?: LoginPostData): Promise<boolean> {
    const { password = this.password, username = this.username } = data ?? {}
    if (username && password) {
      try {
        return await this.#authenticate({ password, username })
      } catch (error) {
        if (data !== undefined) {
          throw error
        }
      }
    }
    return false
  }

  public async bindings(): Promise<{ data: Bindings }> {
    return this.#api.get<Bindings>('/bindings')
  }

  public clearSync(): void {
    if (this.#syncTimeout) {
      clearTimeout(this.#syncTimeout)
      this.#syncTimeout = null
    }
  }

  public async control({
    id,
    postData,
  }: {
    id: string
    postData: DevicePostDataAny
  }): Promise<{ data: Data }> {
    return this.#api.post<Data>(`/control/${id}`, postData)
  }

  public async deviceData({
    id,
  }: {
    id: string
  }): Promise<{ data: DeviceData }> {
    return this.#api.get<DeviceData>(`/devdata/${id}/latest`)
  }

  public async login({
    postData,
  }: {
    postData: LoginPostData
  }): Promise<{ data: LoginData }> {
    return this.#api.post<LoginData>(LOGIN_PATH, postData)
  }

  async #authenticate({ password, username }: LoginPostData): Promise<true> {
    const { data } = await this.login({ postData: { password, username } })
    this.username = username
    this.password = password
    this.expireAt = String(data.expire_at)
    ;({ token: this.token } = data)
    await this.fetch()
    return true
  }

  #canRetry(): boolean {
    if (!this.#retryTimeout) {
      this.#retryTimeout = setTimeout(() => {
        this.#retryTimeout = null
      }, RETRY_DELAY)
      return true
    }
    return false
  }

  #createAPI(rejectUnauthorized: boolean): AxiosInstance {
    const api = axios.create({
      baseURL: 'https://euapi.gizwits.com/app',
      headers: { [APPLICATION_ID]: 'c70a66ff039d41b4a220e198b0fcc8b3' },
      httpsAgent: new https.Agent({ rejectUnauthorized }),
    })
    this.#setupAxiosInterceptors(api)
    return api
  }

  async #handleError(error: AxiosError): Promise<AxiosError> {
    const errorData = createAPICallErrorData(error)
    this.#logger.error(String(errorData))
    if (
      error.response?.status === HttpStatusCode.BadRequest &&
      this.#canRetry() &&
      error.config?.url !== LOGIN_PATH &&
      (await this.authenticate()) &&
      error.config
    ) {
      return this.#api.request(error.config)
    }
    throw new Error(errorData.errorMessage)
  }

  async #handleRequest(
    config: InternalAxiosRequestConfig,
  ): Promise<InternalAxiosRequestConfig> {
    const newConfig = { ...config }
    if (newConfig.url !== LOGIN_PATH) {
      const { expireAt, token } = this
      if (expireAt && DateTime.fromSeconds(Number(expireAt)) < DateTime.now()) {
        await this.authenticate()
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

  #planNextSync(): void {
    if (this.#autoSyncInterval) {
      this.#syncTimeout = setTimeout(() => {
        this.fetch().catch(() => {
          //
        })
      }, this.#autoSyncInterval)
    }
  }

  #setOptionalProperties({
    language,
    password,
    timezone,
    username,
  }: {
    language?: string
    password?: string
    timezone?: string
    username?: string
  }): void {
    if (timezone !== undefined) {
      LuxonSettings.defaultZone = timezone
    }
    if (language !== undefined) {
      LuxonSettings.defaultLocale = language
    }
    if (username !== undefined) {
      this.username = username
    }
    if (password !== undefined) {
      this.password = password
    }
  }

  #setupAxiosInterceptors(api: AxiosInstance): void {
    api.interceptors.request.use(
      async (
        config: InternalAxiosRequestConfig,
      ): Promise<InternalAxiosRequestConfig> => this.#handleRequest(config),
      async (error: AxiosError): Promise<AxiosError> =>
        this.#handleError(error),
    )
    api.interceptors.response.use(
      (response: AxiosResponse): AxiosResponse =>
        this.#handleResponse(response),
      async (error: AxiosError): Promise<AxiosError> =>
        this.#handleError(error),
    )
  }

  async #sync(devices: readonly Device[]): Promise<void> {
    DeviceModel.sync(
      devices,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      Object.fromEntries(
        await Promise.all(
          devices.map(async ({ did }) => [
            did,
            (await this.deviceData({ id: did })).data.attr,
          ]),
        ),
      ) as Record<string, Attrs>,
    )
  }
}
