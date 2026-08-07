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
      // Gizwits split temperature registers mix snake and camel
      // (`cur_tempH`) — the wire is canonical.
      {
        filter: { match: true, regex: '^(cft|cur|eco)_temp[HL]$' },
        format: null,
        selector: ['objectLiteralProperty', 'typeProperty'],
      },
    ],
  }),
])

export default config
