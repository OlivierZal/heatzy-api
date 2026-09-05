# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [16.2.0] - 2026-09-05

### Changed

- **The exact `@olivierzal/api-core` pin advances to 1.2.0.** The core's one change: `SessionAPI` now hands `SyncManager` the LABELLED logger — the seat a host running two labelled clients needs to tell whose auto-sync line a diagnostic report carries. This SDK passes NO `logLabel` (the Ledger verdict: a single client — nothing to disambiguate), so `this.logger` stays the host logger verbatim and every seat, `SyncManager` included, keeps receiving it unwrapped: the log output is byte-identical before and after the bump. The session-lifecycle kernel is the consumer witness — its no-label clause ("hands every seat the host logger verbatim, so no line carries a label"), which reaches the `SyncManager`'s own logger through a throwing host reporter, crossed green with ZERO diff; api-core's suite pins the no-op seat on its side, this kernel pins it through the real client.

### Removed

- **The SessionAPI adoption's stranded residue is swept.** Seven zero-importer forwards left standing by 16.1.0 are removed: five thin `src/resilience/` shim modules (`disposable-timeout`, `retry-backoff`, `policy`, `auth-retry-policy`, `transient-retry-policy`) and `src/fire-and-forget.ts` are deleted outright — the resilience barrel keeps only the `RetryGuard` and `isSessionExpired` forwards, the two paths the session-lifecycle kernel and `HeatzyAPI` still resolve through — and the `Intl` forward is dropped from the surviving `src/temporal.ts` (nothing in this repo formats through it; melcloud-api's own `temporal.ts` serves its consumers). Two test exports orphaned by the 16.1.0 suite surgery (`createHttpError`, `mockHttpClient`) lose their `export`, and the eslint overlay drops the reason-phrase `wireNamingEntries` splice — the status map it covered is `@olivierzal/api-core`'s since the extraction, and `src/http/status.ts` is a bare re-export with no keys left to exempt.

- **The session-lifecycle kernel cites by symbol, never by line.** The kernel carried seventeen line-number citations (`heatzy.ts:341-345` and kin) that rotted when the adoption moved the cited members into the core — several pointed at members no longer in the file at all. They are replaced with the symbol names that survive a move, and the header now carries the same CITATION RULE melcloud-api's kernel adopted on 2026-08-30. The clause texts, the staged wires and every assertion are untouched — only citations changed, and the kernel stays green.

The sweep above shipped unreleased as 16.1.1 and rides along here; it stays behavior-neutral on its own terms — every deleted module was imported by nothing (verified family-wide), none was reachable from the package's single `.` export, and the test/tooling edits touch no shipped code. The minor digit belongs to the pin advance, matching the family's adoption precedent (16.1.0 for core 1.1.0): the dependency's public machinery moves under this SDK's inherited protected seam, even when — as here — no line this SDK emits changes.

## [16.1.0] - 2026-09-04

### Changed

- **`HeatzyAPI` is now a subclass of `@olivierzal/api-core`'s `SessionAPI` (1.1.0).** The session lifecycle and request pipeline this repo carried — the login backoff, the logOut-epoch protocol, the single-flight session refresh and resume, the accepted-sign-ins verdict counter, the refusal record, the loss episodes, the resilience pipeline, the sync-cycle template and its settling epilogue — are DELETED here and inherited from the core, exactly as extracted (the extraction reconciled this repo's 16.0.0 and melcloud-api's 55.0.0 before either SDK adopted). What stays is the Gizwits dialect behind the core's hooks: `doAuthenticate` (the verbatim `/login` exchange, `expire_at` epoch-seconds → ISO 8601), `getAuthHeaders` (the `X-Gizwits-User-token` header), `hasPersistedSession`/`isAuthenticated`/`needsSessionRefresh` (the token as the sole session artifact), `performSessionRefresh` (full re-login, the only refresh Gizwits offers), the CLEARING `reauthenticate` (the 400/9004 names the token itself — the dialect half opposite melcloud's non-clearing Classic, kernel-pinned), `enforceRegistrySync`/`syncRegistry`/`reuseSucceeded` (the per-device registry cycle and the probe's judge-by-the-credential verdict), and `clearPersistedSession`/`clearRegistry`. The subclass passes the core `[401, 400]` (both statuses arm the reactive re-auth), NO `logLabel` (every log line stays unprefixed, as pinned) and NO `rateLimitHours` (no rate-limit rung is built — ledger verdict), and hands it the Gizwits-bound redaction engine, so the request/response log lines the inherited dispatch emits keep masking the user-token header exactly as this repo's own dispatch did — the seam whose omission this adoption caught in the unreleased core, fixed there (`SessionAPIOptions.redaction`) before any SDK adopted, and now pinned here through the real client. The session-lifecycle kernel crossed the move byte-identical but for the one clause below; the public surface is unchanged name for name (64 exports before and after), with the core's protected seam (hooks, `dispatch`/`request`, the template methods, the `expiry` accessor) newly visible to subclassers as inherited members.

- **`[Symbol.dispose]()` now also releases the auth-retry guard.** The one deliberate behavior change of the adoption, taken with the move rather than smuggled through it: this SDK used to release only the auto-sync timer, melcloud both, and the extracted core carries melcloud's superset. Inert in practice — the released window only affects a replay budget, and a disposed instance is documented unusable — and the kernel clause that pinned the old divergence is updated to pin the superset, in this commit, as that clause's own comment always demanded.

- **The observability shells left with the mechanism.** The pre-bound `APICallRequestData`/`APICallResponseData`/`createAPICallErrorData`/`LifecycleEmitter` bindings (internal modules, never part of the public API) existed to seat the Gizwits vocabulary into this repo's own dispatch; the core now takes the engine directly (`SessionAPIOptions.redaction`), so the shells are deleted and `src/observability/context.ts` — the vocabulary and the one bound engine — is what remains. `AuthenticationError`, `RegistrySyncError` and the `setting` decorator are now the core's own, re-exported under their unchanged public names so `instanceof` and the persistence contract hold across the SDK and the core alike.

Minor, not major: no exported name moves or changes meaning, every public method keeps its 16.0.0 contract (the kernel is the witness), and the additions — the inherited protected seam and the dispose superset — are strictly additive. The exact `@olivierzal/api-core` pin advances to 1.1.0, which this release is the adoption of.

## [16.0.0] - 2026-08-31

### Breaking changes

- **`resumeSession()` reports a refused re-sign-in as a failed resume, standing session or not.** The 11.0.0 verdict — "judge by the session, not by the throw" — claimed BOTH swallowed shapes for one `isAuthenticated()` reading, and shipped one of them wrong: when the server REFUSES the stored credentials while a session established before the attempt still stands, the old code answered `true` — reporting a re-sign-in that never happened and handing the caller the credential Gizwits had just rejected. No internal path ever consumed that wrong `true` (the reactive `#reauthenticate` clears the refused token FIRST, because a Gizwits 400/9004 names the token itself — that in-repo shield is kept, and now kernel-pinned as the dialect-specific half), but `resumeSession()` is public: a host calling it over a live token with refused stored credentials was told "resumed". The verdict is now the SIGN-IN ROUND-TRIP's, the mechanism ported from melcloud-api 55.0.0: a counter bumped the instant `#doAuthenticate` resolves, compared across the call. An ACCEPTED sign-in whose enforced post-auth sync then failed still answers `true` — that half of 11.0.0 was and stays correct, since the session it established stands. What a refusal must NOT do is clear: only the verdict changes, the stored session does not. Migration: a host reading `true` as "the stored credentials still work" now gets the answer it always thought it had; one that wanted "is a session standing" reads `isAuthenticated()` instead.

  Major by this repo's own versioning precedent, matched to the twin's: the return value of a public method changes meaning for a reachable class of inputs — the contract-shaped change melcloud-api called major (55.0.0, 2026-08-30). The retired shorthand was born here (11.0.0), copied there (54.0.0), refined there (55.0.0) — and the refinement crossed back in one day, per the ledger's own lesson: a fix to either twin re-opens the question for BOTH, the same day.

- **`authenticate()` now wraps an enforced post-auth cycle failure in the new `RegistrySyncError`.** 11.0.0 made that failure propagate instead of resolving over an empty registry — the right verdict, unchanged here — but it propagated RAW, so a consumer telling "signed in, stale list" from "sign-in refused" had to fall back to judging by the session (`error instanceof AuthenticationError || !isAuthenticated()`) — the discriminator the entry above exists to retire, and with the same false positive: a transport failure during a sign-in over a PRE-EXISTING live token (a user switching accounts) reads "signed in, stale list" while the new pair was never accepted. The failure now surfaces as `RegistrySyncError` with the cycle's own error preserved as `cause`; a refused credential is never wrapped — it stays `AuthenticationError`, structurally so, because the credential check throws before the cycle is ever spent. Ported from melcloud-api 55.0.0 the day it shipped.

  Migration: a caller matching the enforced-cycle failure by its concrete type (`ValidationError`, a transport error) now finds it on `error.cause`; classification becomes `instanceof RegistrySyncError`, with no session re-derivation.

- **A definitively-refused stored credential is no longer served as "signed in".** The refusal path clears nothing (the 12.0.1 rule: a rejected sign-in leaves the stored session untouched — only the REACTIVE `#reauthenticate` wipes, on a 400/9004 that names the token itself, and that is a different path), and every loss-surfacing path keyed on `isAuthenticated()` — which a still-standing token answers `true` for its whole remaining life. Net effect: after a server-side password change, a host whose token was still being served read "signed in" over a dead account, and `onAuthenticationLost` could not fire while the token stood — the refusal `resumeSession` had just witnessed was unreportable. The refusal VERDICT is now recorded — set where `resumeSession` swallows a definitive rejection (any `AuthenticationError` on this dialect, which has no throttle type to exclude; never a transport blip), lifted by the next ACCEPTED sign-in — and consulted where the loss surfaces: the sync-cycle epilogue emits `onAuthenticationLost` once per episode and leaves the auto-sync disarmed, exactly the existing lost-session shape. The stored token itself still stands: no clearing verdict changed. The record is in-memory by design, like the loss-episode marker — a restart re-witnesses the refusal on its first gated sign-in, and the persisted login backoff keeps that sign-in honest. Ported from melcloud-api 55.0.0 — where the port needed VERIFYING, not copying: melcloud justified the flag by Classic never wiping on a refusal, and this dialect DOES wipe on the reactive path; but the refusal path is not the reactive path, so the hole existed here identically.

  Migration: `onAuthenticationLost` newly fires — and the auto-sync newly disarms — where the stored credentials are refused while an older token still stands. That is the honest report: the account is dead even though requests on the surviving token may still be served.

### Fixed

- **`resumeSession()` is single-flight.** com.heatzy boots with `shouldResumeSessionInBackground: true`, so the background `initialize()`'s resume and the first request's `#ensureSession` → `#performSessionRefresh` → resume could both pass the login-backoff gate before either refusal armed it — two refused sign-ins nearly simultaneously, against a login endpoint whose lockout hammering only prolongs. Concurrent calls now share ONE in-flight attempt (the `#ensureSession` memo pattern, one lifecycle layer up), and every caller's verdict describes that shared attempt; N concurrent calls spend one sign-in round-trip, kernel-pinned. One deliberate asymmetry, ported with the mechanism: a caller joining AFTER the shared sign-in was accepted, while its enforced registry cycle still runs, reads the already-determined verdict instead of awaiting the shared promise — the one real caller in that window is the reactive token-failure path that cycle itself triggered (`#reauthenticate` → `resumeSession`, both arming statuses included), and awaiting there would wait on its own caller.

### Added

- **`RegistrySyncError`** — the dedicated type of the enforced post-auth cycle failure, carrying the cycle's own error as `cause` (see the breaking entry above). Exported from the root barrel and the `errors/` surface like its siblings.

### Changed

- **Listing drops are reported as ONE aggregated line per cycle.** `list()` used to write one `logger.error` line per dropped `/bindings` entry; melcloud-api settled the opposite shape the same day it shipped its own boundary (54.0.0), under a volume rationale that applies here verbatim: the listing carries every device of the account on every sync cycle, so a listing-wide wire regression stormed the host logger exactly when the diagnostic report most needed to stay readable. One line per cycle now names every dropped entry with its verdict, the two verdicts still worded apart (`an entry this SDK cannot read` = wire regression, fix the schema; `unknown product_key …` = a radiator newer than this release, extend the product map in `constants.ts`) — and an unreadable entry that at least spells a string `did` is now named by it, where the old per-entry line could only quote the Zod message. The `/devdata` fan-out keeps its per-device line: its failures cost a wire call each, so their volume is bounded by the devices that individually failed, never by the listing's size. Only the log SHAPE changed — what is dropped, kept, retried and returned is exactly 15.0.0.

- **The session-lifecycle kernel gains the 55.0.0 crossing clauses, and two enforced-cycle clauses are repointed at the wrap.** The `RegistrySyncError` pair (an enforced-cycle failure wrapped with its cause preserved; a refused credential never wrapped), the refusal-record episode (loss surfaced once per settling cycle over a standing token, recovery announced on the next accepted sign-in, a transport blip recording nothing — the throttle row of melcloud's negative clause has no form here, decided in the kernel's DECLARED ABSENCES entry 1 alongside the record's missing throttle-exclusion rung), and the `resumeSession` single-flight rows (N concurrent callers, one sign-in round-trip, accepted and refused alike; the accepted-join asymmetry pinned in the unit suite). The two clauses that asserted the enforced cycle rejects now assert it rejects with `RegistrySyncError` — deliberate clause changes, in the commit that says so.

- **The session-lifecycle kernel aligns its `resumeSession` verdicts with the melcloud twin, and pins the reactive shield.** The clause "reports the standing session from resumeSession, not the throw" pinned the WRONG verdict — refused re-sign-in over a standing session → `true` — so the twin CONTRACT KERNELS held OPPOSITE verdicts for the same staged scenario, which no single extracted `SessionAPI` could satisfy. It is flipped to "reports a refused re-sign-in as a failed resume, standing session or not" (→ `false`, session untouched), the accepted-then-sync-failed → `true` clause stays, and a new clause pins the negative reactive rung the twin also holds: an expired-token failure whose re-sign-in is refused is never replayed, and the refused token is cleared FIRST — the DIALECT-SPECIFIC half, opposite of melcloud's Classic, which deliberately does not clear because its 401 can name an endpoint rather than the session. Deliberate clause changes, in the commit that says so — not rewordings smuggled through a neutrality-critical move.

## [15.0.0] - 2026-08-30

### Breaking changes

- **One device this SDK cannot model no longer denies the whole account.** The registry cycle degraded as a block, in three independent places, and every one of them was reached from the ENFORCED post-auth cycle (`authenticate()` → `#finishLogin` → `#syncCycle`), which has propagated since 11.0.0 — so each read to the user as "cannot sign in at all", over credentials the server had just accepted and a token already stored:

  1. `/bindings` was validated ATOMICALLY (`z.array(DeviceBindingSchema)`): one malformed entry invalidated every sibling.
  2. The `/devdata` fan-out was a `Promise.all` over a throwing `getValues`, and `AttributesSchema.mode` is a REQUIRED closed literal union — so one device reporting an unmodelled mode, or one transient 5xx that outlived the retry rung, rejected the whole cycle.
  3. `Device`'s constructor resolves `getProduct(binding.product_key)`, which THROWS on an unknown key — so one just-released Heatzy radiator on the account took the sign-in down with it, mid-sync, leaving the registry half-built and unpruned.

  All three now degrade at the boundary, so what survives is what this SDK models: the `/bindings` entries are validated one by one and dropped individually, an entry whose `product_key` does not resolve is dropped before a model is built, and the `/devdata` legs settle independently (`Promise.allSettled`), feeding the registry the `undefined` it has always documented — an existing model keeps its last-known data, a new one waits for the next cycle. `DeviceRegistry.syncDevices`'s tolerance ("a binding whose attributes are missing keeps its existing model untouched … and is skipped when new") was unreachable from the client under `Promise.all`; it is now what the fan-out actually feeds.

  **No drop is silent.** Each one writes a `logger.error` line naming the device, and the two listing reasons are worded apart on purpose — a malformed entry is a wire regression (the schema is wrong), an unresolved `product_key` is a product newer than this release (extend the map in `constants.ts`, with its PDF in `references/`) — because a silent drop would leave one indistinguishable symptom, "a device disappeared", in the diagnostic reports users paste into issues.

  What still fails the whole cycle is what no partial answer can survive: a refused `/bindings` call, or an envelope that is not a device list at all. Migration: code that branched on `authenticate()` rejecting for a device the SDK could not model now takes the SUCCESS path with a partial registry; `fetch()`'s returned list is the ledger of what the cycle modelled, and a device whose live read failed is present there while `registry.devices.getById` answers `undefined` or a model still carrying its previous data. Nothing calls the wire more often — an unmodelled entry is now dropped _before_ its `/devdata` read is spent — no retry policy changed, and the failed round-trip still reaches `events.onRequestError` and the call logger, so a transient 5xx on one device stays visible and is retried by the next cycle.

  melcloud-api shipped this shape on 2026-08-29 (its 54.0.0) for its bulk Classic listing, and its changelog claimed "the heatzy twin has no equivalent exposure: its sync is per-device". That claim was false three ways over, as above: per-device describes the fan-out, not the listing that opens it — and the fan-out was the _worst_ of the three, because it also lost a device to a transient 5xx. A fix to either twin re-opens the question for both, the same day.

- **`Bindings.devices` is `readonly unknown[]`.** The published type names the envelope AS IT COMES OFF THE WIRE: a device list whose entries are not yet anyone's contract. Its schema (internal) validates the list and leaves the entries alone; they are validated one by one at the listing boundary — the first exposure above, restated as a type. Migration: code annotating a hand-parsed `/bindings` body with `Bindings` now holds `unknown[]` and narrows the entries itself; `DeviceBinding` is unchanged and stays the type of a modelled entry. Nothing else changed shape — `list()` and `fetch()` still answer `readonly DeviceBinding[]`.

- **`list()` answers the entries this SDK models, not every entry the wire carried.** Its doc promised "every device bound to the account"; it now promises every device bound to the account _that this SDK models_, and says in the log which ones it dropped and why. The registry has always relied on exactly that: it builds a model per entry with no runtime guard of its own, which is the reason exposure 3 existed.

### Added

- **`isModelledProduct(productKey)`** — the non-throwing form of `getProduct`, asked at the `/bindings` boundary before a `Device` is built, and published beside it because `DeviceRegistry.syncDevices` carries the same precondition for a caller synchronizing hand-built bindings. `getProduct` still throws: extending the product map stays the fix for a new radiator, this only keeps one from denying the account until then.

### Changed

- **The session-lifecycle kernel gains the account-denial clauses, and its 200-that-denies-the-registry is repointed.** `tests/contracts/session-lifecycle.test.ts` pins both halves of the property — a listing this SDK only partly models, and a fan-out leg that comes back unreadable — each asserting the sign-in still succeeds, that exactly the modelled devices survive, and that every drop was named in the log. The kernel's `drifted-registry` outcome used to be an unshipped `product_key`, which no longer fails anything; it is now a `/bindings` body that is not a device list, which is both the only remaining whole-cycle registry failure and the shape melcloud-api's twin kernel already staged (`Areas: 'not-an-array'`). A deliberate clause change, in the commit that says so — not a rewording smuggled through a neutrality-critical move.

## [14.1.0] - 2026-08-27

### Changed

- **The API-client mechanisms are now imported from `@olivierzal/api-core` 1.0.0 (exact pin) instead of living here.** The HTTP client and `HttpError` (whole-snapshot redaction seated in the constructor), the redaction engine, the observability shells and `LifecycleEmitter`, the resilience primitives, `SyncManager`, the temporal entry point, the time units and the `APIError` base become thin re-exports of the shared package. These modules used to be melcloud-api's byte-identical twins ("edit both or neither"); the 2026-08-21 redaction fix took four days to cross to this repo, which expired that discipline — a mechanism now changes once, in api-core, and arrives everywhere as a pin bump. This repo keeps only its protocol layer: the Gizwits sensitive-key vocabulary (`src/observability/context.ts` builds the one bound redaction engine and injects it into every seat), the 400+401 auth-failure statuses `HeatzyAPI` passes to the core's `AuthRetryPolicy`, the wire types, the schemas and the facades. Zero public-surface change: the export set is name-for-name identical before and after (62 = 62 symbols), so no consumer code changes.

### Added

- **`HttpStatus.NotFound` (404) and `HttpStatus.TooManyRequests` (429)** — present in api-core's status vocabulary, now re-exported here.
- **An optional `zone` parameter on `isSessionExpired`** — offset-less expiry strings can be interpreted in a supplied IANA timezone instead of the runtime's.
- **`RetryGuard` implements `Disposable`** — usable with `using` for scope-bound release.
- **`createAPICallErrorData` accepts any `Error`** — widened from `HttpError`; a non-HTTP failure gets error data instead of a type error.

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

[16.2.0]: https://github.com/OlivierZal/heatzy-api/compare/v16.1.0...v16.2.0
[16.1.0]: https://github.com/OlivierZal/heatzy-api/compare/v16.0.0...v16.1.0
[16.0.0]: https://github.com/OlivierZal/heatzy-api/compare/v15.0.0...v16.0.0
[15.0.0]: https://github.com/OlivierZal/heatzy-api/compare/v14.1.0...v15.0.0
[14.1.0]: https://github.com/OlivierZal/heatzy-api/compare/v14.0.0...v14.1.0
[14.0.0]: https://github.com/OlivierZal/heatzy-api/compare/v13.0.1...v14.0.0
[13.0.1]: https://github.com/OlivierZal/heatzy-api/compare/v13.0.0...v13.0.1
[13.0.0]: https://github.com/OlivierZal/heatzy-api/compare/v12.0.2...v13.0.0
[12.0.2]: https://github.com/OlivierZal/heatzy-api/compare/v12.0.1...v12.0.2
[12.0.1]: https://github.com/OlivierZal/heatzy-api/compare/v12.0.0...v12.0.1
[12.0.0]: https://github.com/OlivierZal/heatzy-api/compare/v11.0.1...v12.0.0
[11.0.1]: https://github.com/OlivierZal/heatzy-api/compare/v11.0.0...v11.0.1
[11.0.0]: https://github.com/OlivierZal/heatzy-api/compare/v10.0.0...v11.0.0
[10.0.0]: https://github.com/OlivierZal/heatzy-api/releases/tag/v10.0.0
