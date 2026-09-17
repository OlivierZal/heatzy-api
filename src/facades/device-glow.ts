import { GLOW_SETPOINT_RANGES, Mode, TEMPERATURE_SCALE } from '../constants.ts'
import { clampToRange } from '../utils.ts'
import { DeviceV2Facade } from './device-v2.ts'

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
   * The sensor calibration register. On the Pro it reads 0–100 in
   * tenths of a degree centred on 50 (no change); the Glow family
   * declares it over 0–255 with no documented scale, so the raw value
   * is answered as is (`TemperatureCompensation` names the Pro's
   * anchors).
   * @returns The wire `com_temp` value.
   */
  public get temperatureCompensation(): number {
    return this.getValue('com_temp')
  }

  protected getTargetTemperature(
    mode: typeof Mode.comfort | typeof Mode.eco,
  ): number {
    return clampToRange(this.getTemperature(mode), GLOW_SETPOINT_RANGES[mode])
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
