/**
 * 跨类型联合验证示例
 *
 * 演示如何使用 types: 语法实现跨类型联合验证
 */

const { dsl, validate, DslBuilder, PluginManager } = require('../index');

console.log('='.repeat(60));
console.log('跨类型联合验证 - types: 语法示例');
console.log('='.repeat(60));

// ========== 示例1：基础联合类型 ==========
console.log('\n【示例1】基础联合类型：string|number');
const schema1 = dsl({
  value: 'types:string|number'
});

console.log('✓ 字符串:', validate(schema1, { value: 'hello' }).valid);
console.log('✓ 数字:', validate(schema1, { value: 123 }).valid);
console.log('✗ 布尔:', validate(schema1, { value: true }).valid);

// ========== 示例2：带约束的联合类型 ==========
console.log('\n【示例2】带约束：string:3-10|number:0-100');
const schema2 = dsl({
  value: 'types:string:3-10|number:0-100!'
});

console.log('✓ 字符串(abc):', validate(schema2, { value: 'abc' }).valid);
console.log('✓ 数字(50):', validate(schema2, { value: 50 }).valid);
console.log('✗ 字符串太短(ab):', validate(schema2, { value: 'ab' }).valid);
console.log('✗ 数字超范围(101):', validate(schema2, { value: 101 }).valid);

// ========== 示例3：使用插件自定义类型 ==========
console.log('\n【示例3】使用插件自定义类型');

// 加载custom-format插件
const customFormatPlugin = require('../plugins/custom-format');
const pluginManager = new PluginManager();
pluginManager.register(customFormatPlugin);
pluginManager.install(require('../index'));

const schema3 = dsl({
  contact: 'types:email|phone-cn|qq!'
});

console.log('✓ 邮箱:', validate(schema3, { contact: 'user@example.com' }).valid);
console.log('✓ 手机号:', validate(schema3, { contact: '13800138000' }).valid);
console.log('✓ QQ号:', validate(schema3, { contact: '10000' }).valid);
console.log('✗ 无效格式:', validate(schema3, { contact: 'invalid' }).valid);

// ========== 示例4：复杂场景 - 用户注册表单 ==========
console.log('\n【示例4】实际场景：用户注册表单');

const registerSchema = dsl({
  username: 'string:3-20!',
  password: 'string:8-20!',
  contact: 'types:email|phone-cn!',  // 邮箱或手机号
  age: 'types:integer:1-150|null',    // 年龄或null
  referralCode: 'types:string:6|null' // 推荐码（6位）或null
});

const testData = {
  username: 'john_doe',
  password: 'Pass1234',
  contact: 'john@example.com',
  age: 25,
  referralCode: 'ABC123'
};

const result = validate(registerSchema, testData);
console.log('✓ 完整表单验证:', result.valid);

console.log('\n' + '='.repeat(60));
console.log('示例执行完成！');
console.log('='.repeat(60));

