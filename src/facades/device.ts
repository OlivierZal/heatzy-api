import { UNIT } from '../constants.ts'
import { syncDevices } from '../decorators/sync-devices.ts'
import { updateDevice } from '../decorators/update-device.ts'
import { Mode } from '../enums.ts'
import { DeviceModel } from '../models/device.ts'

import type { IDeviceModel } from '../models/interfaces.ts'
import type { IAPI } from '../services/interfaces.ts'
import type { Attrs } from '../types.ts'

import type { IDeviceFacade } from './interfaces.ts'

export class DeviceFacade implements IDeviceFacade {
  public readonly id: string

  public readonly supportsExtendedMode: boolean

  protected readonly api: IAPI

  public constructor(api: IAPI, instance: IDeviceModel) {
    this.api = api
    ;({ id: this.id } = instance)
    this.supportsExtendedMode = !['v1', 'v2'].includes(instance.product)
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

  public get onOff(): boolean {
    return this.mode === Mode.stop
  }

  public async onSync(): Promise<void> {
    await this.api.onSync?.({ ids: [this.id] })
  }

  @syncDevices
  @updateDevice
  public async setValues(attrs: Attrs): Promise<Attrs> {
    const { mode } = attrs
    if (mode !== undefined) {
      await this.api.control({
        id: this.id,
        postData: { raw: [UNIT, UNIT, mode] },
      })
    }
    return attrs
  }

  @syncDevices
  @updateDevice
  public async values(): Promise<Attrs> {
    return (await this.api.deviceData({ id: this.id })).data.attr
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
