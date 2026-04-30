import { dsl, validate } from '../dist/index.js';

const schema = dsl({
  name: 'string:2-32!',
  email: 'email!'
});

console.log(validate(schema, { name: 'Rocky', email: 'rocky@example.com' }));

