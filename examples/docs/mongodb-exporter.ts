import { s, MongoDBExporter } from '../../dist/pure.js'

// ============================================================
// 1. Basic export: dsl schema → MongoDB $jsonSchema validator
// ============================================================

const userSchema = s({
  _id:       'objectId!',
  username:  s('string:3-32!').description('Login name — unique across all accounts'),
  email:     s('email!').description('Primary email address'),
  age:       'integer:0-150',
  score:     'number:0-100',
  isActive:  'boolean',
  tags:      'array<string>',
  metadata:  'object',
  createdAt: 'datetime!',
  updatedAt: 'datetime',
})

const rawSchema = MongoDBExporter.export(userSchema) as {
  $jsonSchema: {
    bsonType: string
    properties: Record<string, { bsonType?: string; description?: string }>
    required?: string[]
  }
}

console.log('mongodb-exporter.rootType         =', rawSchema.$jsonSchema.bsonType)           // 'object'
console.log('mongodb-exporter.id.type          =', rawSchema.$jsonSchema.properties._id.bsonType)       // 'objectId'
console.log('mongodb-exporter.username.type    =', rawSchema.$jsonSchema.properties.username.bsonType)  // 'string'
console.log('mongodb-exporter.email.type       =', rawSchema.$jsonSchema.properties.email.bsonType)     // 'string'
console.log('mongodb-exporter.age.type         =', rawSchema.$jsonSchema.properties.age.bsonType)       // 'int'
console.log('mongodb-exporter.score.type       =', rawSchema.$jsonSchema.properties.score.bsonType)     // 'double'
console.log('mongodb-exporter.isActive.type    =', rawSchema.$jsonSchema.properties.isActive.bsonType)  // 'bool'
console.log('mongodb-exporter.tags.type        =', rawSchema.$jsonSchema.properties.tags.bsonType)      // 'array'
console.log('mongodb-exporter.metadata.type    =', rawSchema.$jsonSchema.properties.metadata.bsonType)  // 'object'
console.log('mongodb-exporter.required.has     =', rawSchema.$jsonSchema.required?.includes('username')) // true

// ============================================================
// 2. generateCreateCommand — db.createCollection with validation
// ============================================================

const exporter = new MongoDBExporter({ strict: true })

const createCmd = exporter.generateCreateCommand('users', userSchema)
console.log('mongodb-exporter.cmd.create          =', createCmd.collectionName)              // 'users'
console.log('mongodb-exporter.cmd.validationLevel =', createCmd.options.validationLevel)     // 'strict'
console.log('mongodb-exporter.cmd.hasValidator    =', Boolean(createCmd.options.validator))  // true

// ============================================================
// 3. generateCommand — runnable JavaScript string for mongo shell
// ============================================================

const shellCommand = exporter.generateCommand('users', userSchema)
console.log('mongodb-exporter.shell.hasCreateColl =', shellCommand.includes('db.createCollection')) // true
console.log('mongodb-exporter.shell.hasUsers      =', shellCommand.includes('users'))               // true
console.log('mongodb-exporter.shell.hasJsonSchema =', shellCommand.includes('$jsonSchema'))         // true

// ============================================================
// 4. Embedded document / nested object schema
// ============================================================

const orderSchema = s({
  _id:       'objectId!',
  userId:    'objectId!',
  status:    'pending|processing|shipped|delivered|cancelled!',
  items: s({
    productId: 'objectId!',
    name:      'string:1-200!',
    qty:       'integer:1-!',
    price:     'number:0.01-!',
  }),
  address: {
    street: 'string!',
    city:   'string!',
    zip:    'string:3-10!',
    country: 'string:2-3!',
  },
  total:     'number:0.01-!',
  createdAt: 'datetime!',
})

const orderRaw = MongoDBExporter.export(orderSchema) as {
  $jsonSchema: {
    bsonType: string
    required?: string[]
    properties: Record<string, {
      bsonType?: string
      properties?: Record<string, { bsonType?: string }>
    }>
  }
}

console.log('mongodb-exporter.nested.rootType          =', orderRaw.$jsonSchema.bsonType)  // 'object'
console.log('mongodb-exporter.nested.address.type      =',
  orderRaw.$jsonSchema.properties.address?.bsonType)                                        // 'object'
console.log('mongodb-exporter.nested.required.userId   =',
  orderRaw.$jsonSchema.required?.includes('userId'))                                        // true

// ============================================================
// 5. lenient validation mode
// ============================================================

const lenientExporter = new MongoDBExporter({ strict: false })
const lenientCmd = lenientExporter.generateCreateCommand('orders', orderSchema) as {
  options: { validationLevel: string }
}
console.log('mongodb-exporter.lenient.level =', lenientCmd.options.validationLevel)  // 'moderate'