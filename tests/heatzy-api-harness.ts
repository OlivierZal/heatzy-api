import { type MockInstance, vi } from 'vitest'

import type { HeatzyAPIConfig, SettingManager } from '../src/api/types.ts'
import type {
  HttpClient,
  HttpRequestConfig,
  HttpResponse,
} from '../src/http/index.ts'
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

export const BINDINGS_PATH = '/bindings'
export const DEVDATA_PREFIX = '/devdata/'
export const LOGIN_PATH = '/login'

/**
 * Splits the transport in two along the only seam this SDK stages
 * independently: the `/login` round-trip on one side, everything the
 * session then spends itself on (the registry cycle, a mutation) on the
 * other.
 * @param requestSpy - Spy standing in for the transport.
 * @param root0 - The two responders.
 * @param root0.login - Answers the sign-in round-trip.
 * @param root0.rest - Answers every other call.
 */
export const stageHeatzyWire = (
  requestSpy: MockInstance<HttpClient['request']>,
  {
    login,
    rest,
  }: {
    login: () => HttpResponse
    rest: (config: HttpRequestConfig) => HttpResponse
  },
): void => {
  requestSpy.mockImplementation(async (config) => {
    await Promise.resolve()
    return config.url === LOGIN_PATH ? login() : rest(config)
  })
}

/**
 * One successful registry cycle on the wire. Heatzy's cycle is
 * PER-DEVICE: `/bindings` answers the envelope, then the client fans
 * out one `/devdata/{did}/latest` read per binding — so a single canned
 * body cannot stand in for the cycle the way a bulk dialect's can.
 * @param root0 - The call being answered.
 * @param root0.url - URL the call targeted.
 * @param root1 - Payload the cycle carries.
 * @param root1.attributes - Attribute payload every device read answers.
 * @param root1.bindings - Entries the `/bindings` envelope carries.
 * @returns The response for that hop of the cycle.
 */
export const heatzyRegistryResponse = (
  { url }: HttpRequestConfig,
  {
    attributes,
    bindings,
  }: { attributes: Attributes; bindings: readonly DeviceBinding[] },
): HttpResponse => {
  if (url === BINDINGS_PATH) {
    return mockResponse({ devices: bindings })
  }
  if (url?.startsWith(DEVDATA_PREFIX) === true) {
    return mockResponse({ attr: attributes })
  }
  return mockResponse({})
}

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
  stageHeatzyWire(mockRequest, {
    login: () => mockResponse(loginData ?? buildLoginData()),
    rest: (config) => heatzyRegistryResponse(config, { attributes, bindings }),
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
  mockRequest.mock.calls.filter(([config]) => config.url === LOGIN_PATH).length

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
