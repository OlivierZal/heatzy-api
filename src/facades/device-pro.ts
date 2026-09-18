import {
  DerogationMode,
  isMode,
  Mode,
  TEMPERATURE_SCALE,
} from '../constants.ts'
import { DeviceGlowFacade } from './device-glow.ts'

/**
 * Facade for Pro products: single-register temperatures, humidity and
 * reported-mode measures, open-window detection, and the presence
 * derogation.
 * @category Facades
 */
export class DeviceProFacade extends DeviceGlowFacade {
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
   * @returns The reported mode, or `null` when the wire answers a value
   * this SDK does not model (a code outside the six labels, `null`).
   */
  public get currentMode(): Mode | null {
    const value: unknown = this.getValue('cur_mode')
    return isMode(value) ? value : null
  }

  /**
   * The pilot-wire order the module is sending to the radiator right
   * now (wire `cur_signal`, Pro only). The Pro regulates on its own
   * sensor, so under one commanded `mode` it alternates between
   * comfort and eco — this says which of them is on the wire.
   * @returns The order being sent, or `null` when the wire answers a
   * value this SDK does not model, or none at all.
   */
  public get currentSignal(): Mode | null {
    const value: unknown = this.data.cur_signal
    return isMode(value) ? value : null
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
      this.derogationMode === DerogationMode.presence &&
      this.currentMode === Mode.comfort
    )
  }

  protected override getTemperature(
    mode: 'cur' | typeof Mode.comfort | typeof Mode.eco = 'cur',
  ): number {
    return this.getValue(`${mode}_temp`) / TEMPERATURE_SCALE
  }
}
