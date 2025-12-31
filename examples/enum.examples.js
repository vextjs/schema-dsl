/**
 * 枚举功能完整示例
 *
 * 演示 schema-dsl 中枚举的各种用法
 *
 * @since v1.1.0
 */

const { dsl, validate } = require('../index');

console.log('========== 枚举功能示例 ==========\n');

// ========================================
// 1. 基础字符串枚举
// ========================================
console.log('【示例 1】基础字符串枚举\n');

const userSchema = dsl({
  username: 'string:3-32!',
  role: 'admin|user|guest!',           // 简写形式
  status: 'enum:active|inactive|pending'  // 完整形式
});

let result = validate(userSchema, {
  username: 'john_doe',
  role: 'admin',
  status: 'active'
});

console.log('✅ 验证通过:', result.valid);
console.log('数据:', result.data);
console.log('');

// 测试无效值
result = validate(userSchema, {
  username: 'jane',
  role: 'superadmin',  // 无效值
  status: 'active'
});

console.log('❌ 验证失败:', !result.valid);
console.log('错误:', result.errors[0].message);
console.log('');

// ========================================
// 2. 布尔值枚举
// ========================================
console.log('【示例 2】布尔值枚举\n');

const featureSchema = dsl({
  name: 'string!',
  isEnabled: 'true|false!',              // 自动识别为布尔值
  isPublic: 'enum:boolean:true|false',   // 显式指定布尔值
  verified: 'true|false'                 // 可选的布尔值
});

result = validate(featureSchema, {
  name: 'dark-mode',
  isEnabled: true,
  isPublic: false
});

console.log('✅ 验证通过:', result.valid);
console.log('数据:', result.data);
console.log('');

// 测试类型错误
result = validate(featureSchema, {
  name: 'feature-x',
  isEnabled: 'true',  // 字符串 'true' 不是布尔值
  isPublic: false
});

console.log('❌ 类型错误（字符串 vs 布尔值）:', !result.valid);
console.log('');

// ========================================
// 3. 数字枚举
// ========================================
console.log('【示例 3】数字枚举\n');

const taskSchema = dsl({
  title: 'string!',
  priority: '1|2|3!',                    // 自动识别为数字
  level: 'enum:number:1|2|3|4|5',       // 显式指定数字
  rating: '1.0|1.5|2.0|2.5|3.0'         // 小数枚举
});

result = validate(taskSchema, {
  title: 'Fix bug',
  priority: 1,
  level: 3,
  rating: 2.5
});

console.log('✅ 验证通过:', result.valid);
console.log('数据:', result.data);
console.log('');

// 测试超出范围
result = validate(taskSchema, {
  title: 'New task',
  priority: 4,  // 超出 1|2|3
  level: 2
});

console.log('❌ 超出范围:', !result.valid);
console.log('');

// ========================================
// 4. 整数枚举
// ========================================
console.log('【示例 4】整数枚举（禁止小数）\n');

const gameSchema = dsl({
  playerName: 'string!',
  difficulty: 'enum:integer:1|2|3'  // 必须是整数
});

result = validate(gameSchema, {
  playerName: 'Alice',
  difficulty: 2
});

console.log('✅ 整数验证通过:', result.valid);
console.log('');

// 小数应该失败
result = validate(gameSchema, {
  playerName: 'Bob',
  difficulty: 1.5  // 小数不符合 integer 类型
});

console.log('❌ 小数验证失败:', !result.valid);
console.log('');

// ========================================
// 5. 枚举与链式 API
// ========================================
console.log('【示例 5】枚举与链式 API\n');

const postSchema = dsl({
  title: 'string:5-100!',
  status: dsl('draft|published|archived')
    .label('文章状态')
    .messages({
      'enum': '状态必须是: 草稿、已发布或已归档'
    }),
  visibility: dsl('public|private|unlisted!')
    .label('可见性')
    .default('public')
});

result = validate(postSchema, {
  title: 'My First Post',
  status: 'invalid_status',
  visibility: 'public'
});

console.log('❌ 自定义错误消息:', !result.valid);
console.log('错误:', result.errors[0].message);
console.log('');

// ========================================
// 6. 数组中的枚举
// ========================================
console.log('【示例 6】数组中的枚举\n');

const articleSchema = dsl({
  title: 'string!',
  tags: 'array<enum:tech|business|lifestyle>',
  permissions: 'array<enum:read|write|delete>'
});

result = validate(articleSchema, {
  title: 'Tech Article',
  tags: ['tech', 'business'],
  permissions: ['read', 'write']
});

console.log('✅ 数组枚举验证通过:', result.valid);
console.log('数据:', result.data);
console.log('');

// ========================================
// 7. 复杂对象中的枚举
// ========================================
console.log('【示例 7】复杂对象中的枚举\n');

const orderSchema = dsl({
  orderId: 'string!',
  status: 'pending|processing|completed|cancelled!',
  priority: '1|2|3'.default(2),
  payment: {
    method: 'card|paypal|crypto!',
    status: 'pending|success|failed!'
  },
  items: 'array',
  metadata: {
    isUrgent: 'true|false',
    category: 'electronics|clothing|food'
  }
});

result = validate(orderSchema, {
  orderId: 'ORD-12345',
  status: 'processing',
  priority: 1,
  payment: {
    method: 'card',
    status: 'success'
  },
  items: [],
  metadata: {
    isUrgent: true,
    category: 'electronics'
  }
});

console.log('✅ 复杂对象验证通过:', result.valid);
console.log('数据:', JSON.stringify(result.data, null, 2));
console.log('');

// ========================================
// 8. 错误处理
// ========================================
console.log('【示例 8】错误处理\n');

try {
  // 无效的布尔值枚举
  dsl({ flag: 'enum:boolean:true|false|maybe' });
} catch (error) {
  console.log('❌ 捕获错误:', error.message);
}

try {
  // 无效的数字枚举
  dsl({ value: 'enum:number:1|2|abc' });
} catch (error) {
  console.log('❌ 捕获错误:', error.message);
}

console.log('');

// ========================================
// 9. 实际应用场景
// ========================================
console.log('【示例 9】实际应用 - 用户管理系统\n');

const userManagementSchema = dsl({
  // 基本信息
  userId: 'string!',
  username: 'string:3-32!',
  email: 'email!',

  // 枚举字段
  role: 'admin|moderator|user|guest!',
  status: 'active|inactive|suspended|banned',
  emailVerified: 'true|false',

  // 权限等级（数字枚举）
  permissionLevel: '0|1|2|3|4|5'.default(0),

  // 偏好设置
  preferences: {
    theme: 'light|dark|auto',
    language: 'en|zh-CN|zh-TW|ja|ko',
    notifications: 'all|mentions|none'
  }
});

const newUser = {
  userId: 'u_12345',
  username: 'alice',
  email: 'alice@example.com',
  role: 'user',
  status: 'active',
  emailVerified: true,
  permissionLevel: 1,
  preferences: {
    theme: 'dark',
    language: 'zh-CN',
    notifications: 'mentions'
  }
};

result = validate(userManagementSchema, newUser);

console.log('✅ 用户数据验证通过:', result.valid);
console.log('用户数据:', JSON.stringify(result.data, null, 2));
console.log('');

// ========================================
// 10. 性能测试
// ========================================
console.log('【示例 10】性能测试\n');

const perfSchema = dsl({
  status: 'active|inactive|pending',
  priority: '1|2|3',
  flag: 'true|false'
});

const iterations = 10000;
const startTime = Date.now();

for (let i = 0; i < iterations; i++) {
  validate(perfSchema, {
    status: 'active',
    priority: 2,
    flag: true
  });
}

const endTime = Date.now();
const duration = endTime - startTime;
const perSecond = Math.round((iterations / duration) * 1000);

console.log(`验证 ${iterations} 次耗时: ${duration}ms`);
console.log(`平均每秒验证: ${perSecond.toLocaleString()} 次`);
console.log('');

console.log('========== 示例结束 ==========');

