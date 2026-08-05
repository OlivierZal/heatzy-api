# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Breaking changes

- **`updateValues` returns `Promise<void>`.** Its response body was discarded at every call site; dropping it also keeps the README's "Zod schemas guard every consumed payload" literally true.
- **`toAuthFailure` is internal again.** Consumers already receive `AuthenticationError` and narrow with `isAPIError`; nothing downstream holds an `HttpError` in need of mapping.
- **The `Data`, `ErrorData` and `Resolved` type exports are gone.** `Data` and `Resolved` had no consumer, and `ErrorData` was subsumed when `isHttpError` moved to `instanceof` narrowing — the brand field is gone from `HttpError` instances.

### Added

- `HttpStatus`, `HttpErrorRequestConfig` and `TransportConfig` are published: all three were reachable from public members (`HttpError.config`, the `transport` option) yet unnameable by consumers.

### Fixed

- **Log redaction recurses into nested objects.** `redactValue` redacted arrays recursively but returned nested object properties verbatim, so a sensitive key one level deep (`{ body: { password } }`) logged in clear while the README promised redaction.
- The retry backoff's `sleep` detaches its abort listener when the timer fires; a long-lived abort signal (the documented Homey shutdown use case) accumulated one leaked listener per retry.
- The reactive re-auth retry window is anchored to the monotonic clock, so a backwards system-clock adjustment can no longer stretch it.

### Changed

- **Glow setpoint writes are clamped into the wire's accepted ranges** (comfort 15–30 °C, eco 10–19 °C), symmetric with the read side. `getTargetTemperature(Product.glow, …)` used to encode out-of-range values verbatim, so a caller could write 35 °C and read 30 °C back. Non-Glow generations are unchanged.

## [11.0.1] - 2026-08-03

### Fixed

- A write whose only keys are present-`undefined` (`setValues({ mode: undefined })`) no longer reaches the wire on V2, Glow and Pro devices. The `PostAttributes` fields are declared `| undefined`, so any caller can hand one over; V1 already filtered it, but the V2+ guard counted keys before dropping `undefined` values, so the wire received an empty `attrs` payload — a wasted call at best. The rule now lives once, at the `setValues` entry point, and is pinned by a cross-generation contract suite (`tests/contracts/no-changes.test.ts`).

## [11.0.0] - 2026-07-29

### Breaking changes

- **`authenticate()` now rejects when its enforced post-auth sync fails.** Its documented guarantee — "successful return guarantees the registry reflects server state" — was void: the enforced sync ran through `fetch()`, whose catch-all logs and returns an empty list. A `ValidationError`, an unknown `product_key` (the case when Heatzy ships a generation this SDK predates) or any registry error therefore resolved as a successful sign-in over an empty registry, which downstream reads as "this account has no devices". Callers that only handle `AuthenticationError` now see the real error instead; the sync failure surfaces after a successful credential check, so the session is left signed in.

### Fixed

- `resumeSession()` judges the outcome by the session rather than by the throw: a sign-in that succeeded before its sync failed is reported as authenticated (its documented meaning) instead of `false`, which `initialize()` would otherwise have turned into a spurious `onAuthenticationLost` — prompting the user to sign in again over credentials that had just worked.
- `fetch()` no longer emits a sync notification when it swallows a failure; announcing a completed sync over a registry that could not be refreshed made consumers rewrite stale values as if they were fresh.

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

[unreleased]: https://github.com/OlivierZal/heatzy-api/compare/v11.0.1...HEAD
[11.0.1]: https://github.com/OlivierZal/heatzy-api/compare/v11.0.0...v11.0.1
[11.0.0]: https://github.com/OlivierZal/heatzy-api/compare/v10.0.0...v11.0.0
[10.0.0]: https://github.com/OlivierZal/heatzy-api/releases/tag/v10.0.0
