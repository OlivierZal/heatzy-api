import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  RequestCompleteEvent,
  RequestErrorEvent,
  RequestRetryEvent,
  RequestStartEvent,
  SyncCallback,
} from '../../src/api/types.ts'
import type { DevicePostDataAny } from '../../src/types/index.ts'
import { HeatzyAPI } from '../../src/api/heatzy.ts'
import { Mode } from '../../src/constants.ts'
import { ValidationError } from '../../src/errors/index.ts'
import { buildBinding, buildLoginData, proAttributes } from '../fixtures.ts'
import {
  createApi,
  createAuthedApi,
  mockRequest,
  wireSetup,
  wireTeardown,
} from '../heatzy-api-harness.ts'
import { createLogger, createServerError, mockResponse } from '../helpers.ts'

describe(HeatzyAPI, () => {
  beforeEach(wireSetup)

  afterEach(wireTeardown)

  describe('construction and configuration', () => {
    it('builds a fetch-backed transport when none is injected', async () => {
      const api = await HeatzyAPI.create()

      expect(api.isAuthenticated()).toBe(false)
      expect(api.registry.getDevices()).toHaveLength(0)
      expect(mockRequest).not.toHaveBeenCalled()
    })

    it.each([
      { label: 'the default timeout', transport: {} },
      { label: 'a custom timeout', transport: { timeoutMs: 1000 } },
    ])('builds a fetch-backed transport with $label', async ({ transport }) => {
      const api = await HeatzyAPI.create({
        syncIntervalMinutes: false,
        transport,
      })

      expect(api.isAuthenticated()).toBe(false)
    })

    it('exposes the configured locale and timezone', async () => {
      const api = await createApi({ locale: 'fr-FR', timezone: 'Europe/Paris' })

      expect(api.locale).toBe('fr-FR')
      expect(api.timezone).toBe('Europe/Paris')
    })

    it('exposes undefined locale and timezone when unset', async () => {
      const api = await createApi()

      expect(api.locale).toBeUndefined()
      expect(api.timezone).toBeUndefined()
      expect(api.registry.getDevices()).toHaveLength(0)
    })
  })

  describe('endpoints and validation', () => {
    it('lists bindings without touching the registry', async () => {
      const { api } = await createAuthedApi()
      const binding = buildBinding('v2')
      mockRequest.mockResolvedValue(mockResponse({ devices: [binding] }))
      const devices = await api.list()

      expect(devices).toStrictEqual([binding])
      expect(api.registry.getDevices()).toHaveLength(0)
    })

    // The listing boundary: the ENVELOPE is validated as a list, its
    // ENTRIES one by one. A drop is never silent, and the two reasons
    // are worded apart — a wire regression means the schema is wrong, an
    // unresolved `product_key` means Heatzy shipped a radiator after
    // this release and the product map needs extending.
    it('drops the entries it cannot model and names each one', async () => {
      const logger = createLogger()
      const { api } = await createAuthedApi({ logger })
      const binding = buildBinding('v2')
      mockRequest.mockResolvedValue(
        mockResponse({
          devices: [
            binding,
            { dev_alias: 'Malformed', product_name: 'v2' },
            { ...buildBinding('pro'), product_key: 'unshipped-generation' },
          ],
        }),
      )

      await expect(api.list()).resolves.toStrictEqual([binding])

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'Skipping a /bindings entry this SDK cannot read',
        ),
      )
      expect(logger.error).toHaveBeenCalledWith(
        'Skipping device did-pro: unknown product_key unshipped-generation',
      )
    })

    it('rejects a malformed /bindings payload with a ValidationError', async () => {
      const { api } = await createAuthedApi()
      mockRequest.mockResolvedValue(mockResponse({ bindings: 'nope' }))
      const listPromise = api.list()

      await expect(listPromise).rejects.toBeInstanceOf(ValidationError)
      await expect(listPromise).rejects.toMatchObject({
        context: 'GET /bindings',
      })
    })

    it('rejects a malformed /devdata payload with a ValidationError', async () => {
      const { api } = await createAuthedApi()
      mockRequest.mockResolvedValue(mockResponse({ attr: { mode: 'nope' } }))
      const valuesPromise = api.getValues({ id: 'did-pro' })

      await expect(valuesPromise).rejects.toBeInstanceOf(ValidationError)
      await expect(valuesPromise).rejects.toMatchObject({
        context: 'GET /devdata/did-pro/latest',
      })
    })

    it.each<{ dialect: string; postData: DevicePostDataAny }>([
      { dialect: 'named-attributes', postData: { attrs: { mode: Mode.eco } } },
      { dialect: 'V1 raw-triplet', postData: { raw: [1, 1, 3] } },
    ])(
      'posts the $dialect dialect to /control verbatim',
      async ({ postData }) => {
        const { api } = await createAuthedApi()
        mockRequest.mockResolvedValue(mockResponse({}))

        await expect(
          api.updateValues({ id: 'did-pro', postData }),
        ).resolves.toBeUndefined()
        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            data: postData,
            method: 'post',
            url: '/control/did-pro',
          }),
        )
      },
    )

    it('returns the parsed login payload', async () => {
      const api = await createApi()
      const loginData = buildLoginData(1_700_000_000)
      mockRequest.mockResolvedValue(mockResponse(loginData))

      await expect(
        api.login({
          postData: { password: 'secret', username: 'user@test.com' },
        }),
      ).resolves.toStrictEqual(loginData)
    })

    it('rejects a malformed login payload with a ValidationError', async () => {
      const api = await createApi()
      mockRequest.mockResolvedValue(mockResponse({ token: 'user-token' }))
      const loginPromise = api.login({
        postData: { password: 'secret', username: 'user@test.com' },
      })

      await expect(loginPromise).rejects.toBeInstanceOf(ValidationError)
      await expect(loginPromise).rejects.toMatchObject({ context: 'login' })
    })
  })

  describe('request lifecycle events', () => {
    it('emits onRequestStart and onRequestComplete with a shared correlationId', async () => {
      const onRequestComplete = vi.fn<(event: RequestCompleteEvent) => void>()
      const onRequestStart = vi.fn<(event: RequestStartEvent) => void>()
      const { api } = await createAuthedApi({
        events: { onRequestComplete, onRequestStart },
      })
      mockRequest.mockResolvedValue(mockResponse({ attr: proAttributes }))
      await api.getValues({ id: 'did-pro' })

      expect(onRequestStart).toHaveBeenCalledTimes(1)
      expect(onRequestComplete).toHaveBeenCalledTimes(1)

      const startEvent = onRequestStart.mock.calls[0]?.[0]
      const completeEvent = onRequestComplete.mock.calls[0]?.[0]

      expect(startEvent?.correlationId).toBeTypeOf('string')
      expect(startEvent?.method).toBe('GET')
      expect(startEvent?.url).toBe('/devdata/did-pro/latest')
      expect(completeEvent?.correlationId).toBe(startEvent?.correlationId)
      expect(completeEvent?.status).toBe(200)
      expect(completeEvent?.durationMs).toBeTypeOf('number')
    })

    it('emits onRequestError when a request fails permanently', async () => {
      const onRequestError = vi.fn<(event: RequestErrorEvent) => void>()
      const { api } = await createAuthedApi({ events: { onRequestError } })
      const failure = createServerError(500, '/devdata/did-pro/latest')
      mockRequest.mockRejectedValue(failure)

      await expect(api.getValues({ id: 'did-pro' })).rejects.toThrow(
        'Status 500',
      )

      expect(onRequestError).toHaveBeenCalledTimes(1)

      const errorEvent = onRequestError.mock.calls[0]?.[0]

      expect(errorEvent?.error).toBe(failure)
      expect(errorEvent?.durationMs).toBeTypeOf('number')
    })

    it('emits onRequestRetry for a transient 502 GET with the same correlationId', async () => {
      const logger = createLogger()
      const onRequestRetry = vi.fn<(event: RequestRetryEvent) => void>()
      const onRequestStart = vi.fn<(event: RequestStartEvent) => void>()
      const { api } = await createAuthedApi({
        events: { onRequestRetry, onRequestStart },
        logger,
      })
      mockRequest
        .mockRejectedValueOnce(createServerError(502, '/bindings'))
        .mockResolvedValueOnce(mockResponse({ devices: [] }))
      const listPromise = api.list()
      await vi.advanceTimersByTimeAsync(2000)

      await expect(listPromise).resolves.toStrictEqual([])

      expect(onRequestRetry).toHaveBeenCalledTimes(1)

      const retryEvent = onRequestRetry.mock.calls[0]?.[0]

      expect(retryEvent?.attempt).toBe(1)
      expect(retryEvent?.delayMs).toBeTypeOf('number')
      expect(retryEvent?.correlationId).toBe(
        onRequestStart.mock.calls[0]?.[0]?.correlationId,
      )
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining('Transient server error on /bindings'),
      )
    })

    it('does not retry transient failures on POST', async () => {
      const onRequestRetry = vi.fn<(event: RequestRetryEvent) => void>()
      const { api } = await createAuthedApi({ events: { onRequestRetry } })
      mockRequest.mockRejectedValue(createServerError(502, '/control/did-pro'))

      await expect(
        api.updateValues({
          id: 'did-pro',
          postData: { attrs: { mode: Mode.eco } },
        }),
      ).rejects.toThrow('Status 502')

      expect(onRequestRetry).not.toHaveBeenCalled()
      expect(mockRequest).toHaveBeenCalledTimes(1)
    })

    it('forwards the notifySync payload to events.onSyncComplete', async () => {
      const onSyncComplete = vi.fn<SyncCallback>().mockResolvedValue(undefined)
      const api = await createApi({ events: { onSyncComplete } })
      await api.notifySync({ ids: ['did-pro'] })

      expect(onSyncComplete).toHaveBeenCalledWith({ ids: ['did-pro'] })
    })

    it('swallows a misbehaving onSyncComplete callback', async () => {
      const logger = createLogger()
      const onSyncComplete = vi.fn<SyncCallback>().mockImplementation(() => {
        throw new Error('observer rogue')
      })
      const api = await createApi({ events: { onSyncComplete }, logger })

      await expect(api.notifySync()).resolves.toBeUndefined()

      expect(logger.error).toHaveBeenCalledWith(
        'LifecycleEvents.onSyncComplete callback threw — ignoring',
        expect.any(Error),
      )
    })

    it('swallows an onSyncComplete rejection', async () => {
      const logger = createLogger()
      const onSyncComplete = vi
        .fn<SyncCallback>()
        .mockRejectedValue(new Error('observer rejected'))
      const api = await createApi({ events: { onSyncComplete }, logger })

      await expect(api.notifySync()).resolves.toBeUndefined()

      expect(logger.error).toHaveBeenCalledWith(
        'LifecycleEvents.onSyncComplete callback threw — ignoring',
        expect.any(Error),
      )
    })
  })
})
