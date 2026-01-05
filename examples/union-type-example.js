/**
 * 联合类型验证示例
 *
 * 使用 .pattern() + .messages() 实现一个字段支持多种格式
 */

const { dsl, validate } = require('../index');

console.log('========================================');
console.log('联合类型验证示例 - 使用 .pattern()');
console.log('========================================\n');

// ========================================
// 示例1：邮箱或手机号（使用多语言 key）
// ========================================
console.log('【示例1】邮箱或手机号 - 多语言支持');
console.log('----------------------------');

const schema1 = dsl({
  name: 'string:1-50!',
  contact: dsl('string!')
    .pattern(/^([^\s@]+@[^\s@]+\.[^\s@]+|1[3-9]\d{9})$/)
    .messages({ pattern: 'pattern.emailOrPhone' })  // 🌍 使用多语言 key
    .label('联系方式')
});

const testData1 = [
  { name: '张三', contact: 'zhangsan@example.com' },
  { name: '李四', contact: '13800138000' },
  { name: '王五', contact: 'invalid' }
];

// 中文验证
console.log('🇨🇳 中文错误消息:');
testData1.forEach((data) => {
  const result = validate(schema1, data, { locale: 'zh-CN' });
  console.log(`  ${data.name} (${data.contact}):`, result.valid ? '✅ 通过' : '❌ 失败');
  if (!result.valid) {
    console.log(`    错误: ${result.errors[0].message}`);
  }
});

// 英文验证
console.log('\n🇺🇸 英文错误消息:');
testData1.forEach((data) => {
  const result = validate(schema1, data, { locale: 'en-US' });
  console.log(`  ${data.name} (${data.contact}):`, result.valid ? '✅ Pass' : '❌ Fail');
  if (!result.valid) {
    console.log(`    Error: ${result.errors[0].message}`);
  }
});

console.log('');

// ========================================
// 示例2：用户登录（用户名或邮箱）- 多语言
// ========================================
console.log('【示例2】用户登录（用户名或邮箱）- 多语言');
console.log('----------------------------');

const loginSchema = dsl({
  username: dsl('string:3-32!')
    .pattern(/^([^\s@]+@[^\s@]+\.[^\s@]+|[a-zA-Z0-9_]+)$/)
    .messages({ pattern: 'pattern.usernameOrEmail' })  // 🌍 多语言 key
    .label('用户名'),
  password: 'string:8-32!'
});

const loginTest = { username: 'invalid!@#', password: '12345678' };

console.log('🇨🇳 中文:');
const r1 = validate(loginSchema, loginTest, { locale: 'zh-CN' });
console.log(`  ${loginTest.username}:`, r1.valid ? '✅' : `❌ ${r1.errors[0].message}`);

console.log('🇺🇸 英文:');
const r2 = validate(loginSchema, loginTest, { locale: 'en-US' });
console.log(`  ${loginTest.username}:`, r2.valid ? '✅' : `❌ ${r2.errors[0].message}`);

console.log('');

// ========================================
// 示例3：URL（http 或 https）- 多语言
// ========================================
console.log('【示例3】URL（http 或 https）- 多语言');
console.log('----------------------------');

const urlSchema = dsl({
  website: dsl('string!')
    .pattern(/^https?:\/\/.+$/)
    .messages({ pattern: 'pattern.httpOrHttps' })  // 🌍 多语言 key
    .label('网站地址')
});

const urlTest = { website: 'ftp://example.com' };

console.log('🇨🇳 中文:');
const u1 = validate(urlSchema, urlTest, { locale: 'zh-CN' });
console.log(`  ${urlTest.website}:`, u1.valid ? '✅' : `❌ ${u1.errors[0].message}`);

console.log('🇺🇸 英文:');
const u2 = validate(urlSchema, urlTest, { locale: 'en-US' });
console.log(`  ${urlTest.website}:`, u2.valid ? '✅' : `❌ ${u2.errors[0].message}`);

console.log('');

// ========================================
// 示例4：直接写错误消息（不使用多语言）
// ========================================
console.log('【示例4】直接写错误消息（不使用多语言）');
console.log('----------------------------');

const simpleSchema = dsl({
  contact: dsl('string!')
    .pattern(/^([^\s@]+@[^\s@]+\.[^\s@]+|1[3-9]\d{9})$/)
    .messages({ pattern: '必须是邮箱或手机号' })  // 直接写死
});

const result = validate(simpleSchema, { contact: 'invalid' });
console.log('invalid:', result.valid ? '✅' : `❌ ${result.errors[0].message}`);

console.log('');

console.log('========================================');
console.log('示例运行完成！');
console.log('多语言测试成功！🎉');
console.log('========================================');

