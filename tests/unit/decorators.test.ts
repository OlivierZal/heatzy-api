import { describe, expect, it, vi } from 'vitest'

import type { SettingManager } from '../../src/api/index.ts'
import type { Attributes, UndefinedTolerant } from '../../src/types/index.ts'
import { Mode } from '../../src/constants.ts'
import {
  setting,
  syncDevices,
  updateDevice,
} from '../../src/decorators/index.ts'
import { createSettingStore, defined, mock } from '../helpers.ts'

class SettingHost {
  public settingManager: SettingManager | undefined

  @setting
  public accessor token = ''

  public constructor(settingManager?: SettingManager) {
    this.settingManager = settingManager
  }
}

describe(setting, () => {
  it('reads through the setting manager when one is configured', () => {
    const host = new SettingHost(
      createSettingStore({ token: 'stored' }).settingManager,
    )

    expect(host.token).toBe('stored')
  })

  it('writes through the setting manager when one is configured', () => {
    const { setSpy, settingManager } = createSettingStore()
    const host = new SettingHost(settingManager)
    host.token = 'fresh'

    expect(setSpy).toHaveBeenCalledWith('token', 'fresh')
    expect(host.token).toBe('fresh')
  })

  it('falls back to the in-memory default when the stored value is absent', () => {
    const host = new SettingHost(createSettingStore().settingManager)

    expect(host.token).toBe('')
  })

  it('falls back to the in-memory accessor without a setting manager', () => {
    const host = new SettingHost()

    expect(host.token).toBe('')

    host.token = 'memory'

    expect(host.token).toBe('memory')
  })

  it('unsets the key when clearing through a manager that delegates unset', () => {
    const { setSpy, settingManager, unsetSpy } = createSettingStore(
      { token: 'stored' },
      { hasUnset: true },
    )
    const host = new SettingHost(settingManager)
    host.token = ''

    expect(unsetSpy).toHaveBeenCalledWith('token')
    expect(setSpy).not.toHaveBeenCalled()
    expect(host.token).toBe('')
  })

  it('stores the empty string when clearing without unset', () => {
    const { setSpy, settingManager } = createSettingStore({ token: 'stored' })
    const host = new SettingHost(settingManager)
    host.token = ''

    expect(setSpy).toHaveBeenCalledWith('token', '')
    expect(host.token).toBe('')
  })
})

describe(syncDevices, () => {
  it('notifies sync after the decorated method resolves', async () => {
    const notifySync = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
    const target = vi.fn<() => Promise<string>>().mockResolvedValue('result')
    const decorated = syncDevices(target, mock<ClassMethodDecoratorContext>())

    await expect(decorated.call({ notifySync })).resolves.toBe('result')

    const [targetOrder] = target.mock.invocationCallOrder
    const [notifyOrder] = notifySync.mock.invocationCallOrder

    expect(notifySync).toHaveBeenCalledTimes(1)
    expect(defined(targetOrder)).toBeLessThan(defined(notifyOrder))
  })

  it('is a no-op without the notify hook', async () => {
    const target = vi.fn<() => Promise<string>>().mockResolvedValue('result')
    const decorated = syncDevices(target, mock<ClassMethodDecoratorContext>())

    await expect(decorated.call({})).resolves.toBe('result')
  })

  it('propagates an exception thrown by the sync callback', async () => {
    const notifySync = vi
      .fn<() => Promise<void>>()
      .mockRejectedValue(new Error('sync boom'))
    const target = vi.fn<() => Promise<string>>().mockResolvedValue('result')
    const decorated = syncDevices(target, mock<ClassMethodDecoratorContext>())

    await expect(decorated.call({ notifySync })).rejects.toThrow('sync boom')
  })
})

describe(updateDevice, () => {
  it('merges the resolved payload into the host model and returns it', async () => {
    const payload: Attributes = { mode: Mode.eco }
    const update = vi.fn<(data: UndefinedTolerant<Attributes>) => void>()
    const target = vi.fn<() => Promise<Attributes>>().mockResolvedValue(payload)
    const decorated = updateDevice(target, mock<ClassMethodDecoratorContext>())

    await expect(decorated.call({ update })).resolves.toBe(payload)

    expect(update).toHaveBeenCalledWith(payload)
  })
})
