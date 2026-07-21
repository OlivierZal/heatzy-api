import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DerogationMode, Mode, Product, Switch } from '../../src/constants.ts'
import { Device, syncDevice } from '../../src/entities/index.ts'
import { Temporal } from '../../src/temporal.ts'
import {
  buildBinding,
  PRODUCT_KEYS,
  proAttributes,
  v2Attributes,
} from '../fixtures.ts'
import { defined, mockTemporalNowZoned } from '../helpers.ts'

const NOW_ISO = '2026-07-21T10:00:00Z'
const MINUTE_MS = 60_000
const DAY_MS = 24 * 60 * MINUTE_MS

describe(Device, () => {
  describe('construction', () => {
    it('mirrors the wire identity and resolves the product', () => {
      const device = new Device(buildBinding('pro'), proAttributes)

      expect(device.id).toBe('did-pro')
      expect(device.name).toBe('Radiator pro')
      expect(device.productKey).toBe(PRODUCT_KEYS.pro)
      expect(device.productName).toBe('pro')
      expect(device.product).toBe(Product.pro)
    })

    it('throws on an unknown product key', () => {
      expect(
        () =>
          new Device(
            buildBinding('pro', { product_key: 'unknown' }),
            proAttributes,
          ),
      ).toThrow('Invalid product: unknown')
    })

    it('exposes the attribute payload through data', () => {
      const device = new Device(buildBinding('v2'), v2Attributes)

      expect(device.data).toStrictEqual(v2Attributes)
    })
  })

  describe('previousMode', () => {
    it('defaults to eco when the device has only ever been stopped', () => {
      const device = new Device(buildBinding('v2'), {
        ...v2Attributes,
        mode: Mode.stop,
      })

      expect(device.previousMode).toBe(Mode.eco)
    })

    it('captures the constructor mode when not stopped', () => {
      const device = new Device(buildBinding('v2'), v2Attributes)

      expect(device.previousMode).toBe(Mode.comfort)
    })

    it('records the last non-stop mode seen before each merge', () => {
      const device = new Device(buildBinding('v2'), v2Attributes)
      device.update({ mode: Mode.eco })

      expect(device.previousMode).toBe(Mode.comfort)

      device.update({ mode: Mode.stop })

      expect(device.previousMode).toBe(Mode.eco)

      device.update({ mode: Mode.frostProtection })

      expect(device.previousMode).toBe(Mode.eco)
    })
  })

  describe('update', () => {
    it('merges a partial payload over the previous attributes', () => {
      const device = new Device(buildBinding('v2'), v2Attributes)
      device.update({ derog_time: 3, lock_switch: Switch.on })

      expect(device.data).toStrictEqual({
        ...v2Attributes,
        derog_time: 3,
        lock_switch: Switch.on,
      })
    })

    it('drops explicit-undefined keys instead of erasing known state', () => {
      const device = new Device(buildBinding('v2'), v2Attributes)
      device.update({ derog_time: undefined, timer_switch: Switch.on })

      expect(device.data).toStrictEqual({
        ...v2Attributes,
        timer_switch: Switch.on,
      })
    })
  })

  describe('derogationEndDate', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(Temporal.Instant.from(NOW_ISO).epochMilliseconds)
      mockTemporalNowZoned()
    })

    afterEach(() => {
      vi.mocked(Temporal.Now.zonedDateTimeISO).mockRestore()
      vi.useRealTimers()
    })

    const createPresenceDevice = (): Device =>
      new Device(buildBinding('pro'), {
        ...proAttributes,
        cur_mode: Mode.eco,
        derog_mode: DerogationMode.presence,
      })

    it('sets a boost end derog_time minutes away', () => {
      const device = new Device(buildBinding('v2'), v2Attributes)
      device.update({ derog_mode: DerogationMode.boost, derog_time: 45 })

      expect(defined(device.derogationEndDate).epochMilliseconds).toBe(
        Date.now() + 45 * MINUTE_MS,
      )
    })

    it('sets a vacation end derog_time days away', () => {
      const device = new Device(buildBinding('v2'), v2Attributes)
      device.update({ derog_mode: DerogationMode.vacation, derog_time: 2 })

      expect(defined(device.derogationEndDate).epochMilliseconds).toBe(
        Date.now() + 2 * DAY_MS,
      )
    })

    it('clears the end when the derogation turns off', () => {
      const device = new Device(buildBinding('v2'), v2Attributes)
      device.update({ derog_mode: DerogationMode.boost, derog_time: 45 })
      device.update({ derog_mode: DerogationMode.off })

      expect(device.derogationEndDate).toBeNull()
    })

    it.each([
      { expectedMinutes: 90, reported: Mode.comfort },
      { expectedMinutes: 60, reported: Mode.comfortMinus1 },
      { expectedMinutes: 30, reported: Mode.comfortMinus2 },
    ])(
      'starts a $expectedMinutes-minute presence countdown when cur_mode becomes $reported',
      ({ expectedMinutes, reported }) => {
        const device = createPresenceDevice()
        device.update({ cur_mode: reported })

        expect(defined(device.derogationEndDate).epochMilliseconds).toBe(
          Date.now() + expectedMinutes * MINUTE_MS,
        )
      },
    )

    it.each([
      { reported: Mode.eco },
      { reported: Mode.frostProtection },
      { reported: Mode.stop },
    ])(
      'clears the presence countdown when cur_mode becomes $reported',
      ({ reported }) => {
        const device = createPresenceDevice()
        device.update({ cur_mode: Mode.comfort })
        device.update({ cur_mode: reported })

        expect(device.derogationEndDate).toBeNull()
      },
    )

    it('keeps the presence countdown when the reported mode does not change', () => {
      const device = createPresenceDevice()
      device.update({ cur_mode: Mode.comfort })
      const end = defined(device.derogationEndDate).epochMilliseconds
      vi.advanceTimersByTime(10 * MINUTE_MS)
      device.update({ cur_mode: Mode.comfort })

      expect(defined(device.derogationEndDate).epochMilliseconds).toBe(end)
    })

    it('does not recompute the end when the derogation payload is unchanged', () => {
      const device = new Device(buildBinding('v2'), v2Attributes)
      device.update({ derog_mode: DerogationMode.boost, derog_time: 45 })
      const end = defined(device.derogationEndDate).epochMilliseconds
      vi.advanceTimersByTime(10 * MINUTE_MS)
      device.update({ derog_mode: DerogationMode.boost, derog_time: 45 })

      expect(defined(device.derogationEndDate).epochMilliseconds).toBe(end)
    })

    it('reads null once the deadline has passed', () => {
      const device = new Device(buildBinding('v2'), v2Attributes)
      device.update({ derog_mode: DerogationMode.boost, derog_time: 45 })
      vi.advanceTimersByTime(46 * MINUTE_MS)

      expect(device.derogationEndDate).toBeNull()
    })

    it('does not derive an end date at construction', () => {
      const device = new Device(buildBinding('v2'), {
        ...v2Attributes,
        derog_mode: DerogationMode.boost,
        derog_time: 45,
      })

      expect(device.derogationEndDate).toBeNull()
    })

    it('anchors the end date in the provided timezone', () => {
      const device = new Device(buildBinding('v2'), v2Attributes, 'Asia/Tokyo')
      device.update({ derog_mode: DerogationMode.boost, derog_time: 45 })
      const end = defined(device.derogationEndDate)

      expect(end.timeZoneId).toBe('Asia/Tokyo')
      expect(end.epochMilliseconds).toBe(Date.now() + 45 * MINUTE_MS)
    })

    // The helper substitutes UTC for an undefined timezone, so this
    // pins that the entity passes `undefined` through to the runtime.
    it('falls back to the runtime timezone when none is provided', () => {
      const device = new Device(buildBinding('v2'), v2Attributes)
      device.update({ derog_mode: DerogationMode.boost, derog_time: 45 })

      expect(defined(device.derogationEndDate).timeZoneId).toBe('UTC')
    })
  })
})

describe(syncDevice, () => {
  it('applies the rename and merges the fresh attributes', () => {
    const device = new Device(buildBinding('v2'), v2Attributes)
    syncDevice(device, buildBinding('v2', { dev_alias: 'Renamed' }), {
      ...v2Attributes,
      mode: Mode.eco,
    })

    expect(device.name).toBe('Renamed')
    expect(device.data.mode).toBe(Mode.eco)
  })

  it('tracks previousMode through the sync merge', () => {
    const device = new Device(buildBinding('v2'), v2Attributes)
    syncDevice(device, buildBinding('v2'), { ...v2Attributes, mode: Mode.stop })

    expect(device.previousMode).toBe(Mode.comfort)
  })
})

describe('derogation without any duration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(Temporal.Instant.from(NOW_ISO).epochMilliseconds)
    mockTemporalNowZoned()
  })

  afterEach(() => {
    vi.mocked(Temporal.Now.zonedDateTimeISO).mockRestore()
    vi.useRealTimers()
  })

  it('falls back to a zero-length window when no derog_time was ever reported', () => {
    const device = new Device(buildBinding('v2'), { mode: Mode.comfort })

    device.update({ derog_mode: DerogationMode.boost })

    expect(device.derogationEndDate).toBeNull()
  })
})
