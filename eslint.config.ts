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
    ],
    // The modules that hold a wire vocabulary: the Gizwits payload
    // types and their zod mirror. Everywhere else the strict core
    // applies, so a snake_case name of our own invention is caught
    // rather than waved through by a vocabulary it does not belong to.
    wireNamingFiles: ['src/types/heatzy.ts', 'src/validation/schemas.ts'],
  }),
])

export default config
