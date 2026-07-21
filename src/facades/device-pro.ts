import { DerogationMode, Mode, TEMPERATURE_SCALE } from '../constants.ts'
import { DeviceGlowFacade } from './device-glow.ts'

/**
 * Facade for Pro products: single-register temperatures, humidity and
 * reported-mode measures, open-window detection, and the presence
 * derogation.
 * @category Facades
 */
export class DeviceProFacade extends DeviceGlowFacade {
  public override get comfortTemperature(): number {
    return this.getTargetTemperature(Mode.comfort)
  }

  /**
   * The measured relative humidity.
   * @returns The reading in %.
   */
  public get currentHumidity(): number {
    return this.getValue('cur_humi')
  }

  /**
   * The mode the device is actually applying right now (wire
   * `cur_mode`), which can differ from the commanded `mode` during a
   * presence derogation.
   * @returns The reported mode.
   */
  public get currentMode(): Mode {
    return this.getValue('cur_mode')
  }

  public override get currentTemperature(): number {
    return this.getTemperature()
  }

  public override get ecoTemperature(): number {
    return this.getTargetTemperature(Mode.eco)
  }

  /**
   * Whether the device has detected an open window and paused heating.
   * @returns `true` while open-window detection is triggered.
   */
  public get isDetectingOpenWindow(): boolean {
    return Boolean(this.getValue('window_switch'))
  }

  public override get isLocked(): boolean {
    return Boolean(this.getValue('lock_switch'))
  }

  public override get isOn(): boolean {
    return this.mode !== Mode.stop
  }

  /**
   * Whether a presence derogation is running and currently applying
   * comfort.
   * @returns `true` during an active presence window.
   */
  public get isPresence(): boolean {
    return (
      this.getValue('derog_mode') === DerogationMode.presence &&
      this.currentMode === Mode.comfort
    )
  }

  protected override getTemperature(
    mode: 'cur' | typeof Mode.comfort | typeof Mode.eco = 'cur',
  ): number {
    return this.getValue(`${mode}_temp`) / TEMPERATURE_SCALE
  }
}
