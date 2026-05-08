import { dsl, MySQLExporter } from '../../dist/index.js'

const userSchema = dsl({
  id: dsl('uuid!').description('用户 ID'),
  username: dsl('string:3-32!').description('用户登录名'),
  email: dsl('email!').description('用户邮箱'),
  password: 'string:8-64!',
  age: 'number:0-150',
  status: 'active|inactive|banned',
  createdAt: 'datetime!',
})

const exporter = new MySQLExporter()
const ddl = exporter.export('users', userSchema)
const emailIndex = exporter.generateIndex('users', 'email', { unique: true })
const statusIndex = exporter.generateIndex('users', 'status')

console.log('mysql-exporter.ddlHasCreateTable =', ddl.includes('CREATE TABLE'))
console.log('mysql-exporter.ddlHasPrimaryKey =', ddl.includes('PRIMARY KEY'))
console.log('mysql-exporter.emailIndexUnique =', emailIndex.includes('UNIQUE'))
console.log('mysql-exporter.statusIndexHasIndex =', statusIndex.includes('INDEX'))