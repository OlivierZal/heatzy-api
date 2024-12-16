import { DateTime } from 'luxon'

import { DerogMode, Mode } from '../enums.ts'

import {
  getProduct,
  Product,
  type IDeviceModel,
  type PreviousMode,
} from './interfaces.ts'

import type { Attrs, Device } from '../types.ts'

export class DeviceModel implements IDeviceModel {
  static readonly #instances = new Map<string, DeviceModel>()

  public readonly hasRestrictedModes: boolean

  public readonly id: string

  public readonly name: string

  public readonly product: Product

  public readonly productKey: string

  public readonly productName: string

  #data: Attrs

  #derogEndDate: DateTime | null = null

  #previousMode?: PreviousMode

  private constructor(device: Device, data: Attrs) {
    ;({
      dev_alias: this.name,
      did: this.id,
      product_key: this.productKey,
      product_name: this.productName,
    } = device)
    this.#data = data
    this.product = getProduct(this.productKey)
    this.hasRestrictedModes = [Product.v1, Product.v2].includes(this.product)
  }

  public get data(): Attrs {
    return this.#data
  }

  public get derogEndDate(): DateTime | null {
    return this.#derogEndDate && this.#derogEndDate > DateTime.now() ?
        this.#derogEndDate
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
    data: Record<string, Attrs>,
  ): void {
    devices.forEach((device) => {
      const { did: id } = device
      if (this.#instances.has(id)) {
        this.#instances.get(id)?.update(data[id])
        return
      }
      this.#instances.set(id, new this(device, data[id]))
    })
    ;[...this.#instances.keys()].forEach((id) => {
      if (!devices.map(({ did }) => did).includes(id)) {
        this.#instances.delete(id)
      }
    })
  }

  public update(data: Partial<Attrs>): void {
    const {
      cur_mode: oldCurrentMode,
      derog_mode: oldDerogMode,
      derog_time: oldDerogTime,
      mode: oldMode,
    } = this.#data
    const {
      cur_mode: newCurrentMode,
      derog_mode: newDerogMode,
      derog_time: newDerogTime,
      mode: newMode,
    } = data
    this.#handlePreviousMode({ newMode, oldMode })
    this.#handleDerogModeEndDate({
      newCurrentMode,
      newDerogMode,
      newDerogTime,
      oldCurrentMode,
      oldDerogMode,
      oldDerogTime,
    })
    this.#data = { ...this.#data, ...data }
  }

  #handleDerogModeEndDate({
    newCurrentMode,
    newDerogMode,
    newDerogTime,
    oldCurrentMode,
    oldDerogMode,
    oldDerogTime,
  }: {
    newCurrentMode?: Mode
    newDerogMode?: DerogMode
    newDerogTime?: number
    oldCurrentMode?: Mode
    oldDerogMode?: DerogMode
    oldDerogTime?: number
  }): void {
    if (
      (newDerogMode !== undefined && newDerogMode !== oldDerogMode) ||
      (newDerogTime !== undefined && newDerogTime !== oldDerogTime)
    ) {
      const derogMode = newDerogMode ?? oldDerogMode
      const derogTime = newDerogTime ?? oldDerogTime
      const now = DateTime.now()
      switch (derogMode) {
        case DerogMode.boost:
          this.#derogEndDate = now.plus({ minutes: derogTime })
          break
        case DerogMode.presence:
          this.#handlePresenceDerogEndDate({ newCurrentMode, oldCurrentMode })
          break
        case DerogMode.vacation:
          this.#derogEndDate = now.plus({ days: derogTime })
          break
        case DerogMode.off:
        case undefined:
        default:
          this.#derogEndDate = null
      }
    }
  }

  #handlePresenceDerogEndDate({
    newCurrentMode,
    oldCurrentMode,
  }: {
    newCurrentMode?: Mode
    oldCurrentMode?: Mode
  }): void {
    if (newCurrentMode !== undefined && newCurrentMode !== oldCurrentMode) {
      switch (newCurrentMode) {
        case Mode.cft:
          this.#derogEndDate = DateTime.now().plus({ minutes: 90 })
          break
        case Mode.cft1:
          this.#derogEndDate = DateTime.now().plus({ minutes: 60 })
          break
        case Mode.cft2:
          this.#derogEndDate = DateTime.now().plus({ minutes: 30 })
          break
        case Mode.eco:
        case Mode.fro:
        case Mode.stop:
        default:
          this.#derogEndDate = null
      }
    }
  }

  #handlePreviousMode({
    newMode,
    oldMode,
  }: {
    oldMode: Mode
    newMode?: Mode
  }): void {
    if (newMode !== undefined && oldMode !== Mode.stop) {
      this.#previousMode = oldMode
    }
  }
}
