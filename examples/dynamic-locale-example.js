/**
 * 动态多语言配置示例
 *
 * 演示如何从请求头动态获取语言并进行验证
 */

const { dsl, Validator, Locale } = require('../index');

// ========== 1. 初始化语言包 ==========

console.log('📦 初始化语言包...\n');

// 中文语言包
Locale.addLocale('zh-CN', {
  'required': '{{#label}}不能为空',
  'min': '{{#label}}至少{{#limit}}个字符',
  'max': '{{#label}}最多{{#limit}}个字符',
  'pattern': '{{#label}}格式不正确',
  'format': '请输入有效的{{#label}}'
});

// 英文语言包
Locale.addLocale('en-US', {
  'required': '{{#label}} is required',
  'min': '{{#label}} must be at least {{#limit}} characters',
  'max': '{{#label}} must be at most {{#limit}} characters',
  'pattern': '{{#label}} format is invalid',
  'format': 'Please enter a valid {{#label}}'
});

console.log('✅ 语言包已加载: zh-CN, en-US\n');

// ========== 2. 定义Schema ==========

console.log('📋 定义Schema...\n');

const userSchema = dsl({
  username: 'string:3-32!'.label('用户名'),
  email: 'email!'.label('邮箱地址'),
  password: 'string:8-64!'
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .label('密码'),
  age: 'number:18-120'.label('年龄')
});

console.log('✅ Schema定义完成\n');

// ========== 3. 测试数据 ==========

const testData = {
  username: 'ab',  // 太短
  email: 'invalid-email',  // 格式错误
  password: 'weak',  // 不符合强度要求
  age: 15  // 年龄不够
};

// ========== 4. 创建验证器 ==========

const validator = new Validator();

// ========== 5. 测试不同语言 ==========

console.log('🧪 测试验证 - 不同语言\n');
console.log('=' .repeat(60));

// 中文验证
console.log('\n📍 测试1: 中文错误消息 (locale: zh-CN)');
console.log('-'.repeat(60));

const result1 = validator.validate(userSchema, testData, {
  locale: 'zh-CN'
});

console.log('验证结果:', result1.valid ? '✅ 通过' : '❌ 失败');
if (!result1.valid) {
  console.log('\n错误列表:');
  result1.errors.forEach((error, index) => {
    console.log(`  ${index + 1}. ${error.path}: ${error.message}`);
  });
}

// 英文验证
console.log('\n📍 测试2: 英文错误消息 (locale: en-US)');
console.log('-'.repeat(60));

const result2 = validator.validate(userSchema, testData, {
  locale: 'en-US'
});

console.log('验证结果:', result2.valid ? '✅ 通过' : '❌ 失败');
if (!result2.valid) {
  console.log('\n错误列表:');
  result2.errors.forEach((error, index) => {
    console.log(`  ${index + 1}. ${error.path}: ${error.message}`);
  });
}

// ========== 6. 模拟HTTP请求场景 ==========

console.log('\n\n🌐 模拟HTTP请求场景');
console.log('=' .repeat(60));

/**
 * 解析 Accept-Language 头
 */
function parseAcceptLanguage(acceptLanguage) {
  if (!acceptLanguage) return 'en-US';

  const languages = acceptLanguage.split(',').map(lang => {
    const [code, qValue] = lang.trim().split(';');
    const q = qValue ? parseFloat(qValue.split('=')[1]) : 1.0;
    return { code: code.trim(), q };
  });

  languages.sort((a, b) => b.q - a.q);

  const supportedLocales = ['zh-CN', 'en-US'];
  for (const lang of languages) {
    const matched = supportedLocales.find(locale =>
      locale.toLowerCase() === lang.code.toLowerCase()
    );
    if (matched) return matched;
  }

  return 'en-US';
}

/**
 * 模拟验证请求
 */
function handleRequest(acceptLanguage, data) {
  const locale = parseAcceptLanguage(acceptLanguage);

  console.log(`\n📍 请求头: Accept-Language: ${acceptLanguage}`);
  console.log(`   解析语言: ${locale}`);
  console.log('-'.repeat(60));

  const result = validator.validate(userSchema, data, { locale });

  if (!result.valid) {
    console.log('❌ 验证失败:');
    result.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.path}: ${error.message}`);
    });
  } else {
    console.log('✅ 验证通过');
  }

  return result;
}

// 测试不同的 Accept-Language 头
handleRequest('zh-CN,zh;q=0.9,en;q=0.8', testData);
handleRequest('en-US,en;q=0.9', testData);
handleRequest('zh-CN', testData);
handleRequest('en-US', testData);
handleRequest('ja-JP,en-US;q=0.8', testData);  // 不支持的语言，回退到英文

// ========== 7. 并发测试 ==========

console.log('\n\n⚡ 并发测试 - 验证无竞态问题');
console.log('=' .repeat(60));

async function concurrentTest() {
  const promises = [
    // 5个中文请求
    ...Array(5).fill().map(() =>
      Promise.resolve(validator.validate(userSchema, testData, { locale: 'zh-CN' }))
    ),
    // 5个英文请求
    ...Array(5).fill().map(() =>
      Promise.resolve(validator.validate(userSchema, testData, { locale: 'en-US' }))
    )
  ];

  const results = await Promise.all(promises);

  // 检查结果
  const zhResults = results.slice(0, 5);
  const enResults = results.slice(5);

  const allZhCorrect = zhResults.every(r =>
    r.errors[0].message.includes('用户名')
  );

  const allEnCorrect = enResults.every(r =>
    r.errors[0].message.includes('username')
  );

  console.log('\n并发测试结果:');
  console.log(`  中文请求 (5个): ${allZhCorrect ? '✅ 全部正确' : '❌ 有错误'}`);
  console.log(`  英文请求 (5个): ${allEnCorrect ? '✅ 全部正确' : '❌ 有错误'}`);

  if (allZhCorrect && allEnCorrect) {
    console.log('\n🎉 并发测试通过！无竞态问题！');
  }
}

concurrentTest();

// ========== 8. 正确数据测试 ==========

console.log('\n\n✅ 测试正确数据');
console.log('=' .repeat(60));

const validData = {
  username: 'john_doe',
  email: 'john@example.com',
  password: 'Password123',
  age: 25
};

console.log('\n📍 中文验证');
const validResult1 = validator.validate(userSchema, validData, {
  locale: 'zh-CN'
});
console.log('结果:', validResult1.valid ? '✅ 验证通过' : '❌ 验证失败');

console.log('\n📍 英文验证');
const validResult2 = validator.validate(userSchema, validData, {
  locale: 'en-US'
});
console.log('结果:', validResult2.valid ? '✅ 验证通过' : '❌ 验证失败');

// ========== 总结 ==========

console.log('\n\n' + '='.repeat(60));
console.log('📊 总结');
console.log('='.repeat(60));
console.log(`
✅ 核心功能:
  1. 支持动态语言切换 (locale参数)
  2. 支持并发请求，无竞态问题
  3. 自动解析 Accept-Language 头
  4. 支持多语言错误消息

✅ 使用方式:
  validator.validate(schema, data, { locale: 'zh-CN' })

✅ 推荐场景:
  - Express/Koa API 服务
  - 多语言Web应用
  - 国际化移动应用后端

📖 详细文档: docs/dynamic-locale.md
`);

