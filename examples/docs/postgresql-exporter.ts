import { dsl, PostgreSQLExporter } from '../../dist/index.js'

const userSchema = dsl({
  id: dsl('uuid!').description('用户 ID'),
  username: dsl('string:3-32!').description('用户登录名'),
  email: dsl('email!').description('用户邮箱'),
  status: 'active|inactive|banned',
  metadata: 'object',
  age: 'number:18-120',
})

const exporter = new PostgreSQLExporter({ schema: 'app', quoteIdentifiers: true })
const ddl = exporter.export('users', userSchema)
const ginIndex = exporter.generateIndex('users', 'metadata', { method: 'gin' })

console.log('postgresql-exporter.ddlHasCreateTable =', ddl.includes('CREATE TABLE'))
console.log('postgresql-exporter.ddlHasSchema =', ddl.includes('app'))
console.log('postgresql-exporter.ddlHasCheck =', ddl.includes('CHECK'))
console.log('postgresql-exporter.ginIndex =', ginIndex.includes('USING gin'))