# Heatzy API for Node.js - v4.5.1

## Enumerations

### DerogMode

#### Enumeration Members

| Enumeration Member | Value | Defined in                                                                                                               |
| ------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------ |
| `boost`            | `2`   | [src/enums.ts:2](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/enums.ts#L2) |
| `off`              | `0`   | [src/enums.ts:3](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/enums.ts#L3) |
| `presence`         | `3`   | [src/enums.ts:6](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/enums.ts#L6) |
| `vacation`         | `1`   | [src/enums.ts:4](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/enums.ts#L4) |

---

### Mode

#### Enumeration Members

| Enumeration Member | Value    | Defined in                                                                                                                 |
| ------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `cft`              | `"cft"`  | [src/enums.ts:10](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/enums.ts#L10) |
| `cft1`             | `"cft1"` | [src/enums.ts:15](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/enums.ts#L15) |
| `cft2`             | `"cft2"` | [src/enums.ts:16](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/enums.ts#L16) |
| `eco`              | `"eco"`  | [src/enums.ts:11](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/enums.ts#L11) |
| `fro`              | `"fro"`  | [src/enums.ts:12](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/enums.ts#L12) |
| `stop`             | `"stop"` | [src/enums.ts:13](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/enums.ts#L13) |

---

### ModeV1

#### Enumeration Members

| Enumeration Member | Value | Defined in                                                                                                                 |
| ------------------ | ----- | -------------------------------------------------------------------------------------------------------------------------- |
| `cft`              | `0`   | [src/enums.ts:20](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/enums.ts#L20) |
| `eco`              | `1`   | [src/enums.ts:21](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/enums.ts#L21) |
| `fro`              | `2`   | [src/enums.ts:22](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/enums.ts#L22) |
| `stop`             | `3`   | [src/enums.ts:23](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/enums.ts#L23) |

---

### Switch

#### Enumeration Members

| Enumeration Member | Value | Defined in                                                                                                                 |
| ------------------ | ----- | -------------------------------------------------------------------------------------------------------------------------- |
| `off`              | `0`   | [src/enums.ts:27](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/enums.ts#L27) |
| `on`               | `1`   | [src/enums.ts:28](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/enums.ts#L28) |

---

### TemperatureCompensation

#### Enumeration Members

| Enumeration Member | Value | Defined in                                                                                                                 |
| ------------------ | ----- | -------------------------------------------------------------------------------------------------------------------------- |
| `minus5C`          | `0`   | [src/enums.ts:32](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/enums.ts#L32) |
| `noChange`         | `50`  | [src/enums.ts:33](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/enums.ts#L33) |
| `plus5C`           | `100` | [src/enums.ts:34](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/enums.ts#L34) |

## Classes

### DeviceModel

#### Implements

- [`IDeviceModel`](README.md#idevicemodel)

#### Properties

| Property                     | Modifier   | Type                           | Defined in                                                                                                                                 |
| ---------------------------- | ---------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `doesNotSupportExtendedMode` | `readonly` | `boolean`                      | [src/models/device.ts:8](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/device.ts#L8)   |
| `id`                         | `readonly` | `string`                       | [src/models/device.ts:10](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/device.ts#L10) |
| `name`                       | `readonly` | `string`                       | [src/models/device.ts:12](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/device.ts#L12) |
| `product`                    | `readonly` | [`Product`](README.md#product) | [src/models/device.ts:14](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/device.ts#L14) |
| `productKey`                 | `readonly` | `string`                       | [src/models/device.ts:16](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/device.ts#L16) |
| `productName`                | `readonly` | `string`                       | [src/models/device.ts:18](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/device.ts#L18) |

#### Accessors

##### data

###### Get Signature

```ts
get data(): Attrs
```

###### Returns

[`Attrs`](README.md#attrs)

###### Implementation of

[`IDeviceModel`](README.md#idevicemodel).`data`

###### Defined in

[src/models/device.ts:34](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/device.ts#L34)

#### Methods

##### update()

```ts
update(data: Partial<Attrs>): void
```

###### Parameters

| Parameter | Type                                    |
| --------- | --------------------------------------- |
| `data`    | `Partial`\<[`Attrs`](README.md#attrs)\> |

###### Returns

`void`

###### Implementation of

[`IDeviceModel`](README.md#idevicemodel).`update`

###### Defined in

[src/models/device.ts:59](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/device.ts#L59)

##### getAll()

```ts
static getAll(): DeviceModel[]
```

###### Returns

[`DeviceModel`](README.md#devicemodel)[]

###### Defined in

[src/models/device.ts:38](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/device.ts#L38)

##### getById()

```ts
static getById(id: string): undefined | DeviceModel
```

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `id`      | `string` |

###### Returns

`undefined` \| [`DeviceModel`](README.md#devicemodel)

###### Defined in

[src/models/device.ts:42](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/device.ts#L42)

##### getByName()

```ts
static getByName(name: string): undefined | DeviceModel
```

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `name`    | `string` |

###### Returns

`undefined` \| [`DeviceModel`](README.md#devicemodel)

###### Defined in

[src/models/device.ts:46](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/device.ts#L46)

##### sync()

```ts
static sync(devices: readonly Device[], data: Record<string, Attrs>): void
```

###### Parameters

| Parameter | Type                                             |
| --------- | ------------------------------------------------ |
| `devices` | readonly [`Device`](README.md#device)[]          |
| `data`    | `Record`\<`string`, [`Attrs`](README.md#attrs)\> |

###### Returns

`void`

###### Defined in

[src/models/device.ts:50](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/device.ts#L50)

---

### FacadeManager

#### Implements

- [`IFacadeManager`](README.md#ifacademanager)

#### Constructors

##### new FacadeManager()

```ts
new FacadeManager(api: IAPI): FacadeManager
```

###### Parameters

| Parameter | Type                     |
| --------- | ------------------------ |
| `api`     | [`IAPI`](README.md#iapi) |

###### Returns

[`FacadeManager`](README.md#facademanager)

###### Defined in

[src/facades/manager.ts:16](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/manager.ts#L16)

#### Properties

| Property | Modifier   | Type                     | Defined in                                                                                                                                     |
| -------- | ---------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `api`    | `readonly` | [`IAPI`](README.md#iapi) | [src/facades/manager.ts:12](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/manager.ts#L12) |

#### Methods

##### get()

###### Call Signature

```ts
get(): undefined
```

###### Returns

`undefined`

###### Implementation of

[`IFacadeManager`](README.md#ifacademanager).`get`

###### Defined in

[src/facades/manager.ts:20](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/manager.ts#L20)

###### Call Signature

```ts
get(instance: IDeviceModel): IDeviceFacadeAny
```

###### Parameters

| Parameter  | Type                                     |
| ---------- | ---------------------------------------- |
| `instance` | [`IDeviceModel`](README.md#idevicemodel) |

###### Returns

[`IDeviceFacadeAny`](README.md#idevicefacadeany)

###### Implementation of

`IFacadeManager.get`

###### Defined in

[src/facades/manager.ts:21](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/manager.ts#L21)

---

### HeatzyAPI

#### Implements

- [`IAPI`](README.md#iapi)

#### Constructors

##### new HeatzyAPI()

```ts
new HeatzyAPI(config: APIConfig): HeatzyAPI
```

###### Parameters

| Parameter | Type                               |
| --------- | ---------------------------------- |
| `config`  | [`APIConfig`](README.md#apiconfig) |

###### Returns

[`HeatzyAPI`](README.md#heatzyapi)

###### Defined in

[src/services/api.ts:83](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/api.ts#L83)

#### Properties

| Property          | Modifier   | Type                                         | Defined in                                                                                                                               |
| ----------------- | ---------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `onSync?`         | `readonly` | () => `Promise`\<`void`\>                    | [src/services/api.ts:69](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/api.ts#L69) |
| `settingManager?` | `readonly` | [`SettingManager`](README.md#settingmanager) | [src/services/api.ts:71](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/api.ts#L71) |

#### Methods

##### authenticate()

```ts
authenticate(data?: LoginPostData): Promise<boolean>
```

###### Parameters

| Parameter | Type                                       |
| --------- | ------------------------------------------ |
| `data`?   | [`LoginPostData`](README.md#loginpostdata) |

###### Returns

`Promise`\<`boolean`\>

###### Implementation of

[`IAPI`](README.md#iapi).`authenticate`

###### Defined in

[src/services/api.ts:144](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/api.ts#L144)

##### bindings()

```ts
bindings(): Promise<{
  data: Bindings;
}>
```

###### Returns

`Promise`\<\{
`data`: [`Bindings`](README.md#bindings-1);
\}\>

###### Implementation of

[`IAPI`](README.md#iapi).`bindings`

###### Defined in

[src/services/api.ts:158](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/api.ts#L158)

##### clearSync()

```ts
clearSync(): void
```

###### Returns

`void`

###### Implementation of

[`IAPI`](README.md#iapi).`clearSync`

###### Defined in

[src/services/api.ts:162](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/api.ts#L162)

##### control()

```ts
control(__namedParameters: {
  id: string;
  postData: DevicePostDataAny;
 }): Promise<{
  data: Data;
}>
```

###### Parameters

| Parameter                    | Type                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| `__namedParameters`          | \{ `id`: `string`; `postData`: [`DevicePostDataAny`](README.md#devicepostdataany); \} |
| `__namedParameters.id`       | `string`                                                                              |
| `__namedParameters.postData` | [`DevicePostDataAny`](README.md#devicepostdataany)                                    |

###### Returns

`Promise`\<\{
`data`: [`Data`](README.md#data-1);
\}\>

###### Implementation of

[`IAPI`](README.md#iapi).`control`

###### Defined in

[src/services/api.ts:169](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/api.ts#L169)

##### deviceData()

```ts
deviceData(__namedParameters: {
  id: string;
 }): Promise<{
  data: DeviceData;
}>
```

###### Parameters

| Parameter              | Type                  |
| ---------------------- | --------------------- |
| `__namedParameters`    | \{ `id`: `string`; \} |
| `__namedParameters.id` | `string`              |

###### Returns

`Promise`\<\{
`data`: [`DeviceData`](README.md#devicedata-1);
\}\>

###### Implementation of

[`IAPI`](README.md#iapi).`deviceData`

###### Defined in

[src/services/api.ts:179](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/api.ts#L179)

##### fetch()

```ts
fetch(): Promise<readonly Device[]>
```

###### Returns

`Promise`\<readonly [`Device`](README.md#device)[]\>

###### Implementation of

[`IAPI`](README.md#iapi).`fetch`

###### Defined in

[src/services/api.ts:129](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/api.ts#L129)

##### login()

```ts
login(__namedParameters: {
  postData: LoginPostData;
 }): Promise<{
  data: LoginData;
}>
```

###### Parameters

| Parameter                    | Type                                                          |
| ---------------------------- | ------------------------------------------------------------- |
| `__namedParameters`          | \{ `postData`: [`LoginPostData`](README.md#loginpostdata); \} |
| `__namedParameters.postData` | [`LoginPostData`](README.md#loginpostdata)                    |

###### Returns

`Promise`\<\{
`data`: [`LoginData`](README.md#logindata);
\}\>

###### Implementation of

[`IAPI`](README.md#iapi).`login`

###### Defined in

[src/services/api.ts:187](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/api.ts#L187)

##### create()

```ts
static create(config: APIConfig): Promise<HeatzyAPI>
```

###### Parameters

| Parameter | Type                               |
| --------- | ---------------------------------- |
| `config`  | [`APIConfig`](README.md#apiconfig) |

###### Returns

`Promise`\<[`HeatzyAPI`](README.md#heatzyapi)\>

###### Defined in

[src/services/api.ts:122](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/api.ts#L122)

## Interfaces

### APIConfig

#### Extends

- `Partial`\<[`LoginPostData`](README.md#loginpostdata)\>

#### Properties

| Property            | Modifier   | Type                                         | Inherited from     | Defined in                                                                                                                                             |
| ------------------- | ---------- | -------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `autoSyncInterval?` | `public`   | `null` \| `number`                           | -                  | [src/services/interfaces.ts:29](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/interfaces.ts#L29) |
| `language?`         | `public`   | `string`                                     | -                  | [src/services/interfaces.ts:30](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/interfaces.ts#L30) |
| `logger?`           | `public`   | [`Logger`](README.md#logger)                 | -                  | [src/services/interfaces.ts:31](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/interfaces.ts#L31) |
| `onSync?`           | `public`   | [`OnSyncFunction`](README.md#onsyncfunction) | -                  | [src/services/interfaces.ts:32](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/interfaces.ts#L32) |
| `password?`         | `readonly` | `string`                                     | `Partial.password` | [src/types.ts:57](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L57)                             |
| `settingManager?`   | `public`   | [`SettingManager`](README.md#settingmanager) | -                  | [src/services/interfaces.ts:33](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/interfaces.ts#L33) |
| `shouldVerifySSL?`  | `public`   | `boolean`                                    | -                  | [src/services/interfaces.ts:34](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/interfaces.ts#L34) |
| `timezone?`         | `public`   | `string`                                     | -                  | [src/services/interfaces.ts:35](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/interfaces.ts#L35) |
| `username?`         | `readonly` | `string`                                     | `Partial.username` | [src/types.ts:58](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L58)                             |

---

### APISettings

#### Properties

| Property    | Type               | Defined in                                                                                                                                             |
| ----------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `expireAt?` | `null` \| `string` | [src/services/interfaces.ts:12](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/interfaces.ts#L12) |
| `password?` | `null` \| `string` | [src/services/interfaces.ts:13](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/interfaces.ts#L13) |
| `token?`    | `null` \| `string` | [src/services/interfaces.ts:14](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/interfaces.ts#L14) |
| `username?` | `null` \| `string` | [src/services/interfaces.ts:15](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/interfaces.ts#L15) |

---

### Attrs

#### Extends

- [`PostAttrs`](README.md#postattrs)

#### Properties

| Property         | Modifier   | Type                                                           | Overrides                                 | Inherited from                                     | Defined in                                                                                                                 |
| ---------------- | ---------- | -------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `cft_temp?`      | `readonly` | `number`                                                       | -                                         | [`PostAttrs`](README.md#postattrs).`cft_temp`      | [src/types.ts:78](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L78) |
| `cft_tempH?`     | `readonly` | `number`                                                       | -                                         | [`PostAttrs`](README.md#postattrs).`cft_tempH`     | [src/types.ts:72](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L72) |
| `cft_tempL?`     | `readonly` | `number`                                                       | -                                         | [`PostAttrs`](README.md#postattrs).`cft_tempL`     | [src/types.ts:73](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L73) |
| `com_temp?`      | `readonly` | [`TemperatureCompensation`](README.md#temperaturecompensation) | -                                         | [`PostAttrs`](README.md#postattrs).`com_temp`      | [src/types.ts:70](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L70) |
| `cur_humi?`      | `readonly` | `number`                                                       | -                                         | -                                                  | [src/types.ts:16](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L16) |
| `cur_mode?`      | `readonly` | [`Mode`](README.md#mode)                                       | -                                         | -                                                  | [src/types.ts:17](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L17) |
| `cur_signal?`    | `readonly` | [`Mode`](README.md#mode)                                       | -                                         | -                                                  | [src/types.ts:18](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L18) |
| `cur_temp?`      | `readonly` | `number`                                                       | -                                         | -                                                  | [src/types.ts:19](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L19) |
| `cur_tempH?`     | `readonly` | `number`                                                       | -                                         | -                                                  | [src/types.ts:13](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L13) |
| `cur_tempL?`     | `readonly` | `number`                                                       | -                                         | -                                                  | [src/types.ts:14](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L14) |
| `derog_mode?`    | `readonly` | [`DerogMode`](README.md#derogmode)                             | -                                         | [`PostAttrs`](README.md#postattrs).`derog_mode`    | [src/types.ts:64](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L64) |
| `derog_time?`    | `readonly` | `number`                                                       | -                                         | [`PostAttrs`](README.md#postattrs).`derog_time`    | [src/types.ts:65](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L65) |
| `eco_temp?`      | `readonly` | `number`                                                       | -                                         | [`PostAttrs`](README.md#postattrs).`eco_temp`      | [src/types.ts:79](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L79) |
| `eco_tempH?`     | `readonly` | `number`                                                       | -                                         | [`PostAttrs`](README.md#postattrs).`eco_tempH`     | [src/types.ts:74](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L74) |
| `eco_tempL?`     | `readonly` | `number`                                                       | -                                         | [`PostAttrs`](README.md#postattrs).`eco_tempL`     | [src/types.ts:75](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L75) |
| `Heating_state?` | `readonly` | [`Switch`](README.md#switch)                                   | -                                         | -                                                  | [src/types.ts:20](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L20) |
| `lock_c?`        | `readonly` | [`Switch`](README.md#switch)                                   | -                                         | [`PostAttrs`](README.md#postattrs).`lock_c`        | [src/types.ts:76](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L76) |
| `lock_switch?`   | `readonly` | [`Switch`](README.md#switch)                                   | -                                         | [`PostAttrs`](README.md#postattrs).`lock_switch`   | [src/types.ts:68](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L68) |
| `mode`           | `readonly` | [`Mode`](README.md#mode)                                       | [`PostAttrs`](README.md#postattrs).`mode` | -                                                  | [src/types.ts:11](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L11) |
| `timer_switch?`  | `readonly` | [`Switch`](README.md#switch)                                   | -                                         | [`PostAttrs`](README.md#postattrs).`timer_switch`  | [src/types.ts:66](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L66) |
| `window_switch?` | `readonly` | [`Switch`](README.md#switch)                                   | -                                         | [`PostAttrs`](README.md#postattrs).`window_switch` | [src/types.ts:80](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L80) |

---

### Bindings

#### Properties

| Property  | Modifier   | Type                                    | Defined in                                                                                                                 |
| --------- | ---------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `devices` | `readonly` | readonly [`Device`](README.md#device)[] | [src/types.ts:24](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L24) |

---

### DerogSettings

#### Properties

| Property          | Type                               | Defined in                                                                                                                                           |
| ----------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `derogEndDate`    | `null` \| `DateTime`\<`boolean`\>  | [src/facades/interfaces.ts:8](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L8)   |
| `derogEndString`  | `null` \| `string`                 | [src/facades/interfaces.ts:9](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L9)   |
| `derogMode`       | [`DerogMode`](README.md#derogmode) | [src/facades/interfaces.ts:10](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L10) |
| `derogModeString` | `string`                           | [src/facades/interfaces.ts:11](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L11) |

---

### Device

#### Properties

| Property       | Modifier   | Type     | Defined in                                                                                                                 |
| -------------- | ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `dev_alias`    | `readonly` | `string` | [src/types.ts:28](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L28) |
| `did`          | `readonly` | `string` | [src/types.ts:29](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L29) |
| `product_key`  | `readonly` | `string` | [src/types.ts:30](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L30) |
| `product_name` | `readonly` | `string` | [src/types.ts:31](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L31) |

---

### DeviceData

#### Properties

| Property | Modifier   | Type                       | Defined in                                                                                                                 |
| -------- | ---------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `attr`   | `readonly` | [`Attrs`](README.md#attrs) | [src/types.ts:35](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L35) |

---

### DevicePostData

#### Properties

| Property | Modifier   | Type                               | Defined in                                                                                                                 |
| -------- | ---------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `attrs`  | `readonly` | [`PostAttrs`](README.md#postattrs) | [src/types.ts:39](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L39) |

---

### DeviceV1PostData

#### Properties

| Property | Modifier   | Type                                     | Defined in                                                                                                                 |
| -------- | ---------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `raw`    | `readonly` | [`1`, `1`, [`ModeV1`](README.md#modev1)] | [src/types.ts:43](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L43) |

---

### ErrorData

#### Properties

| Property         | Modifier   | Type               | Defined in                                                                                                                 |
| ---------------- | ---------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `detail_message` | `readonly` | `null` \| `string` | [src/types.ts:47](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L47) |
| `error_message`  | `readonly` | `null` \| `string` | [src/types.ts:48](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L48) |

---

### IAPI

#### Properties

| Property       | Type                                                                                                                                                                   | Defined in                                                                                                                                             |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `authenticate` | (`data`?: [`LoginPostData`](README.md#loginpostdata)) => `Promise`\<`boolean`\>                                                                                        | [src/services/interfaces.ts:40](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/interfaces.ts#L40) |
| `bindings`     | () => `Promise`\<\{ `data`: [`Bindings`](README.md#bindings-1); \}\>                                                                                                   | [src/services/interfaces.ts:41](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/interfaces.ts#L41) |
| `clearSync`    | () => `void`                                                                                                                                                           | [src/services/interfaces.ts:42](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/interfaces.ts#L42) |
| `control`      | (`__namedParameters`: \{ `id`: `string`; `postData`: [`DevicePostDataAny`](README.md#devicepostdataany); \}) => `Promise`\<\{ `data`: [`Data`](README.md#data-1); \}\> | [src/services/interfaces.ts:43](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/interfaces.ts#L43) |
| `deviceData`   | (`__namedParameters`: \{ `id`: `string`; \}) => `Promise`\<\{ `data`: [`DeviceData`](README.md#devicedata-1); \}\>                                                     | [src/services/interfaces.ts:50](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/interfaces.ts#L50) |
| `fetch`        | () => `Promise`\<readonly [`Device`](README.md#device)[]\>                                                                                                             | [src/services/interfaces.ts:51](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/interfaces.ts#L51) |
| `login`        | (`__namedParameters`: \{ `postData`: [`LoginPostData`](README.md#loginpostdata); \}) => `Promise`\<\{ `data`: [`LoginData`](README.md#logindata); \}\>                 | [src/services/interfaces.ts:52](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/interfaces.ts#L52) |
| `onSync?`      | [`OnSyncFunction`](README.md#onsyncfunction)                                                                                                                           | [src/services/interfaces.ts:39](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/interfaces.ts#L39) |

---

### IDeviceFacade

#### Extends

- `IBaseDeviceModel`

#### Extended by

- [`IDeviceV2Facade`](README.md#idevicev2facade)

#### Properties

| Property                     | Type                                                                                                 | Inherited from                                | Defined in                                                                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `device`                     | [`IDeviceModel`](README.md#idevicemodel)                                                             | -                                             | [src/facades/interfaces.ts:15](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L15) |
| `doesNotSupportExtendedMode` | `boolean`                                                                                            | `IBaseDeviceModel.doesNotSupportExtendedMode` | [src/models/interfaces.ts:4](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/interfaces.ts#L4)     |
| `id`                         | `string`                                                                                             | `IBaseDeviceModel.id`                         | [src/models/interfaces.ts:5](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/interfaces.ts#L5)     |
| `isOn`                       | `boolean`                                                                                            | -                                             | [src/facades/interfaces.ts:16](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L16) |
| `mode`                       | [`Mode`](README.md#mode)                                                                             | -                                             | [src/facades/interfaces.ts:17](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L17) |
| `name`                       | `string`                                                                                             | `IBaseDeviceModel.name`                       | [src/models/interfaces.ts:6](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/interfaces.ts#L6)     |
| `onSync`                     | () => `Promise`\<`void`\>                                                                            | -                                             | [src/facades/interfaces.ts:21](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L21) |
| `setValues`                  | (`data`: [`PostAttrs`](README.md#postattrs)) => `Promise`\<`Partial`\<[`Attrs`](README.md#attrs)\>\> | -                                             | [src/facades/interfaces.ts:22](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L22) |
| `supportsGlow`               | `boolean`                                                                                            | -                                             | [src/facades/interfaces.ts:18](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L18) |
| `supportsPro`                | `boolean`                                                                                            | -                                             | [src/facades/interfaces.ts:19](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L19) |
| `supportsV2`                 | `boolean`                                                                                            | -                                             | [src/facades/interfaces.ts:20](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L20) |
| `values`                     | () => `Promise`\<[`Attrs`](README.md#attrs)\>                                                        | -                                             | [src/facades/interfaces.ts:23](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L23) |

---

### IDeviceGlowFacade

#### Extends

- [`IDeviceV2Facade`](README.md#idevicev2facade)

#### Extended by

- [`IDeviceProFacade`](README.md#ideviceprofacade)

#### Properties

| Property                     | Type                                                                                                 | Overrides                                                     | Inherited from                                                              | Defined in                                                                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `comfortTemperature`         | `number`                                                                                             | -                                                             | -                                                                           | [src/facades/interfaces.ts:27](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L27) |
| `currentTemperature`         | `number`                                                                                             | -                                                             | -                                                                           | [src/facades/interfaces.ts:28](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L28) |
| `derogEndDate`               | `null` \| `DateTime`\<`boolean`\>                                                                    | -                                                             | [`IDeviceV2Facade`](README.md#idevicev2facade).`derogEndDate`               | [src/facades/interfaces.ts:45](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L45) |
| `derogMode`                  | [`DerogMode`](README.md#derogmode)                                                                   | -                                                             | [`IDeviceV2Facade`](README.md#idevicev2facade).`derogMode`                  | [src/facades/interfaces.ts:46](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L46) |
| `derogSettings`              | [`DerogSettings`](README.md#derogsettings)                                                           | -                                                             | [`IDeviceV2Facade`](README.md#idevicev2facade).`derogSettings`              | [src/facades/interfaces.ts:47](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L47) |
| `device`                     | [`IDeviceModel`](README.md#idevicemodel)                                                             | -                                                             | [`IDeviceV2Facade`](README.md#idevicev2facade).`device`                     | [src/facades/interfaces.ts:15](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L15) |
| `doesNotSupportExtendedMode` | `boolean`                                                                                            | -                                                             | [`IDeviceV2Facade`](README.md#idevicev2facade).`doesNotSupportExtendedMode` | [src/models/interfaces.ts:4](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/interfaces.ts#L4)     |
| `ecoTemperature`             | `number`                                                                                             | -                                                             | -                                                                           | [src/facades/interfaces.ts:29](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L29) |
| `id`                         | `string`                                                                                             | -                                                             | [`IDeviceV2Facade`](README.md#idevicev2facade).`id`                         | [src/models/interfaces.ts:5](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/interfaces.ts#L5)     |
| `isLocked`                   | `boolean`                                                                                            | -                                                             | [`IDeviceV2Facade`](README.md#idevicev2facade).`isLocked`                   | [src/facades/interfaces.ts:48](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L48) |
| `isOn`                       | `boolean`                                                                                            | -                                                             | [`IDeviceV2Facade`](README.md#idevicev2facade).`isOn`                       | [src/facades/interfaces.ts:16](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L16) |
| `isTimer`                    | `boolean`                                                                                            | -                                                             | [`IDeviceV2Facade`](README.md#idevicev2facade).`isTimer`                    | [src/facades/interfaces.ts:49](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L49) |
| `mode`                       | [`Mode`](README.md#mode)                                                                             | -                                                             | [`IDeviceV2Facade`](README.md#idevicev2facade).`mode`                       | [src/facades/interfaces.ts:17](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L17) |
| `name`                       | `string`                                                                                             | -                                                             | [`IDeviceV2Facade`](README.md#idevicev2facade).`name`                       | [src/models/interfaces.ts:6](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/interfaces.ts#L6)     |
| `onSync`                     | () => `Promise`\<`void`\>                                                                            | -                                                             | [`IDeviceV2Facade`](README.md#idevicev2facade).`onSync`                     | [src/facades/interfaces.ts:21](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L21) |
| `setValues`                  | (`data`: [`PostAttrs`](README.md#postattrs)) => `Promise`\<`Partial`\<[`Attrs`](README.md#attrs)\>\> | -                                                             | [`IDeviceV2Facade`](README.md#idevicev2facade).`setValues`                  | [src/facades/interfaces.ts:22](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L22) |
| `supportsGlow`               | `true`                                                                                               | [`IDeviceV2Facade`](README.md#idevicev2facade).`supportsGlow` | -                                                                           | [src/facades/interfaces.ts:30](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L30) |
| `supportsPro`                | `boolean`                                                                                            | -                                                             | [`IDeviceV2Facade`](README.md#idevicev2facade).`supportsPro`                | [src/facades/interfaces.ts:19](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L19) |
| `supportsV2`                 | `true`                                                                                               | -                                                             | [`IDeviceV2Facade`](README.md#idevicev2facade).`supportsV2`                 | [src/facades/interfaces.ts:50](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L50) |
| `temperatureCompensation`    | [`TemperatureCompensation`](README.md#temperaturecompensation)                                       | -                                                             | -                                                                           | [src/facades/interfaces.ts:31](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L31) |
| `values`                     | () => `Promise`\<[`Attrs`](README.md#attrs)\>                                                        | -                                                             | [`IDeviceV2Facade`](README.md#idevicev2facade).`values`                     | [src/facades/interfaces.ts:23](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L23) |

---

### IDeviceModel

#### Extends

- `IBaseDeviceModel`

#### Properties

| Property                     | Type                                                        | Inherited from                                | Defined in                                                                                                                                         |
| ---------------------------- | ----------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`                       | [`Attrs`](README.md#attrs)                                  | -                                             | [src/models/interfaces.ts:10](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/interfaces.ts#L10) |
| `doesNotSupportExtendedMode` | `boolean`                                                   | `IBaseDeviceModel.doesNotSupportExtendedMode` | [src/models/interfaces.ts:4](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/interfaces.ts#L4)   |
| `id`                         | `string`                                                    | `IBaseDeviceModel.id`                         | [src/models/interfaces.ts:5](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/interfaces.ts#L5)   |
| `name`                       | `string`                                                    | `IBaseDeviceModel.name`                       | [src/models/interfaces.ts:6](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/interfaces.ts#L6)   |
| `product`                    | [`Product`](README.md#product)                              | -                                             | [src/models/interfaces.ts:11](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/interfaces.ts#L11) |
| `productKey`                 | `string`                                                    | -                                             | [src/models/interfaces.ts:12](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/interfaces.ts#L12) |
| `productName`                | `string`                                                    | -                                             | [src/models/interfaces.ts:13](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/interfaces.ts#L13) |
| `update`                     | (`data`: `Partial`\<[`Attrs`](README.md#attrs)\>) => `void` | -                                             | [src/models/interfaces.ts:14](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/interfaces.ts#L14) |

---

### IDeviceProFacade

#### Extends

- [`IDeviceGlowFacade`](README.md#ideviceglowfacade)

#### Properties

| Property                     | Type                                                                                                 | Overrides                                                        | Inherited from                                                                  | Defined in                                                                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `comfortTemperature`         | `number`                                                                                             | -                                                                | [`IDeviceGlowFacade`](README.md#ideviceglowfacade).`comfortTemperature`         | [src/facades/interfaces.ts:27](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L27) |
| `currentHumidity`            | `number`                                                                                             | -                                                                | -                                                                               | [src/facades/interfaces.ts:35](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L35) |
| `currentMode`                | [`Mode`](README.md#mode)                                                                             | -                                                                | -                                                                               | [src/facades/interfaces.ts:36](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L36) |
| `currentSignal`              | [`Mode`](README.md#mode)                                                                             | -                                                                | -                                                                               | [src/facades/interfaces.ts:37](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L37) |
| `currentTemperature`         | `number`                                                                                             | -                                                                | [`IDeviceGlowFacade`](README.md#ideviceglowfacade).`currentTemperature`         | [src/facades/interfaces.ts:28](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L28) |
| `derogEndDate`               | `null` \| `DateTime`\<`boolean`\>                                                                    | -                                                                | [`IDeviceGlowFacade`](README.md#ideviceglowfacade).`derogEndDate`               | [src/facades/interfaces.ts:45](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L45) |
| `derogMode`                  | [`DerogMode`](README.md#derogmode)                                                                   | -                                                                | [`IDeviceGlowFacade`](README.md#ideviceglowfacade).`derogMode`                  | [src/facades/interfaces.ts:46](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L46) |
| `derogSettings`              | [`DerogSettings`](README.md#derogsettings)                                                           | -                                                                | [`IDeviceGlowFacade`](README.md#ideviceglowfacade).`derogSettings`              | [src/facades/interfaces.ts:47](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L47) |
| `device`                     | [`IDeviceModel`](README.md#idevicemodel)                                                             | -                                                                | [`IDeviceGlowFacade`](README.md#ideviceglowfacade).`device`                     | [src/facades/interfaces.ts:15](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L15) |
| `doesNotSupportExtendedMode` | `boolean`                                                                                            | -                                                                | [`IDeviceGlowFacade`](README.md#ideviceglowfacade).`doesNotSupportExtendedMode` | [src/models/interfaces.ts:4](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/interfaces.ts#L4)     |
| `ecoTemperature`             | `number`                                                                                             | -                                                                | [`IDeviceGlowFacade`](README.md#ideviceglowfacade).`ecoTemperature`             | [src/facades/interfaces.ts:29](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L29) |
| `id`                         | `string`                                                                                             | -                                                                | [`IDeviceGlowFacade`](README.md#ideviceglowfacade).`id`                         | [src/models/interfaces.ts:5](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/interfaces.ts#L5)     |
| `isDetectingOpenWindow`      | `boolean`                                                                                            | -                                                                | -                                                                               | [src/facades/interfaces.ts:38](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L38) |
| `isHeating`                  | `boolean`                                                                                            | -                                                                | -                                                                               | [src/facades/interfaces.ts:39](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L39) |
| `isLocked`                   | `boolean`                                                                                            | -                                                                | [`IDeviceGlowFacade`](README.md#ideviceglowfacade).`isLocked`                   | [src/facades/interfaces.ts:48](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L48) |
| `isOn`                       | `boolean`                                                                                            | -                                                                | [`IDeviceGlowFacade`](README.md#ideviceglowfacade).`isOn`                       | [src/facades/interfaces.ts:16](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L16) |
| `isPresence`                 | `boolean`                                                                                            | -                                                                | -                                                                               | [src/facades/interfaces.ts:40](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L40) |
| `isTimer`                    | `boolean`                                                                                            | -                                                                | [`IDeviceGlowFacade`](README.md#ideviceglowfacade).`isTimer`                    | [src/facades/interfaces.ts:49](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L49) |
| `mode`                       | [`Mode`](README.md#mode)                                                                             | -                                                                | [`IDeviceGlowFacade`](README.md#ideviceglowfacade).`mode`                       | [src/facades/interfaces.ts:17](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L17) |
| `name`                       | `string`                                                                                             | -                                                                | [`IDeviceGlowFacade`](README.md#ideviceglowfacade).`name`                       | [src/models/interfaces.ts:6](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/interfaces.ts#L6)     |
| `onSync`                     | () => `Promise`\<`void`\>                                                                            | -                                                                | [`IDeviceGlowFacade`](README.md#ideviceglowfacade).`onSync`                     | [src/facades/interfaces.ts:21](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L21) |
| `setValues`                  | (`data`: [`PostAttrs`](README.md#postattrs)) => `Promise`\<`Partial`\<[`Attrs`](README.md#attrs)\>\> | -                                                                | [`IDeviceGlowFacade`](README.md#ideviceglowfacade).`setValues`                  | [src/facades/interfaces.ts:22](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L22) |
| `supportsGlow`               | `true`                                                                                               | -                                                                | [`IDeviceGlowFacade`](README.md#ideviceglowfacade).`supportsGlow`               | [src/facades/interfaces.ts:30](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L30) |
| `supportsPro`                | `true`                                                                                               | [`IDeviceGlowFacade`](README.md#ideviceglowfacade).`supportsPro` | -                                                                               | [src/facades/interfaces.ts:41](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L41) |
| `supportsV2`                 | `true`                                                                                               | -                                                                | [`IDeviceGlowFacade`](README.md#ideviceglowfacade).`supportsV2`                 | [src/facades/interfaces.ts:50](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L50) |
| `temperatureCompensation`    | [`TemperatureCompensation`](README.md#temperaturecompensation)                                       | -                                                                | [`IDeviceGlowFacade`](README.md#ideviceglowfacade).`temperatureCompensation`    | [src/facades/interfaces.ts:31](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L31) |
| `values`                     | () => `Promise`\<[`Attrs`](README.md#attrs)\>                                                        | -                                                                | [`IDeviceGlowFacade`](README.md#ideviceglowfacade).`values`                     | [src/facades/interfaces.ts:23](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L23) |

---

### IDeviceV2Facade

#### Extends

- [`IDeviceFacade`](README.md#idevicefacade)

#### Extended by

- [`IDeviceGlowFacade`](README.md#ideviceglowfacade)

#### Properties

| Property                     | Type                                                                                                 | Overrides                                               | Inherited from                                                          | Defined in                                                                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `derogEndDate`               | `null` \| `DateTime`\<`boolean`\>                                                                    | -                                                       | -                                                                       | [src/facades/interfaces.ts:45](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L45) |
| `derogMode`                  | [`DerogMode`](README.md#derogmode)                                                                   | -                                                       | -                                                                       | [src/facades/interfaces.ts:46](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L46) |
| `derogSettings`              | [`DerogSettings`](README.md#derogsettings)                                                           | -                                                       | -                                                                       | [src/facades/interfaces.ts:47](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L47) |
| `device`                     | [`IDeviceModel`](README.md#idevicemodel)                                                             | -                                                       | [`IDeviceFacade`](README.md#idevicefacade).`device`                     | [src/facades/interfaces.ts:15](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L15) |
| `doesNotSupportExtendedMode` | `boolean`                                                                                            | -                                                       | [`IDeviceFacade`](README.md#idevicefacade).`doesNotSupportExtendedMode` | [src/models/interfaces.ts:4](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/interfaces.ts#L4)     |
| `id`                         | `string`                                                                                             | -                                                       | [`IDeviceFacade`](README.md#idevicefacade).`id`                         | [src/models/interfaces.ts:5](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/interfaces.ts#L5)     |
| `isLocked`                   | `boolean`                                                                                            | -                                                       | -                                                                       | [src/facades/interfaces.ts:48](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L48) |
| `isOn`                       | `boolean`                                                                                            | -                                                       | [`IDeviceFacade`](README.md#idevicefacade).`isOn`                       | [src/facades/interfaces.ts:16](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L16) |
| `isTimer`                    | `boolean`                                                                                            | -                                                       | -                                                                       | [src/facades/interfaces.ts:49](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L49) |
| `mode`                       | [`Mode`](README.md#mode)                                                                             | -                                                       | [`IDeviceFacade`](README.md#idevicefacade).`mode`                       | [src/facades/interfaces.ts:17](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L17) |
| `name`                       | `string`                                                                                             | -                                                       | [`IDeviceFacade`](README.md#idevicefacade).`name`                       | [src/models/interfaces.ts:6](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/interfaces.ts#L6)     |
| `onSync`                     | () => `Promise`\<`void`\>                                                                            | -                                                       | [`IDeviceFacade`](README.md#idevicefacade).`onSync`                     | [src/facades/interfaces.ts:21](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L21) |
| `setValues`                  | (`data`: [`PostAttrs`](README.md#postattrs)) => `Promise`\<`Partial`\<[`Attrs`](README.md#attrs)\>\> | -                                                       | [`IDeviceFacade`](README.md#idevicefacade).`setValues`                  | [src/facades/interfaces.ts:22](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L22) |
| `supportsGlow`               | `boolean`                                                                                            | -                                                       | [`IDeviceFacade`](README.md#idevicefacade).`supportsGlow`               | [src/facades/interfaces.ts:18](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L18) |
| `supportsPro`                | `boolean`                                                                                            | -                                                       | [`IDeviceFacade`](README.md#idevicefacade).`supportsPro`                | [src/facades/interfaces.ts:19](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L19) |
| `supportsV2`                 | `true`                                                                                               | [`IDeviceFacade`](README.md#idevicefacade).`supportsV2` | -                                                                       | [src/facades/interfaces.ts:50](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L50) |
| `values`                     | () => `Promise`\<[`Attrs`](README.md#attrs)\>                                                        | -                                                       | [`IDeviceFacade`](README.md#idevicefacade).`values`                     | [src/facades/interfaces.ts:23](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L23) |

---

### IFacadeManager

#### Properties

| Property | Type                                                                                                                 | Defined in                                                                                                                                           |
| -------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get`    | (`instance`?: [`IDeviceModel`](README.md#idevicemodel)) => `undefined` \| [`IDeviceFacade`](README.md#idevicefacade) | [src/facades/interfaces.ts:54](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L54) |

---

### Logger

#### Properties

| Property | Type                                                        | Defined in                                                                                                                                             |
| -------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `error`  | (`message`?: `any`, ...`optionalParams`: `any`[]) => `void` | [src/services/interfaces.ts:60](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/interfaces.ts#L60) |
| `log`    | (`message`?: `any`, ...`optionalParams`: `any`[]) => `void` | [src/services/interfaces.ts:61](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/interfaces.ts#L61) |

---

### LoginData

#### Properties

| Property    | Modifier   | Type     | Defined in                                                                                                                 |
| ----------- | ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `expire_at` | `readonly` | `number` | [src/types.ts:52](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L52) |
| `token`     | `readonly` | `string` | [src/types.ts:53](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L53) |

---

### LoginPostData

#### Properties

| Property   | Modifier   | Type     | Defined in                                                                                                                 |
| ---------- | ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `password` | `readonly` | `string` | [src/types.ts:57](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L57) |
| `username` | `readonly` | `string` | [src/types.ts:58](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L58) |

---

### PostAttrs

#### Extended by

- [`Attrs`](README.md#attrs)

#### Properties

| Property         | Modifier   | Type                                                           | Defined in                                                                                                                 |
| ---------------- | ---------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `cft_temp?`      | `readonly` | `number`                                                       | [src/types.ts:78](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L78) |
| `cft_tempH?`     | `readonly` | `number`                                                       | [src/types.ts:72](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L72) |
| `cft_tempL?`     | `readonly` | `number`                                                       | [src/types.ts:73](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L73) |
| `com_temp?`      | `readonly` | [`TemperatureCompensation`](README.md#temperaturecompensation) | [src/types.ts:70](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L70) |
| `derog_mode?`    | `readonly` | [`DerogMode`](README.md#derogmode)                             | [src/types.ts:64](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L64) |
| `derog_time?`    | `readonly` | `number`                                                       | [src/types.ts:65](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L65) |
| `eco_temp?`      | `readonly` | `number`                                                       | [src/types.ts:79](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L79) |
| `eco_tempH?`     | `readonly` | `number`                                                       | [src/types.ts:74](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L74) |
| `eco_tempL?`     | `readonly` | `number`                                                       | [src/types.ts:75](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L75) |
| `lock_c?`        | `readonly` | [`Switch`](README.md#switch)                                   | [src/types.ts:76](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L76) |
| `lock_switch?`   | `readonly` | [`Switch`](README.md#switch)                                   | [src/types.ts:68](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L68) |
| `mode?`          | `readonly` | [`Mode`](README.md#mode)                                       | [src/types.ts:62](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L62) |
| `timer_switch?`  | `readonly` | [`Switch`](README.md#switch)                                   | [src/types.ts:66](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L66) |
| `window_switch?` | `readonly` | [`Switch`](README.md#switch)                                   | [src/types.ts:80](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L80) |

---

### SettingManager

#### Properties

| Property | Type                                                                                  | Defined in                                                                                                                                             |
| -------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `get`    | \<`K`\>(`key`: `K`) => [`APISettings`](README.md#apisettings)\[`K`\]                  | [src/services/interfaces.ts:65](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/interfaces.ts#L65) |
| `set`    | \<`K`\>(`key`: `K`, `value`: [`APISettings`](README.md#apisettings)\[`K`\]) => `void` | [src/services/interfaces.ts:66](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/interfaces.ts#L66) |

## Type Aliases

### Data

```ts
type Data: Record<string, never>;
```

#### Defined in

[src/types.ts:83](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L83)

---

### DevicePostDataAny

```ts
type DevicePostDataAny: DevicePostData | DeviceV1PostData;
```

#### Defined in

[src/types.ts:85](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/types.ts#L85)

---

### IDeviceFacadeAny

```ts
type IDeviceFacadeAny: IDeviceFacade | IDeviceGlowFacade | IDeviceProFacade | IDeviceV2Facade;
```

#### Defined in

[src/facades/interfaces.ts:57](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L57)

---

### OnSyncFunction()

```ts
type OnSyncFunction: (params?: {
  ids: string[];
}) => Promise<void>;
```

#### Parameters

| Parameter     | Type                     |
| ------------- | ------------------------ |
| `params`?     | \{ `ids`: `string`[]; \} |
| `params.ids`? | `string`[]               |

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/services/interfaces.ts:69](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/services/interfaces.ts#L69)

---

### Product

```ts
type Product:
  | "glow"
  | "pro"
  | "v1"
  | "v2"
  | "v4";
```

#### Defined in

[src/models/interfaces.ts:17](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/models/interfaces.ts#L17)

## Variables

### UNIT

```ts
const UNIT: 1 = 1
```

#### Defined in

[src/constants.ts:1](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/constants.ts#L1)

## Functions

### getTargetTemperature()

```ts
function getTargetTemperature(
  device: IDeviceFacadeAny,
  temperature: 'cft_temp' | 'eco_temp',
  value: number,
): PostAttrs
```

#### Parameters

| Parameter     | Type                                             |
| ------------- | ------------------------------------------------ |
| `device`      | [`IDeviceFacadeAny`](README.md#idevicefacadeany) |
| `temperature` | `"cft_temp"` \| `"eco_temp"`                     |
| `value`       | `number`                                         |

#### Returns

[`PostAttrs`](README.md#postattrs)

#### Defined in

[src/utils.ts:8](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/utils.ts#L8)

---

### supportsGlow()

```ts
function supportsGlow(device: IDeviceFacadeAny): device is IDeviceGlowFacade
```

#### Parameters

| Parameter | Type                                             |
| --------- | ------------------------------------------------ |
| `device`  | [`IDeviceFacadeAny`](README.md#idevicefacadeany) |

#### Returns

`device is IDeviceGlowFacade`

#### Defined in

[src/facades/interfaces.ts:67](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L67)

---

### supportsPro()

```ts
function supportsPro(device: IDeviceFacadeAny): device is IDeviceProFacade
```

#### Parameters

| Parameter | Type                                             |
| --------- | ------------------------------------------------ |
| `device`  | [`IDeviceFacadeAny`](README.md#idevicefacadeany) |

#### Returns

`device is IDeviceProFacade`

#### Defined in

[src/facades/interfaces.ts:71](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L71)

---

### supportsV2()

```ts
function supportsV2(device: IDeviceFacadeAny): device is IDeviceV2Facade
```

#### Parameters

| Parameter | Type                                             |
| --------- | ------------------------------------------------ |
| `device`  | [`IDeviceFacadeAny`](README.md#idevicefacadeany) |

#### Returns

`device is IDeviceV2Facade`

#### Defined in

[src/facades/interfaces.ts:63](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/facades/interfaces.ts#L63)

---

### syncDevices()

```ts
function syncDevices<T>(
  target: (...args: any[]) => Promise<T>,
  _context: ClassMethodDecoratorContext<
    unknown,
    (this: unknown, ...args: any) => any
  >,
): (...args: unknown[]) => Promise<T>
```

#### Type Parameters

| Type Parameter                                                                                   |
| ------------------------------------------------------------------------------------------------ |
| `T` _extends_ readonly [`Device`](README.md#device)[] \| `Partial`\<[`Attrs`](README.md#attrs)\> |

#### Parameters

| Parameter  | Type                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------ |
| `target`   | (...`args`: `any`[]) => `Promise`\<`T`\>                                                   |
| `_context` | `ClassMethodDecoratorContext`\<`unknown`, (`this`: `unknown`, ...`args`: `any`) => `any`\> |

#### Returns

`Function`

##### Parameters

| Parameter | Type        |
| --------- | ----------- |
| ...`args` | `unknown`[] |

##### Returns

`Promise`\<`T`\>

#### Defined in

[src/decorators/sync-devices.ts:5](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/decorators/sync-devices.ts#L5)

---

### updateDevice()

```ts
function updateDevice<T>(
  target: (...args: any[]) => Promise<T>,
  _context: ClassMethodDecoratorContext<
    unknown,
    (this: unknown, ...args: any) => any
  >,
): (...args: unknown[]) => Promise<T>
```

#### Type Parameters

| Type Parameter                                        |
| ----------------------------------------------------- |
| `T` _extends_ `Partial`\<[`Attrs`](README.md#attrs)\> |

#### Parameters

| Parameter  | Type                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------ |
| `target`   | (...`args`: `any`[]) => `Promise`\<`T`\>                                                   |
| `_context` | `ClassMethodDecoratorContext`\<`unknown`, (`this`: `unknown`, ...`args`: `any`) => `any`\> |

#### Returns

`Function`

##### Parameters

| Parameter | Type        |
| --------- | ----------- |
| ...`args` | `unknown`[] |

##### Returns

`Promise`\<`T`\>

#### Defined in

[src/decorators/update-device.ts:8](https://github.com/OlivierZal/heatzy-api/blob/20f75cefee6c9b32e1d5245fae9d9afb8e9e6ad4/src/decorators/update-device.ts#L8)
