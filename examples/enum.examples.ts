import { dsl, validate } from '../dist/index.js';

const schema = dsl({
  status: 'enum:active,inactive!',
  level: 'enum:number:1|2|3'
});

console.log(validate(schema, { status: 'active', level: 2 }));

