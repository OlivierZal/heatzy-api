import type { Attributes, DeviceBinding } from '../types/index.ts'
import { Device, syncDevice } from './device.ts'

/**
 * Central in-memory registry of all bound Heatzy devices. Synced from
 * the `/bindings` + `/devdata` responses and queryable by id.
 *
 * Upsert + prune semantics: existing models are updated in place,
 * new ones created, stale entries removed — object identity is
 * preserved across syncs so facade references remain valid.
 * @category Entities
 */
export class DeviceRegistry {
  readonly #devices = new Map<string, Device>()

  public readonly devices = {
    /**
     * Returns the device with the given id, or `undefined` when no such device is registered.
     * @param id - Device identifier (wire `did`).
     * @returns The device, or `undefined`.
     */
    getById: (id: string): Device | undefined => this.#devices.get(id),
  }

  readonly #timezone: string | undefined

  /**
   * Builds the registry.
   * @param options - Options bag.
   * @param options.timezone - IANA timezone threaded into every
   * {@link Device} for derogation end dates; defaults to the runtime
   * system timezone.
   */
  public constructor({ timezone }: { timezone?: string | undefined } = {}) {
    this.#timezone = timezone
  }

  /**
   * Returns every device currently held in the registry.
   * @returns All devices.
   */
  public getDevices(): Device[] {
    return this.#devices.values().toArray()
  }

  /**
   * Upserts the device registry from fresh wire data; entries absent
   * from `bindings` are pruned. A binding whose attributes are missing
   * from `attributes` keeps its existing model untouched (stale data
   * beats no data) and is skipped when new — the tolerance
   * `HeatzyAPI`'s `/devdata` fan-out feeds, one settled leg per device,
   * so a device that answered `/bindings` but not `/devdata` costs
   * itself and no sibling.
   *
   * Every binding is expected to be one this SDK models: {@link Device}
   * resolves its `product_key` in its constructor and THROWS on a key
   * this SDK predates. The listing boundary (`HeatzyAPI.list`) is what
   * guarantees that; a caller synchronizing hand-built bindings owns
   * the same precondition.
   * @param bindings - Fresh `/bindings` entries this SDK models.
   * @param attributes - Live attribute payloads keyed by `did`.
   */
  public syncDevices(
    bindings: readonly DeviceBinding[],
    attributes: Readonly<Record<string, Attributes>>,
  ): void {
    for (const binding of bindings) {
      this.#upsertDevice(binding, attributes[binding.did])
    }
    this.#prune(new Set(bindings.map(({ did }) => did)))
  }

  #prune(activeIds: ReadonlySet<string>): void {
    for (const id of this.#devices.keys()) {
      if (!activeIds.has(id)) {
        this.#devices.delete(id)
      }
    }
  }

  #upsertDevice(
    binding: DeviceBinding,
    attributes: Attributes | undefined,
  ): void {
    if (attributes === undefined) {
      return
    }
    const existing = this.#devices.get(binding.did)
    if (existing === undefined) {
      this.#devices.set(
        binding.did,
        new Device(binding, attributes, this.#timezone),
      )
      return
    }
    syncDevice(existing, binding, attributes)
  }
}
