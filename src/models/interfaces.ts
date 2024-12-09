import type { Attrs } from '../types.ts'
import type { Product } from '../utils.ts'

export interface IBaseDeviceModel {
  id: string
  name: string
}

export interface IDeviceModel extends IBaseDeviceModel {
  data: Attrs
  product: Product
  productKey: string
  productName: string
  update: (data: Attrs) => void
}
