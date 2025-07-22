import type { IDeviceFacadeAny } from '../facades/index.ts'
import type { Attributes } from '../types.ts'

export const updateDevice = <T extends Partial<Attributes>>(
  target: (...args: any[]) => Promise<T>,
  _context: ClassMethodDecoratorContext,
): ((...args: unknown[]) => Promise<T>) =>
  async function newTarget(this: IDeviceFacadeAny, ...args: unknown[]) {
    const data = await target.call(this, ...args)
    this.update(data)
    return data
  }
