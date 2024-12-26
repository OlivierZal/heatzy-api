import { DateTime } from 'luxon'

import { DerogationMode, Mode } from '../enums.ts'

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

  #derogationEndDate: DateTime | null = null

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
    data: Record<string, Attrs>,
  ): void {
    devices.forEach((device) => {
      const { did: id } = device
      const { id: attrs } = data
      if (attrs) {
        if (this.#instances.has(id)) {
          this.#instances.get(id)?.update(attrs)
          return
        }
        const newDevice = new this(device, attrs)
        this.#instances.set(id, newDevice)
        const {
          cur_mode: currentMode,
          derog_mode: derogationMode,
          derog_time: derogationTime,
          mode,
        } = attrs
        newDevice.#handle({ currentMode, derogationMode, derogationTime, mode })
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
      switch (currentDerogationMode) {
        case DerogationMode.boost:
          this.#derogationEndDate = now.plus({ minutes: currentDerogationTime })
          break
        case DerogationMode.vacation:
          this.#derogationEndDate = now.plus({ days: currentDerogationTime })
          break
        case DerogationMode.off:
        default:
          this.#derogationEndDate = null
      }
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
      switch (newCurrentMode) {
        case Mode.cft:
          this.#derogationEndDate = DateTime.now().plus({ minutes: 90 })
          break
        case Mode.cft1:
          this.#derogationEndDate = DateTime.now().plus({ minutes: 60 })
          break
        case Mode.cft2:
          this.#derogationEndDate = DateTime.now().plus({ minutes: 30 })
          break
        case Mode.eco:
        case Mode.fro:
        case Mode.stop:
        default:
          this.#derogationEndDate = null
      }
    }
  }

  #handlePreviousMode(mode: Mode): void {
    if (mode !== Mode.stop) {
      this.#previousMode = mode
    }
  }
}
