/**
 * SchemaUtils 核心方法示例
 *
 * 展示 v1.0.3 简化后的核心 4 个方法：
 * 1. omit() - 排除字段
 * 2. pick() - 保留字段
 * 3. partial() - 部分验证
 * 4. extend() - 扩展字段
 *
 * @version 1.0.3 (简化版)
 * @date 2025-12-29
 */

const { dsl, validate, SchemaUtils } = require('../index');

console.log('========================================');
console.log('  SchemaUtils 核心方法示例');
console.log('========================================\n');

// ===== 定义基础 Schema =====

const fullUserSchema = dsl({
  id: 'objectId!',
  name: 'string:1-50!',
  email: 'email!',
  password: 'string:8-32!',
  age: 'integer:18-120',
  role: 'admin|user|guest',
  createdAt: 'date',
  updatedAt: 'date'
});

console.log('基础 Schema 字段:', Object.keys(fullUserSchema.properties));
console.log('必填字段:', fullUserSchema.required);
console.log('');

// ===== 1. omit() - 排除字段 =====

console.log('========== 1. omit() - 排除字段 ==========\n');

const publicSchema = SchemaUtils.omit(fullUserSchema, ['password', 'createdAt', 'updatedAt']);

console.log('原 Schema 字段:', Object.keys(fullUserSchema.properties));
console.log('omit 后字段:', Object.keys(publicSchema.properties));
console.log('password 字段被移除:', publicSchema.properties.password === undefined);
console.log('');

// ===== 2. pick() - 保留字段 =====

console.log('========== 2. pick() - 保留字段 ==========\n');

const nameEmailSchema = SchemaUtils.pick(fullUserSchema, ['name', 'email']);

console.log('原 Schema 字段:', Object.keys(fullUserSchema.properties));
console.log('pick 后字段:', Object.keys(nameEmailSchema.properties));
console.log('只保留 name 和 email');
console.log('');

// ===== 3. partial() - 部分验证 =====

console.log('========== 3. partial() - 部分验证 ==========\n');

const partialSchema = SchemaUtils.partial(fullUserSchema);

console.log('原 Schema 必填字段:', fullUserSchema.required);
console.log('partial Schema 必填字段:', partialSchema.required);

// 测试：缺少必填字段
const result4 = validate(partialSchema, {
  name: 'John'
  // 缺少其他必填字段
});

console.log('\n验证结果（缺少必填字段）:');
console.log('  valid:', result4.valid);
if (result4.valid) {
  console.log('  数据:', result4.data);
}
console.log('');

// 部分验证 - 只验证指定字段
const nameAgeSchema = SchemaUtils.partial(fullUserSchema, ['name', 'age']);

console.log('partial(schema, [name, age]) 保留字段:', Object.keys(nameAgeSchema.properties));

const result5 = validate(nameAgeSchema, {
  name: 'John',
  age: 30
});

console.log('验证结果（只验证 name 和 age）:');
console.log('  valid:', result5.valid);
console.log('');

// ===== 4. extend() - 扩展字段 =====

console.log('========== 4. extend() - 扩展字段 ==========\n');

const extendedSchema = SchemaUtils.extend(fullUserSchema, {
  avatar: 'url',
  bio: 'string:0-500'
});

console.log('原 Schema 字段:', Object.keys(fullUserSchema.properties));
console.log('extend 后字段:', Object.keys(extendedSchema.properties));
console.log('新增字段: avatar, bio');
console.log('');

// ===== 5. 链式调用 =====

console.log('========== 5. 链式调用 ==========\n');

// 示例 1: omit
console.log('示例 1: omit (创建用户 Schema)');
const createSchema = SchemaUtils.omit(fullUserSchema, ['id', 'createdAt', 'updatedAt']);

console.log('  字段:', Object.keys(createSchema.properties));
console.log('');

// 示例 2: pick + partial
console.log('示例 2: pick + partial (更新用户 Schema)');
const updateSchema = SchemaUtils
  .pick(fullUserSchema, ['name', 'age'])
  .partial();

console.log('  字段:', Object.keys(updateSchema.properties));
console.log('  必填字段:', updateSchema.required);
console.log('');

// 示例 3: pick + extend (用户建议的常见场景)
console.log('示例 3: pick + extend (自定义用户 Schema)');
const customSchema = SchemaUtils
  .pick(fullUserSchema, ['name', 'email'])
  .extend({ avatar: 'url', bio: 'string:0-500' });

console.log('  字段:', Object.keys(customSchema.properties));
console.log('');

// 示例 4: omit + extend
console.log('示例 4: omit + extend (增强用户 Schema)');
const enhancedSchema = SchemaUtils
  .omit(fullUserSchema, ['password'])
  .extend({ avatar: 'url', bio: 'string:0-500' });

console.log('  字段:', Object.keys(enhancedSchema.properties));
console.log('  新增字段: avatar, bio');
console.log('');

// ===== 6. 实际 CRUD 场景 =====

console.log('========== 6. 实际 CRUD 场景 ==========\n');

console.log('场景 1: POST /users - 创建用户');
const postSchema = SchemaUtils.omit(fullUserSchema, ['id', 'createdAt', 'updatedAt']);

const postData = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  age: 30,
  role: 'user'
};

const postResult = validate(postSchema, postData);
console.log('  验证结果:', postResult.valid);
console.log('  数据:', postResult.data);
console.log('');

console.log('场景 2: GET /users/:id - 查询用户');
const getSchema = SchemaUtils.omit(fullUserSchema, ['password']);

const userData = {
  id: '507f1f77bcf86cd799439011',
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',  // 已从 schema 移除，但验证时会被忽略
  age: 30,
  role: 'user',
  createdAt: new Date(),
  updatedAt: new Date()
};

const getResult = validate(getSchema, userData);
console.log('  验证结果:', getResult.valid);
console.log('  保留字段:', Object.keys(getResult.data));
console.log('');

console.log('场景 3: PATCH /users/:id - 部分更新用户');
const patchSchema = SchemaUtils
  .pick(fullUserSchema, ['name', 'age'])
  .partial();

const patchData = {
  name: 'John Updated'
  // 只更新 name，age 缺失也可以
};

const patchResult = validate(patchSchema, patchData);
console.log('  验证结果:', patchResult.valid);
console.log('  数据:', patchResult.data);
console.log('');

console.log('场景 4: PUT /users/:id - 替换用户');
const putSchema = SchemaUtils.omit(fullUserSchema, ['id', 'createdAt', 'updatedAt']);

const putData = {
  name: 'John Replaced',
  email: 'john.new@example.com',
  password: 'newpassword123',
  age: 31,
  role: 'admin'
};

const putResult = validate(putSchema, putData);
console.log('  验证结果:', putResult.valid);
console.log('  数据:', putResult.data);
console.log('');

// ===== 7. 不可变性验证 =====

console.log('========== 7. 不可变性验证 ==========\n');

const original = dsl({
  name: 'string!',
  email: 'email!'
});

const modified = SchemaUtils.omit(original, ['email']);

console.log('原 Schema 字段:', Object.keys(original.properties));
console.log('修改后 Schema 字段:', Object.keys(modified.properties));
console.log('原 Schema 未被修改:', original.properties.email !== undefined);
console.log('');

console.log('========================================');
console.log('  所有示例运行完成！');
console.log('========================================\n');

console.log('核心方法总结:');
console.log('  1. omit() - 排除字段（50%场景）');
console.log('  2. pick() - 保留字段（30%场景）');
console.log('  3. partial() - 部分验证（25%场景）');
console.log('  4. extend() - 扩展字段（15%场景）');
console.log('');
console.log('常见组合:');
console.log('  - POST: omit(系统字段)');
console.log('  - GET: omit(敏感字段)');
console.log('  - PATCH: pick(可修改字段).partial()');
console.log('  - 自定义: pick(基础字段).extend(新字段)');

