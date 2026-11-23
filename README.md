# @olivierzal/heatzy-api

A typed Node.js client for the [Heatzy](https://www.heatzy.com/) (Gizwits) API, providing access to Heatzy pilot-wire modules and connected radiators: Pilote (V1 to V4), Pilote Pro, Glow, Onyx and Shine.

[![License](https://img.shields.io/github/license/OlivierZal/heatzy-api)](https://github.com/OlivierZal/heatzy-api/blob/main/LICENSE)
[![Node](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FOlivierZal%2Fheatzy-api%2Fmain%2Fpackage.json&query=%24.engines.node&label=node&color=brightgreen)](https://github.com/OlivierZal/heatzy-api/blob/main/package.json)
[![GitHub release](https://img.shields.io/github/v/release/OlivierZal/heatzy-api?sort=semver)](https://github.com/OlivierZal/heatzy-api/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/OlivierZal/heatzy-api/ci.yml?branch=main&label=CI)](https://github.com/OlivierZal/heatzy-api/actions/workflows/ci.yml)
[![CodeQL](https://github.com/OlivierZal/heatzy-api/actions/workflows/github-code-scanning/codeql/badge.svg?branch=main)](https://github.com/OlivierZal/heatzy-api/security/code-scanning)

[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=OlivierZal_heatzy-api&metric=alert_status)](https://sonarcloud.io/dashboard?id=OlivierZal_heatzy-api)
[![Test coverage](https://sonarcloud.io/api/project_badges/measure?project=OlivierZal_heatzy-api&metric=coverage)](https://sonarcloud.io/component_measures?id=OlivierZal_heatzy-api&metric=coverage)
[![Docs coverage](https://olivierzal.github.io/heatzy-api/coverage.svg)](https://olivierzal.github.io/heatzy-api/)

## Features

- **One API for every product**: each device is read and controlled through a facade, and three type guards give access to what its product adds.
- **Read and control**: heating mode, on or off, target temperatures, derogations (the temporary overrides: boost, vacation, presence), child lock, timer and open-window detection, plus the measured temperature and humidity.
- **Session handling**: the session is renewed before it expires and can be kept across restarts.
- **Automatic refresh**: every device is read again every 5 seconds by default, with a callback after each refresh that succeeds.
- **Failure handling**: a read is retried on a server or network failure, a write never is, and a device that cannot be read never prevents the sign-in or hides the other devices.
- **Safe logs**: passwords, usernames, tokens and device names are masked in what the client logs and in every HTTP error it throws.
- **Typed and tree-shakable**: TypeScript declarations included, ESM only, `sideEffects: false`.

## Requirements

- Node.js `>=22.20.0`, ESM only.
- A Heatzy account.
- A GitHub personal access token with the `read:packages` scope, to install the package.

## Installation

The package is published to GitHub Packages, not the public npm registry. Point the `@olivierzal` scope at it, with the token in `NODE_AUTH_TOKEN`:

```ini title=".npmrc"
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
@olivierzal:registry=https://npm.pkg.github.com
```

Then install the package at an exact version:

```sh title="install"
npm install --save-exact @olivierzal/heatzy-api
```

## Quick start

Sign in, list the devices and switch the first one to eco:

```ts title="quick-start"
import { FacadeManager, HeatzyAPI, Mode } from '@olivierzal/heatzy-api'

const api = await HeatzyAPI.create({
  username: 'user@example.com',
  password: 'password',
})
// create() does not throw when the sign-in fails
if (!api.isAuthenticated()) {
  throw new Error('Sign-in failed: see the log')
}

const manager = new FacadeManager(api)
const facades = api.registry.getDevices().map((device) => manager.get(device))
for (const facade of facades) {
  console.log(facade.name, facade.mode, facade.isOn)
}
await facades[0]?.setValues({ mode: Mode.eco })
```

## Usage

### Sign in

`HeatzyAPI.create()` restores the session a previous run stored, or signs in with the `username` and `password` options, and reads the devices before it resolves. It never throws when the sign-in fails: it logs the failure, and `isAuthenticated()` returns `false`. With `shouldResumeSessionInBackground: true` it returns at once and does all this in the background. To handle a refusal yourself, call `authenticate()`:

```ts title="sign-in"
import {
  AuthenticationError,
  HeatzyAPI,
  RegistrySyncError,
} from '@olivierzal/heatzy-api'

const api = await HeatzyAPI.create()
try {
  await api.authenticate({ username: 'user@example.com', password: 'password' })
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Heatzy refused the credentials')
  } else if (error instanceof RegistrySyncError) {
    console.error('Signed in, but the devices could not be read')
  } else {
    throw error
  }
}
```

`authenticate()` resolves once the devices have been read, and throws any other failure (the network, a server error) as it is. `logOut()` forgets the session and the stored credentials, stops the automatic refresh and empties the device list. Once signed in, the client keeps the session alive:

- A session within 5 minutes of its expiry is renewed before the next request, and a request refused because the session is no longer valid triggers one sign-in before it is sent once more.
- An automatic sign-in that fails for a passing reason (the network, a server error) is retried every minute.
- When Heatzy refuses the stored credentials, only the user can restore the session: `events.onAuthenticationLost` fires once and the automatic refresh stops. Automatic sign-ins pause for 15 minutes after a refusal, but `authenticate()` never does: once it succeeds, `events.onAuthenticationRestored` fires and the refresh starts again. A session that ends while no credentials are stored fires no event: `isAuthenticated()` returns `false` and the refresh stops.

### Keep the session across restarts

Without a `settingManager`, everything stays in memory and a new client signs in from scratch. Pass a string store with `get`, `set` and an optional `unset`, and the client keeps five keys in it: `token`, `expiry`, `username`, `password` and `loginBackoffUntil`. Without `unset`, it clears a key by storing an empty string. Credentials given to `authenticate()` are stored once Heatzy has accepted them, so only the first run has to sign in:

```ts title="setting-manager"
import { HeatzyAPI } from '@olivierzal/heatzy-api'

// A Map stands in for your own persistent store
const store = new Map<string, string>()
const api = await HeatzyAPI.create({
  settingManager: {
    get: (key) => store.get(key),
    set: (key, value) => store.set(key, value),
    unset: (key) => store.delete(key),
  },
})
if (!api.isAuthenticated()) {
  await api.authenticate({ username: 'user@example.com', password: 'password' })
}
```

> [!IMPORTANT]
> The store receives the account password and the session token as plain strings. Back it with secure storage.

### Read a device

A `FacadeManager` turns a device, taken from `api.registry.getDevices()` or `api.getDeviceById(id)`, into its facade. Every facade has `id`, `name`, `product`, `mode`, `isOn` and `previousMode`, and `await facade.values()` reads the device now, without waiting for the next refresh. A type guard that passes gives access to what its row adds, and to the rows above it:

| Product              | `facade.product`                       | Guards that pass                            | What the facade adds                                                            |
| -------------------- | -------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------- |
| Pilote V1            | `Product.v1`                           | none                                        | nothing                                                                         |
| Pilote V2, V3 and V4 | `Product.v2` (V2 and V3), `Product.v4` | `supportsV2`                                | derogation, child lock, timer                                                   |
| Glow, Onyx and Shine | `Product.glow`                         | `supportsV2`, `supportsGlow`                | measured, comfort and eco temperatures, sensor calibration                      |
| Pilote Pro           | `Product.pro`                          | `supportsV2`, `supportsGlow`, `supportsPro` | humidity, open-window detection, presence, the mode and the order being applied |

```ts title="read"
import {
  type DeviceFacadeAny,
  supportsGlow,
  supportsPro,
} from '@olivierzal/heatzy-api'

const describe = (facade: DeviceFacadeAny): void => {
  console.log(facade.name, facade.mode, facade.isOn)
  if (supportsGlow(facade)) {
    console.log(facade.currentTemperature, facade.comfortTemperature)
  }
  if (supportsPro(facade)) {
    console.log(facade.currentHumidity, facade.currentSignal)
  }
}
```

- `currentMode`, `currentSignal` and `derogationMode` are `null` for a value the package does not know. On a Pilote Pro, `currentSignal` is the order being sent to the radiator right now: under one `mode`, the Pro's own regulation switches it between comfort and eco.
- `derogationEndDate`, a `Temporal.ZonedDateTime` (`Temporal` is exported), and `derogationEndString` are `null` when no derogation is running, and for a derogation that was already running when the client first saw the device, until it changes. The `timezone` and `locale` options set their zone and their language.
- A facade stays valid for as long as you keep it: it follows its device by id. While the device is absent from the device list, `exists` is `false`, `id` and `product` are still readable, the other getters throw `EntityNotFoundError`, and `values()` and `setValues()` throw it once their request has returned.

### Control a device

`facade.setValues()` takes Heatzy's own attribute names, and each product has its own:

| To set                | Pilote V1 | Pilote V2, V3, V4          | Glow, Onyx, Shine          | Pilote Pro                 |
| --------------------- | --------- | -------------------------- | -------------------------- | -------------------------- |
| Heating mode          | `mode`    | `mode`                     | `mode`                     | `mode`                     |
| On or off             | `mode`    | `mode`                     | `on_off`                   | `mode`                     |
| Derogation            | no        | `derog_mode`, `derog_time` | `derog_mode`, `derog_time` | `derog_mode`, `derog_time` |
| Timer                 | no        | `timer_switch`             | `timer_switch`             | `timer_switch`             |
| Child lock            | no        | `lock_switch`              | `LOCK_C`                   | `lock_switch`              |
| Comfort temperature   | no        | no                         | `cft_tempH`, `cft_tempL`   | `cft_temp`                 |
| Eco temperature       | no        | no                         | `eco_tempH`, `eco_tempL`   | `eco_temp`                 |
| Sensor calibration    | no        | no                         | `com_temp`                 | `com_temp`                 |
| Open-window detection | no        | no                         | no                         | `window_switch`            |

`mode` takes a `Mode`: `comfort`, `comfortMinus1`, `comfortMinus2`, `eco`, `frostProtection` or `stop`, which is off (`previousMode` remembers the mode to restore). `comfortMinus1` and `comfortMinus2` exist from the fourth-generation Pilote on, the Pro and the Glow family included. `derog_mode` takes a `DerogationMode`: `off`, `boost`, `vacation`, or `presence` on the Pilote Pro only, and `derog_time` counts minutes for a boost, days for a vacation. `on_off`, `LOCK_C` and the three `_switch` attributes take a `Switch`, and `com_temp` a number (on the Pilote Pro, 0 to 100 where 50 changes nothing).

```ts title="control"
import {
  type DeviceFacadeAny,
  DerogationMode,
  Product,
  supportsV2,
  Switch,
} from '@olivierzal/heatzy-api'

const control = async (facade: DeviceFacadeAny): Promise<void> => {
  if (supportsV2(facade)) {
    // Boost for 30 minutes
    await facade.setValues({ derog_mode: DerogationMode.boost, derog_time: 30 })
    // The child lock has its own attribute on Glow, Onyx and Shine
    await facade.setValues(
      facade.product === Product.glow
        ? { LOCK_C: Switch.on }
        : { lock_switch: Switch.on },
    )
  }
}
```

- `setValues()` resolves once Heatzy has accepted the write. The state in memory then holds what was sent: nothing is read back from the device.
- `getTargetTemperature(facade.product, Mode.comfort, 20.5)` builds the temperature attributes of a product from degrees Celsius. On Glow, Onyx and Shine it keeps the value within 15 to 30 °C for comfort and 10 to 19 °C for eco.
- A Pilote V1 only takes the modes `comfort`, `eco`, `frostProtection` and `stop`: any other write is ignored without an error.

### Refresh and shut down

The client polls Heatzy: every 5 seconds by default, it reads the device list and the state of each device again, which is how a change made on a device or in the Heatzy app reaches you. `await api.fetch()` refreshes now and never throws: when the refresh fails, it logs and returns an empty list.

- The `syncIntervalMinutes` option sets the pace, in minutes (`0.5` for 30 seconds), and `api.setSyncInterval(minutes)` changes it later; `false` turns the refresh off. The refresh timer never keeps the Node.js process alive by itself.
- `events.onSyncComplete` is awaited after each refresh that succeeds, with no argument, and after each facade read or write, with `{ ids: [id] }`. A write also holds the next refresh back until 3 seconds after it completes.
- To shut down, abort the `abortSignal` you passed at creation, which cancels every request in flight and every later one, then call `api[Symbol.dispose]()` to release the timers. Do not use the client afterwards.

### Handle failures

Besides the two errors of `authenticate()`, a call can throw the four below. All but `HttpError` extend `APIError`: `isAPIError()` and `isHttpError()` tell them apart. A network failure or a timeout is thrown as Node's `fetch` raises it.

| Error                    | Thrown when                                                      | Carries                                                                                                     |
| ------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `HttpError`              | Heatzy answers with a status outside 2xx                         | `response.status`, `response.data` (secrets masked), and Heatzy's own reason as `message` when it gives one |
| `ValidationError`        | a response does not have the expected shape                      | `context` (the call) and `cause`                                                                            |
| `EntityNotFoundError`    | a facade is used while its device is absent from the device list | `entityId`                                                                                                  |
| `AttributeNotFoundError` | a facade member is read that the device's data does not carry    | `attribute`                                                                                                 |

A read is retried up to 4 times, after about 1, 2, 4 and 8 seconds, when Heatzy answers 500, 502, 503 or 504, when the connection fails or when the request times out. A write is never retried on such a failure, and a request you abort is never retried at all. Each request times out after 30 seconds: the `transport: { timeoutMs }` option changes that, and `0` disables the timeout (not recommended).

A device that cannot be read never prevents the sign-in or hides the other devices. If its product is unknown to the package, it is left out and named in the log. If its state cannot be read, it keeps its last known state, or stays out of `api.registry` when it was never read, and is read again at the next refresh. `fetch()` returns the devices it listed, so one whose `did` is unknown to `api.getDeviceById()` has not been read yet. `authenticate()` and a refresh fail as a whole only when the device list itself cannot be read.

### Logs and events

The client writes to the `logger` option, a `Logger` (an object with `log` and `error`) that defaults to `console`: one `log` line per request and per response, in which passwords, usernames, tokens and device names are replaced by `******` and a body over 4 KiB is left out. That is many lines at the default pace, so pass your own `logger` to filter them. A failure that repeats is logged when it starts, when its reason changes, at most every five minutes while it lasts, and when it ends. `logFailure(logger, label, error)` writes your own failures the way the client writes its own: one line naming the causes for an expected failure, the error with its stack for anything else (`isKnownFailure()` and `failureCauseChain()` are its two halves).

The `events` option takes seven optional callbacks: `onSyncComplete`, `onAuthenticationLost`, `onAuthenticationRestored`, and around each read and write `onRequestStart`, `onRequestComplete`, `onRequestRetry` and `onRequestError`, which fires once the retries are spent, even for a failure the log no longer repeats. A callback that throws is caught and logged.

## API reference

The generated reference is at <https://olivierzal.github.io/heatzy-api/>. It documents every export with its signature: the client and its options, the facades and their members, the errors, the constants and the types.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Report a problem on the [issue tracker](https://github.com/OlivierZal/heatzy-api/issues).

## Security

For vulnerability reports, see [SECURITY.md](SECURITY.md).

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## Disclaimer

This API is not endorsed, verified or approved by Heatzy or Gizwits. Heatzy cannot be held liable for any claims or damages that may occur when using this client to control Heatzy devices.

## License

[MIT](LICENSE) © Olivier Zalmanski
