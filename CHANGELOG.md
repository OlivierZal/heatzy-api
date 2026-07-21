# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [10.0.0] - 2026-07-21

Full rewrite aligning the library on the `melcloud-api` architecture, toolchain and process. Consumers upgrade by adapting to the surface below; the Gizwits wire format is untouched.

### Breaking changes

- **Runtime**: ESM only, Node.js >= 22.19. `axios`, `luxon` and `source-map-support` are gone — the transport is native `fetch`, dates are [`temporal-polyfill`](https://github.com/fullcalendar/temporal-polyfill), responses are validated with `zod`.
- **Entry point**: `dist/main.js` → `dist/index.js`; the package now ships `types`-first conditional exports.
- **Enums → `as const` objects**: `Mode`, `DerogationMode`, `Product`, `Switch`, `TemperatureCompensation` are erasable constant objects with union types (no runtime TypeScript enums). Member access is unchanged (`Mode.comfort`), but `enum`-specific patterns (reverse mappings) no longer exist.
- **`API` / `HeatzyAPI` class rewritten** on the melcloud-api client skeleton:
  - Private constructor — instantiate via `await HeatzyAPI.create(config)`.
  - `APIConfig` → `HeatzyAPIConfig`: `autoSyncInterval` (seconds) becomes `syncIntervalMinutes` (minutes, `false` to disable); `language`/`timezone` become `locale`/`timezone` (no more Luxon global mutation); `shouldVerifySSL` is dropped (Gizwits serves valid TLS); new `abortSignal`, `events` (lifecycle callbacks), `shouldResumeSessionInBackground`, `transport` options.
  - `authenticate(credentials)` now **throws** `AuthenticationError` on rejection instead of returning `false`; the best-effort restore is `resumeSession()`.
  - New full `logOut()`: clears the persisted token/expiry/credentials, stops the auto-sync timer and empties the registry.
  - Persisted login backoff after a rejected sign-in; persisted settings keys are now `token`, `expiry` (ISO 8601), `username`, `password`, `loginBackoffUntil` (`expireAt` is gone).
  - Endpoint surface renamed to the melcloud-api convention: `bindings()` → `list()`, `deviceData({ id })` → `getValues({ id })` (returns the unwrapped `Attributes`), `control({ id, postData })` → `updateValues({ id, postData })`; all validated responses.
- **`DeviceModel` (static registry) → `DeviceRegistry` instance** at `api.registry`, with `devices.getById(id)` / `getDevices()`. Object identity is preserved across syncs (upsert + prune); device renames now propagate.
- **Facades**: `FacadeManager` takes the API only (`new FacadeManager(api)`) and is keyed by registry entity; `I*Facade` interfaces are gone — the classes are the types, `IDeviceFacadeAny` → `DeviceFacadeAny`. `derogationEndDate` is a `Temporal.ZonedDateTime`; missing attributes throw a typed `AttributeNotFoundError` instead of a bare `Error`.
- **Errors**: typed hierarchy under `APIError` (`AuthenticationError`, `AttributeNotFoundError`, `ValidationError`), plus `HttpError` from the transport (`isHttpError`, `isAPIError` guards).
- **Removed**: `getTargetTemperature` stays, but `modeToModeV1`, `POST_DATA_UNIT` and other internals are no longer exported; `LoginPostData` is `LoginCredentials`; wire type `Device` is now `DeviceBinding`.
- **License**: ISC → MIT (aligned with melcloud-api; a `LICENSE` file now exists).

### Added

- Lifecycle events: `onSyncComplete`, `onAuthenticationLost`, `onAuthenticationRestored`, `onRequestStart` / `onRequestComplete` / `onRequestError` / `onRequestRetry` with per-request correlation ids.
- Zod validation of every consumed payload (`/login`, `/bindings`, `/devdata`); drift surfaces as `ValidationError` with the boundary label.
- Session reuse probe at startup: a persisted token is verified with one sync instead of paying a full re-login on every boot; `shouldResumeSessionInBackground` keeps slow restores off the host's init path.
- Auto-retry of transient 502/503/504 on GET with exponential backoff, observable via `onRequestRetry`.
- 100% test coverage (branches, functions, lines, statements), enforced in CI.

[10.0.0]: https://github.com/OlivierZal/heatzy-api/releases/tag/v10.0.0
