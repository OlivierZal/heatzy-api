// @ts-check
export default {
  cleanOutputDir: false,
  entryPoints: ['src/index.ts'],
  enumMembersFormat: 'table',
  excludePrivate: true,
  expandObjects: true,
  expandParameters: true,
  hidePageHeader: true,
  indexFormat: 'table',
  out: '.',
  outputFileStrategy: 'modules',
  parametersFormat: 'table',
  plugin: ['typedoc-plugin-markdown'],
  propertiesFormat: 'table',
  readme: 'none',
  textContentMappings: {
    'title.indexPage': 'Heatzy API for Node.js',
  },
  typeDeclarationFormat: 'table',
  useCodeBlocks: true,
}