import type {
  Bindings,
  Data,
  Device,
  DeviceData,
  DevicePostDataAny,
  LoginData,
  LoginPostData,
} from '../types.ts'

export interface APIConfig extends Partial<LoginPostData> {
  readonly autoSyncInterval?: number | null
  readonly language?: string
  readonly logger?: Logger
  readonly onSync?: OnSyncFunction
  readonly settingManager?: SettingManager
  readonly shouldVerifySSL?: boolean
  readonly timezone?: string
}

export interface APISettings {
  readonly expireAt?: string | null
  readonly password?: string | null
  readonly token?: string | null
  readonly username?: string | null
}

export interface IAPI {
  readonly onSync?: OnSyncFunction
  readonly authenticate: (data?: LoginPostData) => Promise<boolean>
  readonly bindings: () => Promise<{ data: Bindings }>
  readonly clearSync: () => void
  readonly control: ({
    id,
    postData,
  }: {
    id: string
    postData: DevicePostDataAny
  }) => Promise<{ data: Data }>
  readonly deviceData: ({ id }: { id: string }) => Promise<{ data: DeviceData }>
  readonly fetch: () => Promise<readonly Device[]>
  readonly login: ({
    postData,
  }: {
    postData: LoginPostData
  }) => Promise<{ data: LoginData }>
}

export interface Logger {
  readonly error: Console['error']
  readonly log: Console['log']
}

export interface SettingManager {
  readonly get: <K extends keyof APISettings>(key: K) => APISettings[K]
  readonly set: <K extends keyof APISettings>(
    key: K,
    value: APISettings[K],
  ) => void
}

export type OnSyncFunction = (parameters?: { ids?: string[] }) => Promise<void>

export const isAPISetting = (value: string): value is keyof APISettings =>
  (
    [
      'expireAt',
      'password',
      'token',
      'username',
    ] satisfies (keyof APISettings)[] as string[]
  ).includes(value)
