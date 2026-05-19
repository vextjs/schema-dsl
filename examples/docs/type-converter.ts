import { TypeConverter } from '../../dist/index.js'

// ============================================================
// TypeConverter — map JSON Schema types to target DB/query types
//
// Static methods:
//   toJSONSchemaType(nativeType)            → JSON Schema type string
//   toMongoDBType(jsType)                   → BSON type string
//   toMySQLType(jsType, schema?)            → MySQL column type string
//   toPostgreSQLType(jsType, schema?)       → PostgreSQL column type string
//   normalizePropertyName(name)             → safe identifier string
//   formatToRegex(format)                   → RegExp | null
//   mergeSchemas(base, extension)           → merged JSONSchema
//   extractConstraints(schema)              → constraint map
// ============================================================

// ============================================================
// 1. toJSONSchemaType() — map built-in type names to JSON Schema
// ============================================================

console.log('type-converter.json.string   =', TypeConverter.toJSONSchemaType('string'))    // 'string'
console.log('type-converter.json.email    =', TypeConverter.toJSONSchemaType('email'))     // 'string'
console.log('type-converter.json.uuid     =', TypeConverter.toJSONSchemaType('uuid'))      // 'string'
console.log('type-converter.json.integer  =', TypeConverter.toJSONSchemaType('integer'))   // 'integer'
console.log('type-converter.json.boolean  =', TypeConverter.toJSONSchemaType('boolean'))   // 'boolean'
console.log('type-converter.json.object   =', TypeConverter.toJSONSchemaType('object'))    // 'object'
console.log('type-converter.json.array    =', TypeConverter.toJSONSchemaType('array'))     // 'array'

// ============================================================
// 2. toMongoDBType() — map to BSON type
// ============================================================

console.log('type-converter.mongo.string  =', TypeConverter.toMongoDBType('string'))     // 'string'
console.log('type-converter.mongo.number  =', TypeConverter.toMongoDBType('number'))     // 'double'
console.log('type-converter.mongo.integer =', TypeConverter.toMongoDBType('integer'))    // 'int'
console.log('type-converter.mongo.boolean =', TypeConverter.toMongoDBType('boolean'))    // 'bool'
console.log('type-converter.mongo.object  =', TypeConverter.toMongoDBType('object'))     // 'object'

// ============================================================
// 3. toMySQLType() — map to MySQL column type (with schema hints)
// ============================================================

// Enum → MySQL ENUM
console.log('type-converter.mysql.enum    =', TypeConverter.toMySQLType('string', {
  type: 'string', enum: ['active', 'inactive', 'banned'],
} as any))   // "ENUM('active', 'inactive', 'banned')"

// Short string → VARCHAR
console.log('type-converter.mysql.varchar =', TypeConverter.toMySQLType('string', {
  type: 'string', maxLength: 100,
} as any))   // 'VARCHAR(100)'

// Long string → TEXT
console.log('type-converter.mysql.text    =', TypeConverter.toMySQLType('string', {
  type: 'string', maxLength: 10000,
} as any))   // 'TEXT'

// Number type
console.log('type-converter.mysql.double  =', TypeConverter.toMySQLType('number'))  // 'DOUBLE'
console.log('type-converter.mysql.boolean =', TypeConverter.toMySQLType('boolean')) // 'BOOLEAN'
console.log('type-converter.mysql.json    =', TypeConverter.toMySQLType('object'))  // 'JSON'

// ============================================================
// 4. toPostgreSQLType() — map to PostgreSQL column type
// ============================================================

// UUID → uses default VARCHAR(255)
console.log('type-converter.pg.uuid      =', TypeConverter.toPostgreSQLType('string', {
  type: 'string', format: 'uuid',
} as any))   // 'VARCHAR(255)'

// Date format
console.log('type-converter.pg.date      =', TypeConverter.toPostgreSQLType('string', {
  type: 'string', format: 'date',
} as any))   // 'DATE'

// Datetime format
console.log('type-converter.pg.timestamp =', TypeConverter.toPostgreSQLType('string', {
  type: 'string', format: 'date-time',
} as any))   // 'TIMESTAMP'

// Integer → BIGINT
console.log('type-converter.pg.bigint    =', TypeConverter.toPostgreSQLType('integer'))  // 'BIGINT'
// Object → JSONB
console.log('type-converter.pg.jsonb     =', TypeConverter.toPostgreSQLType('object'))   // 'JSONB'

// ============================================================
// 5. normalizePropertyName() — make a safe SQL/JS identifier
// ============================================================

console.log('type-converter.norm.spaces  =', TypeConverter.normalizePropertyName('first name'))  // 'first_name'
console.log('type-converter.norm.dashes  =', TypeConverter.normalizePropertyName('user-id'))     // 'user_id'
console.log('type-converter.norm.digits  =', TypeConverter.normalizePropertyName('123created'))  // '_123created' or similar
console.log('type-converter.norm.clean   =', TypeConverter.normalizePropertyName(' email '))     // 'email'

// ============================================================
// 6. formatToRegex() — get validation regex for a format
// ============================================================

const emailRegex = TypeConverter.formatToRegex('email')
const uuidRegex  = TypeConverter.formatToRegex('uuid')
const dateRegex  = TypeConverter.formatToRegex('date')
const nullRegex  = TypeConverter.formatToRegex('custom')  // unknown → null

console.log('type-converter.regex.email  =', emailRegex?.test('user@example.com'))   // true
console.log('type-converter.regex.emailX =', emailRegex?.test('bad-email'))           // false
console.log('type-converter.regex.uuid   =',
  uuidRegex?.test('123e4567-e89b-12d3-a456-426614174000'))                            // true
console.log('type-converter.regex.date   =', dateRegex?.test('2024-01-15'))           // true
console.log('type-converter.regex.null   =', nullRegex)                               // null

// ============================================================
// 7. mergeSchemas() — combine two JSON Schema objects
// ============================================================

const base = {
  type: 'object',
  properties: { name: { type: 'string' }, age: { type: 'integer' } },
  required: ['name'],
} as any

const extension = {
  properties: { email: { type: 'string', format: 'email' }, role: { type: 'string' } },
  required: ['email'],
} as any

const merged = TypeConverter.mergeSchemas(base, extension) as any

console.log('type-converter.merge.required  =', merged.required.sort().join(','))  // 'email,name'
console.log('type-converter.merge.hasEmail  =', 'email' in merged.properties)     // true
console.log('type-converter.merge.hasName   =', 'name' in merged.properties)      // true

// ============================================================
// 8. extractConstraints() — pull constraint keys from a schema
// ============================================================

const constraints = TypeConverter.extractConstraints({
  type: 'string',
  minLength: 3,
  maxLength: 50,
  format: 'email',
} as any)

console.log('type-converter.constraints.keys =', Object.keys(constraints).sort().join(','))