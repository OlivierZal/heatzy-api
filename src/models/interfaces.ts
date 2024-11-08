import type { Attrs } from '../types.js'

export interface IBaseDeviceModel {
  data: Attrs
  id: string
  isFirstGen: boolean
  isFirstPilot: boolean
  isGlow: boolean
  name: string
}

export interface IDeviceModel extends IBaseDeviceModel {
  productKey: string
  productName: string
  update: (data: Attrs) => void
}
