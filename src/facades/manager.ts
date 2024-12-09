import { DeviceGlowFacade } from './device-glow.ts'
import { DeviceProFacade } from './device-pro.ts'
import { DeviceV2Facade } from './device-v2.ts'
import { DeviceFacade } from './device.ts'

import type { IDeviceModel } from '../models/interfaces.ts'
import type { IAPI } from '../services/interfaces.ts'

import type { IDeviceFacade } from './interfaces.ts'

export class FacadeManager {
  public readonly api: IAPI

  readonly #facades = new Map<string, IDeviceFacade>()

  public constructor(api: IAPI) {
    this.api = api
  }

  public get(): undefined
  public get(instance: IDeviceModel): IDeviceFacade
  public get(instance?: IDeviceModel): IDeviceFacade | undefined {
    if (instance) {
      const { id, product } = instance
      if (!this.#facades.has(id)) {
        switch (product) {
          case 'glow':
            this.#facades.set(id, new DeviceGlowFacade(this.api, instance))
            break
          case 'pro':
            this.#facades.set(id, new DeviceProFacade(this.api, instance))
            break
          case 'v1':
            this.#facades.set(id, new DeviceFacade(this.api, instance))
            break
          case 'v2':
          case 'v4':
            this.#facades.set(id, new DeviceV2Facade(this.api, instance))
            break
          default:
        }
      }
      return this.#facades.get(id)
    }
  }
}
