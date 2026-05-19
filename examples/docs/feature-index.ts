import {
  dsl,
  validate,
  MarkdownExporter,
  MongoDBExporter,
  MySQLExporter,
  PostgreSQLExporter,
} from '../../dist/index.js'

// ============================================================
// Feature index — all major features in one file
// ============================================================

// ============================================================
// 1. DSL string types + chaining
// ============================================================

const userSchema = dsl({
  username: dsl('string:3-32!').pattern(/^[a-zA-Z0-9_]+$/).label('Username'),
  email:    dsl('email!').label('Email Address'),
  role:     'admin|user|guest',
  score:    'number:>=0',
  tags:     'array:1-5<string:1-20>',
})

const validResult = validate(userSchema, {
  username: 'feature_user',
  email:    'feature@example.com',
  role:     'admin',
  score:    88,
  tags:     ['typescript', 'schema'],
})

console.log('feature-index.validate.valid             =', validResult.valid)  // true

// ============================================================
// 2. Validation errors — all fields at once
// ============================================================

const invalidResult = validate(userSchema, {
  username: 'bad user',
  email:    'not-an-email',
  role:     'owner',
  score:    -1,
})

console.log('feature-index.validate.invalid           =', invalidResult.valid)   // false
console.log('feature-index.validate.errorCount        =',
  (invalidResult.errors?.length ?? 0) >= 3)  // true

// ============================================================
// 3. Markdown export
// ============================================================

const markdown = MarkdownExporter.export(userSchema, { title: 'User API Schema' })

console.log('feature-index.markdown.containsTitle     =', markdown.includes('User API Schema'))  // true
console.log('feature-index.markdown.hasFields         =', markdown.includes('username'))          // true

// ============================================================
// 4. MongoDB export
// ============================================================

const mongo = MongoDBExporter.export(userSchema)
const mongoSchema = mongo as { $jsonSchema?: { bsonType?: string } }

console.log('feature-index.mongo.hasJsonSchema        =', Boolean(mongoSchema.$jsonSchema))      // true
console.log('feature-index.mongo.rootType             =', mongoSchema.$jsonSchema?.bsonType)     // 'object'

// ============================================================
// 5. MySQL export
// ============================================================

const mysql = MySQLExporter.export('feature_users', userSchema)

console.log('feature-index.mysql.containsCreateTable  =', mysql.includes('CREATE TABLE'))       // true
console.log('feature-index.mysql.containsTableName    =', mysql.includes('feature_users'))      // true

// ============================================================
// 6. PostgreSQL export
// ============================================================

const postgres = PostgreSQLExporter.export('feature_users', userSchema)

console.log('feature-index.postgres.containsCreate    =', postgres.includes('CREATE TABLE'))    // true

// ============================================================
// 7. Nested object schema
// ============================================================

const nestedSchema = dsl({
  user: {
    profile: {
      firstName: 'string:1-64!',
      lastName:  'string:1-64!',
    },
    contact: {
      email: 'email!',
      phone: 'phone:cn',
    },
  },
})

console.log('feature-index.nested.valid               =', validate(nestedSchema, {
  user: {
    profile:  { firstName: 'Rocky', lastName: 'Dev' },
    contact:  { email: 'rocky@example.com', phone: '13800138000' },
  },
}).valid)  // true