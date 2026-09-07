import { mock } from '@olivierzal/api-core/testing'
import { describe, expect, it, vi } from 'vitest'

import type { Attributes, UndefinedTolerant } from '../../src/types/index.ts'
import { Mode } from '../../src/constants.ts'
import { updateDevice } from '../../src/decorators/index.ts'

// The `setting` and `syncDevices` decorators are @olivierzal/api-core's
// (re-exported for the stable public names — `setting` since the
// SessionAPI adoption, `syncDevices` since 17.0.0, in the core's factory
// form); their mechanism suites — delegation, the in-memory fallback and
// the `''`→`unset` cleared-sentinel rule; the target-then-notify order,
// the verbatim forwarding, the propagating hook — live there. What is
// pinned HERE is this SDK's use of them: the kernel's persisted-keys
// clauses drive the real client's decorated `token` accessor against
// both persistence hosts, and the facade and sync suites drive
// `@syncDevices()` through the real facades and the real registry
// cycle. `updateDevice` is this dialect's own.

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
