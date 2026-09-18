import type { HeatzyAPIAdapter } from '../api/types.ts'
import type { Device, PreviousMode } from '../entities/index.ts'
import type { Temporal } from '../temporal.ts'
import type {
  Attributes,
  ControlAttributes,
  PostAttributes,
  UndefinedTolerant,
} from '../types/index.ts'
import {
  type Product,
  Mode,
  modeToModeV1,
  POST_DATA_UNIT,
} from '../constants.ts'
import { syncDevices, updateDevice } from '../decorators/index.ts'
import { AttributeNotFoundError, EntityNotFoundError } from '../errors/index.ts'
import { isKeyOf, omitUndefined } from '../utils.ts'

// `null` is a value here: a read the wire answers with `null` (a
// Glow-family `cur_mode`) is returned, only an absent key throws.
const isDefined = <T>(value: T): value is Exclude<T, undefined> =>
  value !== undefined

const isModeV1 = isKeyOf(modeToModeV1)

/**
 * Behavioral wrapper around a registry {@link Device} for first-generation
 * (V1) products, which only expose the heating mode. Subclasses layer
 * the richer generations on top. Obtain instances through
 * {@link FacadeManager.get} — facades are cached per entity.
 * @category Facades
 */
export class DeviceFacade {
  /**
   * Wire `did` of the wrapped device.
   */
  public readonly id: string

  /**
   * Product generation of the wrapped device.
   */
  public readonly product: Product

  /**
   * When the running derogation ends, or `null` when none is running.
   * @returns The derogation end date, or `null`.
   */
  public get derogationEndDate(): Temporal.ZonedDateTime | null {
    return this.device.derogationEndDate
  }

  /**
   * Whether the underlying device still exists in the registry.
   * Non-throwing introspection: answers `false` instead of throwing
   * {@link EntityNotFoundError} when the registry no longer holds the
   * id. For consumers that keep a cached facade reference and want to
   * detect staleness without a `try`/`catch`.
   * @returns `true` when the device is still resolvable.
   */
  public get exists(): boolean {
    return this.api.getDeviceById(this.id) !== undefined
  }

  /**
   * Whether the device is heating (mode is not stop).
   * @returns `true` while any heating mode is active.
   */
  public get isOn(): boolean {
    return this.mode !== Mode.stop
  }

  /**
   * The current heating mode.
   * @returns The wire mode value.
   */
  public get mode(): Mode {
    return this.getValue('mode')
  }

  /**
   * The user-facing device name, tracking renames across syncs.
   * @returns The wire `dev_alias` value.
   */
  public get name(): string {
    return this.device.name
  }

  /**
   * The last non-stop mode — what "back on" restores to.
   * @returns The previous heating mode.
   */
  public get previousMode(): PreviousMode {
    return this.device.previousMode
  }

  protected readonly api: HeatzyAPIAdapter

  protected get data(): Attributes {
    return this.device.data
  }

  // Resolved on EVERY access, never held. The registry prunes and
  // rebuilds its entries on each sync and on a sign-out, so a facade
  // that captured the object would keep reading a detached copy for the
  // rest of the process — writes would still be sent, and every read
  // would answer the state the device had when it was dropped.
  protected get device(): Device {
    const device = this.api.getDeviceById(this.id)
    if (device === undefined) {
      throw new EntityNotFoundError(this.id)
    }
    return device
  }

  /**
   * Builds the facade over a registry entity. Only the device's
   * IDENTITY is captured — the entity itself is resolved per access.
   * @param api - API surface the facade calls through.
   * @param device - Registry entity to wrap.
   */
  public constructor(api: HeatzyAPIAdapter, device: Device) {
    this.api = api
    this.id = device.id
    this.product = device.product
  }

  /**
   * Refresh a live attribute read into the in-memory model and notify
   * sync observers.
   * @returns The fresh attribute payload.
   */
  @syncDevices()
  @updateDevice
  public async values(): Promise<Attributes> {
    return this.api.getValues({ id: this.id })
  }

  /**
   * Notify the API's `onSyncComplete` observer, scoped to this device.
   * Invoked by the `@syncDevices()` decorator after each decorated
   * mutation or read.
   */
  public async notifySync(): Promise<void> {
    await this.api.notifySync({ ids: [this.id] })
  }

  /**
   * Send a control payload, merge the echo into the in-memory model,
   * and notify sync observers.
   * @param attributes - Writable attributes to apply.
   * @returns The echoed attribute payload.
   */
  /**
   * Send a control payload, merge the echo into the in-memory model,
   * and notify sync observers.
   * @param attributes - Writable attributes EVERY product accepts.
   * `DeviceProFacade` widens this to its own presence derogation.
   * @returns The echoed attribute payload.
   */
  public async setValues(
    attributes: PostAttributes,
  ): Promise<ControlAttributes> {
    return this.applyValues(attributes)
  }

  /**
   * Merge a partial attribute payload into the registry entity.
   * Invoked by the `@updateDevice` decorator.
   * @param data - Partial attribute payload to merge.
   */
  public update(data: UndefinedTolerant<Attributes>): void {
    this.device.update(data)
  }

  // V1 products only accept the positional `raw` triplet, and only for
  // the four base modes. Anything else is silently ignored — mirroring
  // the wire's capabilities, not an SDK limitation.
  /**
   * The ONE decorated write seam: every facade's `setValues` lands
   * here, and it takes the transport's shape so the Pro can pass its
   * own presence derogation through the same echo merge and sync
   * notification. Narrowing happens in the PUBLIC signatures above, not
   * here — a second decorated path would mean a second place to forget
   * the merge.
   * @param attributes - Attributes to write.
   * @returns The echoed attribute payload.
   */
  @syncDevices()
  @updateDevice
  protected async applyValues(
    attributes: ControlAttributes,
  ): Promise<ControlAttributes> {
    // Stripped at the single entry point: V1's `control` checks each key
    // against `undefined` itself, but V2+ counts keys to decide whether
    // anything reaches the wire — and `{ mode: undefined }` has one.
    return this.control(omitUndefined(attributes))
  }

  protected async control({
    mode,
  }: ControlAttributes): Promise<ControlAttributes> {
    if (mode !== undefined && isModeV1(mode)) {
      await this.api.updateValues({
        id: this.id,
        postData: { raw: [POST_DATA_UNIT, POST_DATA_UNIT, modeToModeV1[mode]] },
      })
      return { mode }
    }
    return {}
  }

  protected getValue<T extends keyof Attributes>(
    key: T,
  ): Exclude<Attributes[T], undefined> {
    const value = this.data[key]
    if (!isDefined(value)) {
      throw new AttributeNotFoundError(key)
    }
    return value
  }
}
