import { DateTime } from 'luxon'

import { DerogMode, Mode } from '../enums.ts'

import {
  getProduct,
  type IDeviceModel,
  type PreviousMode,
  type Product,
} from './interfaces.ts'

import type { Attrs, Device } from '../types.ts'

export class DeviceModel implements IDeviceModel {
  static readonly #instances = new Map<string, DeviceModel>()

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
      const attrs = data[id]
      if (attrs) {
        if (this.#instances.has(id)) {
          this.#instances.get(id)?.update(attrs)
          return
        }
        const newDevice = new this(device, attrs)
        this.#instances.set(id, newDevice)
        const {
          cur_mode: currentMode,
          derog_mode: derogMode,
          derog_time: derogTime,
          mode,
        } = attrs
        newDevice.#handle({ currentMode, derogMode, derogTime, mode })
      }
    })
    ;[...this.#instances.keys()].forEach((id) => {
      if (!devices.map(({ did }) => did).includes(id)) {
        this.#instances.delete(id)
      }
    })
  }

  public update(data: Partial<Attrs>): void {
    const {
      cur_mode: currentMode,
      derog_mode: derogMode,
      derog_time: derogTime,
      mode,
    } = this.#data
    const {
      cur_mode: newCurrentMode,
      derog_mode: newDerogMode,
      derog_time: newDerogTime,
    } = data
    this.#handle({
      currentMode,
      derogMode,
      derogTime,
      mode,
      newCurrentMode,
      newDerogMode,
      newDerogTime,
    })
    this.#data = { ...this.#data, ...data }
  }

  #handle({
    currentMode,
    derogMode,
    derogTime,
    mode,
    newCurrentMode,
    newDerogMode,
    newDerogTime,
  }: {
    mode: Mode
    currentMode?: Mode
    derogMode?: DerogMode
    derogTime?: number
    newCurrentMode?: Mode
    newDerogMode?: DerogMode
    newDerogTime?: number
  }): void {
    this.#handlePreviousMode(mode)
    this.#handleDerogModeEndDate({
      currentMode,
      derogMode,
      derogTime,
      newCurrentMode,
      newDerogMode,
      newDerogTime,
    })
  }

  #handleDerogModeEndDate({
    currentMode,
    derogMode,
    derogTime,
    newCurrentMode,
    newDerogMode,
    newDerogTime,
  }: {
    currentMode?: Mode
    derogMode?: DerogMode
    derogTime?: number
    newCurrentMode?: Mode
    newDerogMode?: DerogMode
    newDerogTime?: number
  }): void {
    const currentDerogMode = newDerogMode ?? derogMode
    if (currentDerogMode === DerogMode.presence) {
      this.#handlePresenceDerogEndDate({ currentMode, newCurrentMode })
      return
    }
    if (
      currentDerogMode !== undefined &&
      ((newDerogMode !== undefined && newDerogMode !== derogMode) ||
        (newDerogTime !== undefined && newDerogTime !== derogTime))
    ) {
      const currentDerogTime = newDerogTime ?? derogTime
      const now = DateTime.now()
      switch (currentDerogMode) {
        case DerogMode.boost:
          this.#derogEndDate = now.plus({ minutes: currentDerogTime })
          break
        case DerogMode.vacation:
          this.#derogEndDate = now.plus({ days: currentDerogTime })
          break
        case DerogMode.off:
        default:
          this.#derogEndDate = null
      }
    }
  }

  #handlePresenceDerogEndDate({
    currentMode,
    newCurrentMode,
  }: {
    currentMode?: Mode
    newCurrentMode?: Mode
  }): void {
    if (newCurrentMode !== undefined && newCurrentMode !== currentMode) {
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

  #handlePreviousMode(mode: Mode): void {
    if (mode !== Mode.stop) {
      this.#previousMode = mode
    }
  }
}
