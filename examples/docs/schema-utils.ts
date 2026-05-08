import { dsl, Validator, SchemaUtils } from '../../dist/index.js'

const emailField = SchemaUtils.reusable(() => dsl('email!').label('邮箱'))

const fields = SchemaUtils.createLibrary({
  email: emailField,
  nickname: () => dsl('string:2-20!').label('昵称'),
})

const baseSchema = dsl({
  id: 'objectId!',
  createdAt: 'date',
})

const userSchema = SchemaUtils.extend(
  baseSchema,
  dsl({
    email: fields.email(),
    nickname: fields.nickname(),
    status: 'active|inactive',
  }),
)

const validator = SchemaUtils.withPerformance(new Validator() as any) as Validator
const singleResult = validator.validate(userSchema, {
  id: '507f1f77bcf86cd799439011',
  createdAt: '2026-05-08',
  email: 'user@example.com',
  nickname: 'schema-dsl',
  status: 'active',
}) as { valid: boolean; performance?: unknown }

const batchResult = SchemaUtils.validateBatch(
  userSchema,
  [
    {
      id: '507f1f77bcf86cd799439011',
      createdAt: '2026-05-08',
      email: 'user@example.com',
      nickname: 'schema-dsl',
      status: 'active',
    },
    {
      id: '507f1f77bcf86cd799439011',
      createdAt: '2026-05-08',
      email: 'bad-email',
      nickname: 'x',
      status: 'archived',
    },
  ],
  validator.getAjv(),
)

const cloned = SchemaUtils.clone(userSchema)

console.log('schema-utils.single.valid =', singleResult.valid)
console.log('schema-utils.performance =', Boolean(singleResult.performance))
console.log('schema-utils.batch.invalid =', batchResult.summary.invalid)
console.log('schema-utils.clone.independent =', cloned !== userSchema)