# CLAUDE.md

Typed Node.js client for the Heatzy (Gizwits) API. ESM only,
Node >= 22.20, published to GitHub Packages. `erasableSyntaxOnly` is on:
no runtime enums, no parameter properties, no runtime namespaces.
Architecture, toolchain and process are aligned on the sibling
`melcloud-api` repo — when in doubt, mirror it.

## Commands

- `npm run lint` / `npm run lint:fix` — ESLint (runs with an 8 GB heap).
- `npm test` / `npm run test:coverage` — vitest; coverage must stay at 100%.
- `npm run typecheck` — the native 7.x compiler (`@typescript/native`,
  `npm:typescript@^7`), reached by its explicit path
  `node ./node_modules/@typescript/native/bin/tsc`; does not cover
  `*.config.ts` (the lint does). Keep that path in every script: the
  native package ships no `.bin` shim, while both `.bin/tsc` and
  `.bin/tsc6` point at `@typescript/old` — the `npm:typescript@^6` that
  the compat package depends on — so a bare `tsc` would silently
  typecheck with TypeScript 6. That TS6 line exists only for the tools
  that import the JS API (typedoc, typescript-eslint), which resolve
  `@typescript/typescript6` aliased under the `typescript` name — the
  official side-by-side layout.
- `npm run build` — purges `dist` before emitting, because `tsc` overwrites
  but never deletes: a module renamed or removed in `src` would otherwise
  survive in `dist`, and `files` ships that directory, so `prepare` would
  pack the fossil. The purge is inline rather than a `prebuild` hook so it
  cannot be skipped with `--ignore-scripts`.
- `npm run format` / `npm run format:fix` — prettier.
- `npm run docs` — typedoc. The config is `typedoc.config.js` (JSDoc-typed
  with `@ts-check`: typedoc cannot load `.ts` configs and silently ignores
  them); validation warnings fail the build.

## Domain gotchas

- **An expired or invalid Gizwits token is HTTP 400, not 401** (error
  code 9004 in the body). `AuthRetryPolicy` triggers on 400 _and_ 401,
  and `toAuthFailure` maps both to `AuthenticationError` on the login
  path. A genuinely malformed request therefore pays one guarded
  re-login round-trip before its 400 propagates — the field-proven
  behavior of the previous Axios interceptor.
- Wire-format types mirror the Gizwits API verbatim: snake_case and
  mixed keys (`dev_alias`, `derog_mode`, `cur_tempH`, `LOCK_C`) — do
  not rename them to satisfy style rules. The eslint config carries a
  scoped naming-convention exception for the `(cft|cur|eco)_temp[HL]`
  register keys.
- `/login` returns `expire_at` in **epoch seconds**; it is persisted as
  an ISO 8601 instant (`expiry` setting) so `isSessionExpired` reads it
  back absolutely, timezone-free.
- Product generations resolve from opaque `product_key` hashes
  (`src/constants.ts`); V3 devices identify as V2, Onyx and Shine as
  Glow. An unknown key throws — extend the map when Heatzy ships a new
  product, with the PDF added to `references/`. `isModelledProduct` is
  the non-throwing form the listing boundary asks FIRST, so an
  unextended map costs that one radiator and never the account.
- **The registry cycle degrades per device, at the boundary.** The
  cycle (`/bindings` + one `/devdata` read per binding) is reached from
  the ENFORCED post-auth sync, which propagates — so anything that
  failed the cycle as a block read as "cannot sign in at all". Three
  such blocks were fixed in 15.0.0: the atomic `/bindings` array, the
  `Promise.all` fan-out, and `getProduct`'s throw inside the `Device`
  constructor. Entries are now validated and dropped ONE BY ONE at the
  listing boundary (`HeatzyAPI.list`), and the fan-out settles leg by
  leg (`Promise.allSettled`) feeding the registry the `undefined` it
  documents. `DeviceRegistry` runs no guard of its own — it builds a
  model per entry — so the boundary is what it relies on. Listing
  drops are reported as ONE aggregated line per cycle naming every
  dropped device with its verdict — never one line per entry, because
  the listing carries every device of the account on every cycle and a
  listing-wide regression must not storm the host logger exactly when
  the diagnostic report most needs to stay readable (16.0.0, the shape
  melcloud-api settled under the identical rationale in its 54.0.0).
  The two verdicts stay worded APART inside that line: a malformed
  entry means the schema is wrong, an unresolved `product_key` means
  the product map is stale, and an undifferentiated drop would leave
  one indistinguishable symptom. The `/devdata` fan-out keeps its
  per-device line — its failures each cost a wire call, so their
  volume is bounded by the failed reads, never by the listing's size.
  Only an envelope that is not a device list still fails the whole
  cycle.
- **`resumeSession()` judges by the SIGN-IN ROUND-TRIP, never by the
  session** — two different failures both leave a live session
  standing, and only the round-trip separates them. An ACCEPTED
  sign-in whose enforced post-auth sync then threw IS a resume
  (answering `false` there had `initialize()` emit a spurious
  `onAuthenticationLost` over credentials that had just worked — the
  11.0.0 fix, still correct). A REFUSED sign-in over a session that
  predates the attempt is NOT: a `true` hands the caller the
  credential Gizwits has just rejected. They are distinguishable right
  there, with no heuristic: an accepted-sign-ins counter is bumped
  the instant the `doAuthenticate` hook resolves and compared across
  the call (16.0.0, the mechanism of melcloud-api 55.0.0; since 16.1.0
  the counter and the comparison live in the core's `SessionAPI` — this
  repo supplies only the hook). Do NOT restate this
  as "judge by the session": this repo INVENTED that shorthand in
  11.0.0, melcloud copied it in 54.0.0 and shipped the refused shape
  wrong. Here the wrong `true` never bit an internal path, because the
  reactive `reauthenticate` hook clears the refused token FIRST — right
  on Gizwits, where the 400/9004 names the token itself, and the OPPOSITE
  of melcloud's Classic, whose 401 can name an endpoint rather than
  the session — but `resumeSession` is PUBLIC, and a host calling it
  over a live token with refused stored credentials was told
  "resumed". What a refusal must NOT do is clear: the verdict changes,
  the stored session does not. The verdict, the accepted half, and the
  clearing dialect half are all kernel-pinned.
- **melcloud's 55.0.0 session fixes crossed the same day (16.0.0),
  decided per MECHANISM, never as a block.** The three verdicts:
  1. `RegistrySyncError` CROSSED. The wrap sits in the core's login
     epilogue, cause preserved (since 16.1.0; before the adoption this
     dialect inlined it, with no separate `enforceRegistrySync` hook —
     now `enforceRegistrySync` IS the hook, delegating to the
     propagating `#syncCycle`) — and a refused credential structurally
     CANNOT be wrapped, because the `doAuthenticate` hook throws before
     the cycle is ever spent. Exported from `src/errors/` and the root
     barrel like its siblings; since 16.1.0 the exported name IS the
     core's class, re-exported.
  2. The `resumeSession` single-flight CROSSED. com.heatzy boots with
     `shouldResumeSessionInBackground: true`, so the double-sign-in
     boot window (background `initialize()` vs the first request's
     session refresh) exists here identically. The deliberate
     asymmetry crossed with it and is REACHED the same way: a caller
     joining after the accepted sign-in, while the enforced cycle
     still runs, reads the determined verdict — the one real caller in
     that window is the `reauthenticate` hook, triggered by that very
     cycle's 400/401, and awaiting the shared promise would wait on its
     own caller.
  3. The `#isCredentialRefused` record CROSSED — after VERIFICATION,
     not by copying. melcloud justified the flag by "Classic never
     wipes on a refusal"; this dialect DOES wipe, but only on the
     REACTIVE path (`#reauthenticate` clears FIRST). The REFUSAL path
     is a different path and clears nothing (`authenticate`'s catch =
     `#armLoginBackoff` + rethrow, the 12.0.1 rule), so a refusal
     witnessed over a standing token was unreportable here identically
     — for the token's remaining life rather than forever, a
     difference of degree, not of kind. Two dialect adaptations, both
     deliberate: the record's guard excludes no throttle type (none
     exists here — see the Ledger), and the record is consulted only
     in the sync-cycle epilogue (the core's `isSessionServable`), this
     dialect having no `ensureAuthenticated`.
- V1 products speak a positional `raw: [1, 1, mode]` triplet on
  `/control` and only accept the four base modes; every other
  generation posts named `attrs`. The base facade owns the V1 dialect,
  `DeviceV2Facade.control` the named one.
- Glow splits temperatures across two registers (`tempH` hundreds bit,
  `tempL` remainder in tenths of °C); Pro uses single `*_temp` registers
  in tenths. `getTargetTemperature` (utils) builds the right payload.
- Derogation semantics live in the `Device` entity: boost ends after
  `derog_time` minutes, vacation after `derog_time` days, presence runs
  a countdown keyed off the _reported_ `cur_mode` (comfort 90 min,
  comfort−1 60, comfort−2 30). `references/` holds the vendor PDFs.
- Secrets never travel inside a thrown error. `HttpError` redacts its
  whole snapshot at construction — request headers, BODY and query
  parameters, plus the response headers and body — because that object
  reaches every host logger and lands verbatim in the diagnostic
  reports users paste into issues. The body matters as much as the
  header: `/login` posts the account's username and password, so a
  header-only redaction still leaked the credential on every rejected
  sign-in. Redaction sits in the constructor rather than at the
  logging sites so no future call site can reintroduce the leak; the
  sensitive-key vocabulary is shared with the call loggers
  (`isSensitive`/`redactValue` in `src/observability/context.ts`),
  never re-declared. The RESPONSE counts too, headers and body: an
  upstream echoes the credential it just rejected, which is why
  `response.data` is typed `unknown` — a failed body is a diagnostic
  payload, never a contract. What the retry policies read
  (`retry-after` and friends) passes through untouched. When a wire
  field names a credential, extend the ONE vocabulary in context.ts.

## Ledger (deviations from melcloud-api — deliberate verdicts, plus one recorded failure)

- **No `Result`/`safeRequest`**: every endpoint here is required-path
  (sync, mutations) — there are no best-effort getters like Classic
  reports or Home telemetry, so the Result machinery would be dead
  code. Reintroduce it from melcloud-api only with a real caller.
- **No rate-limit gate**: the Gizwits wire has never surfaced a 429;
  adding the gate without wire evidence is over-engineering. Since the
  SessionAPI adoption (16.1.0) the verdict is spelled as an omission:
  `HeatzyAPI` passes no `rateLimitHours`, so the core builds NO
  rate-limit rung at all — inherited machinery that is never
  constructed costs nothing and needs no local test.
- **No `AuthenticationThrottledError`**: no observed login-throttle
  error code on Gizwits; the single 15-minute login backoff covers
  rejected sign-ins. Corollary (16.0.0): the refusal record's guard is
  bare `instanceof AuthenticationError` — melcloud's throttle
  exclusion has nothing to exclude here, every `AuthenticationError`
  being definitive by construction. Since the SessionAPI adoption
  (16.1.0) both the guard and the throttle-widened backoff branch are
  the core's own code: the branch is inherited but never taken, because
  nothing on this wire ever constructs the throttle class — which also
  stays deliberately un-re-exported. That un-export is why
  `src/errors/authentication.ts` is a const + type PAIR over the core
  class rather than a bare re-export: the core class's doc comment
  hard-links its throttle subclass, typedoc cannot resolve a d.ts
  comment link to a symbol outside this package's documentation, and
  the pair keeps the runtime identity (same object, `instanceof`
  unchanged both ways) while seating this dialect's own doc.
- **No `logLabel`**: a single client — nothing to disambiguate in
  logs. The core makes the label OPTIONAL and `HeatzyAPI` passes none,
  so every seat receives the host logger unwrapped and every line
  lands unprefixed in diagnostic reports, kernel-pinned.
- **Single `.` export**: one dialect → no `/classic`-style subpaths.
- **No `NoChangesError`**: an empty/no-op `setValues` resolves silently
  (V1 returns `{}`, V2+ skips the wire call) and still fires the sync
  notification. melcloud throws `NoChangesError` on an empty payload, but
  here the app-side `#sendUpdate` already guards on
  `Object.keys(updateData).length > 0` before calling, so no real caller
  hits the empty path — adding the error would be untested machinery.
- **Per-call header merge: inherited, not re-judged.** Pre-16.1.0 this
  entry read "no per-call header merge in `#dispatch`" — no Gizwits
  endpoint sends custom per-call headers, and melcloud's
  `configHeaders` merge would have been a dead, uncovered branch in a
  local dispatch. The dispatch is the core's now and DOES carry the
  general merge, covered by api-core's own suite; this SDK still never
  sends per-call headers, so the merge arm simply never fires here.
  The old verdict stands as a fact about the wire, not about the code.
- **Divergence episode, NOT a verdict (2026-08-21 → 2026-08-25)**: the
  `HttpError` redaction shipped here at its round-1, headers-only scope
  (13.0.1) and stayed there for four days while melcloud-api's second
  review round had already established — and documented — that
  headers-only "still leaked the credential": the `/login` body kept
  the account's username and password in clear text in every thrown
  error, under a changelog headline claiming secrets no longer
  traveled. The lesson: a fix to EITHER twin re-opens the question for
  BOTH, the same day — never let the siblings' security scopes drift.
  CLOSED by the `@olivierzal/api-core` extraction: the mechanism now
  lives once, and a redaction fix reaches both SDKs as one release
  plus a pin bump each.
- **Second divergence episode, also NOT a verdict (2026-08-30)**: the
  twin's 54.0.0 changelog cleared this repo in one line — "the heatzy
  twin has no equivalent exposure: its sync is per-device" — and that
  claim was false three ways over (15.0.0). "Per-device" describes the
  `/devdata` fan-out, not the `/bindings` listing that opens it, and the
  fan-out was the worst of the three exposures because a transient 5xx
  on one device denied the account too. The lesson generalizes the
  first: a fix to either twin re-opens the question for BOTH the same
  day, and a changelog line clearing the sibling is a claim to VERIFY
  against its code, never a verdict to inherit. Neither twin's owner
  may write the other's exemption.
- **Third divergence episode, closed in ONE DAY (2026-08-30 →
  2026-08-31)**: melcloud's 55.0.0 rejected the `resumeSession`
  verdict this repo still carried — the "judge by the session"
  shorthand born HERE in 11.0.0, copied there in 54.0.0 — and until
  16.0.0 the twin CONTRACT KERNELS pinned OPPOSITE verdicts for the
  same staged scenario (a refused re-sign-in over a standing session),
  a contradiction no single extracted `SessionAPI` could satisfy. The
  refinement crossed back the next day (16.0.0), which is what the
  first two episodes' lesson demands — and it extends that lesson in
  the one direction they never tested: it applies to fixes of ideas a
  twin EXPORTED, not only to mechanisms it copied. Being the
  shorthand's author is no exemption from re-importing its repair.

## Mechanism boundary (@olivierzal/api-core)

The API-client MECHANISMS live in `@olivierzal/api-core` (exact pin,
production dependency): `SessionAPI` — the session lifecycle, the
login backoff, the logOut-epoch protocol, the single-flight refresh
and resume, the accepted-sign-ins verdict counter, the refusal record,
the request pipeline and the sync-cycle template — plus the HTTP
client and `HttpError` (whole-snapshot redaction seated in the
constructor), the redaction engine, the observability shells and
`LifecycleEmitter`, the resilience primitives, `SyncManager`, the
temporal entry point, the time units, the `setting` decorator and the
error family (`APIError`, `AuthenticationError`, `RegistrySyncError` —
re-exported here under unchanged public names so `instanceof` holds
across the SDK and the core alike). Those modules used to be
melcloud-api's byte-identical twins ("edit both or neither"); the
divergence episode above expired that discipline, and the extraction
replaced it. This repo keeps ONLY its protocol layer: the Gizwits
sensitive-key VOCABULARY (`src/observability/context.ts` builds the
one bound `redaction` engine; the `HttpClient` subclass seats it into
every thrown snapshot, and `HeatzyAPI` hands it to the core through
`SessionAPIOptions.redaction`, which seats it into the request/response
log lines the inherited dispatch emits — the seam this adoption caught
missing in the unreleased core and had fixed there BEFORE adopting,
now pinned through the real client in `heatzy-api.test.ts`), the
subclass options (`[401, 400]` as the auth-failure statuses; NO
`logLabel`; NO `rateLimitHours`), the twelve dialect hooks in
`src/api/heatzy.ts`, the wire types, the schemas, the facades, and
thin re-export modules that keep internal import paths stable. A
mechanism change happens in api-core and arrives here as a release +
exact-pin bump PR; never re-implement one locally. The moved mechanism
test suites live in api-core too — this repo's
`observability.test.ts`/`http-client.test.ts`/`heatzy-api-*.test.ts`
are thin vocabulary/wiring suites pinning what is OURS.

That crossing is DONE (16.1.0): `HeatzyAPI` subclasses the core's
`SessionAPI<SyncParams>`, its former private machinery deleted and its
protocol knowledge re-scoped onto the core's protected hooks. Its
witness is `tests/contracts/session-lifecycle.test.ts`, the twin of
melcloud-api's kernel of the same name: one clause table run against
the REAL client, never a synthetic subclass (a suite whose hooks are
`vi.fn`s proves the template calls its own hooks, not that `HeatzyAPI`
still behaves the same after the move). The kernel crossed
byte-identical except the ONE dispose clause its own comment demanded
be updated deliberately (the core carries melcloud's superset: the
retry guard is released too, inert on a disposed instance) — and its
header PRECONDITION held: `src/api/heatzy.ts`, `src/api/types.ts`,
`src/errors/`, `src/http/` and `src/resilience/` survive as this
repo's own paths, so every kernel import still resolves through them.
`heatzy-api-auth.test.ts` and friends went where the mechanism went:
what re-tested the core's lifecycle died here (api-core's suite owns
it), and the files remain as thin wiring suites over the Gizwits half.

Every clause is worded about the PER-DEVICE registry cycle (`/bindings`
plus its `/devdata` fan-out), the account-denial pair added in 15.0.0
included: a listing this SDK only partly models and a fan-out leg that
comes back unreadable each end in a SUCCESSFUL sign-in over exactly the
modelled devices — the listing half asserting the cycle's ONE
aggregated drop line verbatim (16.0.0), the fan-out half its per-device
line. The `drifted-registry`
outcome — the 200 the session survives and the registry does not — is a
`/bindings` body that is not a device list, the only whole-cycle
registry failure left and the shape melcloud's twin kernel already
stages; it used to be an unshipped `product_key`, which the boundary now
absorbs. Since 16.0.0 the twin tables pin the SAME `resumeSession`
verdicts — the refused-re-sign-in flip that unblocked the extraction —
plus the 55.0.0 crossings: the `RegistrySyncError` wrap pair (failure
wrapped with its cause preserved; a refused credential never wrapped),
the refusal-record episode (loss surfaced once per settling cycle over
a standing token, recovery announced on the next accepted sign-in, a
transport blip recording nothing), and the `resumeSession`
single-flight rows. Four clauses held divergences the extraction had to
handle deliberately rather than silently, and each was settled the way
its clause demanded: `[Symbol.dispose]` used to release the sync timer
but NOT the retry guard — the core carries melcloud's superset, and the
16.1.0 adoption updated that ONE clause in a commit that says so (the
only kernel byte that changed in the move; the flip is inert on a
disposed instance); no log label is passed anywhere, so every line
arrives unprefixed and the core's OPTIONAL `logLabel` stays unset here;
the auth-failure vocabulary is `[401, 400]`, each status pinned by its
own row; and the reactive `reauthenticate` hook clears the refused
token FIRST, pinned as the dialect-specific half opposite melcloud's
non-clearing Classic. The kernel also closes with three DECLARED
ABSENCES — the login-throttle window, the rate-limit gate, and the
mid-ladder probe — each naming the two expressions that make the claim
checkable, so a quarantine can never hide a harness limitation the way
melcloud's first cut did.

## Tooling boundary (@olivierzal/configs)

The shared tooling lives in `@olivierzal/configs` (exact pin): the
eslint `library` preset (plugins are the package's dependencies — no
plugin devDeps here), the prettier config (`"prettier"` key in
package.json, no local file), the `tsconfig/library` base, `typedocBase`
and the vitest `swcPlugin`. The overlays keep ONLY per-repo verdicts:
the lint ignores (`scripts/`), the Gizwits `wireNamingEntries` splice,
tsconfig `outDir`/`include`, and the typedoc identity (name, links,
`intentionallyNotExported`). Do not re-declare family policy locally —
a rule evaluation or version bump happens in configs, adoption is a
reviewed pin bump. Never extend `tsconfig/library-build`: its
`rootDir`/`include` resolve against the base file inside node_modules
(same trap the configs README documents for `outDir`) — extend
`tsconfig/library` and keep those keys local. The CI/audit/claude/zizmor
workflows are stubs calling the family reusables in OlivierZal/configs,
pinned `@<sha> # vX.Y.Z`; `publish.yml` and `docs.yml` stay local (no
reusable exists), so the composite action stays too — and both installs
pass `npm-token` (the configs dependency lives on GitHub Packages,
where even reads need auth).

## Lint doctrine

Same doctrine as melcloud-api — code adapts to the rules, never the
reverse; no new disables; config-level `'off'` entries are triage
verdicts, not suppressions; zero warnings. Since the SessionAPI
adoption (16.1.0) the repo carries ZERO inline disables: the
single-flight `.finally()` left with `#ensureSession`, and the
parse-boundary cast and fire-and-forget `.catch()` had already left
with their mechanisms in the 1.0.0 extraction. The one standing
config-level exception is the TC39 decorator `files`-scoped rule set
for `src/decorators/**`. `src/temporal.ts` is the only sanctioned
`temporal-polyfill` entry point.

- All-type exports hoist the keyword (`export type { A, B }`); mixed
  exports keep inline `type` specifiers, mirroring the
  inline-type-imports style. No shipped rule enforces the export side
  (`consistent-type-exports` tolerates inline specifiers once present;
  `import-x/consistent-type-specifier-style` covers imports only): the
  convention is maintained by hand, in review — a bespoke
  `no-restricted-syntax` selector for it was removed by decision
  (2026-07-28).

## TypeScript & docs conventions

- Tool ownership: prettier = formatting, perfectionist = all sorting,
  `@typescript-eslint/naming-convention` = naming, import-x = imports,
  jsdoc plugin = doc comments on `src/**`.
- TSDoc: documented functions need `@param name - Description.` for
  every parameter, `@returns` for non-void, `@template` per generic,
  `@throws` where relevant; no blank line between the description and
  the first tag. One-liner `/** … */` is fine for consts, types, and
  schemas.
- Tests import vitest APIs explicitly (no globals) and use `it` inside
  `describe`, `.each` for tables, `describe(fn)` function titles.
  Boolean names take a semantic prefix (`is`, `has`, `should`…);
  `device` is the one sanctioned exception (its `false` is a sentinel).

## Repo process

- Companion docs are part of a change's definition of done: whenever a
  PR changes behavior, API surface, requirements or process, the same
  PR updates the affected companion files (README.md, CONTRIBUTING.md,
  SECURITY.md, CLAUDE.md) — never a later sweep; the 2026-08 README
  audit caught exactly the drift this prevents (a shipped Home ATW
  driver absent from its README, a stale `Result` kind list).

- The PR title IS the commit that lands: `squash_merge_commit_title` is
  `PR_TITLE`, so the title is the single source (under the former
  `COMMIT_OR_PR_TITLE`, a one-commit PR silently took its commit subject
  instead). It must follow Conventional Commits, which the required
  `PR title` check enforces (`.github/workflows/pr-title.yml`,
  byte-identical in the SEVEN repos that call the family reusables —
  every repo but `configs`, which hosts them and whose own copy
  differs; md5-verified 2026-08-30, the count having gone stale at five
  when `api-core` joined) — default type set, no scope
  allowlist, and no `subjectPattern`: subjects legitimately open on a
  proper noun. Dependabot's prefixes are pinned to `build(deps)` /
  `build(deps-dev)` rather than inferred, which is what had this repo
  land bare `Bump …` titles with no type at all.
  The **subject** casing stays inferred and cannot be pinned:
  `commit-message` accepts only `prefix`, `prefix-development` and
  `include`, so Dependabot keeps matching each repo's own history
  (`Bump undici` in one, `bump temporal-polyfill` in another). Left
  alone by decision (2026-08): a Dependabot commit subject is not a
  contract, the PR title is — and the `PR title` check already holds
  that one.
- After every push, monitor the triggered pipelines to completion — the
  PR checks after a push, the publish run after a release — and act on
  the outcome: rerun transient infra failures (a SonarCloud 504 is not
  a finding), fix real ones. Work is not done while its pipeline is red
  or unwatched.
- Every review thread (Copilot or human) must end RESOLVED: with a code
  change when the point holds, or with a reasoned reply when it does
  not — verify claims against sources before acting either way.
- SonarCloud must be spotless for a PR to merge — and the quality gate
  passing is necessary, NOT sufficient: the free-tier gate tolerates
  3 % duplication on new code, lets code smells through, and cannot be
  customized, so the real bar is ours, held in review. That bar is
  zero on BOTH windows — new code and overall alike: zero open issues
  of every kind (bugs, code smells, vulnerabilities) across the whole
  project, 0 % duplicated lines across the whole codebase, and 100 %
  coverage (within the exclusions `sonar-project.properties`
  declares). A Sonar finding is handled like a lint error — the code
  adapts, or the divergence is settled as a documented verdict — never
  merged over.
- The SonarCloud project runs **CI-based analysis** (the `ci.yml` scan
  step on the `lts/*` leg): **Automatic Analysis must stay DISABLED** in
  the project's Administration settings. If it is on, the CI scanner
  aborts with `exit 3` ("running CI analysis while Automatic Analysis is
  enabled") and fails the required `Test (Node lts/*)` leg — and
  autoscan miscategorized the `S2245` `Math.random` jitter as a
  _vulnerability_ (quality gate red) instead of the reviewable
  _hotspot_ the CI scanner raised, back when the retry backoff lived
  in this repo's `retry-backoff.ts`. That code is `@olivierzal/api-core`'s
  since the 16.1.0 extraction (its shim swept in 16.1.1), and the
  "retry timing is not security-sensitive" verdict is recorded there;
  the disable-autoscan rule outlives the example.
- Dependabot PRs auto-merge via `gh pr merge --auto`. GitHub merge
  queue is impossible here — the feature is gated on ORGANISATION
  ownership and this repo is user-owned (verified 2026-08 against the
  docs source) — so the workflows declare no `merge_group` trigger.
- The docs site deploys only on release or `gh workflow run docs.yml`.
- CI: `Test (Node latest)` is `continue-on-error` by design — keep it
  out of required status checks. Sonar coverage runs on the `lts/*` leg
  only.

## Releasing

- Publishing is not done until the consumer adopts: com.heatzy pins this
  library EXACTLY (no caret — a `^` is what silently held a published
  auth fix back for six days, 2026-08). Every release therefore ends
  with an adoption PR in com.heatzy bumping the exact pin; nothing reaches
  users otherwise.
- `SECURITY.md` names no version numbers by design ("only the latest
  published release") — nothing to bump there on release, and nothing
  that can drift.

- Publishing is release-triggered (`publish.yml`): a **published GitHub
  Release** packs the tarball and publishes it to GitHub Packages. A
  release marked **prerelease** publishes under the `next` dist-tag; a
  normal one under `latest`. The version comes from `package.json` at
  the released commit, so bump it before tagging.
- Downstream `com.heatzy` (sibling repo) upgrades by pinning the dep to
  the new version, then running its `typecheck`/`lint`/`test`/`build`;
  open the PR from that repo. A major bump's breaking surface is the
  CHANGELOG section for that version.
