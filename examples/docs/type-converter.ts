import { TypeConverter } from '../../dist/index.js';

const merged = TypeConverter.mergeSchemas(
  {
    type: 'object',
    properties: {
      name: { type: 'string' }
    },
    required: ['name']
  } as any,
  {
    properties: {
      email: { type: 'string', format: 'email' }
    },
    required: ['email']
  } as any
) as any;

console.log('type-converter.json.email =', TypeConverter.toJSONSchemaType('email'));
console.log('type-converter.mysql.enum =', TypeConverter.toMySQLType('string', {
  type: 'string',
  enum: ['active', 'inactive']
} as any));
console.log('type-converter.pg.uuid =', TypeConverter.toPostgreSQLType('string', {
  type: 'string',
  format: 'uuid'
} as any));
console.log('type-converter.normalized =', TypeConverter.normalizePropertyName(' 123created-at '));
console.log('type-converter.regex.email =', TypeConverter.formatToRegex('email')?.test('user@example.com'));
console.log('type-converter.merge.required =', merged.required.join(','));
console.log('type-converter.constraints =', Object.keys(TypeConverter.extractConstraints({
  type: 'string',
  maxLength: 50,
  format: 'email'
} as any)).join(','));