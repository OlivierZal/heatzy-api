import {
  type TemperatureCompensation,
  Mode,
  TEMPERATURE_SCALE,
} from '../constants.ts'
import { DeviceV2Facade } from './device-v2.ts'

const COMFORT_RANGE = { max: 30, min: 15 } as const
const ECO_RANGE = { max: 19, min: 10 } as const

/**
 * Facade for Glow products (incl. Onyx and Shine): split high/low
 * temperature registers, a dedicated on/off switch, and a temperature
 * compensation offset.
 * @category Facades
 */
export class DeviceGlowFacade extends DeviceV2Facade {
  /**
   * The comfort target temperature, clamped to the wire's accepted
   * range.
   * @returns The setpoint in °C.
   */
  public get comfortTemperature(): number {
    return this.getTargetTemperature(Mode.comfort)
  }

  /**
   * The measured ambient temperature.
   * @returns The reading in °C.
   */
  public get currentTemperature(): number {
    return this.getTemperature()
  }

  /**
   * The eco target temperature, clamped to the wire's accepted range.
   * @returns The setpoint in °C.
   */
  public get ecoTemperature(): number {
    return this.getTargetTemperature(Mode.eco)
  }

  public override get isLocked(): boolean {
    return Boolean(this.getValue('LOCK_C'))
  }

  public override get isOn(): boolean {
    return Boolean(this.getValue('on_off'))
  }

  /**
   * The temperature compensation offset (wire-encoded around 50 = no
   * change).
   * @returns The wire `com_temp` value.
   */
  public get temperatureCompensation(): TemperatureCompensation {
    return this.getValue('com_temp')
  }

  protected getTargetTemperature(
    mode: typeof Mode.comfort | typeof Mode.eco,
  ): number {
    const { max, min } = mode === Mode.comfort ? COMFORT_RANGE : ECO_RANGE
    return Math.max(Math.min(this.getTemperature(mode), max), min)
  }

  // Glow encodes temperatures across two registers: `tempH` carries
  // hundreds of tenths, `tempL` the remainder in tenths.
  protected getTemperature(
    mode: 'cur' | typeof Mode.comfort | typeof Mode.eco = 'cur',
  ): number {
    return (
      this.getValue(`${mode}_tempH`) * TEMPERATURE_SCALE +
      this.getValue(`${mode}_tempL`) / TEMPERATURE_SCALE
    )
  }
}
