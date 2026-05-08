import { dsl, validate } from '../../dist/index.js';

const schema = dsl({
  name: dsl('string:1-50!').label('姓名'),
  age: 'number:18-120',
  isActive: 'boolean!',
  birthday: 'date?',
  tags: 'array<string:1-20>?',
  status: 'active|inactive'
});

const validResult = validate(schema, {
  name: 'Alice',
  age: 30,
  isActive: true,
  birthday: '2026-05-08',
  tags: ['alpha', 'beta'],
  status: 'active'
});

const invalidResult = validate(schema, {
  name: 'Alice',
  age: 16,
  isActive: true,
  tags: [1, 2],
  status: 'deleted'
});

console.log('multi-type-support.valid =', validResult.valid);
console.log('multi-type-support.invalid =', invalidResult.valid);
console.log('multi-type-support.errorCount =', invalidResult.errors?.length ?? 0);