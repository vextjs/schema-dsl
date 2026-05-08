import { DslBuilder, dsl, validate } from '../../dist/index.js';

DslBuilder.clearCustomTypes();

DslBuilder.registerType('order-id', {
  type: 'string',
  pattern: '^ORD[0-9]{12}$',
  minLength: 15,
  maxLength: 15
} as any);

const schema = dsl({
  value: 'types:string:3-10|number:0-100',
  identifier: 'types:uuid|order-id'
});

const compiled = ((schema as any).toSchema?.() ?? schema) as any;

console.log('union-types.oneOf =', compiled.properties.value.oneOf.length);
console.log('union-types.string.valid =', validate(schema, {
  value: 'hello',
  identifier: '123e4567-e89b-12d3-a456-426614174000'
}).valid);
console.log('union-types.number.valid =', validate(schema, {
  value: 42,
  identifier: 'ORD202401010001'
}).valid);
console.log('union-types.invalid =', validate(schema, {
  value: true,
  identifier: 'BAD'
}).valid);

DslBuilder.clearCustomTypes();