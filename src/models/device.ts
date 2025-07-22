import { DateTime } from 'luxon'

import type { Attributes, Device } from '../types.ts'

import { DerogationMode, Mode } from '../enums.ts'

import {
  type IDeviceModel,
  type PreviousMode,
  type Product,
  getProduct,
} from './interfaces.ts'

export class DeviceModel implements IDeviceModel {
  static readonly #instances = new Map<string, DeviceModel>()

  public readonly id: string

  public readonly name: string

  public readonly product: Product

  public readonly productKey: string

  public readonly productName: string

  #data: Attributes

  #derogationEndDate: DateTime | null = null

  #previousMode?: PreviousMode

  private constructor(device: Device, data: Attributes) {
    ;({
      dev_alias: this.name,
      did: this.id,
      product_key: this.productKey,
      product_name: this.productName,
    } = device)
    this.#data = data
    this.product = getProduct(this.productKey)
  }

  public get data(): Attributes {
    return this.#data
  }

  public get derogationEndDate(): DateTime | null {
    return this.#derogationEndDate && this.#derogationEndDate > DateTime.now() ?
        this.#derogationEndDate
      : null
  }

  public get previousMode(): PreviousMode {
    return this.#previousMode ?? Mode.Eco
  }

  public static getAll(): DeviceModel[] {
    return [...this.#instances.values()]
  }

  public static getById(id: string): DeviceModel | undefined {
    return this.#instances.get(id)
  }

  public static getByName(name: string): DeviceModel | undefined {
    return this.getAll().find(({ name: instanceName }) => instanceName === name)
  }

  public static sync(
    devices: readonly Device[],
    data: Record<string, Attributes>,
  ): void {
    for (const device of devices) {
      const { did } = device
      const { [did]: attributes } = data
      if (attributes) {
        if (this.#instances.has(did)) {
          this.#instances.get(did)?.update(attributes)
          continue
        }
        this.#updateInstances(did, device, attributes)
      }
    }
    this.#cleanInstances(devices)
  }

  static #cleanInstances(devices: readonly Device[]): void {
    for (const id of this.#instances.keys()) {
      if (!devices.map(({ did }) => did).includes(id)) {
        this.#instances.delete(id)
      }
    }
  }

  static #updateInstances(
    did: string,
    device: Device,
    attributes: Attributes,
  ): void {
    const deviceNew = new this(device, attributes)
    this.#instances.set(did, deviceNew)
    const {
      cur_mode: currentMode,
      derog_mode: derogationMode,
      derog_time: derogationTime,
      mode,
    } = attributes
    deviceNew.#handle({ currentMode, derogationMode, derogationTime, mode })
  }

  public update(data: Partial<Attributes>): void {
    const {
      cur_mode: currentMode,
      derog_mode: derogationMode,
      derog_time: derogationTime,
      mode,
    } = this.#data
    const {
      cur_mode: currentModeNew,
      derog_mode: derogationModeNew,
      derog_time: derogationTimeNew,
    } = data
    this.#handle({
      currentMode,
      currentModeNew,
      derogationMode,
      derogationModeNew,
      derogationTime,
      derogationTimeNew,
      mode,
    })
    this.#data = { ...this.#data, ...data }
  }

  #handle({
    currentMode,
    currentModeNew,
    derogationMode,
    derogationModeNew,
    derogationTime,
    derogationTimeNew,
    mode,
  }: {
    mode: Mode
    currentMode?: Mode
    currentModeNew?: Mode
    derogationMode?: DerogationMode
    derogationModeNew?: DerogationMode
    derogationTime?: number
    derogationTimeNew?: number
  }): void {
    this.#handlePreviousMode(mode)
    this.#handleDerogationModeEndDate({
      currentMode,
      currentModeNew,
      derogationMode,
      derogationModeNew,
      derogationTime,
      derogationTimeNew,
    })
  }

  #handleDerogationModeEndDate({
    currentMode,
    currentModeNew,
    derogationMode,
    derogationModeNew,
    derogationTime,
    derogationTimeNew,
  }: {
    currentMode?: Mode
    currentModeNew?: Mode
    derogationMode?: DerogationMode
    derogationModeNew?: DerogationMode
    derogationTime?: number
    derogationTimeNew?: number
  }): void {
    const currentDerogationMode = derogationModeNew ?? derogationMode
    if (currentDerogationMode === DerogationMode.Presence) {
      this.#handlePresenceDerogationEndDate({ currentMode, currentModeNew })
      return
    }
    if (
      currentDerogationMode !== undefined &&
      ((derogationModeNew !== undefined &&
        derogationModeNew !== derogationMode) ||
        (derogationTimeNew !== undefined &&
          derogationTimeNew !== derogationTime))
    ) {
      const currentDerogationTime = derogationTimeNew ?? derogationTime
      const now = DateTime.now()
      ;({ [currentDerogationMode]: this.#derogationEndDate } = {
        [DerogationMode.Boost]: now.plus({ minutes: currentDerogationTime }),
        [DerogationMode.Off]: null,
        [DerogationMode.Vacation]: now.plus({ days: currentDerogationTime }),
      })
    }
  }

  #handlePresenceDerogationEndDate({
    currentMode,
    currentModeNew,
  }: {
    currentMode?: Mode
    currentModeNew?: Mode
  }): void {
    if (currentModeNew !== undefined && currentModeNew !== currentMode) {
      const now = DateTime.now()
      ;({ [currentModeNew]: this.#derogationEndDate } = {
        [Mode.Comfort]: now.plus({ minutes: 90 }),
        [Mode.ComfortMinus1]: now.plus({ minutes: 60 }),
        [Mode.ComfortMinus2]: now.plus({ minutes: 30 }),
        [Mode.Eco]: null,
        [Mode.FrostProtection]: null,
        [Mode.Stop]: null,
      })
    }
  }

  #handlePreviousMode(mode: Mode): void {
    if (mode !== Mode.Stop) {
      this.#previousMode = mode
    }
  }
}
