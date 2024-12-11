import { DateTime } from 'luxon'

import { DerogMode, Mode } from '../enums.ts'
import { supportsPro, type IDeviceFacadeAny } from '../facades/interfaces.ts'

import type { Attrs } from '../types.ts'

export const updateDevice = <T extends Partial<Attrs>>(
  target: (...args: any[]) => Promise<T>,
  _context: ClassMethodDecoratorContext,
): ((...args: unknown[]) => Promise<T>) =>
  async function newTarget(this: IDeviceFacadeAny, ...args: unknown[]) {
    const data = await target.call(this, ...args)
    const { device } = this
    if (supportsPro(this) && this.derogMode === DerogMode.presence) {
      const {
        data: { cur_mode: previousMode },
      } = device
      const { cur_mode: currentMode } = data
      if (currentMode !== undefined && currentMode !== previousMode) {
        this.derogEndDate =
          [Mode.cft, Mode.cft1, Mode.cft2, Mode.eco].includes(currentMode) ?
            DateTime.now().plus({ minutes: 15 })
          : null
      }
    }
    device.update(data)
    return data
  }
