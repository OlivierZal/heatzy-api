import type { DateTime } from 'luxon'

import type { IAPI } from '../services/index.ts'
import type { Attributes, PostAttributes } from '../types.ts'

import { POST_DATA_UNIT } from '../constants.ts'
import { syncDevices, updateDevice } from '../decorators/index.ts'
import { Mode, modeToModeV1 } from '../enums.ts'
import {
  type IDeviceModel,
  type PreviousMode,
  type Product,
  DeviceModel,
} from '../models/index.ts'

import type { IDeviceFacade } from './interfaces.ts'

const isModeV1 = (value?: Mode): value is keyof typeof modeToModeV1 =>
  value !== undefined && value in modeToModeV1

export class DeviceFacade implements IDeviceFacade {
  public readonly id: string

  public readonly product: Product

  protected readonly api: IAPI

  public constructor(api: IAPI, instance: IDeviceModel) {
    this.api = api
    ;({ id: this.id, product: this.product } = instance)
  }

  public get derogationEndDate(): DateTime | null {
    return this.instance.derogationEndDate
  }

  public get isOn(): boolean {
    return this.mode !== Mode.Stop
  }

  public get mode(): Mode {
    return this.getValue('mode')
  }

  public get name(): string {
    return this.instance.name
  }

  public get previousMode(): PreviousMode {
    return this.instance.previousMode
  }

  protected get data(): Attributes {
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
  public async setValues(
    attributes: PostAttributes,
  ): Promise<Partial<Attributes>> {
    return this.control(attributes)
  }

  @syncDevices
  @updateDevice
  public async values(): Promise<Attributes> {
    const {
      data: { attr },
    } = await this.api.deviceData({ id: this.id })
    return attr
  }

  public update(data: Partial<Attributes>): void {
    this.instance.update(data)
  }

  protected async control({
    mode,
  }: PostAttributes): Promise<Partial<Attributes>> {
    if (isModeV1(mode)) {
      const { [mode]: modeV1 } = modeToModeV1
      await this.api.control({
        id: this.id,
        postData: { raw: [POST_DATA_UNIT, POST_DATA_UNIT, Number(modeV1)] },
      })
      return { mode }
    }
    return {}
  }

  protected getValue<T extends keyof Attributes>(
    key: T,
  ): NonNullable<Attributes[T]> {
    const {
      data: { [key]: value },
    } = this
    if (value === undefined) {
      throw new Error(`${key} not found`)
    }
    return value
  }
}
