import { dsl, PostgreSQLExporter } from '../../dist/index.js'

// ============================================================
// 1. Basic export: dsl schema → PostgreSQL CREATE TABLE DDL
// ============================================================

const userSchema = dsl({
  id:        dsl('uuid!').description('Primary key — UUID v4'),
  username:  dsl('string:3-32!').description('Login name'),
  email:     dsl('email!').description('Primary email address'),
  password:  'string:8-64!',
  age:       'integer:0-150',
  score:     'number:0-100',
  isActive:  'boolean',
  bio:       'string:5000',
  tags:      'array<string>',
  metadata:  'object',
  status:    'active|inactive|banned',
  createdAt: 'datetime!',
  updatedAt: 'datetime',
})

// With schema prefix and quoted identifiers
const exporter = new PostgreSQLExporter({ schema: 'app', quoteIdentifiers: true })
const ddl = exporter.export('users', userSchema)

console.log('postgresql-exporter.ddl.hasCreateTable =', ddl.includes('CREATE TABLE'))     // true
console.log('postgresql-exporter.ddl.hasSchema      =', ddl.includes('app'))              // true — schema prefix
console.log('postgresql-exporter.ddl.uuid.type      =', ddl.includes('UUID'))             // true — uuid → UUID
console.log('postgresql-exporter.ddl.email.type     =', ddl.toLowerCase().includes('varchar') || ddl.includes('TEXT')) // true
console.log('postgresql-exporter.ddl.age.type       =', ddl.includes('INTEGER'))          // true — integer → INTEGER
console.log('postgresql-exporter.ddl.score.type     =', ddl.includes('DOUBLE') || ddl.includes('FLOAT') || ddl.includes('NUMERIC')) // true
console.log('postgresql-exporter.ddl.isActive.type  =', ddl.includes('BOOLEAN'))          // true
console.log('postgresql-exporter.ddl.metadata.type  =', ddl.includes('JSONB') || ddl.includes('JSON')) // true — object → JSONB
console.log('postgresql-exporter.ddl.createdAt.type =', ddl.includes('TIMESTAMP'))        // true

// ============================================================
// 2. Enum constraint — status field generates a CHECK constraint
// ============================================================

console.log('postgresql-exporter.ddl.hasCheck       =', ddl.includes('CHECK'))            // true — enum → CHECK

// ============================================================
// 3. generateIndex — B-TREE, GIN, GiST, Hash
// ============================================================

// Standard B-TREE index (default)
const emailIndex    = exporter.generateIndex('users', 'email',    { unique: true })
const statusIndex   = exporter.generateIndex('users', 'status')

// GIN index — ideal for JSONB / full-text search
const metadataIndex = exporter.generateIndex('users', 'metadata', { method: 'gin' })
const tagsIndex     = exporter.generateIndex('users', 'tags',     { method: 'gin' })

console.log('postgresql-exporter.index.email.unique  =', emailIndex.includes('UNIQUE'))        // true
console.log('postgresql-exporter.index.status.btree  =', !statusIndex.includes('USING gin'))   // default is B-TREE
console.log('postgresql-exporter.index.metadata.gin  =', metadataIndex.includes('USING gin'))  // true
console.log('postgresql-exporter.index.tags.gin      =', tagsIndex.includes('USING gin'))      // true

// ============================================================
// 4. Product schema with JSONB, arrays, and full type mapping
// ============================================================

const productSchema = dsl({
  id:          'uuid!',
  sku:         'alphanum:5-20!',
  name:        'string:2-200!',
  description: 'string:10000',
  price:       'number:0.01-!',
  stock:       'integer:0-!',
  attributes:  'object',         // → JSONB
  imageUrls:   'array<string>',  // → JSONB or TEXT[]
  category:    'electronics|apparel|home|books|sports',
  isPublished: 'boolean',
  publishedAt: 'datetime',
})

const productDdl = exporter.export('products', productSchema)
console.log('postgresql-exporter.product.hasCreate   =', productDdl.includes('CREATE TABLE'))   // true
console.log('postgresql-exporter.product.hasJsonb    =', productDdl.includes('JSONB') || productDdl.includes('JSON')) // true
console.log('postgresql-exporter.product.hasCheck    =', productDdl.includes('CHECK'))          // true — category enum

// ============================================================
// 5. Unquoted identifiers and no schema prefix
// ============================================================

const plainExporter = new PostgreSQLExporter()
const plainDdl = plainExporter.export('orders', dsl({
  id:       'uuid!',
  userId:   'uuid!',
  total:    'number:0.01-!',
  placedAt: 'datetime!',
}))
console.log('postgresql-exporter.plain.noSchema =', !plainDdl.includes('app.'))   // true — no prefix
console.log('postgresql-exporter.plain.hasTable =', plainDdl.includes('CREATE TABLE'))  // true

// ============================================================
// 6. COMMENT ON — descriptions carried into DDL
// ============================================================

const commentedDdl = exporter.export('users', dsl({
  id:    dsl('uuid!').description('Unique user identifier — UUID v4'),
  email: dsl('email!').description('Primary email used for login'),
}))
console.log('postgresql-exporter.comment.hasComment =', commentedDdl.includes('COMMENT'))  // true