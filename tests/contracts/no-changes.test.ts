import { describe, expect, it, vi } from 'vitest'

import type { HeatzyAPIAdapter, SyncCallback } from '../../src/api/index.ts'
import type { PostAttributes } from '../../src/types/index.ts'
import { Mode } from '../../src/constants.ts'
import { Device } from '../../src/entities/index.ts'
import { DeviceGlowFacade } from '../../src/facades/device-glow.ts'
import { DeviceProFacade } from '../../src/facades/device-pro.ts'
import { DeviceV2Facade } from '../../src/facades/device-v2.ts'
import { DeviceFacade } from '../../src/facades/device.ts'
import {
  buildBinding,
  glowAttributes,
  proAttributes,
  v1Attributes,
  v2Attributes,
} from '../fixtures.ts'

// `setValues` answers one question on every generation — is there
// anything to send? — and must answer it before the wire. A
// present-`undefined` key counts as absent on all of them: the
// `PostAttributes` fields are declared `| undefined`, so any caller can
// hand one over.
//
// The mechanics differ, and that difference is not the contract: V1
// checks each key against `undefined` itself, V2+ counts the keys of
// the payload it forwards as `attrs`. Two independent implementations
// of one rule is exactly the shape that let melcloud-api's
// `isAvailable` diverge silently at 100% coverage — and it had diverged
// here too: `{ mode: undefined }` has one key, so the V2+ guard sent an
// empty `attrs` to the wire while V1 sent nothing.
const CASES: readonly {
  readonly label: string
  readonly values: PostAttributes
}[] = [
  { label: 'an empty change set', values: {} },
  {
    label: 'a set whose only key is present-undefined',
    values: { mode: undefined },
  },
]

/**
 * One write attempt against a freshly built facade, so the wire-call
 * count belongs to that attempt alone.
 */
interface Attempt {
  /** How many times the write reached the wire. */
  readonly wireCalls: () => number
  /** Performs the write. */
  readonly write: (values: PostAttributes) => Promise<PostAttributes>
}

/**
 * Runs the no-op write contract against one product generation.
 * @param name - Implementation label used in the test titles.
 * @param attempt - Builds a fresh facade with its wire-call counter.
 */
const describeNoChangesContract = (
  name: string,
  attempt: () => Attempt,
): void => {
  describe(`setValues — ${name}`, () => {
    it.each(CASES)(
      'sends nothing to the wire for $label',
      async ({ values }) => {
        const { wireCalls, write } = attempt()

        await write(values)

        expect(wireCalls()).toBe(0)
      },
    )

    // Without this clause the one above would also pass on a facade that
    // refuses every write, including the ones it should send.
    it('sends a real change to the wire', async () => {
      const { wireCalls, write } = attempt()

      await write({ mode: Mode.eco })

      expect(wireCalls()).toBe(1)
    })
  })
}

const createApi = (): HeatzyAPIAdapter => ({
  fetch: vi.fn<HeatzyAPIAdapter['fetch']>().mockResolvedValue([]),
  getValues: vi
    .fn<HeatzyAPIAdapter['getValues']>()
    .mockResolvedValue(v1Attributes),
  locale: undefined,
  notifySync: vi.fn<SyncCallback>().mockResolvedValue(undefined),
  timezone: undefined,
  updateValues: vi.fn<HeatzyAPIAdapter['updateValues']>().mockResolvedValue({}),
})

const GENERATIONS = [
  {
    name: 'V1 device',
    build: (api: HeatzyAPIAdapter): DeviceFacade =>
      new DeviceFacade(api, new Device(buildBinding('v1'), v1Attributes)),
  },
  {
    name: 'V2 device',
    build: (api: HeatzyAPIAdapter): DeviceV2Facade =>
      new DeviceV2Facade(api, new Device(buildBinding('v2'), v2Attributes)),
  },
  {
    name: 'Glow device',
    build: (api: HeatzyAPIAdapter): DeviceGlowFacade =>
      new DeviceGlowFacade(
        api,
        new Device(buildBinding('glow'), glowAttributes),
      ),
  },
  {
    name: 'Pro device',
    build: (api: HeatzyAPIAdapter): DeviceProFacade =>
      new DeviceProFacade(api, new Device(buildBinding('pro'), proAttributes)),
  },
] as const

for (const { build, name } of GENERATIONS) {
  describeNoChangesContract(name, () => {
    const api = createApi()
    const facade = build(api)
    return {
      wireCalls: (): number => vi.mocked(api.updateValues).mock.calls.length,
      write: async (values): Promise<PostAttributes> =>
        facade.setValues(values),
    }
  })
}
