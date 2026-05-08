import { dsl, validate } from '../../dist/index.js';

const rules = {
  username: { min: 3, max: 12 },
  age: { min: 18, max: 60 }
};

const schemaConfig = {
  username: `string:${rules.username.min}-${rules.username.max}!`,
  age: `number:${rules.age.min}-${rules.age.max}`,
  email: 'email!'
};

const serialized = JSON.stringify(schemaConfig);
const hydrated = JSON.parse(serialized);
const schema = dsl(hydrated);

console.log('design-philosophy.serialized =', serialized.includes('string:3-12!'));
console.log('design-philosophy.valid =', validate(schema, {
  username: 'runtime_user',
  age: 28,
  email: 'runtime@example.com'
}).valid);