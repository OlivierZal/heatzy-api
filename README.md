# Heatzy API for Node.js

## Enumerations

### DerogMode

#### Enumeration Members

| Enumeration Member | Value | Defined in |
| ------ | ------ | ------ |
| `boost` | `2` | [src/types.ts:15](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L15) |
| `off` | `0` | [src/types.ts:13](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L13) |
| `vacation` | `1` | [src/types.ts:14](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L14) |

***

### Mode

#### Enumeration Members

| Enumeration Member | Value | Defined in |
| ------ | ------ | ------ |
| `cft` | `0` | [src/types.ts:4](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L4) |
| `cft1` | `4` | [src/types.ts:8](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L8) |
| `cft2` | `5` | [src/types.ts:9](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L9) |
| `eco` | `1` | [src/types.ts:5](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L5) |
| `fro` | `2` | [src/types.ts:6](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L6) |
| `stop` | `3` | [src/types.ts:7](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L7) |

***

### Switch

#### Enumeration Members

| Enumeration Member | Value | Defined in |
| ------ | ------ | ------ |
| `off` | `0` | [src/types.ts:19](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L19) |
| `on` | `1` | [src/types.ts:20](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L20) |

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
| ------ | ------ |
| `config` | `object` |
| `config.logger`? | [`Logger`](README.md#logger) |
| `config.settingManager`? | [`SettingManager`](README.md#settingmanager) |
| `config.shouldVerifySSL`? | `boolean` |

###### Returns

[`default`](README.md#default)

###### Defined in

[src/lib/HeatzyAPI.ts:66](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/lib/HeatzyAPI.ts#L66)

#### Methods

##### applyLogin()

```ts
applyLogin(data?: LoginCredentials): Promise<boolean>
```

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `data`? | [`LoginCredentials`](README.md#logincredentials) |

###### Returns

`Promise`\<`boolean`\>

###### Defined in

[src/lib/HeatzyAPI.ts:120](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/lib/HeatzyAPI.ts#L120)

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

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `data` | [`Bindings`](README.md#bindings-1) | [src/lib/HeatzyAPI.ts:135](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/lib/HeatzyAPI.ts#L135) |

###### Defined in

[src/lib/HeatzyAPI.ts:135](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/lib/HeatzyAPI.ts#L135)

##### control()

```ts
control(id: string, postData: DevicePostDataAny): Promise<{
  data: Data;
}>
```

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `postData` | [`DevicePostDataAny`](README.md#devicepostdataany) |

###### Returns

`Promise`\<\{
  `data`: [`Data`](README.md#data);
 \}\>

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `data` | [`Data`](README.md#data) | [src/lib/HeatzyAPI.ts:142](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/lib/HeatzyAPI.ts#L142) |

###### Defined in

[src/lib/HeatzyAPI.ts:139](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/lib/HeatzyAPI.ts#L139)

##### deviceData()

```ts
deviceData(id: string): Promise<{
  data: DeviceData;
}>
```

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

###### Returns

`Promise`\<\{
  `data`: [`DeviceData`](README.md#devicedata-1);
 \}\>

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `data` | [`DeviceData`](README.md#devicedata-1) | [src/lib/HeatzyAPI.ts:146](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/lib/HeatzyAPI.ts#L146) |

###### Defined in

[src/lib/HeatzyAPI.ts:146](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/lib/HeatzyAPI.ts#L146)

##### login()

```ts
login(__namedParameters: LoginPostData): Promise<{
  data: LoginData;
}>
```

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `__namedParameters` | [`LoginPostData`](README.md#loginpostdata) |

###### Returns

`Promise`\<\{
  `data`: [`LoginData`](README.md#logindata);
 \}\>

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `data` | [`LoginData`](README.md#logindata) | [src/lib/HeatzyAPI.ts:153](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/lib/HeatzyAPI.ts#L153) |

###### Defined in

[src/lib/HeatzyAPI.ts:150](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/lib/HeatzyAPI.ts#L150)

## Interfaces

### APISettings

#### Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| `expireAt?` | `readonly` | `null` \| `number` | [src/lib/HeatzyAPI.ts:25](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/lib/HeatzyAPI.ts#L25) |
| `password?` | `readonly` | `null` \| `string` | [src/lib/HeatzyAPI.ts:26](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/lib/HeatzyAPI.ts#L26) |
| `token?` | `readonly` | `null` \| `string` | [src/lib/HeatzyAPI.ts:27](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/lib/HeatzyAPI.ts#L27) |
| `username?` | `readonly` | `null` \| `string` | [src/lib/HeatzyAPI.ts:28](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/lib/HeatzyAPI.ts#L28) |

***

### BaseAttrs

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| `cft_tempH?` | `number` | [src/types.ts:59](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L59) |
| `cft_tempL?` | `number` | [src/types.ts:60](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L60) |
| `derog_mode?` | [`DerogMode`](README.md#derogmode) | [src/types.ts:61](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L61) |
| `derog_time?` | `number` | [src/types.ts:62](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L62) |
| `lock_switch?` | [`Switch`](README.md#switch) | [src/types.ts:63](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L63) |
| `mode?` | [`Mode`](README.md#mode) | [src/types.ts:64](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L64) |
| `timer_switch?` | [`Switch`](README.md#switch) | [src/types.ts:65](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L65) |

***

### Bindings

#### Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| `devices` | `readonly` | readonly \{ `dev_alias`: `string`; `did`: `string`; `product_key`: `string`; `product_name`: `string`; \}[] | [src/types.ts:46](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L46) |

***

### DeviceData

#### Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| `attr` | `readonly` | `never` | [src/types.ts:75](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L75) |

***

### DevicePostData

#### Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| `attrs` | `readonly` | [`BaseAttrs`](README.md#baseattrs) | [src/types.ts:69](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L69) |

***

### ErrorData

#### Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| `detail_message` | `readonly` | `null` \| `string` | [src/types.ts:26](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L26) |
| `error_message` | `readonly` | `null` \| `string` | [src/types.ts:27](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L27) |

***

### FirstGenDevicePostData

#### Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| `raw` | `readonly` | [`1`, `1`, [`Mode`](README.md#mode)] | [src/types.ts:55](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L55) |

***

### Logger

#### Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| `error` | `readonly` | (...`data`: `any`[]) => `void`(`message`?: `any`, ...`optionalParams`: `any`[]) => `void` | [src/lib/HeatzyAPI.ts:32](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/lib/HeatzyAPI.ts#L32) |
| `log` | `readonly` | (...`data`: `any`[]) => `void`(`message`?: `any`, ...`optionalParams`: `any`[]) => `void` | [src/lib/HeatzyAPI.ts:33](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/lib/HeatzyAPI.ts#L33) |

***

### LoginCredentials

#### Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| `password` | `readonly` | `string` | [src/types.ts:31](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L31) |
| `username` | `readonly` | `string` | [src/types.ts:32](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L32) |

***

### LoginData

#### Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| `expire_at` | `readonly` | `number` | [src/types.ts:41](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L41) |
| `token` | `readonly` | `string` | [src/types.ts:42](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L42) |

***

### LoginPostData

#### Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| `password` | `readonly` | `string` | [src/types.ts:36](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L36) |
| `username` | `readonly` | `string` | [src/types.ts:37](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L37) |

***

### SettingManager

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| `get` | \<`K`\>(`key`: `K`) => `undefined` \| `null` \| [`APISettings`](README.md#apisettings)\[`K`\] | [src/lib/HeatzyAPI.ts:37](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/lib/HeatzyAPI.ts#L37) |
| `set` | \<`K`\>(`key`: `K`, `value`: [`APISettings`](README.md#apisettings)\[`K`\]) => `void` | [src/lib/HeatzyAPI.ts:40](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/lib/HeatzyAPI.ts#L40) |

## Type Aliases

### Data

```ts
type Data: Record<string, never>;
```

#### Defined in

[src/types.ts:23](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L23)

***

### DevicePostDataAny

```ts
type DevicePostDataAny: DevicePostData | FirstGenDevicePostData;
```

#### Defined in

[src/types.ts:72](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L72)

## Variables

### NUMBER\_1

```ts
const NUMBER_1: 1 = 1;
```

#### Defined in

[src/types.ts:1](https://github.com/OlivierZal/heatzy-api/blob/77300e31c27b54afa928262b4d821c2753ce13e1/src/types.ts#L1)
