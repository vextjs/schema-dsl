import { dsl, MongoDBExporter } from '../../dist/index.js'

const userSchema = dsl({
  _id: 'string!',
  username: dsl('string:3-32!').description('用户名'),
  email: dsl('email!').description('邮箱'),
  profile: {
    bio: 'string:500',
    avatar: 'url',
  },
  status: 'active|inactive|banned',
  createdAt: 'datetime!',
})

const exporter = new MongoDBExporter({ strict: true })
const mongoSchema = MongoDBExporter.export(userSchema) as {
  $jsonSchema?: {
    bsonType?: string
    properties?: Record<string, { bsonType?: string }>
  }
}
const createCommand = exporter.generateCreateCommand('users', userSchema) as {
  options?: { validationLevel?: string; validator?: unknown }
}
const commandText = exporter.generateCommand('users', userSchema)

console.log('mongodb-exporter.rootType =', mongoSchema.$jsonSchema?.bsonType)
console.log('mongodb-exporter.usernameType =', mongoSchema.$jsonSchema?.properties?.username?.bsonType)
console.log('mongodb-exporter.validationLevel =', createCommand.options?.validationLevel)
console.log('mongodb-exporter.hasValidator =', Boolean(createCommand.options?.validator))
console.log('mongodb-exporter.commandHasCreateCollection =', commandText.includes('db.createCollection'))