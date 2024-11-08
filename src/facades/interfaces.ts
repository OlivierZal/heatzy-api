import type { DerogMode, Mode, Switch } from '../enums.js'
import type { IBaseDeviceModel } from '../models/interfaces.js'
import type { Attrs } from '../types.js'

export interface DerogSettings {
  derogEnd: string | null
  derogTimeBoost: number
  derogTimeVacation: number
}

export interface IDeviceFacade extends IBaseDeviceModel {
  get: () => Promise<Attrs>
  mode: Mode
  set: (data: Attrs) => Promise<Attrs>
  cftTempH?: number
  cftTempL?: number
  derogMode?: DerogMode
  derogSettings?: DerogSettings
  derogTime?: number
  lockSwitch?: Switch
  timerSwitch?: Switch
}
