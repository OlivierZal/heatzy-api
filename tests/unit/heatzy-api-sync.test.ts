import { createLogger, createServerError } from '@olivierzal/api-core/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { RequestErrorEvent, SyncCallback } from '../../src/api/types.ts'
import { HeatzyAPI } from '../../src/api/heatzy.ts'
import { ValidationError } from '../../src/errors/index.ts'
import { buildBinding, buildLoginData, proAttributes } from '../fixtures.ts'
import {
  createAuthedApi,
  heatzyRegistryResponse,
  mockRequest,
  mockWire,
  stageHeatzyWire,
  wireSetup,
  wireTeardown,
} from '../heatzy-api-harness.ts'
import { mockResponse } from '../helpers.ts'

// Thin SYNC WIRING suite since the SessionAPI adoption: the sync-cycle
// template — timer arming and disposal, the best-effort downgrade, the
// loss episodes the settling epilogue surfaces — is the core's, pinned
// by its own suite and, through the real client, by the
// session-lifecycle kernel. What this file pins is the PER-DEVICE
// cycle this dialect owns: the `/bindings` + `/devdata` fan-out, its
// leg-by-leg degradation, the `@syncDevices()` notification, and the
// abortSignal wiring from `HeatzyAPIConfig` into every request.

// Long enough for the transient-retry rung to exhaust its four
// attempts (1 s initial delay, 16 s cap) and hand the failure back.
const TRANSIENT_RETRY_WINDOW_MS = 30_000

const UNREADABLE_DEVICE_PATH = '/devdata/did-v2/latest'

// Stages the registry cycle with a mode and a binding list read per
// cycle, so a clause can change either between two fetches.
const stageRegistry = (wire: {
  bindings: () => readonly unknown[]
  mode: () => unknown
}): void => {
  stageHeatzyWire(mockRequest, {
    login: () => mockResponse(buildLoginData()),
    rest: (config) =>
      config.url === '/devdata/did-pro/latest'
        ? mockResponse({ attr: { ...proAttributes, mode: wire.mode() } })
        : heatzyRegistryResponse(config, {
            attributes: proAttributes,
            bindings: wire.bindings(),
          }),
  })
}

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

    it('notifies onSyncComplete after each fetch', async () => {
      const onSyncComplete = vi.fn<SyncCallback>().mockResolvedValue(undefined)
      const { api } = await createAuthedApi({ events: { onSyncComplete } })
      mockWire()
      await api.fetch()

      expect(onSyncComplete).toHaveBeenCalledTimes(1)
      // The bare `@syncDevices()` forwards `undefined`: the core's
      // factory forwards what it was built with, where this repo's
      // former bare decorator called `notifySync()` with no argument.
      expect(onSyncComplete).toHaveBeenCalledWith(undefined)
    })
  })

  // A device that stays unreadable fails the same way on every cycle.
  // At the five-second cadence one line per failed read was 17,280 full
  // error entries a day: the failure is reported when its streak starts,
  // when its reason changes and every sixty identical cycles — so a
  // diagnostic report's tail still carries it — and closed by one
  // recovery line.
  describe('failure streaks', () => {
    const SKIP_LINE =
      'Skipping device did-pro: its live attributes could not be read'
    const DROPPED_LINE =
      'Dropped 1 of 2 /bindings entries: device did-new (unknown product_key unshipped)'
    const unshippedBinding = buildBinding('pro', {
      did: 'did-new',
      product_key: 'unshipped',
    })

    const fetchCycles = async (
      api: HeatzyAPI,
      cycles: number,
    ): Promise<void> => {
      if (cycles === 0) {
        return
      }
      await api.fetch()
      await fetchCycles(api, cycles - 1)
    }

    it('reports an unreadable device once per streak, not once per cycle', async () => {
      const logger = createLogger()
      const { api } = await createAuthedApi({ logger })
      stageRegistry({
        bindings: () => [buildBinding('pro')],
        mode: () => 'cft3',
      })

      await fetchCycles(api, 3)

      expect(logger.error).toHaveBeenCalledExactlyOnceWith(
        SKIP_LINE,
        expect.any(ValidationError),
      )
    })

    it('reminds of the streak every sixty identical failures', async () => {
      const logger = createLogger()
      const { api } = await createAuthedApi({ logger })
      stageRegistry({
        bindings: () => [buildBinding('pro')],
        mode: () => 'cft3',
      })

      await fetchCycles(api, 60)

      expect(logger.error).toHaveBeenCalledTimes(2)
      expect(logger.error).toHaveBeenLastCalledWith(
        'Skipping device did-pro: still unreadable after 60 consecutive reads (ValidationError: Invalid API response shape (GET /devdata/did-pro/latest): attr.mode (received "cft3"))',
      )
    })

    it('reports the failure in full again when its reason changes', async () => {
      const logger = createLogger()
      const { api } = await createAuthedApi({ logger })
      let mode = 'cft3'
      stageRegistry({ bindings: () => [buildBinding('pro')], mode: () => mode })

      await api.fetch()
      mode = 'cft4'
      await api.fetch()

      expect(logger.error).toHaveBeenCalledTimes(2)
      expect(logger.error).toHaveBeenLastCalledWith(
        SKIP_LINE,
        expect.any(ValidationError),
      )
    })

    it('closes the streak with one recovery line', async () => {
      const logger = createLogger()
      const { api } = await createAuthedApi({ logger })
      let mode = 'cft3'
      stageRegistry({ bindings: () => [buildBinding('pro')], mode: () => mode })

      await fetchCycles(api, 2)
      mode = 'cft'
      await fetchCycles(api, 2)

      expect(api.registry.devices.getById('did-pro')).toBeDefined()
      expect(
        vi
          .mocked(logger.log)
          .mock.calls.filter(([message]) =>
            String(message).startsWith('Device did-pro:'),
          ),
      ).toStrictEqual([
        [
          'Device did-pro: its live attributes are readable again after 2 failed reads',
        ],
      ])
    })

    // A host transport can reject with a value that is not an Error;
    // the leg receives it unwrapped (probed), and a streak still needs
    // an identity for it.
    it('keys a streak on a non-Error rejection by its string or its type', async () => {
      const logger = createLogger()
      const { api } = await createAuthedApi({ logger })
      const readDevice = vi
        .fn<() => Promise<ReturnType<typeof mockResponse>>>()
        .mockRejectedValueOnce('offline')
        .mockRejectedValueOnce('offline')
        .mockRejectedValueOnce(7)
        .mockRejectedValueOnce(8)
      mockRequest.mockImplementation(async (config) =>
        config.url === '/devdata/did-pro/latest'
          ? readDevice()
          : heatzyRegistryResponse(config, {
              attributes: proAttributes,
              bindings: [buildBinding('pro')],
            }),
      )

      await fetchCycles(api, 4)

      expect(vi.mocked(logger.error).mock.calls).toStrictEqual([
        [SKIP_LINE, 'offline'],
        [SKIP_LINE, 7],
      ])
    })

    it('starts a new streak for a device that left the account and came back', async () => {
      const logger = createLogger()
      const { api } = await createAuthedApi({ logger })
      let bindings: readonly unknown[] = [buildBinding('pro')]
      stageRegistry({ bindings: () => bindings, mode: () => 'cft3' })

      await api.fetch()
      bindings = []
      await api.fetch()
      bindings = [buildBinding('pro')]
      await api.fetch()

      expect(logger.error).toHaveBeenCalledTimes(2)
    })

    it('starts a new streak after a sign-out', async () => {
      const logger = createLogger()
      const { api, settingManager } = await createAuthedApi({ logger })
      stageRegistry({
        bindings: () => [buildBinding('pro')],
        mode: () => 'cft3',
      })

      await api.fetch()
      api.logOut()
      settingManager.set('token', 'user-token')
      await api.fetch()

      expect(logger.error).toHaveBeenCalledTimes(2)
    })

    it('reports a listing drop once per streak and closes it on recovery', async () => {
      const logger = createLogger()
      const { api } = await createAuthedApi({ logger })
      let bindings: readonly unknown[] = [buildBinding('pro'), unshippedBinding]
      stageRegistry({ bindings: () => bindings, mode: () => 'cft' })

      await fetchCycles(api, 2)
      bindings = [buildBinding('pro')]
      await api.fetch()

      expect(logger.error).toHaveBeenCalledExactlyOnceWith(DROPPED_LINE)
      expect(logger.log).toHaveBeenCalledWith(
        'Every /bindings entry is readable again after 2 listings with drops',
      )
    })

    it('reminds of a listing drop every sixty identical listings', async () => {
      const logger = createLogger()
      const { api } = await createAuthedApi({ logger })
      stageRegistry({
        bindings: () => [buildBinding('pro'), unshippedBinding],
        mode: () => 'cft',
      })

      await fetchCycles(api, 60)

      expect(logger.error).toHaveBeenCalledTimes(2)
      expect(logger.error).toHaveBeenLastCalledWith(
        `${DROPPED_LINE} (unchanged over 60 listings)`,
      )
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
})
