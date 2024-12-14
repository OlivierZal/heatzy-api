import { getProduct, Product, type IDeviceModel } from './interfaces.ts'

import type { Attrs, Device } from '../types.ts'

export class DeviceModel implements IDeviceModel {
  static #instances = new Map<string, DeviceModel>()

  public readonly hasRestrictedModes: boolean

  public readonly id: string

  public readonly name: string

  public readonly product: Product

  public readonly productKey: string

  public readonly productName: string

  #data: Attrs

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
    this.#instances = new Map(
      devices.map((device) => [device.did, new this(device, data[device.did])]),
    )
  }

  public update(data: Partial<Attrs>): void {
    this.#data = { ...this.#data, ...data }
  }
}
