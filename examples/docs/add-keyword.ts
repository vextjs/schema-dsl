import { Validator } from '../../dist/index.js';

const validator = new Validator();

validator.addKeyword('isEven', {
  type: 'number',
  validate: (_schema: unknown, data: unknown) => (data as number) % 2 === 0
});

const schema = { type: 'number', isEven: true };

console.log('add-keyword.even =', validator.validate(schema as any, 4).valid);
console.log('add-keyword.odd =', validator.validate(schema as any, 5).valid);