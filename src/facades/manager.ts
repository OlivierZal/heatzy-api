import type { IAPI } from '../services/index.ts'

import { type IDeviceModel, Product } from '../models/index.ts'

import type { IDeviceFacadeAny, IFacadeManager } from './interfaces.ts'

import { DeviceGlowFacade } from './device-glow.ts'
import { DeviceProFacade } from './device-pro.ts'
import { DeviceV2Facade } from './device-v2.ts'
import { DeviceFacade } from './device.ts'

export class FacadeManager implements IFacadeManager {
  public readonly api: IAPI

  readonly #facades = new Map<string, IDeviceFacadeAny>()

  public constructor(api: IAPI) {
    this.api = api
  }

  public get(): null
  public get(instance: IDeviceModel): IDeviceFacadeAny
  public get(instance?: IDeviceModel): IDeviceFacadeAny | null {
    if (instance) {
      const { id, product } = instance
      if (!this.#facades.has(id)) {
        switch (product) {
          case Product.Glow:
            this.#facades.set(id, new DeviceGlowFacade(this.api, instance))
            break
          case Product.Pro:
            this.#facades.set(id, new DeviceProFacade(this.api, instance))
            break
          case Product.V1:
            this.#facades.set(id, new DeviceFacade(this.api, instance))
            break
          case Product.V2:
          case Product.V4:
            this.#facades.set(id, new DeviceV2Facade(this.api, instance))
            break
          default:
        }
      }
      return this.#facades.get(id) ?? null
    }
    return null
  }
}
