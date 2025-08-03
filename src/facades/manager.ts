import type { IDeviceModel } from '../models/index.ts'
import type { IAPI } from '../services/index.ts'

import { Product } from '../enums.ts'

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
            [Product.glow]: DeviceGlowFacade,
            [Product.pro]: DeviceProFacade,
            [Product.v1]: DeviceFacade,
            [Product.v2]: DeviceV2Facade,
            [Product.v4]: DeviceV2Facade,
          }[product](this.api, instance),
        )
      }
      return this.#facades.get(id) ?? null
    }
    return null
  }
}
