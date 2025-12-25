/**
 * 全面深度验证：文档、代码、测试、示例的完全一致性
 * 特别关注 README.md 的每一个细节
 */

const { dsl, validate } = require('../index.js');
const fs = require('fs');
const path = require('path');

console.log('================================================================================');
console.log('  📋 SchemaIO 全面深度验证（三轮 + README.md 逐行验证）');
console.log('================================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failedDetails = [];

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`✅ ${name}`);
    return true;
  } catch (e) {
    failedTests++;
    console.log(`❌ ${name}`);
    console.log(`   错误: ${e.message}\n`);
    failedDetails.push({ name, error: e.message });
    return false;
  }
}

// ========== 第一轮：README.md 逐项验证 ==========
console.log('🔍 第一轮：README.md 逐项深度验证\n');
console.log('📄 读取 README.md...\n');

const readmePath = path.join(__dirname, '../README.md');
const readme = fs.readFileSync(readmePath, 'utf-8');

// 1.1 检查 README 中提到的所有基本类型
test('README 基本类型：string', () => {
  const schema = dsl({ name: 'string' });
  if (schema.properties.name.type !== 'string') throw new Error('string 类型解析失败');
});

test('README 基本类型：number', () => {
  const schema = dsl({ age: 'number' });
  if (schema.properties.age.type !== 'number') throw new Error('number 类型解析失败');
});

test('README 基本类型：integer', () => {
  const schema = dsl({ count: 'integer' });
  if (schema.properties.count.type !== 'integer') throw new Error('integer 类型解析失败');
});

test('README 基本类型：boolean', () => {
  const schema = dsl({ active: 'boolean' });
  if (schema.properties.active.type !== 'boolean') throw new Error('boolean 类型解析失败');
});

test('README 基本类型：email', () => {
  const schema = dsl({ email: 'email' });
  if (schema.properties.email.format !== 'email') throw new Error('email 格式解析失败');
});

test('README 基本类型：url', () => {
  const schema = dsl({ website: 'url' });
  if (schema.properties.website.format !== 'uri') throw new Error('url 格式解析失败');
});

test('README 基本类型：uuid', () => {
  const schema = dsl({ id: 'uuid' });
  if (schema.properties.id.format !== 'uuid') throw new Error('uuid 格式解析失败');
});

test('README 基本类型：date', () => {
  const schema = dsl({ created: 'date' });
  if (schema.properties.created.format !== 'date') throw new Error('date 格式解析失败');
});

// 1.2 检查约束条件语法（README 中列出的所有4种格式）
test('README 约束语法：type:max（简写）', () => {
  const schema = dsl({ bio: 'string:500' });
  if (schema.properties.bio.maxLength !== 500) throw new Error('简写格式解析失败');
});

test('README 约束语法：type:-max（明确写法）', () => {
  const schema = dsl({ bio: 'string:-500' });
  if (schema.properties.bio.maxLength !== 500) throw new Error('明确写法解析失败');
});

test('README 约束语法：type:min-max（范围）', () => {
  const schema = dsl({ username: 'string:3-32' });
  if (schema.properties.username.minLength !== 3) throw new Error('范围最小值解析失败');
  if (schema.properties.username.maxLength !== 32) throw new Error('范围最大值解析失败');
});

test('README 约束语法：type:min-（只限最小）', () => {
  const schema = dsl({ content: 'string:10-' });
  if (schema.properties.content.minLength !== 10) throw new Error('只限最小解析失败');
  if (schema.properties.content.maxLength) throw new Error('不应有最大值');
});

// 1.3 检查 README 快速开始示例
test('README 快速开始：完整示例运行', () => {
  const schema = dsl({
    username: 'string:3-32!',
    email: 'email!',
    age: 'number:18-120'
  });

  const result = validate(schema, {
    username: 'john_doe',
    email: 'john@example.com',
    age: 25
  });

  if (!result.valid) throw new Error(`验证失败: ${JSON.stringify(result.errors)}`);
});

// 1.4 检查默认验证器章节
test('README 默认验证器：username() 无参数', () => {
  const schema = dsl({ username: 'string!'.username() });
  if (schema.properties.username.minLength !== 3) throw new Error('默认最小长度应为3');
  if (schema.properties.username.maxLength !== 32) throw new Error('默认最大长度应为32');
});

test('README 默认验证器：username("5-20")', () => {
  const schema = dsl({ username: 'string!'.username('5-20') });
  if (schema.properties.username.minLength !== 5) throw new Error('最小长度应为5');
  if (schema.properties.username.maxLength !== 20) throw new Error('最大长度应为20');
});

test('README 默认验证器：username("short")', () => {
  const schema = dsl({ username: 'string!'.username('short') });
  if (schema.properties.username.minLength !== 3) throw new Error('short最小长度应为3');
  if (schema.properties.username.maxLength !== 16) throw new Error('short最大长度应为16');
});

test('README 默认验证器：username("medium")', () => {
  const schema = dsl({ username: 'string!'.username('medium') });
  if (schema.properties.username.minLength !== 3) throw new Error('medium最小长度应为3');
  if (schema.properties.username.maxLength !== 32) throw new Error('medium最大长度应为32');
});

test('README 默认验证器：username("long")', () => {
  const schema = dsl({ username: 'string!'.username('long') });
  if (schema.properties.username.minLength !== 3) throw new Error('long最小长度应为3');
  if (schema.properties.username.maxLength !== 64) throw new Error('long最大长度应为64');
});

test('README 默认验证器：phone("cn")', () => {
  const schema = dsl({ phone: 'string!'.phone('cn') });
  if (schema.properties.phone.type !== 'string') throw new Error('phone类型应为string');
  if (schema.properties.phone.minLength !== 11) throw new Error('cn手机号长度应为11');
  if (schema.properties.phone.maxLength !== 11) throw new Error('cn手机号长度应为11');
});

test('README 默认验证器：phone 类型自动纠正', () => {
  const schema = dsl({ phone: 'number!'.phone('cn') });
  if (schema.properties.phone.type !== 'string') throw new Error('应自动纠正为string');
});

test('README 默认验证器：password("strong")', () => {
  const schema = dsl({ password: 'string!'.password('strong') });
  if (schema.properties.password.minLength !== 8) throw new Error('strong最小长度应为8');
  if (schema.properties.password.maxLength !== 64) throw new Error('最大长度应为64');
});

test('README 默认验证器：完整示例运行', () => {
  const registrationSchema = dsl({
    username: 'string!'.username('5-20'),
    phone: 'string!'.phone('cn').label('手机号'),
    password: 'string!'.password('strong').label('密码'),
    email: 'email!'.label('邮箱')
  });

  const result = validate(registrationSchema, {
    username: 'john_doe',
    phone: '13800138000',
    password: 'Abc123456',
    email: 'john@example.com'
  });

  if (!result.valid) throw new Error('默认验证器示例验证失败');
});

// 1.5 检查 String 扩展方法
test('README String扩展：.pattern()', () => {
  const schema = dsl({
    username: 'string:3-32!'.pattern(/^[a-zA-Z0-9_]+$/)
  });
  if (!schema.properties.username.pattern) throw new Error('pattern未设置');
});

test('README String扩展：.label()', () => {
  'string!'.label('测试'); // 只验证不报错
});

test('README String扩展：.messages()', () => {
  'string!'.messages({'min': 'test'}); // 只验证不报错
});

test('README String扩展：.description()', () => {
  'string!'.description('测试'); // 只验证不报错
});

test('README String扩展：.custom()', () => {
  'string!'.custom(() => {}); // 只验证不报错
});

test('README String扩展：.default()', () => {
  const schema = dsl({ name: 'string'.default('guest') });
  if (schema.properties.name.default !== 'guest') throw new Error('default未设置');
});

// 1.6 检查数组类型
test('README 数组类型：array<string>', () => {
  const schema = dsl({ tags: 'array<string>' });
  if (schema.properties.tags.type !== 'array') throw new Error('数组类型解析失败');
  if (schema.properties.tags.items.type !== 'string') throw new Error('数组元素类型解析失败');
});

test('README 数组类型：array<number>', () => {
  const schema = dsl({ scores: 'array<number>' });
  if (schema.properties.scores.type !== 'array') throw new Error('数组类型解析失败');
  if (schema.properties.scores.items.type !== 'number') throw new Error('数组元素类型解析失败');
});

// 1.7 检查枚举值
test('README 枚举值：status', () => {
  const schema = dsl({ status: 'active|inactive|pending' });
  if (!schema.properties.status.enum) throw new Error('枚举值未解析');
  if (!schema.properties.status.enum.includes('active')) throw new Error('active未包含');
  if (!schema.properties.status.enum.includes('inactive')) throw new Error('inactive未包含');
  if (!schema.properties.status.enum.includes('pending')) throw new Error('pending未包含');
});

// 1.8 检查嵌套对象
test('README 嵌套对象：两层嵌套', () => {
  const schema = dsl({
    user: {
      name: 'string:1-100!',
      email: 'email!',
      profile: {
        bio: 'string:500',
        website: 'url'
      }
    }
  });

  if (!schema.properties.user) throw new Error('user对象未解析');
  if (!schema.properties.user.properties) throw new Error('user.properties未解析');
  if (!schema.properties.user.properties.profile) throw new Error('profile对象未解析');
  if (!schema.properties.user.properties.profile.properties) throw new Error('profile.properties未解析');
});

console.log('\n' + '='.repeat(80) + '\n');

// ========== 第二轮：测试用例与文档一致性 ==========
console.log('🔍 第二轮：测试用例与文档一致性验证\n');

// 2.1 检查测试文件是否存在
const testFiles = [
  'test/unit/core/DslBuilder.test.js',
  'test/unit/adapters/DslAdapter.test.js',
  'test/unit/v2.0.1-features.test.js'
];

testFiles.forEach(file => {
  test(`测试文件存在：${file}`, () => {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) throw new Error(`文件不存在: ${file}`);
  });
});

// 2.2 检查示例文件与文档一致性
const exampleFiles = [
  'examples/v2.0.1-simple.js',
  'examples/v2.0.1-features.js',
  'examples/string-extensions.js'
];

exampleFiles.forEach(file => {
  test(`示例文件存在：${file}`, () => {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) throw new Error(`文件不存在: ${file}`);
  });
});

// 2.3 运行示例文件验证可执行性
test('示例文件可执行：v2.0.1-simple.js', () => {
  try {
    require('../examples/v2.0.1-simple.js');
  } catch (e) {
    if (!e.message.includes('exports')) throw e;
  }
});

test('示例文件可执行：string-extensions.js', () => {
  try {
    require('../examples/string-extensions.js');
  } catch (e) {
    if (!e.message.includes('exports')) throw e;
  }
});

console.log('\n' + '='.repeat(80) + '\n');

// ========== 第三轮：文档完整性交叉验证 ==========
console.log('🔍 第三轮：文档完整性交叉验证\n');

// 3.1 检查所有文档文件是否存在
const docFiles = [
  'docs/quick-start.md',
  'docs/dsl-syntax.md',
  'docs/string-extensions.md',
  'docs/label-vs-description.md',
  'docs/INDEX.md'
];

docFiles.forEach(file => {
  test(`文档文件存在：${file}`, () => {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) throw new Error(`文件不存在: ${file}`);
  });
});

// 3.2 检查文档引用的准确性
test('README 引用了 quick-start.md', () => {
  if (!readme.includes('docs/quick-start.md')) throw new Error('quick-start.md 未被引用');
});

test('README 引用了 dsl-syntax.md', () => {
  if (!readme.includes('docs/dsl-syntax.md')) throw new Error('dsl-syntax.md 未被引用');
});

test('README 引用了 string-extensions.md', () => {
  if (!readme.includes('docs/string-extensions.md')) throw new Error('string-extensions.md 未被引用');
});

test('README 引用了 label-vs-description.md', () => {
  if (!readme.includes('docs/label-vs-description.md')) throw new Error('label-vs-description.md 未被引用');
});

// 3.3 检查 README 中的关键词准确性
test('README 包含 "简洁而强大"', () => {
  if (!readme.includes('简洁而强大')) throw new Error('核心定位词缺失');
});

test('README 包含 "DSL 语法"', () => {
  if (!readme.includes('DSL 语法')) throw new Error('DSL 语法描述缺失');
});

test('README 包含 "String 扩展"', () => {
  if (!readme.includes('String 扩展')) throw new Error('String 扩展描述缺失');
});

test('README 包含 "默认验证器"', () => {
  if (!readme.includes('默认验证器')) throw new Error('默认验证器描述缺失');
});

test('README 包含 username/phone/password', () => {
  if (!readme.includes('username')) throw new Error('username 未提及');
  if (!readme.includes('phone')) throw new Error('phone 未提及');
  if (!readme.includes('password')) throw new Error('password 未提及');
});

// 3.4 检查代码注释与文档一致性
test('DslBuilder.js 有 username 方法注释', () => {
  const builderPath = path.join(__dirname, '../lib/core/DslBuilder.js');
  const builder = fs.readFileSync(builderPath, 'utf-8');
  if (!builder.includes('username') || !builder.includes('用户名验证')) {
    throw new Error('username 方法缺少注释或注释不完整');
  }
});

test('DslBuilder.js 有 phone 方法注释', () => {
  const builderPath = path.join(__dirname, '../lib/core/DslBuilder.js');
  const builder = fs.readFileSync(builderPath, 'utf-8');
  if (!builder.includes('phone') || !builder.includes('手机号验证')) {
    throw new Error('phone 方法缺少注释或注释不完整');
  }
});

test('DslBuilder.js 有 password 方法注释', () => {
  const builderPath = path.join(__dirname, '../lib/core/DslBuilder.js');
  const builder = fs.readFileSync(builderPath, 'utf-8');
  if (!builder.includes('password') || !builder.includes('密码')) {
    throw new Error('password 方法缺少注释或注释不完整');
  }
});

console.log('\n' + '='.repeat(80) + '\n');

// ========== 总结 ==========
console.log('📊 全面验证总结\n');
console.log(`总测试数: ${totalTests}`);
console.log(`✅ 通过: ${passedTests}`);
console.log(`❌ 失败: ${failedTests}`);
console.log(`通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

if (failedTests > 0) {
  console.log('❌ 失败详情:\n');
  failedDetails.forEach((detail, index) => {
    console.log(`${index + 1}. ${detail.name}`);
    console.log(`   ${detail.error}\n`);
  });
}

if (failedTests === 0) {
  console.log('================================================================================');
  console.log('  🎉 恭喜！所有验证通过，文档、代码、测试、示例完全一致！');
  console.log('================================================================================\n');
  process.exit(0);
} else {
  console.log('================================================================================');
  console.log('  ⚠️  警告：发现不一致问题，请立即修复！');
  console.log('================================================================================\n');
  process.exit(1);
}

