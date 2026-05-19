import { dsl, MongoDBExporter, MySQLExporter, PostgreSQLExporter } from '../../dist/index.js'

// ============================================================
// Export limitations guide
//
// Not everything in a DSL schema can be mapped 1-to-1 to a DB
// column definition or MongoDB validator. This file documents
// what each exporter supports, and what gets simplified or dropped.
// ============================================================

// ============================================================
// 1. Conditional schemas (dsl.match / dsl.if) → dropped by SQL exporters
// ============================================================

// This schema uses runtime-conditional logic based on contactType.
// It validates perfectly, but SQL exporters cannot express if/then.
const fullSchema = dsl({
  username:     dsl('string:3-32!').description('Login handle'),
  contactType:  'email|phone',
  contact:      dsl.match('contactType', {
    email: 'email!',
    phone: 'phone:cn!',
  }),
})

// For DB export, use a simplified version without conditions
const dbSchema = dsl({
  username:     dsl('string:3-32!').description('Login handle'),
  contactType:  'email|phone',
  contact:      dsl('string!').description('Email or phone number'),
})

const mysqlDdl    = MySQLExporter.export('users', dbSchema)
const postgresDdl = PostgreSQLExporter.export('users', dbSchema)
const mongoOut    = MongoDBExporter.export(dbSchema) as { $jsonSchema?: { bsonType?: string } }

console.log('export-limitations.fullSchema.type     =', typeof fullSchema)          // 'object'
console.log('export-limitations.mysql.hasCreate     =', mysqlDdl.includes('CREATE TABLE'))   // true
console.log('export-limitations.postgres.hasCreate  =', postgresDdl.includes('CREATE TABLE'))  // true
console.log('export-limitations.mongo.rootBsonType  =', mongoOut.$jsonSchema?.bsonType)        // 'object'

// ============================================================
// 2. Regex patterns — dropped in SQL DDL, kept in MongoDB
// ============================================================

const patternSchema = dsl({
  slug: dsl('string:3-50!').pattern(/^[a-z0-9-]+$/).description('URL-safe slug'),
  code: dsl('string:6!').pattern(/^[A-Z0-9]{6}$/).description('6-char uppercase code'),
})

const mysqlPattern = MySQLExporter.export('items', patternSchema)
const mongoPattern = MongoDBExporter.export(patternSchema) as { $jsonSchema?: Record<string, unknown> }

// SQL exporters produce a VARCHAR column but DROP the regex
console.log('export-limitations.pattern.mysql.noRegex =',
  !mysqlPattern.includes('^[a-z0-9-]+$'))   // true — regex not in DDL
// MongoDB keeps the pattern via $jsonSchema
console.log('export-limitations.pattern.mongo.has    =',
  JSON.stringify(mongoPattern).includes('pattern'))  // true

// ============================================================
// 3. Array item types — simplified in SQL, kept in MongoDB
// ============================================================

const arraySchema = dsl({
  tags: dsl('array<slug>!').description('URL slugs'),
  nums: dsl('array<integer:1-100>').description('Scores'),
})

const mysqlArray = MySQLExporter.export('posts', arraySchema)
const mongoArray = MongoDBExporter.export(arraySchema)

// SQL DDL can't express array item constraints natively
console.log('export-limitations.array.mysql.noItems  =',
  !mysqlArray.includes('integer'))   // true — item type not in DDL
console.log('export-limitations.array.mongo.is       =', typeof mongoArray)  // 'object'

// ============================================================
// 4. Enum types — VARCHAR in SQL, enum in MongoDB
// ============================================================

const enumSchema = dsl({
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
// 5. Exporter summary: what each exporter supports
// ============================================================
//
// Feature                | MySQL  | PostgreSQL | MongoDB | Markdown
// -----------------------|--------|------------|---------|--------
// required fields        | YES    | YES        | YES     | YES
// string min/max         | YES    | YES        | YES     | YES
// enum values            | YES    | YES        | YES     | YES
// regex pattern          | NO     | NO         | YES     | YES
// conditional (if/match) | NO     | NO         | YES     | YES
// array item types       | NO     | NO         | YES     | YES
// number min/max         | CHECK  | CHECK      | YES     | YES
// custom formats         | NO     | NO         | PARTIAL | YES

console.log('export-limitations.summary.done = true')