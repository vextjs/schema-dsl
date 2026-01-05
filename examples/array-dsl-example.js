/**
 * SchemaIO v2.0.1 新功能完整示例
 *
 * 展示v2.0.1版本的核心功能
 */

const { dsl, validate, SchemaUtils, DslBuilder, Validator } = require('../index');

console.log('========== SchemaIO v2.0.1 新功能示例 ==========\n');

// ========== 1. DSL数组语法 ==========
console.log('✨ 1. DSL数组语法');

const tagsSchema = dsl({
  // 使用DSL数组语法：array:min-max<itemType>
  tags: 'array:1-10<string:1-20>!'
});

console.log('验证标签:', validate(tagsSchema, { tags: ['javascript', 'nodejs'] }).valid);
console.log('空标签验证:', validate(tagsSchema, { tags: [] }).valid); // false
console.log('');

// ========== 2. when条件验证 ==========
console.log('✨ 2. when条件验证');

const contactSchema = dsl({
  contactType: 'email|phone',
  // 使用 dsl.match 条件验证
  contact: dsl.match('contactType', {
    email: 'email!',
    phone: 'string:11!'
  })
});

console.log('match条件Schema已创建');
console.log('');

// ========== 3. 自定义验证器 ==========
console.log('✨ 3. 自定义验证器');

const customSchema = dsl({
  username: dsl('string:3-32!')
    .custom((value) => {
      // 返回错误消息字符串表示失败
      const forbidden = ['admin', 'root'];
      if (forbidden.includes(value)) {
        return '该用户名已被保留';
      }
      // 不返回任何值表示通过
    })
    .label('用户名')
});

console.log('自定义验证器Schema已创建');
console.log('');

// ========== 4. 默认验证器快捷方法 ==========
console.log('✨ 4. 默认验证器快捷方法');

const userSchema = dsl({
  // ✨ username验证器：自动设置正则和长度
  username: dsl('string!').username().label('用户名'),

  // ✨ password验证器：根据强度设置验证
  password: dsl('string!').password('medium').label('密码'),

  // ✨ phone验证器：根据国家设置正则
  phone: dsl('string!').phone('cn').label('手机号')
});

console.log('验证用户:', validate(userSchema, {
  username: 'john_doe',
  password: 'Test1234',
  phone: '13800138000'
}).valid);
console.log('');

// ========== 5. Schema复用 ==========
console.log('✨ 5. Schema复用');

// ✨ 新特性：创建可复用片段
const emailField = SchemaUtils.reusable(() =>
  dsl('email!').label('邮箱地址')
);

const schema1 = dsl({ email: emailField() });
const schema2 = dsl({ contactEmail: emailField() });

console.log('Schema复用成功:', schema1.properties.email.format === 'email');
console.log('');

// ========== 6. Schema合并 ==========
console.log('✨ 6. Schema合并');

const baseUser = dsl({
  name: 'string!',
  email: 'email!'
});

const withAge = dsl({
  age: 'number:18-120'
});

// ✨ 新特性：merge方法
const extendedSchema = SchemaUtils.extend(baseUser, withAge);

console.log('合并后字段数:', Object.keys(extendedSchema.properties).length);
console.log('');

// ========== 7. Schema pick/omit ==========
console.log('✨ 7. Schema pick/omit');

const fullUser = dsl({
  name: 'string!',
  email: 'email!',
  password: 'string!',
  age: 'number'
});

// ✨ 新特性：pick方法
const publicUser = SchemaUtils.pick(fullUser, ['name', 'email']);

console.log('公开用户字段:', Object.keys(publicUser.properties));
console.log('');

// ========== 8. 性能监控 ==========
console.log('✨ 8. 性能监控');

// Validator 已在文件开头导入
const validator = new Validator(); // 高级用法：创建实例以增强功能

// ✨ 新特性：性能监控
const enhancedValidator = SchemaUtils.withPerformance(validator);

const perfResult = enhancedValidator.validate(
  dsl({ email: 'email!' }),
  { email: 'test@example.com' }
);

console.log('验证耗时:', perfResult.performance.duration, 'ms');
console.log('');

// ========== 9. 批量验证 ==========
console.log('✨ 9. 批量验证');

const users = [
  { email: 'user1@example.com' },
  { email: 'invalid' },
  { email: 'user3@example.com' }
];

// ✨ 新特性：批量验证优化
const batchResult = SchemaUtils.validateBatch(
  dsl({ email: 'email!' }),
  users,
  validator
);

console.log('批量验证总数:', batchResult.summary.total);
console.log('有效数量:', batchResult.summary.valid);
console.log('无效数量:', batchResult.summary.invalid);
console.log('平均耗时:', batchResult.summary.averageTime.toFixed(2), 'ms');
console.log('');

// ========== 10. Schema导出文档 ==========
console.log('✨ 10. Schema导出文档');

const docSchema = dsl({
  name: dsl('string:1-50!').label('姓名').description('用户真实姓名'),
  email: dsl('email!').label('邮箱').description('用于登录'),
  age: dsl('number:18-120').label('年龄')
});

// ✨ 新特性：导出Markdown
const markdown = SchemaUtils.toMarkdown(docSchema, { title: '用户Schema' });

console.log('Markdown文档生成:', markdown.length, '字符');
console.log('');
console.log('--- Markdown预览 ---');
console.log(markdown.substring(0, 300) + '...');
console.log('');

// ========== 11. 嵌套深度验证 ==========
console.log('✨ 11. 嵌套深度验证');

const deepSchema = dsl({
  level1: {
    level2: {
      level3: {
        level4: {
          value: 'string'
        }
      }
    }
  }
});

// ✨ 新特性：嵌套深度检查
const depthCheck = DslBuilder.validateNestingDepth(deepSchema, 3);

console.log('嵌套深度检查:', depthCheck.message);
console.log('实际深度:', depthCheck.depth);
console.log('是否超限:', !depthCheck.valid ? '⚠️ 是' : '✅ 否');
console.log('');

// ========== 总结 ==========
console.log('========== 功能总结 ==========');
console.log(`
✨ SchemaIO v2.0.1 核心功能：

1. ✅ DSL数组语法 - array:min-max<itemType>
2. ✅ when条件验证 - 条件字段验证
3. ✅ 自定义验证器 - .custom()链式调用
4. ✅ 默认验证器 - username/password/phone
5. ✅ Schema复用 - reusable()方法
6. ✅ Schema合并 - merge()方法
7. ✅ Schema筛选 - pick/omit方法
8. ✅ 性能监控 - withPerformance()
9. ✅ 批量验证 - validateBatch()优化
10. ✅ 文档导出 - toMarkdown/toHTML
11. ✅ 嵌套检查 - validateNestingDepth()

🎉 SchemaIO v2.0.1 - 功能强大，使用简单！
`);



