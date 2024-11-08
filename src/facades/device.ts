import { DateTime } from 'luxon'

import { UNIT } from '../constants.js'
import { syncDevices } from '../decorators/syncDevices.js'
import { updateDevice } from '../decorators/updateDevice.js'
import { DerogMode, type Mode, type Switch } from '../enums.js'
import { DeviceModel } from '../models/device.js'

import type { API } from '../services/api.js'
import type { Attrs, DevicePostDataAny } from '../types.js'

import type { DerogSettings, IDeviceFacade } from './interfaces.js'
import type { FacadeManager } from './manager.js'

const getVacationEnd = (days: number): string =>
  DateTime.now().plus({ days }).toLocaleString({
    day: 'numeric',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: 'short',
  })

const getBoostEnd = (minutes: number): string =>
  DateTime.now().plus({ minutes }).toLocaleString(DateTime.TIME_24_SIMPLE)

export class DeviceFacade implements IDeviceFacade {
  public readonly api: API

  public readonly id: string

  readonly #isFirstGen: boolean

  public constructor(manager: FacadeManager, instance: DeviceModel) {
    ;({ api: this.api } = manager)
    ;({ id: this.id, isFirstGen: this.#isFirstGen } = instance)
  }

  public get cftTempH(): number | undefined {
    return this.data.cft_tempH
  }

  public get cftTempL(): number | undefined {
    return this.data.cft_tempL
  }

  public get data(): Attrs {
    return this.instance.data
  }

  public get derogMode(): DerogMode | undefined {
    return this.data.derog_mode
  }

  public get derogSettings(): DerogSettings | undefined {
    if (this.derogMode !== undefined && this.derogTime !== undefined) {
      switch (this.derogMode) {
        case DerogMode.boost:
          return {
            derogEnd: getBoostEnd(this.derogTime),
            derogTimeBoost: this.derogTime,
            derogTimeVacation: 0,
          }
        case DerogMode.off:
          return {
            derogEnd: null,
            derogTimeBoost: 0,
            derogTimeVacation: 0,
          }
        case DerogMode.vacation:
          return {
            derogEnd: getVacationEnd(this.derogTime),
            derogTimeBoost: 0,
            derogTimeVacation: this.derogTime,
          }
        default:
      }
    }
    return undefined
  }

  public get derogTime(): number | undefined {
    return this.data.derog_time
  }

  public get lockSwitch(): Switch | undefined {
    return this.data.lock_switch
  }

  public get mode(): Mode {
    const {
      data: { mode },
    } = this
    if (mode === undefined) {
      throw new Error('Mode undefined')
    }
    return mode
  }

  public get name(): string {
    return this.instance.name
  }

  public get timerSwitch(): Switch | undefined {
    return this.data.timer_switch
  }

  protected get instance(): DeviceModel {
    const instance = DeviceModel.getById(this.id)
    if (!instance) {
      throw new Error('Device not found')
    }
    return instance
  }

  @syncDevices
  @updateDevice
  public async get(): Promise<Attrs> {
    return (await this.api.deviceData({ id: this.id })).data.attr
  }

  @syncDevices
  @updateDevice
  public async set(data: Attrs): Promise<Attrs> {
    const postData = this.#handle(data)
    if (postData) {
      await this.api.control({
        id: this.id,
        postData,
      })
    }
    return data
  }

  #handle(attrs: Attrs): DevicePostDataAny | undefined {
    if (Object.keys(attrs).length) {
      if (this.#isFirstGen) {
        return attrs.mode === undefined ?
            undefined
          : { raw: [UNIT, UNIT, attrs.mode] }
      }
      return { attrs }
    }
  }
}
