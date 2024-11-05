import type {
  Bindings,
  Data,
  Device,
  DeviceData,
  DevicePostDataAny,
  LoginData,
  LoginPostData,
} from '../types.js'

export interface APISettings {
  expireAt?: string | null
  password?: string | null
  token?: string | null
  username?: string | null
}

export const isAPISetting = (key: string): key is keyof APISettings =>
  (
    [
      'expireAt',
      'password',
      'token',
      'username',
    ] satisfies (keyof APISettings)[] as string[]
  ).includes(key)

export interface SettingManager {
  get: <K extends keyof APISettings>(key: K) => APISettings[K]
  set: <K extends keyof APISettings>(key: K, value: APISettings[K]) => void
}

export interface Logger {
  error: Console['error']
  log: Console['log']
}

export interface APIConfig extends Partial<LoginPostData> {
  autoSyncInterval?: number | null
  language?: string
  logger?: Logger
  onSync?: () => Promise<void>
  settingManager?: SettingManager
  shouldVerifySSL?: boolean
  timezone?: string
}

export interface IAPI {
  authenticate: (data?: LoginPostData) => Promise<boolean>
  bindings: () => Promise<{ data: Bindings }>
  clearSync: () => void
  control: ({
    id,
    postData,
  }: {
    id: string
    postData: DevicePostDataAny
  }) => Promise<{ data: Data }>
  deviceData: ({ id }: { id: string }) => Promise<{ data: DeviceData }>
  fetch: () => Promise<readonly Device[]>
  login: ({
    postData,
  }: {
    postData: LoginPostData
  }) => Promise<{ data: LoginData }>
  onSync?: () => Promise<void>
}
