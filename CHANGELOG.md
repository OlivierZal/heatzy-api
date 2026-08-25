# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [14.0.0] - 2026-08-25

### Security

- **13.0.1's headline overclaimed — the sign-in body kept leaking until this release.** "Secrets no longer travel inside a thrown `HttpError`" was true of the request HEADERS only: `config.data` still carried the `/login` body verbatim, so every rejected sign-in put the account's **username and password in clear text** into the thrown error, reachable through the host's own error logging. Query parameters, the response headers and the response body were equally untouched — and an upstream echoes the credential it just rejected. The whole snapshot is now redacted at construction — request headers, body and query parameters, response headers and body alike — the scope the sibling melcloud-api client shipped on 2026-08-21 and this repo should have adopted the same day. If a host log captured an `HttpError` from a rejected sign-in under 13.0.1 or earlier, treat the password as exposed and rotate it.

### Changed

- **BREAKING — a thrown `HttpError` no longer carries a typed, verbatim payload.** `HttpError` loses its `T` type parameter and `response.data` is now `unknown`, because a failed response body is a DIAGNOSTIC payload rather than a contract: its secrets are replaced by `******`, so nothing may rely on its shape. Migration: an `HttpError<Foo>` annotation becomes `HttpError`, and code reading `error.response.data` narrows it itself — nothing in this SDK ever did.

## [13.0.1] - 2026-08-21

### Fixed

- **Secrets no longer travel inside a thrown `HttpError`.** The request snapshot the error carries (`config.headers`) held the Gizwits authentication headers verbatim, and because those are DEFAULT headers every non-2xx on an authenticated call leaked the token — into whatever logger the host runs, and from there into the diagnostic reports users paste into issues (a sibling client leaked a live bearer token that way on 2026-08-21). Header values whose key names a secret now read `******`, redacted in the `HttpError` constructor so the leak is gone as a class rather than guarded at each logging site; the vocabulary is the one the call loggers already used.

## [13.0.0] - 2026-08-10

### Changed

- **Breaking:** `engines.node` raised to `>=22.20.0` (was `>=22.19.0`). The floor now states the measured device fleet: every up-to-date Homey Pro runs Node 22.20 (Early 2019) or 22.23 (2023), measured on-device 2026-08, so 22.19 was a number nothing executed. No production dependency of this package declares a floor of its own, so nothing constrained it from below — the previous value was carried over from the sibling client, where `undici` had set it. Nothing changes at runtime (`engines` is advisory absent `engine-strict`), but the package no longer claims support for Node 22.0–22.19.x.

## [12.0.2] - 2026-08-10

### Fixed

- **The library parses again on Homey Pro (2016–2019) running older firmware.** The absolute-URL test in the HTTP client carried the `v` flag, an ES2024 addition: the pre-Node-20 engine on those firmwares rejects it at _parse_ time, so importing the library threw `SyntaxError: Invalid regular expression flags` and took the host app down at boot before any code ran. The regex now uses `u`, which is equivalent here — it uses none of the set notation `v` exists for — and a lint rule holds the constraint.

## [12.0.1] - 2026-08-06

### Fixed

- **Credentials are persisted only when the server accepts them.** `authenticate` used to write the attempted username/password to the settings store and wipe the persisted session before the sign-in round-trip, so a rejected attempt (a typo, a revoked account) displaced working stored credentials and destroyed the live session. A rejected sign-in now leaves the previously persisted credentials and session untouched; a successful one replaces them atomically (`logOut` and the reactive re-authentication keep clearing the session where its invalidation is actually known).

## [12.0.0] - 2026-08-06

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

[14.0.0]: https://github.com/OlivierZal/heatzy-api/compare/v13.0.1...v14.0.0
[13.0.1]: https://github.com/OlivierZal/heatzy-api/compare/v13.0.0...v13.0.1
[13.0.0]: https://github.com/OlivierZal/heatzy-api/compare/v12.0.2...v13.0.0
[12.0.2]: https://github.com/OlivierZal/heatzy-api/compare/v12.0.1...v12.0.2
[12.0.1]: https://github.com/OlivierZal/heatzy-api/compare/v12.0.0...v12.0.1
[12.0.0]: https://github.com/OlivierZal/heatzy-api/compare/v11.0.1...v12.0.0
[11.0.1]: https://github.com/OlivierZal/heatzy-api/compare/v11.0.0...v11.0.1
[11.0.0]: https://github.com/OlivierZal/heatzy-api/compare/v10.0.0...v11.0.0
[10.0.0]: https://github.com/OlivierZal/heatzy-api/releases/tag/v10.0.0
