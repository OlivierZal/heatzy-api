import type { DeviceFacade } from '../facades/device.js'
import type { Attrs } from '../types.js'

export const updateDevice = (
  target: (...args: any[]) => Promise<Attrs>,
  _context: ClassMethodDecoratorContext,
): ((...args: unknown[]) => Promise<Attrs>) =>
  async function newTarget(this: DeviceFacade, ...args: unknown[]) {
    const data = await target.call(this, ...args)
    this.instance.update(data)
    return data
  }
