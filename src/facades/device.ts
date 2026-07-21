import type { HeatzyAPIAdapter } from '../api/types.ts'
import type { Device, PreviousMode } from '../entities/index.ts'
import type { Temporal } from '../temporal.ts'
import type {
  Attributes,
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
import { AttributeNotFoundError } from '../errors/index.ts'
import { isKeyOf } from '../utils.ts'

const isModeV1 = isKeyOf(modeToModeV1)

/**
 * Behavioral wrapper around a registry {@link Device} for first-generation
 * (V1) products, which only expose the heating mode. Subclasses layer
 * the richer generations on top. Obtain instances through
 * {@link FacadeManager.get} — facades are cached per entity.
 * @category Facades
 */
export class DeviceFacade {
  /** Wire `did` of the wrapped device. */
  public readonly id: string

  /** Product generation of the wrapped device. */
  public readonly product: Product

  /**
   * When the running derogation ends, or `null` when none is running.
   * @returns The derogation end date, or `null`.
   */
  public get derogationEndDate(): Temporal.ZonedDateTime | null {
    return this.device.derogationEndDate
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

  protected readonly device: Device

  protected get data(): Attributes {
    return this.device.data
  }

  /**
   * Builds the facade over a registry entity.
   * @param api - API surface the facade calls through.
   * @param device - Registry entity to wrap.
   */
  public constructor(api: HeatzyAPIAdapter, device: Device) {
    this.api = api
    this.device = device
    this.id = device.id
    this.product = device.product
  }

  /**
   * Send a control payload, merge the echo into the in-memory model,
   * and notify sync observers.
   * @param attributes - Writable attributes to apply.
   * @returns The echoed attribute payload.
   */
  @syncDevices
  @updateDevice
  public async setValues(attributes: PostAttributes): Promise<PostAttributes> {
    return this.control(attributes)
  }

  /**
   * Refresh a live attribute read into the in-memory model and notify
   * sync observers.
   * @returns The fresh attribute payload.
   */
  @syncDevices
  @updateDevice
  public async values(): Promise<Attributes> {
    return this.api.getValues({ id: this.id })
  }

  /**
   * Notify the API's `onSyncComplete` observer, scoped to this device.
   * Invoked by the `@syncDevices` decorator after each decorated
   * mutation or read.
   */
  public async notifySync(): Promise<void> {
    await this.api.notifySync({ ids: [this.id] })
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
  protected async control({ mode }: PostAttributes): Promise<PostAttributes> {
    if (mode !== undefined && isModeV1(mode)) {
      await this.api.updateValues({
        id: this.id,
        postData: {
          raw: [POST_DATA_UNIT, POST_DATA_UNIT, modeToModeV1[mode]],
        },
      })
      return { mode }
    }
    return {}
  }

  protected getValue<T extends keyof Attributes>(
    key: T,
  ): NonNullable<Attributes[T]> {
    const value = this.data[key]
    if (value === undefined) {
      throw new AttributeNotFoundError(key)
    }
    return value
  }
}
