const config = {
  cleanOutputDir: false,
  entryPoints: ['src/main.ts'],
  enumMembersFormat: 'table',
  excludePrivate: true,
  expandObjects: true,
  expandParameters: true,
  hidePageHeader: true,
  includeVersion: true,
  indexFormat: 'table',
  out: '.',
  outputFileStrategy: 'modules',
  parametersFormat: 'table',
  plugin: ['typedoc-plugin-markdown'],
  propertiesFormat: 'table',
  readme: 'none',
  textContentMappings: {
    'title.indexPage': 'Heatzy API for Node.js - {version}',
  },
  typeDeclarationFormat: 'table',
  useCodeBlocks: true,
}

export default config
