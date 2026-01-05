/**
 * ConditionalBuilder 完整示例
 *
 * 展示链式条件构建器的各种用法
 */

const { dsl, validate } = require('../index');

console.log('========================================');
console.log('ConditionalBuilder 示例');
console.log('========================================\n');

// ============================================
// 示例1：简单条件 + 错误消息
// ============================================
console.log('【示例1】简单条件 + 错误消息');
console.log('----------------------------');

const schema1 = dsl({
  age: 'number!',
  status: dsl.if((data) => data.age >= 18)
    .message('未成年用户不能注册')
});

const testData1a = { age: 20, status: 'active' };
const result1a = validate(schema1, testData1a);
console.log('✅ 成年用户:', result1a.valid ? '验证通过' : '验证失败');

const testData1b = { age: 16, status: 'active' };
const result1b = validate(schema1, testData1b);
console.log('❌ 未成年用户:', result1b.valid ? '验证通过' : '验证失败');
if (!result1b.valid) {
  console.log('   错误消息:', result1b.errors[0].message);
}

// ============================================
// 示例2：条件 + then/else（动态Schema）
// ============================================
console.log('\n【示例2】条件 + then/else（动态Schema）');
console.log('----------------------------');

const schema2 = dsl({
  userType: 'string!',
  email: dsl.if((data) => data.userType === 'admin')
    .then('email!')  // 管理员必填
    .else('email')   // 普通用户可选
});

const testData2a = { userType: 'admin', email: 'admin@example.com' };
const result2a = validate(schema2, testData2a);
console.log('✅ 管理员有邮箱:', result2a.valid ? '验证通过' : '验证失败');

const testData2b = { userType: 'admin', email: '' };
const result2b = validate(schema2, testData2b);
console.log('❌ 管理员无邮箱:', result2b.valid ? '验证通过' : '验证失败');

const testData2c = { userType: 'user', email: '' };
const result2c = validate(schema2, testData2c);
console.log('✅ 普通用户无邮箱:', result2c.valid ? '验证通过' : '验证失败');

// ============================================
// 示例3：else 可选（不写 else 就不验证）
// ============================================
console.log('\n【示例3】else 可选');
console.log('----------------------------');

const schema3 = dsl({
  userType: 'string!',
  vipLevel: dsl.if((data) => data.userType === 'vip')
    .then('enum:gold|silver|bronze!')
    // 不写 else，非 vip 用户不验证 vipLevel
});

const testData3a = { userType: 'vip', vipLevel: 'gold' };
const result3a = validate(schema3, testData3a);
console.log('✅ VIP用户有等级:', result3a.valid ? '验证通过' : '验证失败');

const testData3b = { userType: 'user' };
const result3b = validate(schema3, testData3b);
console.log('✅ 普通用户无等级:', result3b.valid ? '验证通过' : '验证失败');

const testData3c = { userType: 'user', vipLevel: 'invalid_level' };
const result3c = validate(schema3, testData3c);
console.log('✅ 普通用户有无效等级:', result3c.valid ? '验证通过（不验证）' : '验证失败');

// ============================================
// 示例4：多条件 AND
// ============================================
console.log('\n【示例4】多条件 AND');
console.log('----------------------------');

const schema4 = dsl({
  age: 'number!',
  userType: 'string!',
  email: dsl.if((data) => data.age >= 18)
    .and((data) => data.userType === 'admin')
    .then('email!')
    .else('email')
});

const testData4a = { age: 20, userType: 'admin', email: 'admin@example.com' };
const result4a = validate(schema4, testData4a);
console.log('✅ 成年管理员有邮箱:', result4a.valid ? '验证通过' : '验证失败');

const testData4b = { age: 20, userType: 'user', email: '' };
const result4b = validate(schema4, testData4b);
console.log('✅ 成年普通用户无邮箱:', result4b.valid ? '验证通过' : '验证失败');

const testData4c = { age: 16, userType: 'admin', email: '' };
const result4c = validate(schema4, testData4c);
console.log('✅ 未成年管理员无邮箱:', result4c.valid ? '验证通过' : '验证失败');

// ============================================
// 示例5：多条件 OR
// ============================================
console.log('\n【示例5】多条件 OR');
console.log('----------------------------');

const schema5 = dsl({
  age: 'number!',
  status: 'string!',
  reason: dsl.if((data) => data.age < 18)
    .or((data) => data.status === 'blocked')
    .message('不允许注册')
});

const testData5a = { age: 16, status: 'active', reason: 'test' };
const result5a = validate(schema5, testData5a);
console.log('❌ 未成年用户:', result5a.valid ? '验证通过' : `验证失败（${result5a.errors[0].message}）`);

const testData5b = { age: 20, status: 'blocked', reason: 'test' };
const result5b = validate(schema5, testData5b);
console.log('❌ 被封禁用户:', result5b.valid ? '验证通过' : `验证失败（${result5b.errors[0].message}）`);

const testData5c = { age: 20, status: 'active', reason: 'test' };
const result5c = validate(schema5, testData5c);
console.log('✅ 正常用户:', result5c.valid ? '验证通过' : '验证失败');

// ============================================
// 示例6：elseIf 多分支
// ============================================
console.log('\n【示例6】elseIf 多分支');
console.log('----------------------------');

const schema6 = dsl({
  userType: 'string!',
  permissions: dsl.if((data) => data.userType === 'admin')
    .then('array<string>!')
    .elseIf((data) => data.userType === 'vip')
    .then('array<string>')
    .else(null)
});

const testData6a = { userType: 'admin', permissions: ['read', 'write'] };
const result6a = validate(schema6, testData6a);
console.log('✅ 管理员有权限:', result6a.valid ? '验证通过' : '验证失败');

const testData6b = { userType: 'vip' };
const result6b = validate(schema6, testData6b);
console.log('✅ VIP无权限:', result6b.valid ? '验证通过' : '验证失败');

const testData6c = { userType: 'guest' };
const result6c = validate(schema6, testData6c);
console.log('✅ 游客无权限:', result6c.valid ? '验证通过' : '验证失败');

// ============================================
// 示例7：复杂场景 - 用户注册
// ============================================
console.log('\n【示例7】复杂场景 - 用户注册');
console.log('----------------------------');

const userRegistrationSchema = dsl({
  username: 'string:3-32!',
  age: 'number:1-120!',
  userType: 'enum:admin|vip|user!',

  // 未成年禁止注册
  ageCheck: dsl.if((data) => data.age < 18)
    .message('未成年用户不能注册'),

  // 管理员必须有邮箱
  email: dsl.if((data) => data.userType === 'admin')
    .then('email!')
    .else('email'),

  // VIP用户必须有手机号
  phone: dsl.if((data) => data.userType === 'vip')
    .then('string:11!')
    .else(null),

  // 管理员和VIP可以设置昵称
  nickname: dsl.if((data) => data.userType === 'admin')
    .or((data) => data.userType === 'vip')
    .then('string:2-20')
    .else(null)
});

const testData7a = {
  username: 'admin1',
  age: 25,
  userType: 'admin',
  email: 'admin@example.com',
  nickname: 'Super Admin'
};
const result7a = validate(userRegistrationSchema, testData7a);
console.log('✅ 成年管理员:', result7a.valid ? '注册成功' : '注册失败');

const testData7b = {
  username: 'vip1',
  age: 30,
  userType: 'vip',
  phone: '13800138000',
  nickname: 'VIP User'
};
const result7b = validate(userRegistrationSchema, testData7b);
console.log('✅ VIP用户:', result7b.valid ? '注册成功' : '注册失败');

const testData7c = {
  username: 'kid',
  age: 15,
  userType: 'user'
};
const result7c = validate(userRegistrationSchema, testData7c);
console.log('❌ 未成年用户:', result7c.valid ? '注册成功' : `注册失败（${result7c.errors[0].message}）`);

// ============================================
// 示例8：复杂场景 - 商品发布
// ============================================
console.log('\n【示例8】复杂场景 - 商品发布');
console.log('----------------------------');

const productSchema = dsl({
  title: 'string:1-100!',
  price: 'number:0-!',
  type: 'enum:physical|digital|service!',

  // 实体商品需要重量和尺寸
  weight: dsl.if((data) => data.type === 'physical')
    .then('number:0-!')
    .else(null),

  dimensions: dsl.if((data) => data.type === 'physical')
    .then('string!')
    .else(null),

  // 数字商品需要下载链接
  downloadUrl: dsl.if((data) => data.type === 'digital')
    .then('url!')
    .else(null),

  // 服务类需要服务时长
  duration: dsl.if((data) => data.type === 'service')
    .then('number:1-!')
    .else(null)
});

const testData8a = {
  title: '笔记本电脑',
  price: 5999,
  type: 'physical',
  weight: 1.5,
  dimensions: '30x20x2cm'
};
const result8a = validate(productSchema, testData8a);
console.log('✅ 实体商品:', result8a.valid ? '发布成功' : '发布失败');

const testData8b = {
  title: '电子书',
  price: 29.9,
  type: 'digital',
  downloadUrl: 'https://example.com/download'
};
const result8b = validate(productSchema, testData8b);
console.log('✅ 数字商品:', result8b.valid ? '发布成功' : '发布失败');

const testData8c = {
  title: '咨询服务',
  price: 200,
  type: 'service',
  duration: 60
};
const result8c = validate(productSchema, testData8c);
console.log('✅ 服务类:', result8c.valid ? '发布成功' : '发布失败');

console.log('\n========================================');
console.log('示例运行完成！');
console.log('========================================');

