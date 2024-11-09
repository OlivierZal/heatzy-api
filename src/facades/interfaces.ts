import type { DerogMode, Mode, Switch } from '../enums.js'
import type { IBaseDeviceModel } from '../models/interfaces.js'
import type { Attrs, BaseAttrs } from '../types.js'

export interface DerogSettings {
  derogEnd: string | null
  derogTimeBoost: number
  derogTimeVacation: number
}

export interface IDeviceFacade extends IBaseDeviceModel {
  get: () => Promise<Attrs>
  mode: keyof typeof Mode
  set: (data: BaseAttrs) => Promise<BaseAttrs>
  cftTempH?: number
  cftTempL?: number
  derogMode?: DerogMode
  derogSettings?: DerogSettings
  derogTime?: number
  lockSwitch?: Switch
  timerSwitch?: Switch
}
