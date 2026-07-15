import { s, validate } from '../../dist/index.js'

const schema = s({
  email: s('email!').description('Login email'),
  nickname: 'string?',
})

const jsonSchema = schema
if (!jsonSchema.required?.includes('email')) {
  throw new Error('v3 object required[] contract changed')
}
if (jsonSchema.required?.includes('nickname')) {
  throw new Error('v3 optional marker contract changed')
}
if (typeof ('' as unknown as { description?: unknown }).description !== 'undefined') {
  throw new Error('v3 root import unexpectedly installed String.prototype.description')
}

const result = validate(schema, { email: 'user@example.com' })
if (!result.valid || (result.data as { email?: unknown } | undefined)?.email !== 'user@example.com') {
  throw new Error('v3 root validation example failed')
}
