/**
 * SchemaIO v2.0.1 新功能完整示例
 *
 * 展示所有新增的10个功能
 */

const { dsl, validate, SchemaUtils, DslBuilder } = require('../index');

console.log('========== SchemaIO v2.0.1 新功能示例 ==========\n');

// ========== 1. 数组元素验证增强 ==========
console.log('✨ 1. 数组元素验证增强');

const tagsSchema = dsl({
  // ✨ 新特性：array链式调用
  tags: dsl('array!')
    .items('string:1-20'.pattern(/^[a-z]+$/))
    .min(1)
    .max(10)
    .label('标签列表')
});

console.log('验证标签:', validate(tagsSchema, { tags: ['javascript', 'nodejs'] }).valid);
console.log('');

// ========== 2. when条件验证简化 ==========
console.log('✨ 2. when条件验证简化');

const contactSchema = dsl({
  contactType: 'email|phone',

  // ✨ 新特性：多值映射
  contact: dsl('string').when('contactType', {
    email: 'email!',
    phone: 'string:11!',
    default: 'string'
  }).label('联系方式')
});

console.log('验证邮箱联系:', validate(contactSchema, {
  contactType: 'email',
  contact: 'test@example.com'
}).valid);
console.log('');

// ========== 3. 自定义验证器错误辅助 ==========
console.log('✨ 3. 自定义验证器错误辅助');

const usernameSchema = dsl({
  username: dsl('string:3-32!')
    .custom(async (value, { fail, pass }) => {
      // ✨ 新特性：fail/pass辅助方法
      const existingUsers = ['admin', 'root'];
      if (existingUsers.includes(value)) {
        return fail('用户名已被占用');
      }
      return pass();
    })
    .label('用户名')
});

usernameSchema.validate({ username: 'john' }).then(result => {
  console.log('验证用户名:', result.valid);
  console.log('');

  // ========== 4. 常用验证快捷方法 ==========
  console.log('✨ 4. 常用验证快捷方法');

  const userSchema = dsl({
    // ✨ 新特性：phoneNumber快捷方法
    phone: dsl('string:11!').phoneNumber('cn').label('手机号'),

    // ✨ 新特性：idCard快捷方法
    idCard: dsl('string:18').idCard('cn').label('身份证'),

    // ✨ 新特性：username快捷方法
    username: dsl('string:3-32!').username().label('用户名'),

    // ✨ 新特性：slug快捷方法
    slug: dsl('string').slug().label('URL别名')
  });

  console.log('手机号验证:', validate(userSchema, {
    phone: '13800138000',
    username: 'john_doe',
    slug: 'my-article'
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
  const mergedSchema = SchemaUtils.merge(baseUser, withAge);

  console.log('合并后字段数:', Object.keys(mergedSchema.properties).length);
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

  const { Validator } = require('../index');
  const validator = new Validator();

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
✨ SchemaIO v2.0.1 新增11个强大功能：

1. ✅ 数组元素验证 - .items()链式调用
2. ✅ when条件简化 - 多值映射
3. ✅ 验证器辅助 - fail/pass方法
4. ✅ 快捷验证 - phoneNumber/idCard/username等
5. ✅ Schema复用 - reusable()方法
6. ✅ Schema合并 - merge()方法
7. ✅ Schema筛选 - pick/omit方法
8. ✅ 性能监控 - withPerformance()
9. ✅ 批量验证 - validateBatch()优化
10. ✅ 文档导出 - toMarkdown/toHTML
11. ✅ 嵌套检查 - validateNestingDepth()

🎉 SchemaIO v2.0.1 - 功能更强大，使用更简单！
  `);
});

