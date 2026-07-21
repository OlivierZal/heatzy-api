# @olivierzal/heatzy-api

A typed Node.js client for the [Heatzy](https://www.heatzy.com/) (Gizwits) API, providing access to Heatzy pilot-wire modules and connected radiators — Pilote (V1/V2/V4), Glow, Onyx, Shine and Pro.

[![License](https://img.shields.io/github/license/OlivierZal/heatzy-api)](LICENSE)
[![Node](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FOlivierZal%2Fheatzy-api%2Fmain%2Fpackage.json&query=%24.engines.node&label=node&color=brightgreen)](package.json)
[![GitHub release](https://img.shields.io/github/v/release/OlivierZal/heatzy-api?sort=semver)](https://github.com/OlivierZal/heatzy-api/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/OlivierZal/heatzy-api/ci.yml?branch=main&label=CI)](https://github.com/OlivierZal/heatzy-api/actions/workflows/ci.yml)
[![CodeQL](https://github.com/OlivierZal/heatzy-api/actions/workflows/github-code-scanning/codeql/badge.svg?branch=main)](https://github.com/OlivierZal/heatzy-api/security/code-scanning)

[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=OlivierZal_heatzy-api&metric=alert_status)](https://sonarcloud.io/dashboard?id=OlivierZal_heatzy-api)
[![Test coverage](https://sonarcloud.io/api/project_badges/measure?project=OlivierZal_heatzy-api&metric=coverage)](https://sonarcloud.io/component_measures?id=OlivierZal_heatzy-api&metric=coverage)
[![Docs coverage](https://olivierzal.github.io/heatzy-api/coverage.svg)](https://olivierzal.github.io/heatzy-api/)

## Features

- **Strongly typed** — full TypeScript types for the Gizwits wire format, with 100% TSDoc coverage on the public surface.
- **Every generation supported** — Pilote V1's positional `raw` triplet, V2/V4 derogations, Glow's split temperature registers (incl. Onyx and Shine), and Pro's measures, open-window detection and presence mode — behind one facade family.
- **Resilient by default** — auto-retry on transient failures, pre-emptive session refresh, and reactive re-login on Gizwits's 400-coded token expiry.
- **Validated boundaries** — Zod schemas guard every consumed payload, so upstream shape drift surfaces as a typed `ValidationError` instead of a deep `undefined` crash.
- **Registry + facades** — an identity-preserving device registry with product-aware facades (`supportsV2` / `supportsGlow` / `supportsPro` narrowing).
- **Tree-shakable** — ESM only, `sideEffects: false`.

## Requirements

- Node.js >= 22
- A valid Heatzy account
- For installing the package: a GitHub personal access token with the `read:packages` scope

## Installation

> [!IMPORTANT]
> This package is published to **GitHub Packages**, not the public npm registry.

Configure your project so npm fetches the `@olivierzal` scope from GitHub:

```ini title=".npmrc"
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
@olivierzal:registry=https://npm.pkg.github.com
```

`NODE_AUTH_TOKEN` must be a GitHub personal access token with the `read:packages` scope (export it in your shell or set it in your CI environment). Then:

```sh title="install"
npm install @olivierzal/heatzy-api
```

## Usage

```ts title="usage"
import { FacadeManager, HeatzyAPI, supportsGlow } from '@olivierzal/heatzy-api'

const api = await HeatzyAPI.create({
  username: 'user@example.com',
  password: 'password',
})

const manager = new FacadeManager(api)

// Interact with a device through its facade
for (const device of api.registry.getDevices()) {
  const facade = manager.get(device)
  console.log(facade.name, facade.mode, facade.isOn)
  if (supportsGlow(facade)) {
    console.log(facade.currentTemperature, facade.comfortTemperature)
  }
}
```

## Session management

The client keeps its session alive without caller involvement:

- **Pre-emptive refresh** — the Gizwits token is renewed when it comes within 5 minutes of expiry, so no request pays the re-authentication round-trip on its critical path.
- **Reactive recovery** — Gizwits reports an invalid or expired token as **HTTP 400** (not 401); the SDK re-authenticates once from persisted credentials and replays the original request. A cooldown guard prevents retry loops.
- **Persistence** — pass a `settingManager` (a simple `get`/`set` string store) to persist the token and credentials across restarts; without one, everything stays in memory and a new instance signs in from scratch.

> [!IMPORTANT]
> The `SettingManager` receives the user token **and the account password** as plain strings. You are responsible for backing it with secure storage (encrypted settings store, OS keychain, …) — do not write it to a world-readable file. The SDK redacts credentials and tokens from its own log output.

```ts title="setting-manager"
const settings = new Map<string, string>()
const api = await HeatzyAPI.create({
  settingManager: {
    get: (key) => settings.get(key) ?? null,
    set: (key, value) => settings.set(key, value),
  },
})
```

## Resilience & retries

The request pipeline applies two policies, outermost first:

1. **Auth retry (HTTP 400/401)** — a single re-authentication + replay, as described above.
2. **Transient retry (GET only)** — 502/503/504 responses are retried up to 4 times with exponential backoff and jitter (1 s initial delay, 16 s cap). Mutations (`POST`) are **never** retried automatically: a write that may have landed server-side must not be silently duplicated. Each retry is observable through the `onRequestRetry` lifecycle event.

## Documentation

Full API reference at <https://olivierzal.github.io/heatzy-api/>.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

For vulnerability reports, see [SECURITY.md](SECURITY.md).

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

> [!CAUTION]
> This API is not endorsed, verified or approved by Heatzy or Gizwits. Heatzy cannot be held liable for any claims or damages that may occur when using this client to control Heatzy devices.

## License

[MIT](LICENSE) © Olivier Zalmanski
