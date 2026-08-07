import { namingConventionEntries } from '@olivierzal/configs/eslint'
import { library } from '@olivierzal/configs/eslint/library'
import { type Config, defineConfig } from 'eslint/config'

// The modules that hold a wire vocabulary: the Gizwits payload types
// and their zod mirror, plus the HTTP status map. Everywhere else the
// strict core applies.
const wireContractFiles = [
  'src/http/status.ts',
  'src/types/heatzy.ts',
  'src/validation/schemas.ts',
]

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
  }),
  {
    // The wire exemptions above are what the protocol imposes on the
    // modules that speak it, not a licence for the whole tree: the
    // sources that are ours alone take the core back, so a snake_case
    // name of our own invention is caught here rather than waved
    // through by a vocabulary it does not belong to. Fixtures keep the
    // exemption: they carry payloads verbatim.
    files: ['src/**/*.ts'],
    ignores: wireContractFiles,
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        ...namingConventionEntries({
          // Mirrors the library preset's own filter: `device` types
          // include `false` as a sentinel without being a flag.
          booleanFilter: { match: false, regex: '^device$' },
        }),
      ],
    },
  },
])

export default config
