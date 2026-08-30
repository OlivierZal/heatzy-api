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
  model per entry — so the boundary is what it relies on. Every drop
  writes a log line, and the listing's two reasons are worded APART: a
  malformed entry means the schema is wrong, an unresolved
  `product_key` means the product map is stale, and a silent drop
  would leave one indistinguishable symptom. Only an envelope that is
  not a device list still fails the whole cycle.
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
  adding the gate without wire evidence is over-engineering.
- **No `AuthenticationThrottledError`**: no observed login-throttle
  error code on Gizwits; the single 15-minute login backoff covers
  rejected sign-ins.
- **No `logLabel`**: a single client — nothing to disambiguate in logs.
- **Single `.` export**: one dialect → no `/classic`-style subpaths.
- **No `NoChangesError`**: an empty/no-op `setValues` resolves silently
  (V1 returns `{}`, V2+ skips the wire call) and still fires the sync
  notification. melcloud throws `NoChangesError` on an empty payload, but
  here the app-side `#sendUpdate` already guards on
  `Object.keys(updateData).length > 0` before calling, so no real caller
  hits the empty path — adding the error would be untested machinery.
- **No per-call header merge in `#dispatch`**: no Gizwits endpoint sends
  custom per-call headers, so `#dispatch` writes only the auth headers;
  melcloud's `configHeaders` merge would be a dead, uncovered branch here.
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

## Mechanism boundary (@olivierzal/api-core)

The API-client MECHANISMS live in `@olivierzal/api-core` (exact pin,
production dependency): the HTTP client and `HttpError` (whole-snapshot
redaction seated in the constructor), the redaction engine, the
observability shells and `LifecycleEmitter`, the resilience primitives,
`SyncManager`, the temporal entry point, the time units and the
`APIError` base. Those modules used to be melcloud-api's byte-identical
twins ("edit both or neither"); the divergence episode above expired
that discipline, and the extraction replaced it. This repo keeps ONLY
its protocol layer: the Gizwits sensitive-key VOCABULARY
(`src/observability/context.ts` builds the one bound `redaction`
engine; the `HttpClient` subclass and the `APICall*` shells receive
it), the auth-failure statuses (`HeatzyAPI` passes `[401, 400]` to the
core's `AuthRetryPolicy`), the wire types, the schemas, the facades,
and thin re-export modules that keep internal import paths stable. A
mechanism change happens in api-core and arrives here as a release +
exact-pin bump PR; never re-implement one locally. The moved mechanism
test suites live in api-core too — this repo's
`observability.test.ts`/`http-client.test.ts` are thin
vocabulary/wiring suites pinning what is OURS.

The next mechanism to cross that boundary is `src/api/heatzy.ts`'s
session lifecycle and request pipeline, extracted as the core's
`SessionAPI`. Its witness is `tests/contracts/session-lifecycle.test.ts`,
the twin of melcloud-api's kernel of the same name: one clause table run
against the REAL client, never a synthetic subclass (a suite whose hooks
are `vi.fn`s proves the template calls its own hooks, not that
`HeatzyAPI` still behaves the same after the move). The kernel must
cross byte-identical — a clause reworded during the move proves nothing
— which carries a PRECONDITION recorded in its own header:
`src/api/heatzy.ts`, `src/api/types.ts`, `src/errors/`, `src/http/` and
`src/resilience/` must SURVIVE as this repo's own paths, because every
kernel import resolves through them. `heatzy-api-auth.test.ts` and
friends stay where the mechanism goes; the kernel does not.

Every clause is worded about the PER-DEVICE registry cycle (`/bindings`
plus its `/devdata` fan-out), the account-denial pair added in 15.0.0
included: a listing this SDK only partly models and a fan-out leg that
comes back unreadable each end in a SUCCESSFUL sign-in over exactly the
modelled devices, every drop named in the log. The `drifted-registry`
outcome — the 200 the session survives and the registry does not — is a
`/bindings` body that is not a device list, the only whole-cycle
registry failure left and the shape melcloud's twin kernel already
stages; it used to be an unshipped `product_key`, which the boundary now
absorbs. Three clauses hold divergences the extraction must handle
deliberately rather than silently: `[Symbol.dispose]`
releases the sync timer but NOT the retry guard (melcloud releases both —
adopting its superset must update that clause in a commit that says so);
no log label is passed anywhere, so every line arrives unprefixed and a
default label in the extracted class would rewrite this SDK's diagnostic
output; and the auth-failure vocabulary is `[401, 400]`, each status
pinned by its own row. The kernel also closes with three DECLARED
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
verdicts, not suppressions; zero warnings. The only tolerated
exceptions are protocol- or rule-pair-imposed and documented with a
`-- reason`: the TC39 decorator `files`-scoped exceptions in
`src/decorators/**`, the parse-boundary cast in `HttpClient.request`, the
fire-and-forget `.catch()`, and the single-flight `.finally()` in
`#ensureSession`. `src/temporal.ts` is the only sanctioned
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
  byte-identical in the five repos) — default type set, no scope
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
  autoscan miscategorizes the `S2245` `Math.random` jitter in
  `retry-backoff.ts` as a _vulnerability_ (quality gate red) instead of
  the reviewable _hotspot_ the CI scanner raises. That hotspot is marked
  SAFE in the dashboard with the documented "retry timing is not
  security-sensitive" rationale (mirrors melcloud-api).
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
