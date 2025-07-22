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
        this.#facades.set(
          id,
          new {
            [Product.Glow]: DeviceGlowFacade,
            [Product.Pro]: DeviceProFacade,
            [Product.V1]: DeviceFacade,
            [Product.V2]: DeviceV2Facade,
            [Product.V4]: DeviceV2Facade,
          }[product](this.api, instance),
        )
      }
      return this.#facades.get(id) ?? null
    }
    return null
  }
}
