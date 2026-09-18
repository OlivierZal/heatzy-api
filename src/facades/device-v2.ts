import type { ControlAttributes } from '../types/index.ts'
import { DerogationMode, isDerogationMode } from '../constants.ts'
import { DeviceFacade } from './device.ts'

/**
 * Facade for V2/V4 products: named-attribute control, derogations
 * (boost, vacation), timer and lock switches.
 * @category Facades
 */
export class DeviceV2Facade extends DeviceFacade {
  /**
   * The running derogation's end, formatted for display in the
   * configured locale — time-of-day for boost and presence, day +
   * month + time for vacation. `null` when no derogation is running,
   * when its code is one this SDK does not model, or when it was
   * already running at first sight: the wire carries no start
   * timestamp, so the end is only derived when a change is observed
   * (see {@link Device.derogationEndDate}).
   * @returns The formatted end label, or `null`.
   */
  public get derogationEndString(): string | null {
    const { derogationEndDate, derogationMode } = this
    if (
      derogationEndDate === null ||
      derogationMode === null ||
      derogationMode === DerogationMode.off
    ) {
      return null
    }
    return derogationMode === DerogationMode.vacation
      ? derogationEndDate.toLocaleString(this.api.locale, {
          day: 'numeric',
          hour: '2-digit',
          hourCycle: 'h23',
          minute: '2-digit',
          month: 'short',
        })
      : derogationEndDate.toLocaleString(this.api.locale, {
          hour: '2-digit',
          hourCycle: 'h23',
          minute: '2-digit',
        })
  }

  /**
   * The running derogation mode.
   * @returns The wire `derog_mode` value, or `null` for a code the wire
   * allows but this SDK does not model (4 and 5 on the Pro and the Glow
   * family).
   */
  public get derogationMode(): DerogationMode | null {
    const value = this.getValue('derog_mode')
    return isDerogationMode(value) ? value : null
  }

  /**
   * The derogation duration — minutes for boost, days for vacation.
   * @returns The wire `derog_time` value.
   */
  public get derogationTime(): number {
    return this.getValue('derog_time')
  }

  /**
   * Whether the physical controls are locked.
   * @returns `true` when the child lock is on.
   */
  public get isLocked(): boolean {
    return Boolean(this.getValue('lock_switch'))
  }

  /**
   * Whether the on-device program timer is running.
   * @returns `true` when the timer is on.
   */
  public get isTimer(): boolean {
    return Boolean(this.getValue('timer_switch'))
  }

  protected override async control(
    attributes: ControlAttributes,
  ): Promise<ControlAttributes> {
    if (Object.keys(attributes).length > 0) {
      await this.api.updateValues({
        id: this.id,
        postData: { attrs: attributes },
      })
    }
    return attributes
  }
}
