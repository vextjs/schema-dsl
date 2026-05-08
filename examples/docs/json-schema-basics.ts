import { dsl } from '../../dist/index.js';

const emailField = dsl('email!')
  .label('邮箱')
  .description('主要联系邮箱')
  .error({ required: '邮箱必填' });

const rawFieldSchema = (emailField as any).toSchema() as any;
const cleanFieldSchema = emailField.toJsonSchema() as any;
const objectSchema = dsl({
  email: emailField,
  age: dsl('number:18-100').label('年龄')
}) as any;

console.log('json-schema-basics.raw.internal =', ['_label', '_customMessages', '_description'].some(key => key in rawFieldSchema));
console.log('json-schema-basics.clean.internal =', ['_label', '_customMessages', '_description'].some(key => key in cleanFieldSchema));
console.log('json-schema-basics.object.type =', objectSchema.type);
console.log('json-schema-basics.object.required =', objectSchema.required.join(','));