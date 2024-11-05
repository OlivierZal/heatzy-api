# Heatzy API for Node.js - v3.0.0

## Enumerations

### DerogMode

#### Enumeration Members

| Enumeration Member | Value | Defined in                                                                                                                 |
| ------------------ | ----- | -------------------------------------------------------------------------------------------------------------------------- |
| `boost`            | `2`   | [src/types.ts:13](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L13) |
| `off`              | `0`   | [src/types.ts:14](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L14) |
| `vacation`         | `1`   | [src/types.ts:15](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L15) |

---

### Mode

#### Enumeration Members

| Enumeration Member | Value | Defined in                                                                                                               |
| ------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------ |
| `cft`              | `0`   | [src/types.ts:4](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L4) |
| `cft1`             | `4`   | [src/types.ts:5](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L5) |
| `cft2`             | `5`   | [src/types.ts:6](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L6) |
| `eco`              | `1`   | [src/types.ts:7](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L7) |
| `fro`              | `2`   | [src/types.ts:8](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L8) |
| `stop`             | `3`   | [src/types.ts:9](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L9) |

---

### Switch

#### Enumeration Members

| Enumeration Member | Value | Defined in                                                                                                                 |
| ------------------ | ----- | -------------------------------------------------------------------------------------------------------------------------- |
| `off`              | `0`   | [src/types.ts:19](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L19) |
| `on`               | `1`   | [src/types.ts:20](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L20) |

## Classes

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

[src/services/api.ts:49](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/api.ts#L49)

#### Properties

| Property          | Modifier   | Type                                         | Defined in                                                                                                                               |
| ----------------- | ---------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `settingManager?` | `readonly` | [`SettingManager`](README.md#settingmanager) | [src/services/api.ts:37](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/api.ts#L37) |

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

[src/services/api.ts:86](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/api.ts#L86)

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
| `data` | [`Bindings`](README.md#bindings-1) | [src/services/api.ts:100](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/api.ts#L100) |

###### Implementation of

[`IAPI`](README.md#iapi).`bindings`

###### Defined in

[src/services/api.ts:100](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/api.ts#L100)

##### clearSync()

```ts
clearSync(): void
```

###### Returns

`void`

###### Implementation of

[`IAPI`](README.md#iapi).`clearSync`

###### Defined in

[src/services/api.ts:104](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/api.ts#L104)

##### control()

```ts
control(id: string, postData: DevicePostDataAny): Promise<{
  data: Data;
}>
```

###### Parameters

| Parameter  | Type                                               |
| ---------- | -------------------------------------------------- |
| `id`       | `string`                                           |
| `postData` | [`DevicePostDataAny`](README.md#devicepostdataany) |

###### Returns

`Promise`\<\{
`data`: [`Data`](README.md#data);
\}\>

| Name   | Type                     | Defined in                                                                                                                                 |
| ------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `data` | [`Data`](README.md#data) | [src/services/api.ts:114](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/api.ts#L114) |

###### Implementation of

[`IAPI`](README.md#iapi).`control`

###### Defined in

[src/services/api.ts:111](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/api.ts#L111)

##### deviceData()

```ts
deviceData(id: string): Promise<{
  data: DeviceData;
}>
```

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `id`      | `string` |

###### Returns

`Promise`\<\{
`data`: [`DeviceData`](README.md#devicedata-1);
\}\>

| Name   | Type                                   | Defined in                                                                                                                                 |
| ------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `data` | [`DeviceData`](README.md#devicedata-1) | [src/services/api.ts:118](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/api.ts#L118) |

###### Implementation of

[`IAPI`](README.md#iapi).`deviceData`

###### Defined in

[src/services/api.ts:118](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/api.ts#L118)

##### fetchAndSync()

```ts
fetchAndSync(): Promise<readonly Device[]>
```

###### Returns

`Promise`\<readonly `Device`[]\>

###### Implementation of

[`IAPI`](README.md#iapi).`fetchAndSync`

###### Defined in

[src/services/api.ts:122](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/api.ts#L122)

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
| `data` | [`LoginData`](README.md#logindata) | [src/services/api.ts:137](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/api.ts#L137) |

###### Implementation of

[`IAPI`](README.md#iapi).`login`

###### Defined in

[src/services/api.ts:133](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/api.ts#L133)

## Interfaces

### APIConfig

#### Extends

- `Partial`\<[`LoginPostData`](README.md#loginpostdata)\>

#### Properties

| Property            | Modifier   | Type                                         | Inherited from     | Defined in                                                                                                                                             |
| ------------------- | ---------- | -------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `autoSyncInterval?` | `public`   | `null` \| `number`                           | -                  | [src/services/interfaces.ts:39](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/interfaces.ts#L39) |
| `language?`         | `public`   | `string`                                     | -                  | [src/services/interfaces.ts:40](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/interfaces.ts#L40) |
| `logger?`           | `public`   | [`Logger`](README.md#logger)                 | -                  | [src/services/interfaces.ts:41](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/interfaces.ts#L41) |
| `password?`         | `readonly` | `string`                                     | `Partial.password` | [src/types.ts:31](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L31)                             |
| `settingManager?`   | `public`   | [`SettingManager`](README.md#settingmanager) | -                  | [src/services/interfaces.ts:42](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/interfaces.ts#L42) |
| `shouldVerifySSL?`  | `public`   | `boolean`                                    | -                  | [src/services/interfaces.ts:43](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/interfaces.ts#L43) |
| `timezone?`         | `public`   | `string`                                     | -                  | [src/services/interfaces.ts:44](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/interfaces.ts#L44) |
| `username?`         | `readonly` | `string`                                     | `Partial.username` | [src/types.ts:32](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L32)                             |

---

### APISettings

#### Properties

| Property    | Modifier   | Type               | Defined in                                                                                                                                             |
| ----------- | ---------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `expireAt?` | `readonly` | `null` \| `string` | [src/services/interfaces.ts:12](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/interfaces.ts#L12) |
| `password?` | `readonly` | `null` \| `string` | [src/services/interfaces.ts:13](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/interfaces.ts#L13) |
| `token?`    | `readonly` | `null` \| `string` | [src/services/interfaces.ts:14](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/interfaces.ts#L14) |
| `username?` | `readonly` | `null` \| `string` | [src/services/interfaces.ts:15](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/interfaces.ts#L15) |

---

### BaseAttrs

#### Properties

| Property        | Type                               | Defined in                                                                                                                 |
| --------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `cft_tempH?`    | `number`                           | [src/types.ts:56](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L56) |
| `cft_tempL?`    | `number`                           | [src/types.ts:57](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L57) |
| `derog_mode?`   | [`DerogMode`](README.md#derogmode) | [src/types.ts:58](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L58) |
| `derog_time?`   | `number`                           | [src/types.ts:59](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L59) |
| `lock_switch?`  | [`Switch`](README.md#switch)       | [src/types.ts:60](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L60) |
| `mode?`         | [`Mode`](README.md#mode)           | [src/types.ts:61](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L61) |
| `timer_switch?` | [`Switch`](README.md#switch)       | [src/types.ts:62](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L62) |

---

### Bindings

#### Properties

| Property  | Modifier   | Type                | Defined in                                                                                                                 |
| --------- | ---------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `devices` | `readonly` | readonly `Device`[] | [src/types.ts:48](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L48) |

---

### DeviceData

#### Properties

| Property | Modifier   | Type    | Defined in                                                                                                                 |
| -------- | ---------- | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| `attr`   | `readonly` | `never` | [src/types.ts:72](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L72) |

---

### DevicePostData

#### Properties

| Property | Modifier   | Type                               | Defined in                                                                                                                 |
| -------- | ---------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `attrs`  | `readonly` | [`BaseAttrs`](README.md#baseattrs) | [src/types.ts:66](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L66) |

---

### ErrorData

#### Properties

| Property         | Modifier   | Type               | Defined in                                                                                                                 |
| ---------------- | ---------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `detail_message` | `readonly` | `null` \| `string` | [src/types.ts:26](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L26) |
| `error_message`  | `readonly` | `null` \| `string` | [src/types.ts:27](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L27) |

---

### FirstGenDevicePostData

#### Properties

| Property | Modifier   | Type                                 | Defined in                                                                                                                 |
| -------- | ---------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `raw`    | `readonly` | [`1`, `1`, [`Mode`](README.md#mode)] | [src/types.ts:52](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L52) |

---

### IAPI

#### Properties

| Property       | Type                                                                                                                                                   | Defined in                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `authenticate` | (`data`?: [`LoginPostData`](README.md#loginpostdata)) => `Promise`\<`boolean`\>                                                                        | [src/services/interfaces.ts:48](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/interfaces.ts#L48) |
| `bindings`     | () => `Promise`\<\{ `data`: [`Bindings`](README.md#bindings-1); \}\>                                                                                   | [src/services/interfaces.ts:49](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/interfaces.ts#L49) |
| `clearSync`    | () => `void`                                                                                                                                           | [src/services/interfaces.ts:50](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/interfaces.ts#L50) |
| `control`      | (`id`: `string`, `postData`: [`DevicePostDataAny`](README.md#devicepostdataany)) => `Promise`\<\{ `data`: [`Data`](README.md#data); \}\>               | [src/services/interfaces.ts:51](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/interfaces.ts#L51) |
| `deviceData`   | (`id`: `string`) => `Promise`\<\{ `data`: [`DeviceData`](README.md#devicedata-1); \}\>                                                                 | [src/services/interfaces.ts:52](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/interfaces.ts#L52) |
| `fetchAndSync` | () => `Promise`\<readonly `Device`[]\>                                                                                                                 | [src/services/interfaces.ts:53](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/interfaces.ts#L53) |
| `login`        | (`__namedParameters`: \{ `postData`: [`LoginPostData`](README.md#loginpostdata); \}) => `Promise`\<\{ `data`: [`LoginData`](README.md#logindata); \}\> | [src/services/interfaces.ts:54](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/interfaces.ts#L54) |

---

### Logger

#### Properties

| Property | Type                                                        | Defined in                                                                                                                                             |
| -------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `error`  | (`message`?: `any`, ...`optionalParams`: `any`[]) => `void` | [src/services/interfaces.ts:34](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/interfaces.ts#L34) |
| `log`    | (`message`?: `any`, ...`optionalParams`: `any`[]) => `void` | [src/services/interfaces.ts:35](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/interfaces.ts#L35) |

---

### LoginData

#### Properties

| Property    | Modifier   | Type     | Defined in                                                                                                                 |
| ----------- | ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `expire_at` | `readonly` | `number` | [src/types.ts:36](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L36) |
| `token`     | `readonly` | `string` | [src/types.ts:37](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L37) |

---

### LoginPostData

#### Properties

| Property   | Modifier   | Type     | Defined in                                                                                                                 |
| ---------- | ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `password` | `readonly` | `string` | [src/types.ts:31](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L31) |
| `username` | `readonly` | `string` | [src/types.ts:32](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L32) |

---

### SettingManager

#### Properties

| Property | Type                                                                                  | Defined in                                                                                                                                             |
| -------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `get`    | \<`K`\>(`key`: `K`) => [`APISettings`](README.md#apisettings)\[`K`\]                  | [src/services/interfaces.ts:29](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/interfaces.ts#L29) |
| `set`    | \<`K`\>(`key`: `K`, `value`: [`APISettings`](README.md#apisettings)\[`K`\]) => `void` | [src/services/interfaces.ts:30](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/services/interfaces.ts#L30) |

## Type Aliases

### Data

```ts
type Data: Record<string, never>;
```

#### Defined in

[src/types.ts:23](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L23)

---

### DevicePostDataAny

```ts
type DevicePostDataAny: DevicePostData | FirstGenDevicePostData;
```

#### Defined in

[src/types.ts:69](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L69)

## Variables

### NUMBER_1

```ts
const NUMBER_1: 1 = 1
```

#### Defined in

[src/types.ts:1](https://github.com/OlivierZal/heatzy-api/blob/6117127b534ad941957ff80bbaaf35133dde1035/src/types.ts#L1)
