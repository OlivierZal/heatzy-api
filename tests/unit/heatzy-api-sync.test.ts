import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { RequestErrorEvent, SyncCallback } from '../../src/api/types.ts'
import { HeatzyAPI } from '../../src/api/heatzy.ts'
import { buildBinding, buildLoginData, proAttributes } from '../fixtures.ts'
import {
  createApi,
  createAuthedApi,
  heatzyRegistryResponse,
  mockRejectedWire,
  mockRequest,
  mockWire,
  stageHeatzyWire,
  wireSetup,
  wireTeardown,
} from '../heatzy-api-harness.ts'
import {
  createLogger,
  createServerError,
  createSettingStore,
  mockResponse,
} from '../helpers.ts'

// Long enough for the transient-retry rung to exhaust its four
// attempts (1 s initial delay, 16 s cap) and hand the failure back.
const TRANSIENT_RETRY_WINDOW_MS = 30_000

const UNREADABLE_DEVICE_PATH = '/devdata/did-v2/latest'

describe(HeatzyAPI, () => {
  beforeEach(wireSetup)

  afterEach(wireTeardown)

  describe('fetch()', () => {
    it('fetches bindings and live attributes and syncs the registry', async () => {
      const { api } = await createAuthedApi()
      const binding = buildBinding('pro')
      mockWire({ bindings: [binding] })
      const bindings = await api.fetch()

      expect(bindings).toStrictEqual([binding])
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'get', url: '/bindings' }),
      )
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'get',
          url: '/devdata/did-pro/latest',
        }),
      )

      const device = api.registry.devices.getById('did-pro')

      expect(device?.name).toBe('Radiator pro')
      expect(device?.data).toStrictEqual(proAttributes)
    })

    // The fan-out settles leg by leg, so a device the wire will not
    // answer for costs itself and no sibling. A transient 5xx is the
    // case that must not become permanently invisible: the retry rung
    // still spends its attempts, the skip names the device, the failed
    // round-trip still reaches `onRequestError` — and the binding stays
    // in the returned list, so the next cycle reads that device again.
    it('keeps the devices that answered when one device read fails, and says which', async () => {
      const logger = createLogger()
      const onRequestError = vi.fn<(event: RequestErrorEvent) => void>()
      const { api } = await createAuthedApi({
        events: { onRequestError },
        logger,
      })
      stageHeatzyWire(mockRequest, {
        login: () => mockResponse(buildLoginData()),
        rest: (config) => {
          if (config.url === UNREADABLE_DEVICE_PATH) {
            throw createServerError(503, config.url)
          }
          return heatzyRegistryResponse(config, {
            attributes: proAttributes,
            bindings: [buildBinding('pro'), buildBinding('v2')],
          })
        },
      })

      const cycle = api.fetch()
      await vi.advanceTimersByTimeAsync(TRANSIENT_RETRY_WINDOW_MS)

      await expect(cycle).resolves.toHaveLength(2)

      expect(api.registry.getDevices()).toHaveLength(1)
      expect(api.registry.devices.getById('did-pro')).toBeDefined()
      expect(logger.error).toHaveBeenCalledWith(
        'Skipping device did-v2: its live attributes could not be read',
        expect.any(Error),
      )
      expect(onRequestError).toHaveBeenCalledWith(
        expect.objectContaining({ url: UNREADABLE_DEVICE_PATH }),
      )
    })

    // The registry tolerance the fan-out now actually feeds: a device
    // that answered `/bindings` but not `/devdata` keeps the model it
    // had, untouched — stale data beats no data, and beats pruning a
    // device that is merely quiet.
    it('leaves an existing model on its last-known data when its device read fails', async () => {
      const { api } = await createAuthedApi()
      mockWire({ bindings: [buildBinding('pro')] })
      await api.fetch()
      stageHeatzyWire(mockRequest, {
        login: () => mockResponse(buildLoginData()),
        rest: (config) =>
          config.url === '/devdata/did-pro/latest'
            ? mockResponse({ attr: { mode: 'cft3' } })
            : heatzyRegistryResponse(config, {
                attributes: proAttributes,
                bindings: [buildBinding('pro', { dev_alias: 'Renamed' })],
              }),
      })

      await api.fetch()

      const device = api.registry.devices.getById('did-pro')

      expect(device?.name).toBe('Radiator pro')
      expect(device?.data).toStrictEqual(proAttributes)
    })

    it('logs and returns an empty list when the fetch fails', async () => {
      const logger = createLogger()
      const { api } = await createAuthedApi({ logger })
      mockRequest.mockRejectedValue(new Error('network down'))

      await expect(api.fetch()).resolves.toStrictEqual([])

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to fetch devices:',
        expect.any(Error),
      )
    })

    it('notifies onSyncComplete after each fetch', async () => {
      const onSyncComplete = vi.fn<SyncCallback>().mockResolvedValue(undefined)
      const { api } = await createAuthedApi({ events: { onSyncComplete } })
      mockWire()
      await api.fetch()

      expect(onSyncComplete).toHaveBeenCalledTimes(1)
      expect(onSyncComplete).toHaveBeenCalledWith()
    })

    it('re-arms the auto-sync timer after an authenticated cycle', async () => {
      const { settingManager } = createSettingStore({ token: 'user-token' })
      mockWire()
      const api = await createApi({ settingManager, syncIntervalMinutes: 1 })
      mockRequest.mockClear()
      await vi.advanceTimersByTimeAsync(60_000)

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'get', url: '/bindings' }),
      )

      api[Symbol.dispose]()
    })

    it('emits onAuthenticationLost once per loss episode and disarms the auto-sync', async () => {
      const onAuthenticationLost = vi.fn<() => void>()
      const { settingManager } = createSettingStore()
      const api = await createApi({
        events: { onAuthenticationLost },
        settingManager,
        syncIntervalMinutes: 1,
      })
      settingManager.set('password', 'secret')
      settingManager.set('username', 'user@test.com')
      mockRejectedWire()

      await expect(api.fetch()).resolves.toStrictEqual([])
      await expect(api.fetch()).resolves.toStrictEqual([])

      expect(onAuthenticationLost).toHaveBeenCalledTimes(1)

      mockRequest.mockClear()
      await vi.advanceTimersByTimeAsync(120_000)

      expect(mockRequest).not.toHaveBeenCalled()
    })

    it('alternates onAuthenticationLost and onAuthenticationRestored across episodes', async () => {
      const onAuthenticationLost = vi.fn<() => void>()
      const onAuthenticationRestored = vi.fn<() => void>()
      const { settingManager } = createSettingStore()
      const api = await createApi({
        events: { onAuthenticationLost, onAuthenticationRestored },
        settingManager,
      })
      settingManager.set('password', 'secret')
      settingManager.set('username', 'user@test.com')
      mockRejectedWire()

      await expect(api.fetch()).resolves.toStrictEqual([])

      expect(onAuthenticationLost).toHaveBeenCalledTimes(1)
      expect(onAuthenticationRestored).not.toHaveBeenCalled()

      mockWire()
      await api.authenticate({ password: 'secret', username: 'user@test.com' })

      expect(onAuthenticationRestored).toHaveBeenCalledTimes(1)

      await api.fetch()

      expect(onAuthenticationRestored).toHaveBeenCalledTimes(1)

      // Refill the auth-retry guard, then fail a new cycle: a fresh
      // loss episode announces itself again.
      vi.advanceTimersByTime(1500)
      mockRejectedWire()

      await expect(api.fetch()).resolves.toStrictEqual([])

      expect(onAuthenticationLost).toHaveBeenCalledTimes(2)
    })
  })

  describe('abortSignal wiring', () => {
    it('applies the configured abortSignal to outgoing requests', async () => {
      const controller = new AbortController()
      const { api } = await createAuthedApi({ abortSignal: controller.signal })
      mockRequest.mockResolvedValue(mockResponse({ attr: proAttributes }))
      await api.getValues({ id: 'did-pro' })

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({ signal: controller.signal }),
      )
    })

    it('omits the signal when no abortSignal is configured', async () => {
      const { api } = await createAuthedApi()
      mockRequest.mockResolvedValue(mockResponse({ attr: proAttributes }))
      await api.getValues({ id: 'did-pro' })

      expect(mockRequest.mock.lastCall?.[0]).not.toHaveProperty('signal')
    })
  })

  describe('timers and disposal', () => {
    it('arms and disarms the auto-sync timer via setSyncInterval', async () => {
      const api = await createApi()
      api.setSyncInterval(10)

      expect(vi.getTimerCount()).toBe(1)

      api.setSyncInterval(false)

      expect(vi.getTimerCount()).toBe(0)
    })

    it('clearSync cancels a pending auto-sync', async () => {
      const api = await createApi()
      api.setSyncInterval(10)
      api.clearSync()

      expect(vi.getTimerCount()).toBe(0)
    })

    it('releases the auto-sync timer on disposal', async () => {
      const { settingManager } = createSettingStore({ token: 'user-token' })
      mockWire()
      const api = await createApi({ settingManager, syncIntervalMinutes: 1 })
      api[Symbol.dispose]()
      mockRequest.mockClear()
      await vi.advanceTimersByTimeAsync(120_000)

      expect(mockRequest).not.toHaveBeenCalled()
      expect(vi.getTimerCount()).toBe(0)
    })
  })
})
