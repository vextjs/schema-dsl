import { BaseExporter, CACHE, CONSTANTS, CacheManager, CustomKeywords, ErrorFormatter, FORMATS, I18nError, JSONSchemaCore, MessageTemplate, MarkdownExporter, MongoDBExporter, MySQLExporter, ObjectDslBuilder, PATTERNS, PATTERN_IPV4, PATTERN_IPV6, PluginManager, PostgreSQLExporter, SchemaHelper, SchemaUtils, TypeConverter, TypeRegistry, VALIDATION, ValidationError, VERSION, Validator, config, defineExtension, s, exporters, getDefaultValidator, installStringExtensions, registerExtension, renderTemplate, resetDefaultValidator, resetRuntimeState, uninstallStringExtensions, validate, validateAsync } from '../../dist/pure.js'
import { schemaDslEsbuildPlugin } from '../../dist/esbuild.js'
import { dsl as pureDsl } from '../../dist/pure.js'
import { transformSchemaDsl } from '../../dist/transform.js'

const stringTypesEntry = await import('../../dist/string-types.js')

function expect(label: string, condition: boolean): void {
  if (!condition) throw new Error(`api-reference expectation failed: ${label}`)
}

const userSchema = s({
  username: 'string:3-32!',
  email: 'email!',
  role: 'user|admin|moderator',
})

const syncResult = validate(userSchema, {
  username: 'john_doe',
  email: 'john@example.com',
  role: 'user',
})

let asyncError: ValidationError | null = null

try {
  await validateAsync(userSchema, {
    username: 'jd',
    email: 'bad-email',
    role: 'owner',
  })
} catch (error) {
  if (error instanceof ValidationError) {
    asyncError = error
  } else {
    throw error
  }
}

const validator = new Validator()
const compiled = validator.compile(userSchema, 'api-reference-user')
const compiledValid = compiled({
  username: 'compiled_user',
  email: 'compiled@example.com',
  role: 'admin',
})

const validatorResult = validator.validate(userSchema, {
  username: 'sync_user',
  email: 'sync@example.com',
  role: 'moderator',
})

const validatorFactory = Validator.create({ cache: { statsEnabled: true } })
const batchResults = validatorFactory.validateBatch(userSchema, [
  { username: 'batch_one', email: 'one@example.com', role: 'user' },
  { username: 'x', email: 'bad-email', role: 'owner' },
])

const standaloneCache = new CacheManager({ maxSize: 2, ttl: 60_000, statsEnabled: true })
standaloneCache.set('schema:api-reference', { compiled: true })
const standaloneCacheHit = standaloneCache.get('schema:api-reference') as { compiled?: boolean } | null
const standaloneCacheStats = standaloneCache.getStats()

const constantsAligned =
  CONSTANTS.VALIDATION.MAX_RECURSION_DEPTH === VALIDATION.MAX_RECURSION_DEPTH &&
  CONSTANTS.CACHE.ENABLED === CACHE.ENABLED &&
  CONSTANTS.FORMATS.BUILT_IN.includes('email') === FORMATS.BUILT_IN.includes('email') &&
  typeof PATTERNS.phone === 'object' &&
  PATTERN_IPV4.test('127.0.0.1') &&
  PATTERN_IPV6.test('::1')

const exporterBaseSurface = typeof BaseExporter === 'function'

const customKeywordsSurface = typeof CustomKeywords.registerAll === 'function'

const i18nError = I18nError.create('API_REFERENCE_ERROR', { field: 'email' }, 422, 'en-US')
let assertedI18nError: I18nError | null = null
try {
  I18nError.assert(false, 'API_REFERENCE_ASSERTION', { field: 'role' }, 409, 'en-US')
} catch (error) {
  if (error instanceof I18nError) {
    assertedI18nError = error
  } else {
    throw error
  }
}

const pluginManager = new PluginManager()
let installedMode = ''
pluginManager.register({
  name: 'api-reference-plugin',
  version: '1.0.0',
  install(_core: unknown, options?: Record<string, unknown>) {
    installedMode = String(options?.['mode'] ?? '')
  },
} as any)
pluginManager.install({}, 'api-reference-plugin', { mode: 'demo' })
pluginManager.hook('api-reference:hook', (value: unknown) => `hook:${String(value)}`)
const pluginHookResults = await pluginManager.runHook('api-reference:hook', 'ok')
const pluginList = pluginManager.list()
pluginManager.clear()

const quickValid = Validator.quickValidate(userSchema, {
  username: 'quick_user',
  email: 'quick@example.com',
  role: 'admin',
})

validatorFactory.addFormat('ticket-id', /^TCK-\d{4}$/)
const ticketResult = validatorFactory.validate({
  type: 'object',
  properties: { ticketId: { type: 'string', format: 'ticket-id' } },
  required: ['ticketId'],
}, { ticketId: 'TCK-2026' })

validatorFactory.addKeyword('startsWithPrefix', {
  type: 'string',
  schemaType: 'string',
  validate: (prefix: unknown, value: unknown) =>
    typeof prefix === 'string' && typeof value === 'string' && value.startsWith(prefix),
} as any)
const keywordResult = validatorFactory.validate({
  type: 'object',
  properties: {
    accountId: { type: 'string', startsWithPrefix: 'USR-' },
  },
  required: ['accountId'],
} as any, { accountId: 'USR-1001' })

validatorFactory.addSchema('AddressRef', {
  type: 'object',
  properties: { city: { type: 'string', minLength: 2 } },
  required: ['city'],
})
const refResult = validatorFactory.validate({
  type: 'object',
  properties: { address: { $ref: 'AddressRef' } },
  required: ['address'],
} as any, { address: { city: 'Shenzhen' } })
validatorFactory.removeSchema('AddressRef')
const cacheStatsBeforeClear = validatorFactory.getCacheStats()
validatorFactory.clearCache()
const cacheStatsAfterClear = validatorFactory.getCacheStats()

const sharedDefaultValidator = getDefaultValidator()
const sharedDefaultResult = sharedDefaultValidator.validate(userSchema, {
  username: 'singleton_user',
  email: 'singleton@example.com',
  role: 'user',
})

resetDefaultValidator()
const resetDefault = getDefaultValidator()

const rendered = renderTemplate('{field} must be {min}~{max}', {
  field: 'age',
  min: 18,
  max: 65,
})

const messageTemplate = new MessageTemplate('{{#label}} is required')
const batchedTemplates = MessageTemplate.renderBatch(
  {
    required: '{{#label}} is required',
    invalid: '{{#label}} is invalid',
  },
  { label: 'Email' },
)

const resolvedEmailType = TypeRegistry.resolve('email')
const builderStringSchema = s.string().min(3).max(32).label('Username').require().toSchema()
const namespaceEmailSchema = s.email().label('Email').require().toSchema()
const explicitDslSeedSchema = s('email!').label('Email').toSchema()
const namespaceArrayObjectSchema = s.array({ name: 'string!', quantity: 'number:1-999!' }).min(1).toSchema()
const normalizedExtension = defineExtension({
  literal: 'tenant-id',
  factoryName: 'tenantId',
})
registerExtension({
  literal: 'tenant-id',
  factoryName: 'tenantId',
  schema: { type: 'string', pattern: '^tenant_[a-z0-9]+$' },
})
const tenantFactorySchema = (s as typeof s & { tenantId(): ReturnType<typeof s.string> }).tenantId().require().toSchema()
const objectBuilder = new ObjectDslBuilder(s({
  email: 'email!',
  age: 'number:18-65',
}))
const objectBuilderSchema = objectBuilder.requireAll().toSchema()

const pickedSchema = SchemaUtils.pick(userSchema, ['username', 'email'])
const publicSummary = SchemaHelper.summarizeSchema(pickedSchema)
const normalizedField = TypeConverter.normalizePropertyName(' 1 invalid-field ')
const mysqlStringType = TypeConverter.toMySQLType('string', { maxLength: 64 })

const jsonSchemaCore = new JSONSchemaCore()
  .type('object')
  .property('email', { type: 'string', format: 'email' })
  .required('email')
const jsonSchemaCoreResult = jsonSchemaCore.validate({ email: 'bad-email' })

const mongoSchema = MongoDBExporter.export(userSchema)
const mysqlDDL = MySQLExporter.export('users', userSchema)
const pgDDL = PostgreSQLExporter.export('users', userSchema)
const markdown = new MarkdownExporter({ title: 'User schema', locale: 'en-US' }).export(userSchema)
const namespaceMarkdown = exporters.MarkdownExporter.export(userSchema, { title: 'Namespace export', locale: 'en-US' })

const ajvValidator = new Validator()
const rawValidate = ajvValidator.getAjv().compile({
  type: 'object',
  properties: {
    username: { type: 'string', minLength: 3, _label: 'username' },
  },
  required: ['username'],
})
rawValidate({ username: 'ab' })
const formatter = new ErrorFormatter('zh-CN')
const formattedErrors = formatter.formatDetailed(rawValidate.errors ?? [])

config({ cache: { statsEnabled: true, maxSize: 16 } })
const configuredStats = getDefaultValidator().getCacheStats()

uninstallStringExtensions()
const afterUninstall = typeof ('email!' as any).label
const pureEntryAfterImport = typeof ('email!' as any).description
const pureEntrySchema = pureDsl('email!').description('Login email').toSchema()
const transformedDsl = transformSchemaDsl(
  [
    'export const role = "admin|user|guest".label("Role")',
    'export const tenant = "string!".tenantId().label("Tenant")',
  ].join('\n'),
  {
    filename: 'api-reference.ts',
    additionalMethods: ['tenantId'],
    strict: true,
  },
)
const esbuildPlugin = schemaDslEsbuildPlugin()
const registerStringEntry = await import('../../dist/register-string.js')
const afterRegisterStringEntry = typeof ('email!' as any).description
const registerEntrySchema = ('email!' as any).description('Login email').toSchema()
installStringExtensions()
const afterInstall = typeof ('email!' as any).label
const extensionSchema = ('string:2-8!' as any).toJsonSchema()

console.log('api-reference.version =', typeof VERSION)
console.log('api-reference.validate.valid =', syncResult.valid)
console.log('api-reference.validateAsync.errorCaptured =', asyncError instanceof ValidationError)
console.log('api-reference.validateAsync.errors =', asyncError?.errors)
console.log('api-reference.compile.valid =', compiledValid)
console.log('api-reference.validator.validate.valid =', validatorResult.valid)
console.log('api-reference.validator.create.batch =', batchResults.map(r => r.valid))
console.log('api-reference.validator.quickValidate =', quickValid)
console.log('api-reference.validator.addFormat =', ticketResult.valid)
console.log('api-reference.validator.addKeyword =', keywordResult.valid)
console.log('api-reference.validator.addSchema =', refResult.valid)
console.log('api-reference.validator.cache.beforeClear =', cacheStatsBeforeClear.enabled)
console.log('api-reference.validator.cache.afterClear.size =', cacheStatsAfterClear.size)
console.log('api-reference.cacheManager.hit =', standaloneCacheHit?.compiled)
console.log('api-reference.cacheManager.stats =', standaloneCacheStats.enabled)
console.log('api-reference.constants.aligned =', constantsAligned)
console.log('api-reference.customKeywords.surface =', customKeywordsSurface)
console.log('api-reference.i18nError.status =', i18nError.statusCode)
console.log('api-reference.i18nError.assert =', assertedI18nError?.statusCode)
console.log('api-reference.pluginManager.installed =', installedMode)
console.log('api-reference.pluginManager.hook =', pluginHookResults)
console.log('api-reference.pluginManager.list =', pluginList.map(item => item.name))
console.log('api-reference.defaultValidator.valid =', sharedDefaultResult.valid)
console.log('api-reference.defaultValidator.reset =', sharedDefaultValidator !== resetDefault)
console.log('api-reference.renderTemplate =', rendered)
console.log('api-reference.messageTemplate.render =', messageTemplate.render({ label: 'Email' }))
console.log('api-reference.messageTemplate.batch =', batchedTemplates)
console.log('api-reference.dslBuilder.string.required =', builderStringSchema._required)
console.log('api-reference.namespace.identity =', s === pureDsl)
console.log('api-reference.namespace.email =', namespaceEmailSchema.format)
console.log('api-reference.namespace.dslSeed =', explicitDslSeedSchema._required)
console.log('api-reference.namespace.arrayObject =', (namespaceArrayObjectSchema.items as any).required)
console.log('api-reference.namespace.defineExtension =', normalizedExtension.factoryName)
console.log('api-reference.namespace.customFactory =', tenantFactorySchema.pattern)
console.log('api-reference.objectDslBuilder.required =', objectBuilderSchema.requiredAll)
console.log('api-reference.typeRegistry.email =', resolvedEmailType.baseSchema.format)
console.log('api-reference.schemaUtils.pick.fields =', publicSummary.fields)
console.log('api-reference.schemaHelper.summary =', publicSummary.fieldCount)
console.log('api-reference.typeConverter.name =', normalizedField)
console.log('api-reference.typeConverter.mysql =', mysqlStringType)
console.log('api-reference.jsonSchemaCore.valid =', jsonSchemaCoreResult.valid)
console.log('api-reference.exporters.mongodb =', typeof mongoSchema.$jsonSchema)
console.log('api-reference.exporters.mysql =', mysqlDDL.includes('CREATE TABLE'))
console.log('api-reference.exporters.postgresql =', pgDDL.includes('CREATE TABLE'))
console.log('api-reference.exporters.markdown =', markdown.includes('User schema'))
console.log('api-reference.exporters.namespace =', namespaceMarkdown.includes('Namespace export'))
console.log('api-reference.exporters.base =', exporterBaseSurface)
console.log('api-reference.errorFormatter =', formattedErrors)
console.log('api-reference.config.cache =', configuredStats.enabled)
console.log('api-reference.stringExtensions.uninstall =', afterUninstall)
console.log('api-reference.entries.pure.noSideEffect =', pureEntryAfterImport)
console.log('api-reference.entries.pure.schema =', pureEntrySchema.format)
console.log('api-reference.transform.changed =', transformedDsl.changed)
console.log('api-reference.esbuildPlugin.name =', esbuildPlugin.name)
console.log('api-reference.entries.registerString.install =', afterRegisterStringEntry)
console.log('api-reference.entries.registerString.schema =', registerEntrySchema.description)
console.log('api-reference.stringExtensions.install =', afterInstall)
console.log('api-reference.stringExtensions.schema =', extensionSchema.minLength, extensionSchema.maxLength)

expect('validate should pass', syncResult.valid)
expect('validateAsync captures ValidationError', asyncError instanceof ValidationError)
expect('compiled validator should pass', compiledValid === true)
expect('validateBatch returns one valid and one invalid result', batchResults[0]?.valid === true && batchResults[1]?.valid === false)
expect('quickValidate should pass', quickValid === true)
expect('custom format should pass', ticketResult.valid === true)
expect('custom keyword should pass', keywordResult.valid === true)
expect('schema ref should pass before removal', refResult.valid === true)
expect('CacheManager should return stored value', standaloneCacheHit?.compiled === true)
expect('CONSTANTS namespace should align with named constants', constantsAligned)
expect('BaseExporter should be exported for custom exporter subclasses', exporterBaseSurface)
expect('CustomKeywords should expose registerAll', customKeywordsSurface)
expect('I18nError.create should preserve status', i18nError.statusCode === 422)
expect('I18nError.assert should throw I18nError', assertedI18nError?.statusCode === 409)
expect('PluginManager should install and run hooks', installedMode === 'demo' && pluginHookResults[0] === 'hook:ok' && pluginList[0]?.name === 'api-reference-plugin')
expect('string extensions uninstall removes methods', afterUninstall === 'undefined')
expect('pure entry should not install string extensions', pureEntryAfterImport === 'undefined' && pureEntrySchema.format === 'email')
expect('string-types entry should be a side-effect-free runtime module', typeof stringTypesEntry === 'object')
expect('transformSchemaDsl should rewrite built-in, custom, and pipe enum string chains', transformedDsl.changed === true && transformedDsl.code.includes('schema-dsl/pure') && transformedDsl.code.includes('tenantId') && transformedDsl.code.includes('admin|user|guest'))
expect('esbuild plugin should expose schema-dsl name', esbuildPlugin.name === 'schema-dsl')
expect('register-string entry should install extensions', afterRegisterStringEntry === 'function' && typeof registerStringEntry.installStringExtensions === 'function' && registerEntrySchema.description === 'Login email')
expect('string extensions can be reinstalled', afterInstall === 'function')
expect('string extensions produce schema constraints', extensionSchema.minLength === 2 && extensionSchema.maxLength === 8)
expect('shared namespace identity should hold', s === pureDsl)
expect('namespace factories should produce required email fields', namespaceEmailSchema.format === 'email' && namespaceEmailSchema._required === true)
expect('explicit dsl seed should preserve DSL literal required flag', explicitDslSeedSchema._required === true)
expect('namespace array factory should accept DSL object items', Array.isArray((namespaceArrayObjectSchema.items as any).required))
expect('defineExtension should normalize extension metadata', normalizedExtension.factoryName === 'tenantId')
expect('registerExtension should expose a namespace factory', tenantFactorySchema.pattern === '^tenant_[a-z0-9]+$')

resetRuntimeState()
