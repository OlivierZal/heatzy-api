import type { Attrs } from '../types.js'

export interface IBaseDeviceModel {
  data: Attrs
  id: string
  name: string
}

export interface IDeviceModel extends IBaseDeviceModel {
  isFirstGen: boolean
  isFirstPilot: boolean
  isGlow: boolean
  productKey: string
  productName: string
  update: (data: Attrs) => void
}
