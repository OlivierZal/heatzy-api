import { Product, type IDeviceModel } from '../models/interfaces.ts'

import { DeviceGlowFacade } from './device-glow.ts'
import { DeviceProFacade } from './device-pro.ts'
import { DeviceV2Facade } from './device-v2.ts'
import { DeviceFacade } from './device.ts'

import type { IAPI } from '../services/interfaces.ts'

import type { IDeviceFacadeAny, IFacadeManager } from './interfaces.ts'

export class FacadeManager implements IFacadeManager {
  public readonly api: IAPI

  readonly #facades = new Map<string, IDeviceFacadeAny>()

  public constructor(api: IAPI) {
    this.api = api
  }

  public get(): undefined
  public get(instance: IDeviceModel): IDeviceFacadeAny
  public get(instance?: IDeviceModel): IDeviceFacadeAny | undefined {
    if (instance) {
      const { id, product } = instance
      if (!this.#facades.has(id)) {
        switch (product) {
          case Product.glow:
            this.#facades.set(id, new DeviceGlowFacade(this.api, instance))
            break
          case Product.pro:
            this.#facades.set(id, new DeviceProFacade(this.api, instance))
            break
          case Product.v1:
            this.#facades.set(id, new DeviceFacade(this.api, instance))
            break
          case Product.v2:
          case Product.v4:
            this.#facades.set(id, new DeviceV2Facade(this.api, instance))
            break
          default:
        }
      }
      return this.#facades.get(id)
    }
  }
}
