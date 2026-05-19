import { dsl, MySQLExporter } from '../../dist/index.js'

// ============================================================
// 1. Basic export: dsl schema → MySQL CREATE TABLE DDL
// ============================================================

const userSchema = dsl({
  id:        dsl('uuid!').description('Primary key — UUID v4'),
  username:  dsl('string:3-32!').description('Login name'),
  email:     dsl('email!').description('Primary email address'),
  password:  'string:8-64!',
  age:       'integer:0-150',
  score:     'number:0-100',
  isActive:  'boolean',
  bio:       'string:500',
  homepage:  'url',
  status:    'active|inactive|banned',
  createdAt: 'datetime!',
  updatedAt: 'datetime',
})

const exporter = new MySQLExporter()
const ddl = exporter.export('users', userSchema)

console.log('mysql-exporter.ddl.hasCreateTable  =', ddl.includes('CREATE TABLE'))       // true
console.log('mysql-exporter.ddl.hasTableName    =', ddl.includes('`users`'))            // true
console.log('mysql-exporter.ddl.hasPrimaryKey   =', ddl.includes('PRIMARY KEY'))        // true
console.log('mysql-exporter.ddl.uuid.type       =', ddl.includes('VARCHAR(36)'))        // true — uuid → VARCHAR(36)
console.log('mysql-exporter.ddl.email.type      =', ddl.includes('VARCHAR'))            // true
console.log('mysql-exporter.ddl.age.type        =', ddl.includes('INT'))                // true — integer → INT
console.log('mysql-exporter.ddl.score.type      =', ddl.includes('DOUBLE'))             // true — number → DOUBLE
console.log('mysql-exporter.ddl.isActive.type   =', ddl.includes('TINYINT'))            // true — boolean → TINYINT(1)
console.log('mysql-exporter.ddl.createdAt.type  =', ddl.includes('DATETIME'))           // true

// ============================================================
// 2. generateIndex — UNIQUE and non-unique indexes
// ============================================================

const emailIndex  = exporter.generateIndex('users', 'email',  { unique: true })
const statusIndex = exporter.generateIndex('users', 'status')
const ageIndex    = exporter.generateIndex('users', 'age')

console.log('mysql-exporter.index.email.unique  =', emailIndex.includes('UNIQUE INDEX'))  // true
console.log('mysql-exporter.index.status.type   =', statusIndex.includes('INDEX'))         // true
console.log('mysql-exporter.index.age.notUnique =', !ageIndex.includes('UNIQUE'))          // true

// ============================================================
// 3. Product catalog schema with more MySQL-specific type mappings
// ============================================================

const productSchema = dsl({
  id:          'uuid!',
  sku:         'alphanum:5-20!',
  name:        'string:2-200!',
  description: 'string:2000',
  price:       'number:0.01-!',
  stock:       'integer:0-!',
  weight:      'number:0-',
  dimensions:  'object',
  tags:        'array<string>',
  isPublished: 'boolean',
  publishedAt: 'datetime',
})

const productDdl = exporter.export('products', productSchema)
console.log('mysql-exporter.product.hasCreate    =', productDdl.includes('CREATE TABLE'))  // true
console.log('mysql-exporter.product.hasPrice     =', productDdl.includes('DOUBLE'))        // true — number → DOUBLE
console.log('mysql-exporter.product.hasMediumText =', productDdl.toLowerCase().includes('text')) // true — long string

// ============================================================
// 4. Comments in DDL — description fields → COMMENT
// ============================================================

const commentedDdl = exporter.export('users', dsl({
  id:    dsl('uuid!').description('Unique user identifier'),
  email: dsl('email!').description('Primary email — must be unique'),
}))
console.log('mysql-exporter.comment.hasComment   =', commentedDdl.includes('COMMENT'))  // true

// ============================================================
// 5. Composite indexes
// ============================================================

const compositeIndex = exporter.generateIndex('users', 'status,createdAt')
console.log('mysql-exporter.composite.hasIndex   =', compositeIndex.includes('INDEX'))  // true
console.log('mysql-exporter.composite.hasStatus  =', compositeIndex.includes('status')) // true