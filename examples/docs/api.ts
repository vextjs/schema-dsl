import { TypeConverter, Validator, dsl, validate } from '../../dist/index.js';

const schema = dsl({
  email: 'email!',
  age: 'number:18-100'
});

const syncResult = validate(schema, {
  email: 'user@example.com',
  age: 20
});

const validator = new Validator();
const asyncResult = await validator.validateAsync(schema, {
  email: 'admin@example.com',
  age: 30
});

console.log('api.sync =', syncResult.valid);
console.log('api.async.email =', (asyncResult as any).email);
console.log('api.converter =', TypeConverter.toMongoDBType('integer'));