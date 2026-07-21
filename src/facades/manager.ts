import type { HeatzyAPIAdapter } from '../api/types.ts'
import type { Device } from '../entities/index.ts'
import { Product } from '../constants.ts'
import type { DeviceFacadeAny } from './types.ts'
import { DeviceGlowFacade } from './device-glow.ts'
import { DeviceProFacade } from './device-pro.ts'
import { DeviceV2Facade } from './device-v2.ts'
import { DeviceFacade } from './device.ts'

const createFacade = (
  api: HeatzyAPIAdapter,
  device: Device,
): DeviceFacadeAny => {
  switch (device.product) {
    case Product.glow: {
      return new DeviceGlowFacade(api, device)
    }
    case Product.pro: {
      return new DeviceProFacade(api, device)
    }
    case Product.v1: {
      return new DeviceFacade(api, device)
    }
    case Product.v2:
    case Product.v4: {
      return new DeviceV2Facade(api, device)
    }
  }
}

/**
 * Lazily creates and caches facade instances using a WeakMap keyed by
 * entity reference. Ensures each registry entity maps to exactly one
 * facade throughout its lifetime.
 * @category Facades
 */
export class FacadeManager {
  readonly #api: HeatzyAPIAdapter

  readonly #facades = new WeakMap<Device, DeviceFacadeAny>()

  /**
   * Builds a facade manager bound to the given API client; facades it
   * returns share that reference.
   * @param api - Heatzy API client.
   */
  public constructor(api: HeatzyAPIAdapter) {
    this.#api = api
  }

  /**
   * Returns the cached facade for the given entity, lazily creating
   * one on first access; passing `undefined` returns `null`.
   * @param instance - Registry entity to wrap, or `undefined`.
   * @returns The facade, or `null` when no instance was supplied.
   */
  public get(instance: Device): DeviceFacadeAny
  public get(): null
  public get(instance?: Device): DeviceFacadeAny | null
  public get(instance?: Device): DeviceFacadeAny | null {
    if (instance === undefined) {
      return null
    }
    let facade = this.#facades.get(instance)
    if (facade === undefined) {
      facade = createFacade(this.#api, instance)
      this.#facades.set(instance, facade)
    }
    return facade
  }
}
