import { dsl, MongoDBExporter, MySQLExporter, PostgreSQLExporter } from '../../dist/index.js'

const userSchema = dsl({
  id: 'uuid!',
  username: dsl('string:3-32!').description('用户名'),
  email: dsl('email!').description('邮箱'),
  status: 'active|inactive|banned',
  createdAt: 'datetime!',
})

const productSchema = dsl({
  id: 'uuid!',
  name: dsl('string:3-200!').description('商品名称'),
  price: dsl('number:0-').description('价格'),
  stock: 'integer:0-',
  active: 'boolean',
})

const schemas = {
  users: userSchema,
  products: productSchema,
}

const mysqlExporter = new MySQLExporter()
const pgExporter = new PostgreSQLExporter({ schema: 'ecommerce' })
const mongoExporter = new MongoDBExporter({ strict: true })

const mysqlDdl = Object.entries(schemas).map(([name, schema]) => mysqlExporter.export(name, schema))
const pgDdl = Object.entries(schemas).map(([name, schema]) => pgExporter.export(name, schema))
const mongoCommand = mongoExporter.generateCommand('users', userSchema)

console.log('export-guide.mysql.count =', mysqlDdl.length)
console.log('export-guide.mysql.firstHasCreateTable =', mysqlDdl[0].includes('CREATE TABLE'))
console.log('export-guide.postgres.count =', pgDdl.length)
console.log('export-guide.postgres.firstHasCreateTable =', pgDdl[0].includes('CREATE TABLE'))
console.log('export-guide.mongo.commandHasCreateCollection =', mongoCommand.includes('db.createCollection'))