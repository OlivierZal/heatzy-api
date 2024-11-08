# Heatzy API for Node.js - v3.0.2

## Enumerations

### DerogMode

#### Enumeration Members

| Enumeration Member | Value | Defined in                                                                                                                 |
| ------------------ | ----- | -------------------------------------------------------------------------------------------------------------------------- |
| `boost`            | `2`   | [src/enums.ts:11](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/enums.ts#L11) |
| `off`              | `0`   | [src/enums.ts:12](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/enums.ts#L12) |
| `vacation`         | `1`   | [src/enums.ts:13](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/enums.ts#L13) |

---

### Mode

#### Enumeration Members

| Enumeration Member | Value | Defined in                                                                                                               |
| ------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------ |
| `cft`              | `0`   | [src/enums.ts:2](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/enums.ts#L2) |
| `cft1`             | `4`   | [src/enums.ts:3](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/enums.ts#L3) |
| `cft2`             | `5`   | [src/enums.ts:4](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/enums.ts#L4) |
| `eco`              | `1`   | [src/enums.ts:5](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/enums.ts#L5) |
| `fro`              | `2`   | [src/enums.ts:6](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/enums.ts#L6) |
| `stop`             | `3`   | [src/enums.ts:7](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/enums.ts#L7) |

---

### Switch

#### Enumeration Members

| Enumeration Member | Value | Defined in                                                                                                                 |
| ------------------ | ----- | -------------------------------------------------------------------------------------------------------------------------- |
| `off`              | `0`   | [src/enums.ts:17](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/enums.ts#L17) |
| `on`               | `1`   | [src/enums.ts:18](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/enums.ts#L18) |

## Classes

### DeviceFacade

#### Implements

- [`IDeviceFacade`](README.md#idevicefacade)

#### Constructors

##### new DeviceFacade()

```ts
new DeviceFacade(manager: FacadeManager, instance: DeviceModel): DeviceFacade
```

###### Parameters

| Parameter  | Type                                       |
| ---------- | ------------------------------------------ |
| `manager`  | [`FacadeManager`](README.md#facademanager) |
| `instance` | [`DeviceModel`](README.md#devicemodel)     |

###### Returns

[`DeviceFacade`](README.md#devicefacade)

###### Defined in

[src/facades/device.ts:38](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/device.ts#L38)

#### Properties

| Property       | Modifier   | Type                               | Defined in                                                                                                                                   |
| -------------- | ---------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `api`          | `readonly` | [`HeatzyAPI`](README.md#heatzyapi) | [src/facades/device.ts:28](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/device.ts#L28) |
| `id`           | `readonly` | `string`                           | [src/facades/device.ts:30](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/device.ts#L30) |
| `isFirstGen`   | `readonly` | `boolean`                          | [src/facades/device.ts:32](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/device.ts#L32) |
| `isFirstPilot` | `readonly` | `boolean`                          | [src/facades/device.ts:34](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/device.ts#L34) |
| `isGlow`       | `readonly` | `boolean`                          | [src/facades/device.ts:36](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/device.ts#L36) |

#### Accessors

##### cftTempH

###### Get Signature

```ts
get cftTempH(): undefined | number
```

###### Returns

`undefined` \| `number`

###### Implementation of

[`IDeviceFacade`](README.md#idevicefacade).`cftTempH`

###### Defined in

[src/facades/device.ts:48](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/device.ts#L48)

##### cftTempL

###### Get Signature

```ts
get cftTempL(): undefined | number
```

###### Returns

`undefined` \| `number`

###### Implementation of

[`IDeviceFacade`](README.md#idevicefacade).`cftTempL`

###### Defined in

[src/facades/device.ts:52](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/device.ts#L52)

##### data

###### Get Signature

```ts
get data(): Attrs
```

###### Returns

[`Attrs`](README.md#attrs)

###### Implementation of

[`IDeviceFacade`](README.md#idevicefacade).`data`

###### Defined in

[src/facades/device.ts:56](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/device.ts#L56)

##### derogMode

###### Get Signature

```ts
get derogMode(): undefined | DerogMode
```

###### Returns

`undefined` \| [`DerogMode`](README.md#derogmode)

###### Implementation of

[`IDeviceFacade`](README.md#idevicefacade).`derogMode`

###### Defined in

[src/facades/device.ts:60](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/device.ts#L60)

##### derogSettings

###### Get Signature

```ts
get derogSettings(): undefined | DerogSettings
```

###### Returns

`undefined` \| `DerogSettings`

###### Implementation of

[`IDeviceFacade`](README.md#idevicefacade).`derogSettings`

###### Defined in

[src/facades/device.ts:64](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/device.ts#L64)

##### derogTime

###### Get Signature

```ts
get derogTime(): undefined | number
```

###### Returns

`undefined` \| `number`

###### Implementation of

[`IDeviceFacade`](README.md#idevicefacade).`derogTime`

###### Defined in

[src/facades/device.ts:91](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/device.ts#L91)

##### instance

###### Get Signature

```ts
get protected instance(): DeviceModel
```

###### Returns

[`DeviceModel`](README.md#devicemodel)

###### Defined in

[src/facades/device.ts:117](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/device.ts#L117)

##### lockSwitch

###### Get Signature

```ts
get lockSwitch(): undefined | Switch
```

###### Returns

`undefined` \| [`Switch`](README.md#switch)

###### Implementation of

[`IDeviceFacade`](README.md#idevicefacade).`lockSwitch`

###### Defined in

[src/facades/device.ts:95](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/device.ts#L95)

##### mode

###### Get Signature

```ts
get mode(): Mode
```

###### Returns

[`Mode`](README.md#mode)

###### Implementation of

[`IDeviceFacade`](README.md#idevicefacade).`mode`

###### Defined in

[src/facades/device.ts:99](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/device.ts#L99)

##### name

###### Get Signature

```ts
get name(): string
```

###### Returns

`string`

###### Implementation of

[`IDeviceFacade`](README.md#idevicefacade).`name`

###### Defined in

[src/facades/device.ts:109](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/device.ts#L109)

##### timerSwitch

###### Get Signature

```ts
get timerSwitch(): undefined | Switch
```

###### Returns

`undefined` \| [`Switch`](README.md#switch)

###### Implementation of

[`IDeviceFacade`](README.md#idevicefacade).`timerSwitch`

###### Defined in

[src/facades/device.ts:113](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/device.ts#L113)

#### Methods

##### get()

```ts
get(): Promise<Attrs>
```

###### Returns

`Promise`\<[`Attrs`](README.md#attrs)\>

###### Implementation of

[`IDeviceFacade`](README.md#idevicefacade).`get`

###### Defined in

[src/facades/device.ts:127](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/device.ts#L127)

##### set()

```ts
set(data: Attrs): Promise<Attrs>
```

###### Parameters

| Parameter | Type                       |
| --------- | -------------------------- |
| `data`    | [`Attrs`](README.md#attrs) |

###### Returns

`Promise`\<[`Attrs`](README.md#attrs)\>

###### Implementation of

[`IDeviceFacade`](README.md#idevicefacade).`set`

###### Defined in

[src/facades/device.ts:133](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/device.ts#L133)

---

### DeviceModel

#### Implements

- [`IDeviceModel`](README.md#idevicemodel)

#### Properties

| Property       | Modifier   | Type      | Defined in                                                                                                                                 |
| -------------- | ---------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`           | `readonly` | `string`  | [src/models/device.ts:10](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/device.ts#L10) |
| `isFirstGen`   | `public`   | `boolean` | [src/models/device.ts:18](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/device.ts#L18) |
| `isFirstPilot` | `public`   | `boolean` | [src/models/device.ts:20](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/device.ts#L20) |
| `isGlow`       | `public`   | `boolean` | [src/models/device.ts:22](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/device.ts#L22) |
| `name`         | `readonly` | `string`  | [src/models/device.ts:12](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/device.ts#L12) |
| `productKey`   | `readonly` | `string`  | [src/models/device.ts:14](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/device.ts#L14) |
| `productName`  | `readonly` | `string`  | [src/models/device.ts:16](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/device.ts#L16) |

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

[src/models/device.ts:39](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/device.ts#L39)

#### Methods

##### update()

```ts
update(data: Attrs): void
```

###### Parameters

| Parameter | Type                       |
| --------- | -------------------------- |
| `data`    | [`Attrs`](README.md#attrs) |

###### Returns

`void`

###### Implementation of

[`IDeviceModel`](README.md#idevicemodel).`update`

###### Defined in

[src/models/device.ts:64](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/device.ts#L64)

##### getAll()

```ts
static getAll(): DeviceModel[]
```

###### Returns

[`DeviceModel`](README.md#devicemodel)[]

###### Defined in

[src/models/device.ts:43](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/device.ts#L43)

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

[src/models/device.ts:47](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/device.ts#L47)

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

[src/models/device.ts:51](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/device.ts#L51)

##### sync()

```ts
static sync(devices: readonly Device[], data: Record<string, Attrs>): void
```

###### Parameters

| Parameter | Type                                             |
| --------- | ------------------------------------------------ |
| `devices` | readonly `Device`[]                              |
| `data`    | `Record`\<`string`, [`Attrs`](README.md#attrs)\> |

###### Returns

`void`

###### Defined in

[src/models/device.ts:55](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/device.ts#L55)

---

### FacadeManager

#### Constructors

##### new FacadeManager()

```ts
new FacadeManager(api: HeatzyAPI): FacadeManager
```

###### Parameters

| Parameter | Type                               |
| --------- | ---------------------------------- |
| `api`     | [`HeatzyAPI`](README.md#heatzyapi) |

###### Returns

[`FacadeManager`](README.md#facademanager)

###### Defined in

[src/facades/manager.ts:11](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/manager.ts#L11)

#### Properties

| Property | Modifier   | Type                               | Defined in                                                                                                                                   |
| -------- | ---------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `api`    | `readonly` | [`HeatzyAPI`](README.md#heatzyapi) | [src/facades/manager.ts:7](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/manager.ts#L7) |

#### Methods

##### get()

###### get()

```ts
get(): undefined
```

###### Returns

`undefined`

###### Defined in

[src/facades/manager.ts:15](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/manager.ts#L15)

###### get(instance)

```ts
get(instance: DeviceModel): DeviceFacade
```

###### Parameters

| Parameter  | Type                                   |
| ---------- | -------------------------------------- |
| `instance` | [`DeviceModel`](README.md#devicemodel) |

###### Returns

[`DeviceFacade`](README.md#devicefacade)

###### Defined in

[src/facades/manager.ts:16](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/manager.ts#L16)

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

[src/services/api.ts:54](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/api.ts#L54)

#### Properties

| Property          | Modifier   | Type                                         | Defined in                                                                                                                               |
| ----------------- | ---------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `onSync?`         | `readonly` | () => `Promise`\<`void`\>                    | [src/services/api.ts:40](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/api.ts#L40) |
| `settingManager?` | `readonly` | [`SettingManager`](README.md#settingmanager) | [src/services/api.ts:42](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/api.ts#L42) |

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

[src/services/api.ts:115](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/api.ts#L115)

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

| Name   | Type                               | Defined in                                                                                                                                 |
| ------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `data` | [`Bindings`](README.md#bindings-1) | [src/services/api.ts:129](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/api.ts#L129) |

###### Implementation of

[`IAPI`](README.md#iapi).`bindings`

###### Defined in

[src/services/api.ts:129](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/api.ts#L129)

##### clearSync()

```ts
clearSync(): void
```

###### Returns

`void`

###### Implementation of

[`IAPI`](README.md#iapi).`clearSync`

###### Defined in

[src/services/api.ts:133](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/api.ts#L133)

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

| Parameter                    | Type                                               |
| ---------------------------- | -------------------------------------------------- |
| `__namedParameters`          | `object`                                           |
| `__namedParameters.id`       | `string`                                           |
| `__namedParameters.postData` | [`DevicePostDataAny`](README.md#devicepostdataany) |

###### Returns

`Promise`\<\{
`data`: [`Data`](README.md#data-2);
\}\>

| Name   | Type                       | Defined in                                                                                                                                 |
| ------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `data` | [`Data`](README.md#data-2) | [src/services/api.ts:146](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/api.ts#L146) |

###### Implementation of

[`IAPI`](README.md#iapi).`control`

###### Defined in

[src/services/api.ts:140](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/api.ts#L140)

##### deviceData()

```ts
deviceData(__namedParameters: {
  id: string;
 }): Promise<{
  data: DeviceData;
}>
```

###### Parameters

| Parameter              | Type     |
| ---------------------- | -------- |
| `__namedParameters`    | `object` |
| `__namedParameters.id` | `string` |

###### Returns

`Promise`\<\{
`data`: [`DeviceData`](README.md#devicedata-1);
\}\>

| Name   | Type                                   | Defined in                                                                                                                                 |
| ------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `data` | [`DeviceData`](README.md#devicedata-1) | [src/services/api.ts:154](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/api.ts#L154) |

###### Implementation of

[`IAPI`](README.md#iapi).`deviceData`

###### Defined in

[src/services/api.ts:150](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/api.ts#L150)

##### fetch()

```ts
fetch(): Promise<readonly Device[]>
```

###### Returns

`Promise`\<readonly `Device`[]\>

###### Implementation of

[`IAPI`](README.md#iapi).`fetch`

###### Defined in

[src/services/api.ts:100](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/api.ts#L100)

##### login()

```ts
login(__namedParameters: {
  postData: LoginPostData;
 }): Promise<{
  data: LoginData;
}>
```

###### Parameters

| Parameter                    | Type                                       |
| ---------------------------- | ------------------------------------------ |
| `__namedParameters`          | `object`                                   |
| `__namedParameters.postData` | [`LoginPostData`](README.md#loginpostdata) |

###### Returns

`Promise`\<\{
`data`: [`LoginData`](README.md#logindata);
\}\>

| Name   | Type                               | Defined in                                                                                                                                 |
| ------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `data` | [`LoginData`](README.md#logindata) | [src/services/api.ts:162](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/api.ts#L162) |

###### Implementation of

[`IAPI`](README.md#iapi).`login`

###### Defined in

[src/services/api.ts:158](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/api.ts#L158)

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

[src/services/api.ts:93](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/api.ts#L93)

## Interfaces

### APIConfig

#### Extends

- `Partial`\<[`LoginPostData`](README.md#loginpostdata)\>

#### Properties

| Property            | Modifier   | Type                                         | Inherited from     | Defined in                                                                                                                                             |
| ------------------- | ---------- | -------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `autoSyncInterval?` | `public`   | `null` \| `number`                           | -                  | [src/services/interfaces.ts:39](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/interfaces.ts#L39) |
| `language?`         | `public`   | `string`                                     | -                  | [src/services/interfaces.ts:40](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/interfaces.ts#L40) |
| `logger?`           | `public`   | [`Logger`](README.md#logger)                 | -                  | [src/services/interfaces.ts:41](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/interfaces.ts#L41) |
| `onSync?`           | `public`   | () => `Promise`\<`void`\>                    | -                  | [src/services/interfaces.ts:42](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/interfaces.ts#L42) |
| `password?`         | `readonly` | `string`                                     | `Partial.password` | [src/types.ts:12](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/types.ts#L12)                             |
| `settingManager?`   | `public`   | [`SettingManager`](README.md#settingmanager) | -                  | [src/services/interfaces.ts:43](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/interfaces.ts#L43) |
| `shouldVerifySSL?`  | `public`   | `boolean`                                    | -                  | [src/services/interfaces.ts:44](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/interfaces.ts#L44) |
| `timezone?`         | `public`   | `string`                                     | -                  | [src/services/interfaces.ts:45](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/interfaces.ts#L45) |
| `username?`         | `readonly` | `string`                                     | `Partial.username` | [src/types.ts:13](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/types.ts#L13)                             |

---

### APISettings

#### Properties

| Property    | Type               | Defined in                                                                                                                                             |
| ----------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `expireAt?` | `null` \| `string` | [src/services/interfaces.ts:12](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/interfaces.ts#L12) |
| `password?` | `null` \| `string` | [src/services/interfaces.ts:13](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/interfaces.ts#L13) |
| `token?`    | `null` \| `string` | [src/services/interfaces.ts:14](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/interfaces.ts#L14) |
| `username?` | `null` \| `string` | [src/services/interfaces.ts:15](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/interfaces.ts#L15) |

---

### Attrs

#### Properties

| Property        | Modifier   | Type                               | Defined in                                                                                                                 |
| --------------- | ---------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `cft_tempH?`    | `readonly` | `number`                           | [src/types.ts:37](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/types.ts#L37) |
| `cft_tempL?`    | `readonly` | `number`                           | [src/types.ts:38](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/types.ts#L38) |
| `derog_mode?`   | `readonly` | [`DerogMode`](README.md#derogmode) | [src/types.ts:39](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/types.ts#L39) |
| `derog_time?`   | `readonly` | `number`                           | [src/types.ts:40](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/types.ts#L40) |
| `lock_switch?`  | `readonly` | [`Switch`](README.md#switch)       | [src/types.ts:41](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/types.ts#L41) |
| `mode?`         | `readonly` | [`Mode`](README.md#mode)           | [src/types.ts:42](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/types.ts#L42) |
| `timer_switch?` | `readonly` | [`Switch`](README.md#switch)       | [src/types.ts:43](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/types.ts#L43) |

---

### Bindings

#### Properties

| Property  | Modifier   | Type                | Defined in                                                                                                                 |
| --------- | ---------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `devices` | `readonly` | readonly `Device`[] | [src/types.ts:29](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/types.ts#L29) |

---

### DeviceData

#### Properties

| Property | Modifier   | Type                       | Defined in                                                                                                                 |
| -------- | ---------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `attr`   | `readonly` | [`Attrs`](README.md#attrs) | [src/types.ts:53](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/types.ts#L53) |

---

### DevicePostData

#### Properties

| Property | Modifier   | Type                       | Defined in                                                                                                                 |
| -------- | ---------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `attrs`  | `readonly` | [`Attrs`](README.md#attrs) | [src/types.ts:47](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/types.ts#L47) |

---

### ErrorData

#### Properties

| Property         | Modifier   | Type               | Defined in                                                                                                               |
| ---------------- | ---------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `detail_message` | `readonly` | `null` \| `string` | [src/types.ts:7](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/types.ts#L7) |
| `error_message`  | `readonly` | `null` \| `string` | [src/types.ts:8](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/types.ts#L8) |

---

### FirstGenDevicePostData

#### Properties

| Property | Modifier   | Type                                 | Defined in                                                                                                                 |
| -------- | ---------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `raw`    | `readonly` | [`1`, `1`, [`Mode`](README.md#mode)] | [src/types.ts:33](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/types.ts#L33) |

---

### IAPI

#### Properties

| Property       | Type                                                                                                                                                                   | Defined in                                                                                                                                             |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `authenticate` | (`data`?: [`LoginPostData`](README.md#loginpostdata)) => `Promise`\<`boolean`\>                                                                                        | [src/services/interfaces.ts:49](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/interfaces.ts#L49) |
| `bindings`     | () => `Promise`\<\{ `data`: [`Bindings`](README.md#bindings-1); \}\>                                                                                                   | [src/services/interfaces.ts:50](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/interfaces.ts#L50) |
| `clearSync`    | () => `void`                                                                                                                                                           | [src/services/interfaces.ts:51](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/interfaces.ts#L51) |
| `control`      | (`__namedParameters`: \{ `id`: `string`; `postData`: [`DevicePostDataAny`](README.md#devicepostdataany); \}) => `Promise`\<\{ `data`: [`Data`](README.md#data-2); \}\> | [src/services/interfaces.ts:52](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/interfaces.ts#L52) |
| `deviceData`   | (`__namedParameters`: \{ `id`: `string`; \}) => `Promise`\<\{ `data`: [`DeviceData`](README.md#devicedata-1); \}\>                                                     | [src/services/interfaces.ts:59](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/interfaces.ts#L59) |
| `fetch`        | () => `Promise`\<readonly `Device`[]\>                                                                                                                                 | [src/services/interfaces.ts:60](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/interfaces.ts#L60) |
| `login`        | (`__namedParameters`: \{ `postData`: [`LoginPostData`](README.md#loginpostdata); \}) => `Promise`\<\{ `data`: [`LoginData`](README.md#logindata); \}\>                 | [src/services/interfaces.ts:61](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/interfaces.ts#L61) |
| `onSync?`      | () => `Promise`\<`void`\>                                                                                                                                              | [src/services/interfaces.ts:66](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/interfaces.ts#L66) |

---

### IBaseDeviceModel

#### Extended by

- [`IDeviceFacade`](README.md#idevicefacade)
- [`IDeviceModel`](README.md#idevicemodel)

#### Properties

| Property | Type                       | Defined in                                                                                                                                       |
| -------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `data`   | [`Attrs`](README.md#attrs) | [src/models/interfaces.ts:4](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/interfaces.ts#L4) |
| `id`     | `string`                   | [src/models/interfaces.ts:5](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/interfaces.ts#L5) |
| `name`   | `string`                   | [src/models/interfaces.ts:6](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/interfaces.ts#L6) |

---

### IDeviceFacade

#### Extends

- [`IBaseDeviceModel`](README.md#ibasedevicemodel)

#### Properties

| Property         | Type                                                                            | Inherited from                                          | Defined in                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cftTempH?`      | `number`                                                                        | -                                                       | [src/facades/interfaces.ts:18](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/interfaces.ts#L18) |
| `cftTempL?`      | `number`                                                                        | -                                                       | [src/facades/interfaces.ts:19](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/interfaces.ts#L19) |
| `data`           | [`Attrs`](README.md#attrs)                                                      | [`IBaseDeviceModel`](README.md#ibasedevicemodel).`data` | [src/models/interfaces.ts:4](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/interfaces.ts#L4)     |
| `derogMode?`     | [`DerogMode`](README.md#derogmode)                                              | -                                                       | [src/facades/interfaces.ts:20](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/interfaces.ts#L20) |
| `derogSettings?` | `DerogSettings`                                                                 | -                                                       | [src/facades/interfaces.ts:21](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/interfaces.ts#L21) |
| `derogTime?`     | `number`                                                                        | -                                                       | [src/facades/interfaces.ts:22](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/interfaces.ts#L22) |
| `get`            | () => `Promise`\<[`Attrs`](README.md#attrs)\>                                   | -                                                       | [src/facades/interfaces.ts:12](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/interfaces.ts#L12) |
| `id`             | `string`                                                                        | [`IBaseDeviceModel`](README.md#ibasedevicemodel).`id`   | [src/models/interfaces.ts:5](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/interfaces.ts#L5)     |
| `isFirstGen`     | `boolean`                                                                       | -                                                       | [src/facades/interfaces.ts:13](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/interfaces.ts#L13) |
| `isFirstPilot`   | `boolean`                                                                       | -                                                       | [src/facades/interfaces.ts:14](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/interfaces.ts#L14) |
| `isGlow`         | `boolean`                                                                       | -                                                       | [src/facades/interfaces.ts:15](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/interfaces.ts#L15) |
| `lockSwitch?`    | [`Switch`](README.md#switch)                                                    | -                                                       | [src/facades/interfaces.ts:23](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/interfaces.ts#L23) |
| `mode`           | [`Mode`](README.md#mode)                                                        | -                                                       | [src/facades/interfaces.ts:16](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/interfaces.ts#L16) |
| `name`           | `string`                                                                        | [`IBaseDeviceModel`](README.md#ibasedevicemodel).`name` | [src/models/interfaces.ts:6](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/interfaces.ts#L6)     |
| `set`            | (`data`: [`Attrs`](README.md#attrs)) => `Promise`\<[`Attrs`](README.md#attrs)\> | -                                                       | [src/facades/interfaces.ts:17](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/interfaces.ts#L17) |
| `timerSwitch?`   | [`Switch`](README.md#switch)                                                    | -                                                       | [src/facades/interfaces.ts:24](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/facades/interfaces.ts#L24) |

---

### IDeviceModel

#### Extends

- [`IBaseDeviceModel`](README.md#ibasedevicemodel)

#### Properties

| Property       | Type                                           | Inherited from                                          | Defined in                                                                                                                                         |
| -------------- | ---------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`         | [`Attrs`](README.md#attrs)                     | [`IBaseDeviceModel`](README.md#ibasedevicemodel).`data` | [src/models/interfaces.ts:4](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/interfaces.ts#L4)   |
| `id`           | `string`                                       | [`IBaseDeviceModel`](README.md#ibasedevicemodel).`id`   | [src/models/interfaces.ts:5](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/interfaces.ts#L5)   |
| `isFirstGen`   | `boolean`                                      | -                                                       | [src/models/interfaces.ts:10](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/interfaces.ts#L10) |
| `isFirstPilot` | `boolean`                                      | -                                                       | [src/models/interfaces.ts:11](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/interfaces.ts#L11) |
| `isGlow`       | `boolean`                                      | -                                                       | [src/models/interfaces.ts:12](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/interfaces.ts#L12) |
| `name`         | `string`                                       | [`IBaseDeviceModel`](README.md#ibasedevicemodel).`name` | [src/models/interfaces.ts:6](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/interfaces.ts#L6)   |
| `productKey`   | `string`                                       | -                                                       | [src/models/interfaces.ts:13](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/interfaces.ts#L13) |
| `productName`  | `string`                                       | -                                                       | [src/models/interfaces.ts:14](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/interfaces.ts#L14) |
| `update`       | (`data`: [`Attrs`](README.md#attrs)) => `void` | -                                                       | [src/models/interfaces.ts:15](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/models/interfaces.ts#L15) |

---

### Logger

#### Properties

| Property | Type                                                        | Defined in                                                                                                                                             |
| -------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `error`  | (`message`?: `any`, ...`optionalParams`: `any`[]) => `void` | [src/services/interfaces.ts:34](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/interfaces.ts#L34) |
| `log`    | (`message`?: `any`, ...`optionalParams`: `any`[]) => `void` | [src/services/interfaces.ts:35](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/interfaces.ts#L35) |

---

### LoginData

#### Properties

| Property    | Modifier   | Type     | Defined in                                                                                                                 |
| ----------- | ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `expire_at` | `readonly` | `number` | [src/types.ts:17](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/types.ts#L17) |
| `token`     | `readonly` | `string` | [src/types.ts:18](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/types.ts#L18) |

---

### LoginPostData

#### Properties

| Property   | Modifier   | Type     | Defined in                                                                                                                 |
| ---------- | ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `password` | `readonly` | `string` | [src/types.ts:12](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/types.ts#L12) |
| `username` | `readonly` | `string` | [src/types.ts:13](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/types.ts#L13) |

---

### SettingManager

#### Properties

| Property | Type                                                                                  | Defined in                                                                                                                                             |
| -------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `get`    | \<`K`\>(`key`: `K`) => [`APISettings`](README.md#apisettings)\[`K`\]                  | [src/services/interfaces.ts:29](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/interfaces.ts#L29) |
| `set`    | \<`K`\>(`key`: `K`, `value`: [`APISettings`](README.md#apisettings)\[`K`\]) => `void` | [src/services/interfaces.ts:30](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/services/interfaces.ts#L30) |

## Type Aliases

### Data

```ts
type Data: Record<string, never>;
```

#### Defined in

[src/types.ts:4](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/types.ts#L4)

---

### DevicePostDataAny

```ts
type DevicePostDataAny: DevicePostData | FirstGenDevicePostData;
```

#### Defined in

[src/types.ts:50](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/types.ts#L50)

## Variables

### UNIT

```ts
const UNIT: 1 = 1
```

#### Defined in

[src/constants.ts:1](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/constants.ts#L1)

## Functions

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

| Type Parameter                                                  |
| --------------------------------------------------------------- |
| `T` _extends_ readonly `Device`[] \| [`Attrs`](README.md#attrs) |

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

[src/decorators/syncDevices.ts:5](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/decorators/syncDevices.ts#L5)

---

### updateDevice()

```ts
function updateDevice(
  target: (...args: any[]) => Promise<Attrs>,
  _context: ClassMethodDecoratorContext<
    unknown,
    (this: unknown, ...args: any) => any
  >,
): (...args: unknown[]) => Promise<Attrs>
```

#### Parameters

| Parameter  | Type                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------ |
| `target`   | (...`args`: `any`[]) => `Promise`\<[`Attrs`](README.md#attrs)\>                            |
| `_context` | `ClassMethodDecoratorContext`\<`unknown`, (`this`: `unknown`, ...`args`: `any`) => `any`\> |

#### Returns

`Function`

##### Parameters

| Parameter | Type        |
| --------- | ----------- |
| ...`args` | `unknown`[] |

##### Returns

`Promise`\<[`Attrs`](README.md#attrs)\>

#### Defined in

[src/decorators/updateDevice.ts:4](https://github.com/OlivierZal/heatzy-api/blob/581f16ed45dc88cdf0b75779b8d4aaa875e9916f/src/decorators/updateDevice.ts#L4)
