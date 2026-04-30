import { dsl, validate } from '../dist/index.js';

const userSchema = dsl({
  username: 'string:3-32!',
  age: 'number:18-120',
  contact: 'types:email|phone!'
});

console.log(validate(userSchema, {
  username: 'rocky',
  age: '30',
  contact: 'rocky@example.com'
}));

