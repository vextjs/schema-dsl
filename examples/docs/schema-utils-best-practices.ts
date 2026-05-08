import { dsl, validate, SchemaUtils } from '../../dist/index.js'

const fields = SchemaUtils.createLibrary({
  username: () => dsl('string:3-32!').label('用户名'),
  email: () => dsl('email!').label('邮箱'),
  password: () => dsl('string:8-32!').label('密码'),
})

const userSchema = dsl({
  id: 'objectId!',
  username: fields.username(),
  email: fields.email(),
  password: fields.password(),
  createdAt: 'date',
})

const createSchema = SchemaUtils.omit(userSchema, ['id', 'createdAt'])
const publicSchema = SchemaUtils.omit(userSchema, ['password'])
const updateSchema = SchemaUtils.pick(userSchema, ['username', 'email']).partial()

console.log(
  'schema-utils-best-practices.create =',
  validate(createSchema, { username: 'john_doe', email: 'john@example.com', password: 'password123' }).valid,
)
console.log(
  'schema-utils-best-practices.public =',
  validate(publicSchema, {
    id: '507f1f77bcf86cd799439011',
    username: 'john_doe',
    email: 'john@example.com',
    createdAt: '2026-05-08',
  }).valid,
)
console.log(
  'schema-utils-best-practices.update =',
  validate(updateSchema, { email: 'updated@example.com' }).valid,
)