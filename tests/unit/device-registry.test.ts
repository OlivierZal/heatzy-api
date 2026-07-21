import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DerogationMode, Mode } from '../../src/constants.ts'
import { DeviceRegistry } from '../../src/entities/index.ts'
import { Temporal } from '../../src/temporal.ts'
import { buildBinding, proAttributes, v2Attributes } from '../fixtures.ts'
import { defined, mockTemporalNowZoned } from '../helpers.ts'

describe(DeviceRegistry, () => {
  it('registers a device reachable by id', () => {
    const registry = new DeviceRegistry()
    const binding = buildBinding('v2')
    registry.syncDevices([binding], { [binding.did]: v2Attributes })

    expect(registry.devices.getById('did-v2')?.name).toBe('Radiator v2')
    expect(registry.devices.getById('missing')).toBeUndefined()
  })

  it('returns every registered device', () => {
    const registry = new DeviceRegistry()
    registry.syncDevices([buildBinding('v2'), buildBinding('pro')], {
      'did-pro': proAttributes,
      'did-v2': v2Attributes,
    })

    expect(registry.getDevices()).toHaveLength(2)
  })

  it('updates in place on re-sync, preserving object identity', () => {
    const registry = new DeviceRegistry()
    const binding = buildBinding('v2')
    registry.syncDevices([binding], { [binding.did]: v2Attributes })
    const before = registry.devices.getById(binding.did)
    registry.syncDevices([buildBinding('v2', { dev_alias: 'Renamed' })], {
      [binding.did]: { ...v2Attributes, mode: Mode.eco },
    })
    const after = registry.devices.getById(binding.did)

    expect(after).toBe(before)
    expect(after?.name).toBe('Renamed')
    expect(after?.data.mode).toBe(Mode.eco)
  })

  it('prunes devices absent from the fresh bindings', () => {
    const registry = new DeviceRegistry()
    registry.syncDevices([buildBinding('v2'), buildBinding('pro')], {
      'did-pro': proAttributes,
      'did-v2': v2Attributes,
    })
    registry.syncDevices([buildBinding('pro')], { 'did-pro': proAttributes })

    expect(registry.devices.getById('did-v2')).toBeUndefined()
    expect(registry.getDevices()).toHaveLength(1)
  })

  it('skips a new binding whose attributes are missing', () => {
    const registry = new DeviceRegistry()
    registry.syncDevices([buildBinding('v2')], {})

    expect(registry.devices.getById('did-v2')).toBeUndefined()
    expect(registry.getDevices()).toHaveLength(0)
  })

  it('keeps stale data when an existing binding answers without attributes', () => {
    const registry = new DeviceRegistry()
    const binding = buildBinding('v2')
    registry.syncDevices([binding], { [binding.did]: v2Attributes })
    const before = registry.devices.getById(binding.did)
    registry.syncDevices([buildBinding('v2', { dev_alias: 'Renamed' })], {})
    const after = registry.devices.getById(binding.did)

    expect(after).toBe(before)
    expect(after?.name).toBe('Radiator v2')
    expect(after?.data).toStrictEqual(v2Attributes)
  })

  describe('timezone threading', () => {
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

    it('threads the configured timezone into the devices it creates', () => {
      const registry = new DeviceRegistry({ timezone: 'Asia/Tokyo' })
      const binding = buildBinding('v2')
      registry.syncDevices([binding], { [binding.did]: v2Attributes })
      registry.syncDevices([binding], {
        [binding.did]: {
          ...v2Attributes,
          derog_mode: DerogationMode.boost,
          derog_time: 30,
        },
      })

      expect(
        defined(registry.devices.getById(binding.did)?.derogationEndDate)
          .timeZoneId,
      ).toBe('Asia/Tokyo')
    })
  })
})
