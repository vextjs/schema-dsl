import { SchemaUtils, dsl, validate } from '../../dist/index.js';

const fields = SchemaUtils.createLibrary({
  username: () => dsl('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('用户名')
    .error({ pattern: '只能包含字母、数字和下划线' }),
  email: () => dsl('email!')
    .label('邮箱地址')
    .error({ required: '请填写邮箱地址' })
});

const schema = dsl({
  username: fields.username(),
  email: fields.email(),
  age: 'number:18-120',
  role: 'admin|user|guest'
});

console.log('best-practices.valid =', validate(schema, {
  username: 'demo_user',
  email: 'demo@example.com',
  age: 30,
  role: 'admin'
}).valid);

console.log('best-practices.invalid =', validate(schema, {
  username: 'bad user',
  email: 'bad',
  age: 12,
  role: 'unknown'
}).valid);