import { SchemaUtils, Validator, dsl } from '../../dist/index.js';

const schema = dsl({
  email: 'email!',
  age: 'number:18-100'
});

const validator = SchemaUtils.withPerformance(new Validator({
  cache: { maxSize: 10, statsEnabled: true }
} as any) as any) as Validator;

validator.validate(schema, { email: 'first@example.com', age: 20 });
validator.validate(schema, { email: 'second@example.com', age: 21 });

const measured = (validator as any).validate(schema, { email: 'third@example.com', age: 22 }) as any;
const stats = validator.getCacheStats();

console.log('performance-guide.valid =', measured.valid);
console.log('performance-guide.duration =', measured.performance.duration >= 0);
console.log('performance-guide.cache.enabled =', stats.enabled);
console.log('performance-guide.cache.hits =', stats.hits >= 1);