import { dsl, validate } from '../../dist/index.js'

const enumSchema = dsl({
  status: 'active|inactive|pending!',
  role: dsl('admin|user|guest').label('角色').error({ enum: '角色必须是 admin、user 或 guest' }),
  priority: 'enum:number:1|2|3',
  featureFlag: 'enum:boolean:true|false',
  tags: 'array<enum:tech|business|lifestyle>',
})

const validResult = validate(enumSchema, {
  status: 'active',
  role: 'admin',
  priority: 2,
  featureFlag: true,
  tags: ['tech', 'business'],
})

const invalidResult = validate(enumSchema, {
  status: 'draft',
  role: 'owner',
  priority: 4,
  featureFlag: 'yes',
  tags: ['tech', 'unknown'],
})

console.log('enum.valid =', validResult.valid)
console.log('enum.invalid =', invalidResult.valid)
console.log('enum.invalid.errors =', invalidResult.errors)