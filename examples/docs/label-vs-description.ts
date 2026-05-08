import { dsl, validate } from '../../dist/index.js';

const emailField = dsl('email!')
  .label('邮箱地址')
  .description('用于登录和接收系统通知');

const schema = dsl({
  email: emailField
});

const rawField = (emailField as any).toSchema() as any;
const invalid = validate(schema, { email: 'bad' });

console.log('label-vs-description.label =', rawField._label);
console.log('label-vs-description.description =', rawField.description);
console.log('label-vs-description.error =', invalid.errors?.[0]?.message);