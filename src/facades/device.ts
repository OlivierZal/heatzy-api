import { UNIT } from '../constants.ts'
import { syncDevices } from '../decorators/sync-devices.ts'
import { updateDevice } from '../decorators/update-device.ts'
import { Mode, ModeV1 } from '../enums.ts'
import { DeviceModel } from '../models/device.ts'

import type { IDeviceModel, Product } from '../models/interfaces.ts'
import type { IAPI } from '../services/interfaces.ts'
import type { Attrs, PostAttrs } from '../types.ts'

import type { IDeviceFacade } from './interfaces.ts'

const isModeV1 = (mode?: string): mode is keyof typeof ModeV1 =>
  mode !== undefined && mode in ModeV1

export class DeviceFacade implements IDeviceFacade {
  public readonly doesNotSupportExtendedMode: boolean

  public readonly id: string

  public readonly product: Product

  protected readonly api: IAPI

  public constructor(api: IAPI, instance: IDeviceModel) {
    this.api = api
    ;({
      doesNotSupportExtendedMode: this.doesNotSupportExtendedMode,
      id: this.id,
      product: this.product,
    } = instance)
  }

  public get isOn(): boolean {
    return this.mode === Mode.stop
  }

  public get mode(): Mode {
    return this.getValue('mode')
  }

  public get name(): string {
    return this.instance.name
  }

  protected get data(): Attrs {
    return this.instance.data
  }

  protected get instance(): IDeviceModel {
    const instance = DeviceModel.getById(this.id)
    if (!instance) {
      throw new Error('Device not found')
    }
    return instance
  }

  public async onSync(): Promise<void> {
    await this.api.onSync?.({ ids: [this.id] })
  }

  @syncDevices
  @updateDevice
  public async setValues({ mode }: PostAttrs): Promise<Partial<Attrs>> {
    if (isModeV1(mode)) {
      await this.api.control({
        id: this.id,
        postData: { raw: [UNIT, UNIT, ModeV1[mode]] },
      })
      return { mode }
    }
    return {}
  }

  @syncDevices
  @updateDevice
  public async values(): Promise<Attrs> {
    return (await this.api.deviceData({ id: this.id })).data.attr
  }

  public update(data: Partial<Attrs>): void {
    this.instance.update(data)
  }

  protected getValue<T extends keyof Attrs>(key: T): NonNullable<Attrs[T]> {
    const {
      data: { [key]: value },
    } = this
    if (value === undefined) {
      throw new Error(`${key} not found`)
    }
    return value
  }
}
