import { dsl, MongoDBExporter, MySQLExporter, PostgreSQLExporter } from '../../dist/index.js'

const fullSchema = dsl({
  username: dsl('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .description('用户登录名'),
  contactType: 'email|phone',
  contact: dsl.match('contactType', {
    email: 'email!',
    phone: 'phone:cn!',
  }),
})

const dbSchema = dsl({
  username: dsl('string:3-32!').description('用户登录名'),
  contactType: 'email|phone',
  contact: dsl('string!').description('邮箱或手机号（根据 contactType）'),
})

const mysqlDdl = MySQLExporter.export('users', dbSchema)
const postgresDdl = PostgreSQLExporter.export('users', dbSchema)
const mongoSchema = MongoDBExporter.export(dbSchema) as { $jsonSchema?: { bsonType?: string } }

console.log('export-limitations.fullSchemaType =', typeof fullSchema)
console.log('export-limitations.mysql.hasCreateTable =', mysqlDdl.includes('CREATE TABLE'))
console.log('export-limitations.postgres.hasCreateTable =', postgresDdl.includes('CREATE TABLE'))
console.log('export-limitations.mongo.rootType =', mongoSchema.$jsonSchema?.bsonType)