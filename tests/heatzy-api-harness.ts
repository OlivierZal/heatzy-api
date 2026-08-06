import { vi } from 'vitest'

import type { HeatzyAPIConfig, SettingManager } from '../src/api/types.ts'
import type {
  Attributes,
  DeviceBinding,
  LoginData,
} from '../src/types/index.ts'
import { HeatzyAPI } from '../src/api/heatzy.ts'
import { Temporal } from '../src/temporal.ts'
import { buildBinding, buildLoginData, proAttributes } from './fixtures.ts'
import {
  createLogger,
  createMockHttpClient,
  createServerError,
  createSettingStore,
  mockResponse,
  mockTemporalNowInstant,
} from './helpers.ts'

const wire = createMockHttpClient('https://euapi.gizwits.com/app')

export const mockHttpClient: ReturnType<typeof createMockHttpClient>['client'] =
  wire.client

export const mockRequest: ReturnType<
  typeof createMockHttpClient
>['requestSpy'] = wire.requestSpy

export const LOGIN_BACKOFF_MS = 900_000

// Routes the three Heatzy endpoints to canned success responses so
// multi-request flows (login → bindings → devdata per binding) resolve
// without per-call mock choreography.
export const mockWire = ({
  attributes = proAttributes,
  bindings = [buildBinding()],
  loginData,
}: {
  attributes?: Attributes
  bindings?: readonly DeviceBinding[]
  loginData?: LoginData
} = {}): void => {
  mockRequest.mockImplementation(async (config) => {
    await Promise.resolve()
    if (config.url === '/login') {
      return mockResponse(loginData ?? buildLoginData())
    }
    if (config.url === '/bindings') {
      return mockResponse({ devices: bindings })
    }
    if (config.url?.startsWith('/devdata/') === true) {
      return mockResponse({ attr: attributes })
    }
    return mockResponse({})
  })
}

// Rejects every endpoint with the HTTP 400 Gizwits answers for an
// invalid token and rejected credentials alike.
export const mockRejectedWire = (): void => {
  mockRequest.mockImplementation(async (config) => {
    await Promise.resolve()
    throw createServerError(400, config.url ?? '/')
  })
}

export const loginCalls = (): number =>
  mockRequest.mock.calls.filter(([config]) => config.url === '/login').length

export const createApi = async (
  config: HeatzyAPIConfig = {},
): Promise<HeatzyAPI> =>
  HeatzyAPI.create({
    logger: createLogger(),
    syncIntervalMinutes: false,
    transport: mockHttpClient,
    ...config,
  })

// Builds an api over an initially-empty store, then persists a token —
// authenticated without any create-time wire traffic.
export const createAuthedApi = async (
  config: HeatzyAPIConfig = {},
): Promise<{ api: HeatzyAPI; settingManager: SettingManager }> => {
  const { settingManager } = createSettingStore()
  const api = await createApi({ settingManager, ...config })
  settingManager.set('token', 'user-token')
  return { api, settingManager }
}

// A store whose reads blow up — drives the fire-and-forget failure
// path of the background session restore.
export const createExplodingSettingManager = (): SettingManager => ({
  get: vi.fn<SettingManager['get']>().mockImplementation(() => {
    throw new Error('storage exploded')
  }),
  set: vi.fn<SettingManager['set']>(),
})

// One hook pair per suite — register inside each theme file's
// `describe` as `beforeEach(wireSetup)` / `afterEach(wireTeardown)`:
// fake timers + mocked Temporal clock + a reset transport, the
// baseline every HeatzyAPI theme file shares.
export const wireSetup = (): void => {
  vi.useFakeTimers()
  mockTemporalNowInstant()
  mockRequest.mockReset()
  mockRequest.mockResolvedValue(mockResponse({}))
}

export const wireTeardown = (): void => {
  vi.mocked(Temporal.Now.instant).mockRestore()
  vi.useRealTimers()
}
