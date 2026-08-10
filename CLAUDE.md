# CLAUDE.md

Typed Node.js client for the Heatzy (Gizwits) API. ESM only,
Node >= 22.20, published to GitHub Packages. `erasableSyntaxOnly` is on:
no runtime enums, no parameter properties, no runtime namespaces.
Architecture, toolchain and process are aligned on the sibling
`melcloud-api` repo — when in doubt, mirror it.

## Commands

- `npm run lint` / `npm run lint:fix` — ESLint (runs with an 8 GB heap).
- `npm test` / `npm run test:coverage` — vitest; coverage must stay at 100%.
- `npm run typecheck` — `tsc` from `@typescript/native` (TypeScript 7);
  does not cover `*.config.ts` (the lint does). The tooling (typedoc,
  typescript-eslint) still resolves the separate `typescript` 6.x install.
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
  product, with the PDF added to `references/`.
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

## Ledger verdicts (deviations from melcloud-api, all deliberate)

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
- Dependabot PRs auto-merge via `gh pr merge --auto`; the `merge_group`
  triggers in the workflows are inert but harmless (user-owned repo,
  merge queue is org-only).
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
