import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { SyncCallback } from '../../src/api/types.ts'
import type { DevicePostDataAny } from '../../src/types/index.ts'
import { HeatzyAPI } from '../../src/api/heatzy.ts'
import { Mode } from '../../src/constants.ts'
import { ValidationError } from '../../src/errors/index.ts'
import { REDACTED } from '../../src/observability/context.ts'
import { buildBinding, buildLoginData, proAttributes } from '../fixtures.ts'
import {
  createApi,
  createAuthedApi,
  mockRequest,
  wireSetup,
  wireTeardown,
} from '../heatzy-api-harness.ts'
import { createLogger, defined, mockResponse } from '../helpers.ts'

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
    // ENTRIES one by one. A drop is never silent — the cycle reports
    // ONE aggregated line naming every dropped entry (a listing-wide
    // regression must not storm the host logger), and the two verdicts
    // inside it are worded apart — a wire regression means the schema
    // is wrong, an unresolved `product_key` means Heatzy shipped a
    // radiator after this release and the product map needs extending.
    it('drops the entries it cannot model and names each one in a single line', async () => {
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

      expect(logger.error).toHaveBeenCalledTimes(1)
      expect(logger.error).toHaveBeenCalledWith(
        'Dropped 2 of 3 /bindings entries: device unknown (an entry this SDK cannot read), device did-pro (unknown product_key unshipped-generation)',
      )
    })

    // The report still NAMES what it can: an unreadable entry that at
    // least spells a string `did` is reported under it, and only the
    // shapes that spell none — a non-object, `null`, no `did` key, a
    // non-string one — fall back to `unknown`.
    it('salvages the did of an unreadable entry when the wire spelled one', async () => {
      const logger = createLogger()
      const { api } = await createAuthedApi({ logger })
      mockRequest.mockResolvedValue(
        mockResponse({
          devices: [null, 'bogus', { did: 404 }, { did: 'did-named' }],
        }),
      )

      await expect(api.list()).resolves.toStrictEqual([])

      expect(logger.error).toHaveBeenCalledWith(
        'Dropped 4 of 4 /bindings entries: device unknown (an entry this SDK cannot read), device unknown (an entry this SDK cannot read), device unknown (an entry this SDK cannot read), device did-named (an entry this SDK cannot read)',
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

  describe('sync notification wiring', () => {
    it('forwards the notifySync payload to events.onSyncComplete', async () => {
      const onSyncComplete = vi.fn<SyncCallback>().mockResolvedValue(undefined)
      const api = await createApi({ events: { onSyncComplete } })
      await api.notifySync({ ids: ['did-pro'] })

      expect(onSyncComplete).toHaveBeenCalledWith({ ids: ['did-pro'] })
    })
  })

  describe('dispatch log redaction', () => {
    // The request/response log lines come from the CORE's inherited
    // dispatch since the SessionAPI adoption; they serialize through
    // the engine this SDK hands the core at construction (the
    // `redaction` option). Pinned through the REAL client because this
    // is the exact seam the adoption briefly lost: the base vocabulary
    // matches keys exactly, so without the bound engine the Gizwits
    // user-token header rides into every diagnostic log line in clear.
    it('masks the user-token header in the core dispatch log lines through the bound engine', async () => {
      const logger = createLogger()
      const { api, settingManager } = await createAuthedApi({ logger })
      settingManager.set('token', 'top-secret-token')
      mockRequest.mockResolvedValue(mockResponse({ attr: proAttributes }))

      await api.getValues({ id: 'did-pro' })

      const lines = vi
        .mocked(logger.log)
        .mock.calls.map(([line]): unknown => line)
        .filter((line): line is string => typeof line === 'string')
      const requestLine = defined(
        lines.find((line) => line.includes('"API request"')),
      )

      expect(requestLine).toContain(`"X-Gizwits-User-token": "${REDACTED}"`)
      expect(
        lines.filter((line) => line.includes('top-secret-token')),
      ).toStrictEqual([])
    })
  })
})
