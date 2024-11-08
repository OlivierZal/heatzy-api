import { DeviceFacade } from './device.js'

import type { DeviceModel } from '../models/device.js'
import type { API } from '../services/api.js'

export class FacadeManager {
  public readonly api: API

  readonly #facades = new Map<string, DeviceFacade>()

  public constructor(api: API) {
    this.api = api
  }

  public get(): undefined
  public get(instance: DeviceModel): DeviceFacade
  public get(instance?: DeviceModel): DeviceFacade | undefined {
    if (instance) {
      const {
        constructor: { name },
      } = instance
      const modelId = String(instance.id)
      const id = `${name}:${modelId}`
      if (!this.#facades.has(id)) {
        this.#facades.set(id, new DeviceFacade(this, instance))
      }
      return this.#facades.get(id)
    }
  }
}
