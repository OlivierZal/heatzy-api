import { describe, expect, it, vi } from 'vitest'

import type { Attributes, UndefinedTolerant } from '../../src/types/index.ts'
import { Mode } from '../../src/constants.ts'
import { syncDevices, updateDevice } from '../../src/decorators/index.ts'
import { defined, mock } from '../helpers.ts'

// The `setting` decorator is @olivierzal/api-core's since the
// SessionAPI adoption (re-exported for the stable public name); its
// mechanism suite — delegation, in-memory fallback, the `''`→`unset`
// cleared-sentinel rule — lives there. What is pinned HERE is this
// SDK's use of it: the kernel's persisted-keys clauses drive the real
// client's decorated `token` accessor against both persistence hosts.

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
