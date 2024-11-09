import { Mode } from '../enums.js'

import type { DeviceFacade } from '../facades/device.js'
import type { Attrs, BaseAttrs } from '../types.js'

const convertToAttrs = (data: Attrs | BaseAttrs): Partial<Attrs> =>
  typeof data.mode === 'number' ?
    { ...data, mode: Mode[data.mode] as keyof typeof Mode }
  : (data as Partial<Attrs>)

export const updateDevice = <T extends Attrs | BaseAttrs>(
  target: (...args: any[]) => Promise<T>,
  _context: ClassMethodDecoratorContext,
): ((...args: unknown[]) => Promise<T>) =>
  async function newTarget(this: DeviceFacade, ...args: unknown[]) {
    const data = await target.call(this, ...args)
    this.instance.update(convertToAttrs(data))
    return data
  }
