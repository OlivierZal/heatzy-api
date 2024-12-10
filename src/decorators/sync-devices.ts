import type { IDeviceFacade } from '../facades/interfaces.ts'
import type { IAPI } from '../services/interfaces.ts'
import type { Attrs, Device } from '../types.ts'

export const syncDevice = <T extends Attrs | readonly Device[]>(
  target: (...args: any[]) => Promise<T>,
  _context: ClassMethodDecoratorContext,
): ((...args: unknown[]) => Promise<T>) =>
  async function newTarget(this: IAPI | IDeviceFacade, ...args: unknown[]) {
    const data = await target.call(this, ...args)
    await this.onSync?.()
    return data
  }
