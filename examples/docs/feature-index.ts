import {
  dsl,
  validate,
  installStringExtensions,
  MarkdownExporter,
  MongoDBExporter,
  MySQLExporter,
  PostgreSQLExporter,
} from '../../dist/index.js'

installStringExtensions()

const featureSchema = dsl({
  username: ('string:3-32!' as any).label('用户名'),
  email: ('email!' as any).label('邮箱地址'),
  role: 'admin|user|guest',
  score: 'number:>=0',
})

const validationResult = validate(featureSchema, {
  username: 'feature_user',
  email: 'feature@example.com',
  role: 'admin',
  score: 88,
})

const markdown = MarkdownExporter.export(featureSchema, { title: 'Feature Index Demo' })
const mongo = MongoDBExporter.export(featureSchema)
const mysql = MySQLExporter.export('feature_users', featureSchema)
const postgres = PostgreSQLExporter.export('feature_users', featureSchema)
const mongoSchema = mongo as { $jsonSchema?: { bsonType?: string } }

console.log('feature-index.validate.valid =', validationResult.valid)
console.log('feature-index.markdown.containsTitle =', markdown.includes('Feature Index Demo'))
console.log('feature-index.mongo.hasJsonSchema =', Boolean(mongoSchema.$jsonSchema))
console.log('feature-index.mongo.rootType =', mongoSchema.$jsonSchema?.bsonType)
console.log('feature-index.mysql.containsCreateTable =', mysql.includes('CREATE TABLE'))
console.log('feature-index.postgres.containsCreateTable =', postgres.includes('CREATE TABLE'))