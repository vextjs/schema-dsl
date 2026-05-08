import { DslBuilder, TypeRegistry, dsl, validate } from '../../dist/index.js';

DslBuilder.clearCustomTypes();

TypeRegistry.register('evenNumber', {
  baseSchema: { type: 'number', multipleOf: 2 }
});

DslBuilder.registerType('orderCode', {
  type: 'string',
  pattern: '^ORD\\d{6}$'
} as any);

const evenSchema = dsl({ value: 'evenNumber!' });
const orderSchema = dsl({ id: 'orderCode!' });

console.log('plugin-type-registration.even.valid =', validate(evenSchema, { value: 4 }).valid);
console.log('plugin-type-registration.even.invalid =', validate(evenSchema, { value: 3 }).valid);
console.log('plugin-type-registration.order.valid =', validate(orderSchema, { id: 'ORD123456' }).valid);
console.log('plugin-type-registration.order.invalid =', validate(orderSchema, { id: 'BAD' }).valid);
console.log('plugin-type-registration.has.orderCode =', DslBuilder.hasType('orderCode'));

TypeRegistry.unregister('evenNumber');
DslBuilder.clearCustomTypes();

console.log('plugin-type-registration.cleaned =', !TypeRegistry.has('evenNumber') && !DslBuilder.hasType('orderCode'));