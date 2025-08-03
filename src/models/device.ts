import { DateTime } from 'luxon'

import type { Attributes, Device } from '../types.ts'

import { type Product, DerogationMode, Mode } from '../enums.ts'

import {
  type IDeviceModel,
  type PreviousMode,
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
    return this.#previousMode ?? Mode.eco
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
    const newDevice = new this(device, attributes)
    this.#instances.set(did, newDevice)
    const {
      cur_mode: currentMode,
      derog_mode: derogationMode,
      derog_time: derogationTime,
      mode,
    } = attributes
    newDevice.#handle({ currentMode, derogationMode, derogationTime, mode })
  }

  public update(data: Partial<Attributes>): void {
    const {
      cur_mode: currentMode,
      derog_mode: derogationMode,
      derog_time: derogationTime,
      mode,
    } = this.#data
    const {
      cur_mode: newCurrentMode,
      derog_mode: newDerogationMode,
      derog_time: newDerogationTime,
    } = data
    this.#handle({
      currentMode,
      derogationMode,
      derogationTime,
      mode,
      newCurrentMode,
      newDerogationMode,
      newDerogationTime,
    })
    this.#data = { ...this.#data, ...data }
  }

  #handle({
    currentMode,
    derogationMode,
    derogationTime,
    mode,
    newCurrentMode,
    newDerogationMode,
    newDerogationTime,
  }: {
    mode: Mode
    currentMode?: Mode
    derogationMode?: DerogationMode
    derogationTime?: number
    newCurrentMode?: Mode
    newDerogationMode?: DerogationMode
    newDerogationTime?: number
  }): void {
    this.#handlePreviousMode(mode)
    this.#handleDerogationModeEndDate({
      currentMode,
      derogationMode,
      derogationTime,
      newCurrentMode,
      newDerogationMode,
      newDerogationTime,
    })
  }

  #handleDerogationModeEndDate({
    currentMode,
    derogationMode,
    derogationTime,
    newCurrentMode,
    newDerogationMode,
    newDerogationTime,
  }: {
    currentMode?: Mode
    derogationMode?: DerogationMode
    derogationTime?: number
    newCurrentMode?: Mode
    newDerogationMode?: DerogationMode
    newDerogationTime?: number
  }): void {
    const currentDerogationMode = newDerogationMode ?? derogationMode
    if (currentDerogationMode === DerogationMode.presence) {
      this.#handlePresenceDerogationEndDate({ currentMode, newCurrentMode })
      return
    }
    if (
      currentDerogationMode !== undefined &&
      ((newDerogationMode !== undefined &&
        newDerogationMode !== derogationMode) ||
        (newDerogationTime !== undefined &&
          newDerogationTime !== derogationTime))
    ) {
      const currentDerogationTime = newDerogationTime ?? derogationTime
      const now = DateTime.now()
      ;({ [currentDerogationMode]: this.#derogationEndDate } = {
        [DerogationMode.boost]: now.plus({ minutes: currentDerogationTime }),
        [DerogationMode.off]: null,
        [DerogationMode.vacation]: now.plus({ days: currentDerogationTime }),
      })
    }
  }

  #handlePresenceDerogationEndDate({
    currentMode,
    newCurrentMode,
  }: {
    currentMode?: Mode
    newCurrentMode?: Mode
  }): void {
    if (newCurrentMode !== undefined && newCurrentMode !== currentMode) {
      const now = DateTime.now()
      ;({ [newCurrentMode]: this.#derogationEndDate } = {
        [Mode.comfort]: now.plus({ minutes: 90 }),
        [Mode.comfortMinus1]: now.plus({ minutes: 60 }),
        [Mode.comfortMinus2]: now.plus({ minutes: 30 }),
        [Mode.eco]: null,
        [Mode.frostProtection]: null,
        [Mode.stop]: null,
      })
    }
  }

  #handlePreviousMode(mode: Mode): void {
    if (mode !== Mode.stop) {
      this.#previousMode = mode
    }
  }
}
