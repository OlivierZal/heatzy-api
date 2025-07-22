import type { IDeviceFacade } from '../facades/index.ts'
import type { IAPI } from '../services/index.ts'
import type { Attributes, Device } from '../types.ts'

export const syncDevices = <T extends Partial<Attributes> | readonly Device[]>(
  target: (...args: any[]) => Promise<T>,
  _context: ClassMethodDecoratorContext,
): ((...args: unknown[]) => Promise<T>) =>
  async function newTarget(this: IAPI | IDeviceFacade, ...args: unknown[]) {
    const data = await target.call(this, ...args)
    await this.onSync?.()
    return data
  }
