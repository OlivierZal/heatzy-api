import type { IDeviceFacade } from '../facades/interfaces.ts'
import type { Attrs } from '../types.ts'

export const updateDevice = <T extends Attrs>(
  target: (...args: any[]) => Promise<T>,
  _context: ClassMethodDecoratorContext,
): ((...args: unknown[]) => Promise<T>) =>
  async function newTarget(this: IDeviceFacade, ...args: unknown[]) {
    const data = await target.call(this, ...args)
    this.device.update(data)
    return data
  }
