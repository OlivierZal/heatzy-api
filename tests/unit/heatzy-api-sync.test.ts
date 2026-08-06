import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { SyncCallback } from '../../src/api/types.ts'
import { HeatzyAPI } from '../../src/api/heatzy.ts'
import { buildBinding, proAttributes } from '../fixtures.ts'
import {
  createApi,
  createAuthedApi,
  mockRejectedWire,
  mockRequest,
  mockWire,
  wireSetup,
  wireTeardown,
} from '../heatzy-api-harness.ts'
import { createLogger, createSettingStore, mockResponse } from '../helpers.ts'

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
