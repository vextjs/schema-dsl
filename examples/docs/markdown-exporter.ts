import { dsl, MarkdownExporter } from '../../dist/index.js'

const userRegistrationSchema = dsl({
  username: dsl('string:3-32!').label('用户名'),
  email: dsl('email!').label('邮箱地址'),
  password: dsl('string:8-32!').label('密码'),
  realName: dsl('string:1-50').label('真实姓名'),
  age: dsl('integer:18-120').label('年龄'),
  acceptTerms: dsl('boolean!').label('同意条款'),
})

const zhDoc = MarkdownExporter.export(userRegistrationSchema, {
  title: '用户注册 API 文档',
  locale: 'zh-CN',
})

const enDoc = MarkdownExporter.export(userRegistrationSchema, {
  title: 'User Registration API Documentation',
  locale: 'en-US',
})

console.log('markdown-exporter.zhHasTitle =', zhDoc.includes('用户注册 API 文档'))
console.log('markdown-exporter.enHasTitle =', enDoc.includes('User Registration API Documentation'))
console.log('markdown-exporter.zhHasUsername =', zhDoc.toLowerCase().includes('username'))
console.log('markdown-exporter.enHasEmail =', enDoc.toLowerCase().includes('email'))