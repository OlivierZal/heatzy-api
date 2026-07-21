import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { HeatzyAPIAdapter, SyncCallback } from '../../src/api/index.ts'
import type { Attributes, PostAttributes } from '../../src/types/index.ts'
import {
  DerogationMode,
  Mode,
  POST_DATA_UNIT,
  Product,
  Switch,
  TemperatureCompensation,
} from '../../src/constants.ts'
import { Device } from '../../src/entities/index.ts'
import { AttributeNotFoundError } from '../../src/errors/index.ts'
import {
  DeviceFacade,
  DeviceGlowFacade,
  DeviceProFacade,
  DeviceV2Facade,
  FacadeManager,
  supportsGlow,
  supportsPro,
  supportsV2,
} from '../../src/facades/index.ts'
import { Temporal } from '../../src/temporal.ts'
import {
  buildBinding,
  glowAttributes,
  proAttributes,
  v1Attributes,
  v2Attributes,
} from '../fixtures.ts'
import { defined, mock, mockTemporalNowZoned } from '../helpers.ts'

interface FacadeContext<T> {
  api: HeatzyAPIAdapter
  device: Device
  facade: T
}

const createMockApi = (
  overrides: Partial<HeatzyAPIAdapter> = {},
): HeatzyAPIAdapter => ({
  fetch: vi.fn<HeatzyAPIAdapter['fetch']>().mockResolvedValue([]),
  getValues: vi
    .fn<HeatzyAPIAdapter['getValues']>()
    .mockResolvedValue(v1Attributes),
  locale: undefined,
  notifySync: vi.fn<SyncCallback>().mockResolvedValue(undefined),
  timezone: undefined,
  updateValues: vi.fn<HeatzyAPIAdapter['updateValues']>().mockResolvedValue({}),
  ...overrides,
})

const createV1Facade = (
  attributes: Attributes = v1Attributes,
  apiOverrides: Partial<HeatzyAPIAdapter> = {},
): FacadeContext<DeviceFacade> => {
  const api = createMockApi(apiOverrides)
  const device = new Device(buildBinding('v1'), attributes)
  return { api, device, facade: new DeviceFacade(api, device) }
}

const createV2Facade = (
  attributes: Attributes = v2Attributes,
  apiOverrides: Partial<HeatzyAPIAdapter> = {},
): FacadeContext<DeviceV2Facade> => {
  const api = createMockApi(apiOverrides)
  const device = new Device(buildBinding('v2'), attributes)
  return { api, device, facade: new DeviceV2Facade(api, device) }
}

const createGlowFacade = (
  attributes: Attributes = glowAttributes,
): FacadeContext<DeviceGlowFacade> => {
  const api = createMockApi()
  const device = new Device(buildBinding('glow'), attributes)
  return { api, device, facade: new DeviceGlowFacade(api, device) }
}

const createProFacade = (
  attributes: Attributes = proAttributes,
  apiOverrides: Partial<HeatzyAPIAdapter> = {},
): FacadeContext<DeviceProFacade> => {
  const api = createMockApi(apiOverrides)
  const device = new Device(buildBinding('pro'), attributes)
  return { api, device, facade: new DeviceProFacade(api, device) }
}

describe(DeviceFacade, () => {
  it('exposes the wire identity and mode-derived getters', () => {
    const { facade } = createV1Facade()

    expect(facade.id).toBe('did-v1')
    expect(facade.product).toBe(Product.v1)
    expect(facade.name).toBe('Radiator v1')
    expect(facade.mode).toBe(Mode.comfort)
    expect(facade.isOn).toBe(true)
    expect(facade.previousMode).toBe(Mode.comfort)
    expect(facade.derogationEndDate).toBeNull()
  })

  it('reports off and the default previous mode when stopped', () => {
    const { facade } = createV1Facade({ mode: Mode.stop })

    expect(facade.isOn).toBe(false)
    expect(facade.previousMode).toBe(Mode.eco)
  })

  describe('values', () => {
    it('reads fresh values, merges them into the entity, and notifies sync', async () => {
      const fresh: Attributes = { mode: Mode.eco }
      const { api, device, facade } = createV1Facade(v1Attributes, {
        getValues: vi
          .fn<HeatzyAPIAdapter['getValues']>()
          .mockResolvedValue(fresh),
      })

      await expect(facade.values()).resolves.toStrictEqual(fresh)

      expect(api.getValues).toHaveBeenCalledWith({ id: 'did-v1' })
      expect(device.data.mode).toBe(Mode.eco)
      expect(api.notifySync).toHaveBeenCalledWith({ ids: ['did-v1'] })
    })

    it('updates the entity before notifying sync', async () => {
      const { api, device, facade } = createV1Facade()
      const updateSpy = vi.spyOn(device, 'update')
      await facade.values()

      const [updateOrder] = updateSpy.mock.invocationCallOrder
      const [notifyOrder] = vi.mocked(api.notifySync).mock.invocationCallOrder

      expect(defined(updateOrder)).toBeLessThan(defined(notifyOrder))
    })
  })

  describe('setValues', () => {
    it.each([
      { mode: Mode.comfort, positional: 0 },
      { mode: Mode.eco, positional: 1 },
      { mode: Mode.frostProtection, positional: 2 },
      { mode: Mode.stop, positional: 3 },
    ])(
      'posts the raw triplet for the base mode $mode',
      async ({ mode, positional }) => {
        const { api, facade } = createV1Facade()

        await expect(facade.setValues({ mode })).resolves.toStrictEqual({
          mode,
        })

        expect(api.updateValues).toHaveBeenCalledWith({
          id: 'did-v1',
          postData: { raw: [POST_DATA_UNIT, POST_DATA_UNIT, positional] },
        })
      },
    )

    it('merges the echoed mode into the entity and notifies sync', async () => {
      const { api, device, facade } = createV1Facade()
      await facade.setValues({ mode: Mode.eco })

      expect(device.data.mode).toBe(Mode.eco)
      expect(api.notifySync).toHaveBeenCalledWith({ ids: ['did-v1'] })
    })

    it.each<{ attributes: PostAttributes; label: string }>([
      {
        attributes: { derog_mode: DerogationMode.boost, derog_time: 30 },
        label: 'a payload without a mode',
      },
      {
        attributes: { mode: Mode.comfortMinus1 },
        label: 'a mode V1 does not speak',
      },
      { attributes: {}, label: 'an empty payload' },
    ])('posts nothing and echoes {} for $label', async ({ attributes }) => {
      const { api, device, facade } = createV1Facade()

      await expect(facade.setValues(attributes)).resolves.toStrictEqual({})

      expect(api.updateValues).not.toHaveBeenCalled()
      expect(device.data).toStrictEqual(v1Attributes)
    })
  })
})

describe(DeviceV2Facade, () => {
  it('exposes the derogation and switch getters', () => {
    const { facade } = createV2Facade()

    expect(facade.derogationMode).toBe(DerogationMode.off)
    expect(facade.derogationTime).toBe(0)
    expect(facade.isLocked).toBe(false)
    expect(facade.isTimer).toBe(false)
  })

  it('reads the lock and timer switches when on', () => {
    const { facade } = createV2Facade({
      ...v2Attributes,
      lock_switch: Switch.on,
      timer_switch: Switch.on,
    })

    expect(facade.isLocked).toBe(true)
    expect(facade.isTimer).toBe(true)
  })

  it('throws AttributeNotFoundError for an attribute the payload does not carry', () => {
    const { facade } = createV2Facade(v1Attributes)

    expect(() => facade.derogationMode).toThrow(AttributeNotFoundError)
    expect(() => facade.derogationMode).toThrow('derog_mode not found')
  })

  describe('control', () => {
    it('posts named attrs, echoes them, and merges the echo', async () => {
      const { api, device, facade } = createV2Facade()
      const attributes = { mode: Mode.eco, timer_switch: Switch.on }

      await expect(facade.setValues(attributes)).resolves.toStrictEqual(
        attributes,
      )

      expect(api.updateValues).toHaveBeenCalledWith({
        id: 'did-v2',
        postData: { attrs: attributes },
      })
      expect(device.data).toStrictEqual({ ...v2Attributes, ...attributes })
    })

    it('skips the wire call for an empty payload', async () => {
      const { api, facade } = createV2Facade()

      await expect(facade.setValues({})).resolves.toStrictEqual({})

      expect(api.updateValues).not.toHaveBeenCalled()
      expect(api.notifySync).toHaveBeenCalledWith({ ids: ['did-v2'] })
    })
  })

  describe('derogationEndString', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(
        Temporal.Instant.from('2026-07-21T10:00:00Z').epochMilliseconds,
      )
      mockTemporalNowZoned()
    })

    afterEach(() => {
      vi.mocked(Temporal.Now.zonedDateTimeISO).mockRestore()
      vi.useRealTimers()
    })

    it('reads null when no derogation is running', () => {
      const { facade } = createV2Facade()

      expect(facade.derogationEndString).toBeNull()
    })

    it('reads null when the derogation mode is off despite a pending end date', () => {
      const device = mock<Device>({
        data: v2Attributes,
        derogationEndDate: Temporal.Now.zonedDateTimeISO('UTC').add({
          minutes: 30,
        }),
        id: 'did-v2',
        product: Product.v2,
      })
      const facade = new DeviceV2Facade(createMockApi(), device)

      expect(facade.derogationEndString).toBeNull()
    })

    it('renders a time-only label for a boost end in the configured locale', () => {
      const { device, facade } = createV2Facade(v2Attributes, {
        locale: 'fr-FR',
      })
      device.update({ derog_mode: DerogationMode.boost, derog_time: 60 })

      expect(facade.derogationEndString).toBe('11:00')
    })

    it('renders a time-only label for a presence end', () => {
      const { device, facade } = createProFacade(proAttributes, {
        locale: 'fr-FR',
      })
      device.update({
        cur_mode: Mode.eco,
        derog_mode: DerogationMode.presence,
      })
      device.update({ cur_mode: Mode.comfort })

      expect(facade.derogationEndString).toBe('11:30')
    })

    it('renders a day + month + time label for a vacation end in the configured locale', () => {
      const { device, facade } = createV2Facade(v2Attributes, {
        locale: 'fr-FR',
      })
      device.update({ derog_mode: DerogationMode.vacation, derog_time: 3 })

      expect(facade.derogationEndString).toBe('24 juil., 10:00')
    })

    it('falls back to the runtime locale when none is configured', () => {
      const { device, facade } = createV2Facade()
      device.update({ derog_mode: DerogationMode.vacation, derog_time: 3 })
      const expected = defined(facade.derogationEndDate).toLocaleString(
        undefined,
        {
          day: 'numeric',
          hour: '2-digit',
          hourCycle: 'h23',
          minute: '2-digit',
          month: 'short',
        },
      )

      expect(facade.derogationEndString).toBe(expected)
    })
  })
})

describe(DeviceGlowFacade, () => {
  it('exposes the glow surface', () => {
    const { facade } = createGlowFacade()

    expect(facade.isOn).toBe(true)
    expect(facade.isLocked).toBe(false)
    expect(facade.currentTemperature).toBe(19.5)
    expect(facade.comfortTemperature).toBe(21)
    expect(facade.ecoTemperature).toBe(17)
    expect(facade.temperatureCompensation).toBe(
      TemperatureCompensation.noChange,
    )
  })

  it('reads isOn from the dedicated on_off switch, not the mode', () => {
    const { facade } = createGlowFacade({
      ...glowAttributes,
      on_off: Switch.off,
    })

    expect(facade.isOn).toBe(false)
    expect(facade.mode).toBe(Mode.comfort)
  })

  it('reads isLocked from LOCK_C', () => {
    const { facade } = createGlowFacade({
      ...glowAttributes,
      LOCK_C: Switch.on,
    })

    expect(facade.isLocked).toBe(true)
  })

  it.each([
    { expected: 30, high: 3, low: 50 },
    { expected: 15, high: 1, low: 0 },
  ])(
    'clamps the comfort setpoint to $expected °C',
    ({ expected, high, low }) => {
      const { facade } = createGlowFacade({
        ...glowAttributes,
        cft_tempH: high,
        cft_tempL: low,
      })

      expect(facade.comfortTemperature).toBe(expected)
    },
  )

  it.each([
    { expected: 19, high: 2, low: 50 },
    { expected: 10, high: 0, low: 50 },
  ])('clamps the eco setpoint to $expected °C', ({ expected, high, low }) => {
    const { facade } = createGlowFacade({
      ...glowAttributes,
      eco_tempH: high,
      eco_tempL: low,
    })

    expect(facade.ecoTemperature).toBe(expected)
  })
})

describe(DeviceProFacade, () => {
  it('exposes the pro surface', () => {
    const { facade } = createProFacade()

    expect(facade.currentTemperature).toBe(19.5)
    expect(facade.comfortTemperature).toBe(21)
    expect(facade.ecoTemperature).toBe(17)
    expect(facade.currentHumidity).toBe(45)
    expect(facade.currentMode).toBe(Mode.comfort)
    expect(facade.isDetectingOpenWindow).toBe(false)
    expect(facade.isLocked).toBe(false)
    expect(facade.isOn).toBe(true)
  })

  it('reads isOn from the commanded mode', () => {
    const { facade } = createProFacade({ ...proAttributes, mode: Mode.stop })

    expect(facade.isOn).toBe(false)
  })

  it('reads the open-window and lock switches when on', () => {
    const { facade } = createProFacade({
      ...proAttributes,
      lock_switch: Switch.on,
      window_switch: Switch.on,
    })

    expect(facade.isDetectingOpenWindow).toBe(true)
    expect(facade.isLocked).toBe(true)
  })

  it.each([
    {
      currentMode: Mode.comfort,
      derogationMode: DerogationMode.presence,
      isPresence: true,
    },
    {
      currentMode: Mode.eco,
      derogationMode: DerogationMode.presence,
      isPresence: false,
    },
    {
      currentMode: Mode.comfort,
      derogationMode: DerogationMode.off,
      isPresence: false,
    },
  ])(
    'isPresence is $isPresence when derog_mode is $derogationMode and cur_mode is $currentMode',
    ({ currentMode, derogationMode, isPresence }) => {
      const { facade } = createProFacade({
        ...proAttributes,
        cur_mode: currentMode,
        derog_mode: derogationMode,
      })

      expect(facade.isPresence).toBe(isPresence)
    },
  )
})

describe(FacadeManager, () => {
  it.each([
    {
      attributes: v1Attributes,
      expected: DeviceFacade,
      product: 'v1' as const,
    },
    {
      attributes: v2Attributes,
      expected: DeviceV2Facade,
      product: 'v2' as const,
    },
    {
      attributes: v2Attributes,
      expected: DeviceV2Facade,
      product: 'v4' as const,
    },
    {
      attributes: glowAttributes,
      expected: DeviceGlowFacade,
      product: 'glow' as const,
    },
    {
      attributes: proAttributes,
      expected: DeviceProFacade,
      product: 'pro' as const,
    },
  ])(
    'builds a $expected.name for a $product device',
    ({ attributes, expected, product }) => {
      const manager = new FacadeManager(createMockApi())
      const facade = manager.get(new Device(buildBinding(product), attributes))

      expect(facade.constructor).toBe(expected)
    },
  )

  it('caches one facade per entity', () => {
    const manager = new FacadeManager(createMockApi())
    const device = new Device(buildBinding('pro'), proAttributes)

    expect(manager.get(device)).toBe(manager.get(device))
  })

  it('returns null without an entity', () => {
    const manager = new FacadeManager(createMockApi())

    expect(manager.get()).toBeNull()
  })
})

describe('capability guards', () => {
  it.each([
    {
      attributes: v1Attributes,
      product: 'v1' as const,
      supports: { glow: false, pro: false, v2: false },
    },
    {
      attributes: v2Attributes,
      product: 'v2' as const,
      supports: { glow: false, pro: false, v2: true },
    },
    {
      attributes: v2Attributes,
      product: 'v4' as const,
      supports: { glow: false, pro: false, v2: true },
    },
    {
      attributes: glowAttributes,
      product: 'glow' as const,
      supports: { glow: true, pro: false, v2: true },
    },
    {
      attributes: proAttributes,
      product: 'pro' as const,
      supports: { glow: true, pro: true, v2: true },
    },
  ])(
    'narrows the $product generation surface',
    ({ attributes, product, supports }) => {
      const manager = new FacadeManager(createMockApi())
      const facade = manager.get(new Device(buildBinding(product), attributes))

      expect(supportsV2(facade)).toBe(supports.v2)
      expect(supportsGlow(facade)).toBe(supports.glow)
      expect(supportsPro(facade)).toBe(supports.pro)
    },
  )
})
