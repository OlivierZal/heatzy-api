import type { DeviceFacade } from '../facades/device.ts'
import type { Attrs } from '../types.ts'

export const updateDevice = <T extends Attrs>(
  target: (...args: any[]) => Promise<T>,
  _context: ClassMethodDecoratorContext,
): ((...args: unknown[]) => Promise<T>) =>
  async function newTarget(this: DeviceFacade, ...args: unknown[]) {
    const data = await target.call(this, ...args)
    this.instance.update(data)
    return data
  }
