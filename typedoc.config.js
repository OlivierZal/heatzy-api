// @ts-check
import { typedocBase } from '@olivierzal/configs/typedoc'

/** @type {Partial<import('typedoc').TypeDocOptions>} */
const config = typedocBase({
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
  ],
  name: 'Heatzy API for Node.js',
  navigationLinks: {
    GitHub: 'https://github.com/OlivierZal/heatzy-api',
    'GitHub Packages':
      'https://github.com/OlivierZal/heatzy-api/pkgs/npm/heatzy-api',
  },
})

export default config
