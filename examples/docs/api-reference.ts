import {
  ConstraintParser,
  DslParser,
  ErrorFormatter,
  JSONSchemaCore,
  MessageTemplate,
  SchemaCompiler,
  TypeRegistry,
  ValidationError,
  Validator,
  dsl,
  getDefaultValidator,
  renderTemplate,
  resetDefaultValidator,
  validate,
  validateAsync,
} from '../../dist/index.js'

const userSchema = dsl({
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

const parserStringSchema = DslParser.parseString('string:3-32!')
const parserObjectSchema = DslParser.parseObject({
  email: 'email!',
  age: 'number:18-65',
})
const resolvedEmailType = TypeRegistry.resolve('email')
const parsedConstraints = ConstraintParser.parse('3-32', 'string')
const compiledSchema = SchemaCompiler.compile(
  TypeRegistry.resolve('string'),
  parsedConstraints,
  { label: '用户名', required: true },
)
const compiledJsonSchema = SchemaCompiler.toJsonSchema(compiledSchema, TypeRegistry.getInternalKeys())

const jsonSchemaCore = new JSONSchemaCore()
  .type('object')
  .property('email', { type: 'string', format: 'email' })
  .required('email')
const jsonSchemaCoreResult = jsonSchemaCore.validate({ email: 'bad-email' })

const ajvValidator = new Validator()
const rawValidate = ajvValidator.getAjv().compile({
  type: 'object',
  properties: {
    username: { type: 'string', minLength: 3, _label: '用户名' },
  },
  required: ['username'],
})
rawValidate({ username: 'ab' })
const formatter = new ErrorFormatter('zh-CN')
const formattedErrors = formatter.formatDetailed(rawValidate.errors ?? [])

console.log('api-reference.validate.valid =', syncResult.valid)
console.log('api-reference.validateAsync.errorCaptured =', asyncError instanceof ValidationError)
console.log('api-reference.validateAsync.errors =', asyncError?.errors)
console.log('api-reference.compile.valid =', compiledValid)
console.log('api-reference.validator.validate.valid =', validatorResult.valid)
console.log('api-reference.defaultValidator.valid =', sharedDefaultResult.valid)
console.log('api-reference.defaultValidator.reset =', sharedDefaultValidator !== resetDefault)
console.log('api-reference.renderTemplate =', rendered)
console.log('api-reference.messageTemplate.render =', messageTemplate.render({ label: 'Email' }))
console.log('api-reference.messageTemplate.batch =', batchedTemplates)
console.log('api-reference.dslParser.string.required =', parserStringSchema._required)
console.log('api-reference.dslParser.object.required =', parserObjectSchema.required)
console.log('api-reference.typeRegistry.email =', resolvedEmailType.baseSchema.format)
console.log('api-reference.constraintParser =', parsedConstraints)
console.log('api-reference.schemaCompiler.required =', compiledSchema._required)
console.log('api-reference.schemaCompiler.json =', compiledJsonSchema)
console.log('api-reference.jsonSchemaCore.valid =', jsonSchemaCoreResult.valid)
console.log('api-reference.errorFormatter =', formattedErrors)