import { DeviceFacade } from './device.ts'

import type { IDeviceModel } from '../models/interfaces.ts'
import type { IAPI } from '../services/interfaces.ts'

export class FacadeManager {
  public readonly api: IAPI

  readonly #facades = new Map<string, DeviceFacade>()

  public constructor(api: IAPI) {
    this.api = api
  }

  public get(): undefined
  public get(instance: IDeviceModel): DeviceFacade
  public get(instance?: IDeviceModel): DeviceFacade | undefined {
    if (instance) {
      const {
        constructor: { name },
      } = instance
      const modelId = String(instance.id)
      const id = `${name}:${modelId}`
      if (!this.#facades.has(id)) {
        this.#facades.set(id, new DeviceFacade(this.api, instance))
      }
      return this.#facades.get(id)
    }
  }
}
