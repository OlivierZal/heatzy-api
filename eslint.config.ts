import { library } from '@olivierzal/configs/eslint/library'
import { type Config, defineConfig } from 'eslint/config'

const config: Config[] = defineConfig([
  {
    // `scripts/` holds gitignored one-shot wire probes, not shipped
    // code — they stay outside the lint scope by decision, like the
    // build outputs.
    ignores: ['coverage/', 'dist/', 'docs/', 'scripts/'],
  },
  ...library({
    wireNamingEntries: [
      // Gizwits attribute payloads are snake_case, and the split
      // temperature registers mix snake and camel (`cur_tempH`); the
      // Glow generation's `LOCK_C` breaks even that. The wire is
      // canonical — these keys are sent and received verbatim.
      {
        filter: { match: true, regex: '^([a-z]+(_[a-zA-Z]+)+|LOCK_C)$' },
        format: null,
        selector: ['objectLiteralProperty', 'typeProperty'],
      },
      // HTTP names its statuses through reason phrases (IANA HTTP
      // Status Code Registry); the SDK's status map keys them.
      {
        filter: {
          match: true,
          regex:
            '^(BadGateway|BadRequest|GatewayTimeout|ServiceUnavailable|Unauthorized)$',
        },
        format: ['PascalCase'],
        selector: 'objectLiteralProperty',
      },
    ],
    // The modules that hold a wire vocabulary: the Gizwits payload
    // types and their zod mirror, plus the HTTP status map. Everywhere
    // else the strict core applies, so a snake_case name of our own
    // invention is caught rather than waved through by a vocabulary it
    // does not belong to.
    wireNamingFiles: [
      'src/http/status.ts',
      'src/types/heatzy.ts',
      'src/validation/schemas.ts',
    ],
  }),
  {
    // Shipped regexes stay on the `u` flag: the es2024 `v` flag is a
    // parse-time SyntaxError on Homey Pro 2016-2019 (Node < 20) — it
    // killed the melcloud sibling's app at boot on older Homey Pro
    // (2016-2019) firmware (2026-08 crash report).
    files: ['src/**/*.ts'],
    rules: { 'require-unicode-regexp': ['error', { requireFlag: 'u' }] },
  },
])

export default config
