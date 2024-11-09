import type { DeviceFacade } from '../facades/device.js'
import type { API } from '../services/api.js'
import type { Attrs, BaseAttrs, Device } from '../types.js'

export const syncDevices = <T extends Attrs | BaseAttrs | readonly Device[]>(
  target: (...args: any[]) => Promise<T>,
  _context: ClassMethodDecoratorContext,
): ((...args: unknown[]) => Promise<T>) =>
  async function newTarget(this: API | DeviceFacade, ...args: unknown[]) {
    const data = await target.call(this, ...args)
    await ('api' in this ? this.api : this).onSync?.()
    return data
  }
