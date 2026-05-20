import { dsl, validate, MongoDBExporter, MySQLExporter, PostgreSQLExporter, MarkdownExporter } from '../../dist/index.js'

// ============================================================
// Export guide — generate DDL and docs from schemas
//
// Exporters:
//   MySQLExporter       — CREATE TABLE DDL for MySQL
//   PostgreSQLExporter  — CREATE TABLE DDL for PostgreSQL
//   MongoDBExporter     — db.createCollection() validator command
//   MarkdownExporter    — human-readable API documentation
// ============================================================

// ============================================================
// 1. Define a reusable domain schema
// ============================================================

const userSchema = dsl({
  id:          dsl('uuid!').description('Primary key (UUID v4)'),
  username:    dsl('string:3-32!').description('Unique login handle'),
  email:       dsl('email!').description('Login email address'),
  role:        dsl('admin|user|guest').description('Access role'),
  status:      dsl('active|suspended|deleted').description('Account status'),
  createdAt:   dsl('datetime!').description('ISO-8601 creation timestamp'),
  age:         dsl('integer:18-120').description('User age in years'),
})

// ============================================================
// 2. MySQL DDL
// ============================================================

const mysqlExporter = new MySQLExporter()
const mysqlDdl = mysqlExporter.export('users', userSchema)

console.log('export-guide.mysql.hasCreate     =', mysqlDdl.includes('CREATE TABLE'))   // true
console.log('export-guide.mysql.hasId         =', mysqlDdl.toLowerCase().includes('id'))  // true
console.log('export-guide.mysql.hasEmail      =', mysqlDdl.toLowerCase().includes('email'))  // true
console.log('export-guide.mysql.length        =', mysqlDdl.length > 100)                 // true

// ============================================================
// 3. PostgreSQL DDL
// ============================================================

const pgExporter = new PostgreSQLExporter({ schema: 'app' })
const pgDdl = pgExporter.export('users', userSchema)

console.log('export-guide.pg.hasCreate        =', pgDdl.includes('CREATE TABLE'))         // true
console.log('export-guide.pg.hasEmail         =', pgDdl.toLowerCase().includes('email'))  // true

// Multiple tables in one pass
const productSchema = dsl({
  id:       'uuid!',
  name:     dsl('string:2-200!').description('Product display name'),
  price:    dsl('number:0.01-!').description('Unit price'),
  stock:    dsl('integer:0-!').description('Current inventory'),
  active:   'boolean',
})

const pgTables = ['users', 'products'].map((tbl, i) =>
  pgExporter.export(tbl, [userSchema, productSchema][i]!),
)
console.log('export-guide.pg.tables.count     =', pgTables.length)   // 2
console.log('export-guide.pg.tables.allHaveCreate =',
  pgTables.every(t => t.includes('CREATE TABLE')))                    // true

// ============================================================
// 4. MongoDB validator command
// ============================================================

const mongoExporter = new MongoDBExporter({ strict: true })
const mongoCmd = mongoExporter.generateCommand('users', userSchema)

console.log('export-guide.mongo.hasCreate     =', mongoCmd.includes('db.createCollection'))  // true
console.log('export-guide.mongo.length        =', mongoCmd.length > 100)                      // true

// ============================================================
// 5. Markdown API docs
// ============================================================

const mdDoc = MarkdownExporter.export(userSchema as any, {
  title:  'User API Reference',
  locale: 'en-US',
})

console.log('export-guide.markdown.hasTitle   =', mdDoc.includes('User API Reference'))  // true
console.log('export-guide.markdown.hasEmail   =', mdDoc.toLowerCase().includes('email'))  // true
console.log('export-guide.markdown.isString   =', typeof mdDoc)  // 'string'

// Chinese docs (column headers will be in Chinese due to zh-CN locale)
const zhDoc = MarkdownExporter.export(userSchema as any, {
  title:  'User API Docs',
  locale: 'zh-CN',
})
console.log('export-guide.markdown.zh.title   =', zhDoc.includes('User API Docs'))  // true

// ============================================================
// 6. Still validates correctly — exporters are non-destructive
// ============================================================

const testResult = validate(userSchema, {
  id:        '123e4567-e89b-12d3-a456-426614174000',
  username:  'alice_99',
  email:     'alice@example.com',
  role:      'user',
  status:    'active',
  createdAt: '2024-01-15T12:00:00Z',
  age:       28,
})
console.log('export-guide.validate.stillOk    =', testResult.valid)  // true