# Heatzy API for Node.js

## Enumerations

### DerogMode

#### Enumeration Members

| Enumeration Member | Value |
| :------ | :------ |
| `boost` | `2` |
| `off` | `0` |
| `vacation` | `1` |

***

### Mode

#### Enumeration Members

| Enumeration Member | Value |
| :------ | :------ |
| `cft` | `0` |
| `cft1` | `4` |
| `cft2` | `5` |
| `eco` | `1` |
| `fro` | `2` |
| `stop` | `3` |

***

### Switch

#### Enumeration Members

| Enumeration Member | Value |
| :------ | :------ |
| `off` | `0` |
| `on` | `1` |

## Classes

### default

#### Constructors

##### new default()

```ts
new default(config: {
  logger: Logger;
  settingManager: SettingManager;
  shouldVerifySSL: boolean;
 }): default
```

###### Parameters

| Parameter | Type |
| :------ | :------ |
| `config` | `object` |
| `config.logger`? | [`Logger`](README.md#logger) |
| `config.settingManager`? | [`SettingManager`](README.md#settingmanager) |
| `config.shouldVerifySSL`? | `boolean` |

###### Returns

[`default`](README.md#default)

###### Source

[src/lib/HeatzyAPI.ts:66](https://github.com/OlivierZal/heatzy-api/blob/6febc1d92fa9deaa2996a11f15d2e0eed9cb8029/src/lib/HeatzyAPI.ts#L66)

#### Methods

##### applyLogin()

```ts
applyLogin(data?: LoginCredentials): Promise<boolean>
```

###### Parameters

| Parameter | Type |
| :------ | :------ |
| `data`? | [`LoginCredentials`](README.md#logincredentials) |

###### Returns

`Promise`\<`boolean`\>

###### Source

[src/lib/HeatzyAPI.ts:120](https://github.com/OlivierZal/heatzy-api/blob/6febc1d92fa9deaa2996a11f15d2e0eed9cb8029/src/lib/HeatzyAPI.ts#L120)

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

| Member | Type |
| :------ | :------ |
| `data` | [`Bindings`](README.md#bindings-1) |

###### Source

[src/lib/HeatzyAPI.ts:135](https://github.com/OlivierZal/heatzy-api/blob/6febc1d92fa9deaa2996a11f15d2e0eed9cb8029/src/lib/HeatzyAPI.ts#L135)

##### control()

```ts
control(id: string, postData: DevicePostDataAny): Promise<{
  data: Data;
}>
```

###### Parameters

| Parameter | Type |
| :------ | :------ |
| `id` | `string` |
| `postData` | [`DevicePostDataAny`](README.md#devicepostdataany) |

###### Returns

`Promise`\<\{
  `data`: [`Data`](README.md#data);
 \}\>

| Member | Type |
| :------ | :------ |
| `data` | [`Data`](README.md#data) |

###### Source

[src/lib/HeatzyAPI.ts:139](https://github.com/OlivierZal/heatzy-api/blob/6febc1d92fa9deaa2996a11f15d2e0eed9cb8029/src/lib/HeatzyAPI.ts#L139)

##### deviceData()

```ts
deviceData(id: string): Promise<{
  data: DeviceData;
}>
```

###### Parameters

| Parameter | Type |
| :------ | :------ |
| `id` | `string` |

###### Returns

`Promise`\<\{
  `data`: [`DeviceData`](README.md#devicedata-1);
 \}\>

| Member | Type |
| :------ | :------ |
| `data` | [`DeviceData`](README.md#devicedata-1) |

###### Source

[src/lib/HeatzyAPI.ts:146](https://github.com/OlivierZal/heatzy-api/blob/6febc1d92fa9deaa2996a11f15d2e0eed9cb8029/src/lib/HeatzyAPI.ts#L146)

##### login()

```ts
login(__namedParameters: LoginPostData): Promise<{
  data: LoginData;
}>
```

###### Parameters

| Parameter | Type |
| :------ | :------ |
| `__namedParameters` | [`LoginPostData`](README.md#loginpostdata) |

###### Returns

`Promise`\<\{
  `data`: [`LoginData`](README.md#logindata);
 \}\>

| Member | Type |
| :------ | :------ |
| `data` | [`LoginData`](README.md#logindata) |

###### Source

[src/lib/HeatzyAPI.ts:150](https://github.com/OlivierZal/heatzy-api/blob/6febc1d92fa9deaa2996a11f15d2e0eed9cb8029/src/lib/HeatzyAPI.ts#L150)

## Interfaces

### APISettings

#### Properties

| Property | Modifier | Type |
| :------ | :------ | :------ |
| `expireAt?` | `readonly` | `null` \| `number` |
| `password?` | `readonly` | `null` \| `string` |
| `token?` | `readonly` | `null` \| `string` |
| `username?` | `readonly` | `null` \| `string` |

***

### BaseAttrs

#### Properties

| Property | Type |
| :------ | :------ |
| `cft_tempH?` | `number` |
| `cft_tempL?` | `number` |
| `derog_mode?` | [`DerogMode`](README.md#derogmode) |
| `derog_time?` | `number` |
| `lock_switch?` | [`Switch`](README.md#switch) |
| `mode?` | [`Mode`](README.md#mode) |
| `timer_switch?` | [`Switch`](README.md#switch) |

***

### Bindings

#### Properties

| Property | Modifier | Type |
| :------ | :------ | :------ |
| `devices` | `readonly` | readonly \{ `dev_alias`: `string`; `did`: `string`; `product_key`: `string`; `product_name`: `string`; \}[] |

***

### DeviceData

#### Properties

| Property | Modifier | Type |
| :------ | :------ | :------ |
| `attr` | `readonly` | `never` |

***

### DevicePostData

#### Properties

| Property | Modifier | Type |
| :------ | :------ | :------ |
| `attrs` | `readonly` | [`BaseAttrs`](README.md#baseattrs) |

***

### ErrorData

#### Properties

| Property | Modifier | Type |
| :------ | :------ | :------ |
| `detail_message` | `readonly` | `null` \| `string` |
| `error_message` | `readonly` | `null` \| `string` |

***

### FirstGenDevicePostData

#### Properties

| Property | Modifier | Type |
| :------ | :------ | :------ |
| `raw` | `readonly` | [`1`, `1`, [`Mode`](README.md#mode)] |

***

### Logger

#### Properties

| Property | Modifier | Type |
| :------ | :------ | :------ |
| `error` | `readonly` | (...`data`: `any`[]) => `void`(`message`?: `any`, ...`optionalParams`: `any`[]) => `void` |
| `log` | `readonly` | (...`data`: `any`[]) => `void`(`message`?: `any`, ...`optionalParams`: `any`[]) => `void` |

***

### LoginCredentials

#### Properties

| Property | Modifier | Type |
| :------ | :------ | :------ |
| `password` | `readonly` | `string` |
| `username` | `readonly` | `string` |

***

### LoginData

#### Properties

| Property | Modifier | Type |
| :------ | :------ | :------ |
| `expire_at` | `readonly` | `number` |
| `token` | `readonly` | `string` |

***

### LoginPostData

#### Properties

| Property | Modifier | Type |
| :------ | :------ | :------ |
| `password` | `readonly` | `string` |
| `username` | `readonly` | `string` |

***

### SettingManager

#### Properties

| Property | Type |
| :------ | :------ |
| `get` | \<`K`\>(`key`: `K`) => `undefined` \| `null` \| [`APISettings`](README.md#apisettings)\[`K`\] |
| `set` | \<`K`\>(`key`: `K`, `value`: [`APISettings`](README.md#apisettings)\[`K`\]) => `void` |

## Type Aliases

### Data

```ts
type Data: Record<string, never>;
```

#### Source

[src/types.ts:23](https://github.com/OlivierZal/heatzy-api/blob/6febc1d92fa9deaa2996a11f15d2e0eed9cb8029/src/types.ts#L23)

***

### DevicePostDataAny

```ts
type DevicePostDataAny: DevicePostData | FirstGenDevicePostData;
```

#### Source

[src/types.ts:72](https://github.com/OlivierZal/heatzy-api/blob/6febc1d92fa9deaa2996a11f15d2e0eed9cb8029/src/types.ts#L72)

## Variables

### NUMBER\_1

```ts
const NUMBER_1: 1 = 1;
```

#### Source

[src/types.ts:1](https://github.com/OlivierZal/heatzy-api/blob/6febc1d92fa9deaa2996a11f15d2e0eed9cb8029/src/types.ts#L1)
