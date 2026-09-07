# Contributing

Thanks for considering a contribution. This document describes the local workflow expected before opening a pull request.

## Prerequisites

- Node.js `>= 22` (matches `engines.node` in `package.json`)
- npm 10+
- A GitHub personal access token with the `read:packages` scope, exported as `NODE_AUTH_TOKEN` (the `.npmrc` reads from this env var to fetch `@olivierzal` scoped dependencies)

## Setup

```sh title="setup"
git clone https://github.com/OlivierZal/heatzy-api.git
cd heatzy-api
npm ci
```

## Local checks

Run the same suite that CI runs on every pull request:

```sh title="checks"
npm run typecheck       # native 7.x compiler, --noEmit
npm run lint            # ESLint with the @olivierzal/configs `library` preset
npm run format          # prettier --check (run npm run format:fix to write)
npm test                # vitest run
npm run test:coverage   # vitest run --coverage (must remain at 100%)
```

`typecheck` and `build` call the native compiler by its explicit path, `node ./node_modules/@typescript/native/bin/tsc` — do not shorten it to `tsc` or `tsc6`, which both resolve to the TypeScript 6 compat package and would typecheck against the wrong compiler.

The `prepublishOnly` script chains tests + typecheck + lint + format + docs — publishing locally without these passing is impossible.

## Coverage

Branches, functions, lines, and statements are all enforced at **100%** — the family's `coverageDefaults` from `@olivierzal/configs`, spread into the coverage block of [`vitest.config.ts`](vitest.config.ts). New code must come with the tests that keep these thresholds green; review will request changes otherwise.

The vitest doubles the SDK suites share (`cast`, `defined`, `mock`, `createLogger`, `createSettingStore`, `createMockHttpClient`, `mockFetchResponse`, the `HttpError` factories, the `Temporal` clock spies) come from `@olivierzal/api-core/testing`; [`tests/helpers.ts`](tests/helpers.ts) holds only what is this dialect's own. Do not re-add a local copy of a core helper — a fix to one must reach every SDK, which is why they live in the core.

## Commits & pull requests

- Commit messages: short, imperative, present tense (`Add HomeFacade error mapping`). No conventional-commits prefix is required.
- Keep PRs focused — a single concern per PR makes review and bisecting easier.
- Describe user-visible changes in [`CHANGELOG.md`](CHANGELOG.md) under a versioned `## [x.y.z] - YYYY-MM-DD` section: the changelog carries no `[Unreleased]` heading — a section is written together with the version bump it ships in, and the maintainer cuts the release from it.
- Breaking changes: call them out explicitly in the PR description and the changelog entry.

## Releases

Releases are cut by the maintainer via GitHub Releases; the `publish.yml` workflow then publishes to GitHub Packages. The version follows [SemVer](https://semver.org).
