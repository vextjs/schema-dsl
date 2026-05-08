import { dsl, validate } from '../../dist/index.js'

const syntaxSchema = dsl({
  username: dsl('string:3-32!')
    .pattern(/^[a-z0-9_]+$/)
    .label('用户名')
    .error({ pattern: '用户名格式错误' }),
  age: 'integer:18-120',
  status: 'active|inactive|pending',
  tags: 'array:1-5<string:1-20>',
  scores: 'array<number>',
  profile: {
    displayName: 'string:1-50!',
    website: 'url',
    newsletter: 'boolean!',
  },
})

const validPayload = {
  username: 'alice_01',
  age: 26,
  status: 'active',
  tags: ['schema', 'dsl'],
  scores: [98, 92, 87],
  profile: {
    displayName: 'Alice',
    website: 'https://example.com',
    newsletter: true,
  },
}

const invalidPayload = {
  username: 'Alice 01',
  age: 15,
  status: 'draft',
  tags: ['schema', 'dsl', 'typescript', 'validation', 'docs', 'overflow'],
  scores: [98, 'bad'],
  profile: {
    displayName: '',
    website: 'invalid-url',
    newsletter: 'yes',
  },
}

const validResult = validate(syntaxSchema, validPayload)
const invalidResult = validate(syntaxSchema, invalidPayload)

console.log('dsl-syntax.validPayload =', validResult.valid)
console.log('dsl-syntax.invalidPayload =', invalidResult.valid)
console.log('dsl-syntax.invalidPayload.errors =', invalidResult.errors)