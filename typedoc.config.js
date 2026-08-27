// @ts-check
import { typedocBase } from '@olivierzal/configs/typedoc'

/** @type {Partial<import('typedoc').TypeDocOptions>} */
const config = {
  // Core symbols referenced from re-exported doc comments resolve to
  // the api-core docs site; deep pages could drift with typedoc's URL
  // scheme, so the mapping points at the site root.
  externalSymbolLinkMappings: {
    '@olivierzal/api-core': {
      Redaction: 'https://olivierzal.github.io/api-core/',
    },
  },
  ...typedocBase({
    categoryOrder: [
      'API Clients',
      'Facades',
      'Entities',
      'Errors',
      'Configuration',
      'Decorators',
      'HTTP',
      'Types',
      'Utilities',
    ],
    hostedBaseUrl: 'https://olivierzal.github.io/heatzy-api/',
    intentionallyNotExported: [
      // Internal infrastructure leaked through a public decorator
      // signature (tagged `@internal` in source).
      'HasSettingManager',
      // The sync-params vocabulary this SDK instantiates the core's
      // lifecycle generics with; consumers name the aliases
      // (`LifecycleEvents`, `SyncCallback`), never the parameter shape.
      'SyncParams',
    ],
    name: 'Heatzy API for Node.js',
    navigationLinks: {
      GitHub: 'https://github.com/OlivierZal/heatzy-api',
      'GitHub Packages':
        'https://github.com/OlivierZal/heatzy-api/pkgs/npm/heatzy-api',
    },
  }),
}

export default config
