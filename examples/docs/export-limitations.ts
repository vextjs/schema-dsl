import { s, validate, MongoDBExporter, MySQLExporter, PostgreSQLExporter } from '../../dist/pure.js'

function expect(label: string, condition: boolean): void {
  if (!condition) throw new Error(`export-limitations expectation failed: ${label}`)
}

// ============================================================
// Export limitations guide
//
// Not everything in a DSL schema can be mapped 1-to-1 to a DB
// column definition or MongoDB validator. This file documents
// what each exporter supports, and what gets simplified or dropped.
// ============================================================

// ============================================================
// 1. Conditional schemas (s.match / s.if) → dropped by SQL exporters
// ============================================================

// This schema uses runtime-conditional logic based on contactType.
// It validates perfectly, but SQL exporters cannot express if/then.
const fullSchema = s({
  username:     s('string:3-32!').description('Login handle'),
  contactType:  'email|phone',
  contact:      s.match('contactType', {
    email: 'email!',
    phone: 'phone:cn!',
  }),
})

// For DB export, use a simplified version without conditions
const dbSchema = s({
  username:     s('string:3-32!').description('Login handle'),
  contactType:  'email|phone',
  contact:      s('string!').description('Email or phone number'),
})

const mysqlDdl    = MySQLExporter.export('users', dbSchema)
const postgresDdl = PostgreSQLExporter.export('users', dbSchema)
const mongoOut    = MongoDBExporter.export(dbSchema) as { $jsonSchema?: { bsonType?: string } }

console.log('export-limitations.fullSchema.type     =', typeof fullSchema)          // 'object'
console.log('export-limitations.fullSchema.valid    =',
  validate(fullSchema, { username: 'alice_01', contactType: 'email', contact: 'alice@example.com' }).valid)
console.log('export-limitations.fullSchema.invalid  =',
  validate(fullSchema, { username: 'alice_01', contactType: 'email', contact: '13800138000' }).valid)
console.log('export-limitations.mysql.hasCreate     =', mysqlDdl.includes('CREATE TABLE'))   // true
console.log('export-limitations.postgres.hasCreate  =', postgresDdl.includes('CREATE TABLE'))  // true
console.log('export-limitations.mongo.rootBsonType  =', mongoOut.$jsonSchema?.bsonType)        // 'object'
expect('application schema keeps conditional validation',
  validate(fullSchema, { username: 'alice_01', contactType: 'email', contact: '13800138000' }).valid === false)
expect('db schema can be exported to MySQL', mysqlDdl.includes('CREATE TABLE'))

// ============================================================
// 2. Regex patterns — dropped in SQL DDL, kept in MongoDB
// ============================================================

const patternSchema = s({
  slug: s('string:3-50!').pattern(/^[a-z0-9-]+$/).description('URL-safe slug'),
  code: s('string:6!').pattern(/^[A-Z0-9]{6}$/).description('6-char uppercase code'),
})

const mysqlPattern = MySQLExporter.export('items', patternSchema)
const mongoPattern = MongoDBExporter.export(patternSchema) as { $jsonSchema?: Record<string, unknown> }

// SQL exporters produce a VARCHAR column but DROP the regex
console.log('export-limitations.pattern.mysql.noRegex =',
  !mysqlPattern.includes('^[a-z0-9-]+$'))   // true — regex not in DDL
// MongoDB keeps the pattern via $jsonSchema
console.log('export-limitations.pattern.mongo.has    =',
  JSON.stringify(mongoPattern).includes('pattern'))  // true
expect('SQL DDL drops regex pattern', !mysqlPattern.includes('^[a-z0-9-]+$'))
expect('MongoDB exporter keeps regex pattern', JSON.stringify(mongoPattern).includes('pattern'))

// ============================================================
// 3. Array item types — simplified in SQL, kept in MongoDB
// ============================================================

const arraySchema = s({
  tags: s('array<slug>!').description('URL slugs'),
  nums: s('array<integer:1-100>').description('Scores'),
})

const mysqlArray = MySQLExporter.export('posts', arraySchema)
const mongoArray = MongoDBExporter.export(arraySchema)

// SQL DDL can't express array item constraints natively
console.log('export-limitations.array.mysql.noItems  =',
  !mysqlArray.includes('integer'))   // true — item type not in DDL
console.log('export-limitations.array.mongo.is       =', typeof mongoArray)  // 'object'
expect('SQL array export cannot preserve item integer keyword', !mysqlArray.includes('integer'))

// ============================================================
// 4. Enum types — VARCHAR in SQL, enum in MongoDB
// ============================================================

const enumSchema = s({
  role:   'admin|user|guest',
  status: 'active|inactive|banned',
})

const mysqlEnum  = MySQLExporter.export('accounts', enumSchema)
const mongoEnum  = MongoDBExporter.export(enumSchema)

// MySQL uses ENUM() or VARCHAR
console.log('export-limitations.enum.mysql.role      =',
  mysqlEnum.toLowerCase().includes('role'))   // true
console.log('export-limitations.enum.mongo.is        =', typeof mongoEnum)  // 'object'

// ============================================================
// 5. anyOf / oneOf — safe only when all branches map to the same SQL type
// ============================================================

const sameSqlTypeSchema = {
  type: 'object',
  properties: {
    externalId: {
      anyOf: [
        { type: 'string', maxLength: 64 },
        { type: 'string', maxLength: 64 },
      ],
    },
  },
  required: ['externalId'],
}

const mixedSqlTypeSchema = {
  type: 'object',
  properties: {
    value: {
      anyOf: [
        { type: 'string', maxLength: 64 },
        { type: 'number' },
      ],
    },
  },
  required: ['value'],
}

const sameTypeDdl = MySQLExporter.export('external_accounts', sameSqlTypeSchema as any)
let mixedTypeError = ''
try {
  MySQLExporter.export('mixed_values', mixedSqlTypeSchema as any)
} catch (err) {
  mixedTypeError = err instanceof Error ? err.message : String(err)
}

console.log('export-limitations.anyOf.sameType =', sameTypeDdl.includes('VARCHAR(64)'))
console.log('export-limitations.anyOf.mixedError =', mixedTypeError)
expect('same-type anyOf can export', sameTypeDdl.includes('VARCHAR(64)'))
expect('mixed-type anyOf throws instead of guessing', mixedTypeError.includes('cannot safely map anyOf'))

// ============================================================
// 6. Custom validators — keep application validation as source of truth
// ============================================================

const scoreSchema = s({
  score: s('integer:0-100!').custom((value: unknown) =>
    Number(value) % 2 === 0 || 'Score must be an even number'),
})

const scoreAppInvalid = validate(scoreSchema, { score: 41 })
const scoreDdl = MySQLExporter.export('scores', scoreSchema)

console.log('export-limitations.custom.appInvalid =', scoreAppInvalid.valid)
console.log('export-limitations.custom.sqlNoFn =', !scoreDdl.includes('_customValidators'))
expect('application schema runs custom validator', scoreAppInvalid.valid === false)
expect('SQL export cannot include JavaScript custom validators', !scoreDdl.includes('_customValidators'))

// ============================================================
// 7. Nested objects — SQL stores JSON/JSONB and loses inner constraints
// ============================================================

const nestedProfileSchema = {
  type: 'object',
  properties: {
    profile: {
      type: 'object',
      properties: {
        nickname: { type: 'string', minLength: 3 },
      },
      required: ['nickname'],
    },
  },
  required: ['profile'],
}

const nestedMysql = MySQLExporter.export('profiles', nestedProfileSchema as any)
const nestedPostgres = PostgreSQLExporter.export('profiles', nestedProfileSchema as any)
const nestedMongo = MongoDBExporter.export(nestedProfileSchema as any)

console.log('export-limitations.nested.mysqlJson =', nestedMysql.includes('JSON'))
console.log('export-limitations.nested.pgJsonb =', nestedPostgres.includes('JSONB'))
console.log('export-limitations.nested.mongoInner =', JSON.stringify(nestedMongo).includes('minLength'))
expect('MySQL stores nested object as JSON', nestedMysql.includes('JSON'))
expect('PostgreSQL stores nested object as JSONB', nestedPostgres.includes('JSONB'))
expect('MongoDB keeps nested minLength', JSON.stringify(nestedMongo).includes('minLength'))

// ============================================================
// 8. Exporter summary: what each exporter supports
// ============================================================
//
// Feature                | MySQL  | PostgreSQL | MongoDB | Markdown
// -----------------------|--------|------------|---------|--------
// required fields        | YES    | YES        | YES     | YES
// string min/max         | YES    | YES        | YES     | YES
// enum values            | YES    | YES        | YES     | YES
// regex pattern          | NO     | NO         | YES     | YES
// conditional (if/match) | NO     | NO         | NO      | YES
// array item types       | NO     | NO         | YES     | YES
// number min/max         | CHECK  | CHECK      | YES     | YES
// custom formats         | NO     | NO         | PARTIAL | YES
// custom validators      | NO     | NO         | NO      | YES (as documentation text only)

console.log('export-limitations.summary.done = true')
