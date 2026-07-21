import { Product } from '../constants.ts'
import type { DeviceGlowFacade } from './device-glow.ts'
import type { DeviceProFacade } from './device-pro.ts'
import type { DeviceV2Facade } from './device-v2.ts'
import type { DeviceFacade } from './device.ts'

/**
 * Union of every facade generation {@link FacadeManager.get} can
 * return. Narrow with {@link supportsV2}, {@link supportsGlow} and
 * {@link supportsPro} before reading generation-specific members.
 * @category Facades
 */
export type DeviceFacadeAny =
  DeviceFacade | DeviceGlowFacade | DeviceProFacade | DeviceV2Facade

/**
 * Whether the facade's product generation carries the Glow surface
 * (split temperature registers, on/off switch, compensation).
 * @param device - The facade to narrow.
 * @returns `true` for Glow and Pro products.
 * @category Facades
 */
export const supportsGlow = (
  device: DeviceFacadeAny,
): device is DeviceGlowFacade => device.product >= Product.glow

/**
 * Whether the facade's product generation carries the Pro surface
 * (measures, open-window detection, presence).
 * @param device - The facade to narrow.
 * @returns `true` for Pro products.
 * @category Facades
 */
export const supportsPro = (
  device: DeviceFacadeAny,
): device is DeviceProFacade => device.product >= Product.pro

/**
 * Whether the facade's product generation carries the V2 surface
 * (named-attribute control, derogations, timer, lock).
 * @param device - The facade to narrow.
 * @returns `true` for every product but V1.
 * @category Facades
 */
export const supportsV2 = (device: DeviceFacadeAny): device is DeviceV2Facade =>
  device.product >= Product.v2
