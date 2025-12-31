/**
 * Express 集成示例 - 异步验证与 Schema 链式调用
 * 
 * 展示如何在 Express 中使用：
 * 1. validateAsync 异步验证
 * 2. ValidationError 错误处理
 * 3. SchemaUtils 链式调用
 * 4. 完整 CRUD 场景
 * 
 * @version 1.0.3
 * @date 2025-12-29
 */

const express = require('express');
const { dsl, validateAsync, ValidationError, SchemaUtils } = require('../index');

const app = express();
app.use(express.json());

// ===== 模拟数据库 =====
const db = {
  users: [],
  nextId: 1
};

// ===== 定义完整 User Schema =====
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

// ===== 派生各种 Schema =====

// POST /users - 创建用户 Schema（排除系统字段）
const createUserSchema = SchemaUtils.omit(fullUserSchema, ['id', 'createdAt', 'updatedAt']);

// GET /users/:id - 公开用户 Schema（移除敏感字段）
const publicUserSchema = SchemaUtils.omit(fullUserSchema, ['password']);

// PATCH /users/:id - 更新用户 Schema（部分验证）
const updateUserSchema = SchemaUtils
  .pick(fullUserSchema, ['name', 'age'])
  .partial();

// PUT /users/:id - 替换用户 Schema（排除系统字段）
const replaceUserSchema = SchemaUtils.omit(fullUserSchema, ['id', 'createdAt', 'updatedAt']);

// ===== 路由实现 =====

/**
 * POST /users - 创建用户
 * 
 * 使用 createUserSchema：
 * - 排除系统字段（id, createdAt, updatedAt）
 */
app.post('/users', async (req, res, next) => {
  try {
    console.log('\n[POST /users] 创建用户');
    console.log('请求体:', req.body);

    // 使用 validateAsync 验证
    const data = await validateAsync(createUserSchema, req.body);

    console.log('验证通过，数据:', data);

    // 保存到数据库
    const user = {
      id: String(db.nextId++),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.users.push(user);

    // 返回公开信息
    const { validate } = require('../index');
    const result = validate(publicUserSchema, user);

    console.log('返回数据:', result.data);

    res.status(201).json({
      success: true,
      user: result.data
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /users - 获取所有用户
 * 
 * 使用 publicUserSchema 自动移除敏感字段
 */
app.get('/users', (req, res) => {
  console.log('\n[GET /users] 获取所有用户');

  const { validate } = require('../index');

  // 对每个用户应用 publicUserSchema
  const publicUsers = db.users.map(user => {
    const result = validate(publicUserSchema, user);
    return result.data;
  });

  console.log(`返回 ${publicUsers.length} 个用户`);

  res.json({
    success: true,
    count: publicUsers.length,
    users: publicUsers
  });
});

/**
 * GET /users/:id - 获取单个用户
 * 
 * 使用 publicUserSchema 移除敏感字段
 */
app.get('/users/:id', (req, res) => {
  console.log(`\n[GET /users/${req.params.id}] 获取用户`);

  const user = db.users.find(u => u.id === req.params.id);

  if (!user) {
    console.log('用户不存在');
    return res.status(404).json({
      success: false,
      error: '用户不存在'
    });
  }

  // 使用 clean 模式自动移除敏感字段
  const { validate } = require('../index');
  const result = validate(publicUserSchema, user);

  console.log('返回数据:', result.data);

  res.json({
    success: true,
    user: result.data
  });
});

/**
 * PATCH /users/:id - 部分更新用户
 * 
 * 使用 updateUserSchema：
 * - 只验证 name 和 age
 * - 部分验证（可选）
 * - 宽松模式（允许额外字段）
 */
app.patch('/users/:id', async (req, res, next) => {
  try {
    console.log(`\n[PATCH /users/${req.params.id}] 部分更新用户`);
    console.log('请求体:', req.body);

    const user = db.users.find(u => u.id === req.params.id);

    if (!user) {
      console.log('用户不存在');
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    // 验证部分数据
    const data = await validateAsync(updateUserSchema, req.body);

    console.log('验证通过，更新字段:', data);

    // 更新用户
    Object.assign(user, data, {
      updatedAt: new Date().toISOString()
    });

    // 返回公开信息
    const { validate } = require('../index');
    const result = validate(publicUserSchema, user);

    console.log('返回数据:', result.data);

    res.json({
      success: true,
      user: result.data
    });

  } catch (error) {
    next(error);
  }
});

/**
 * PUT /users/:id - 替换用户
 * 
 * 使用 replaceUserSchema：
 * - 排除系统字段
 * - 严格模式（必填字段必须全部提供）
 */
app.put('/users/:id', async (req, res, next) => {
  try {
    console.log(`\n[PUT /users/${req.params.id}] 替换用户`);
    console.log('请求体:', req.body);

    const userIndex = db.users.findIndex(u => u.id === req.params.id);

    if (userIndex === -1) {
      console.log('用户不存在');
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    // 验证完整数据
    const data = await validateAsync(replaceUserSchema, req.body);

    console.log('验证通过，替换用户:', data);

    // 替换用户（保留 id 和 createdAt）
    const oldUser = db.users[userIndex];
    db.users[userIndex] = {
      id: oldUser.id,
      ...data,
      createdAt: oldUser.createdAt,
      updatedAt: new Date().toISOString()
    };

    // 返回公开信息
    const { validate } = require('../index');
    const result = validate(publicUserSchema, db.users[userIndex]);

    console.log('返回数据:', result.data);

    res.json({
      success: true,
      user: result.data
    });

  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /users/:id - 删除用户
 */
app.delete('/users/:id', (req, res) => {
  console.log(`\n[DELETE /users/${req.params.id}] 删除用户`);

  const userIndex = db.users.findIndex(u => u.id === req.params.id);

  if (userIndex === -1) {
    console.log('用户不存在');
    return res.status(404).json({
      success: false,
      error: '用户不存在'
    });
  }

  db.users.splice(userIndex, 1);

  console.log('删除成功');

  res.json({
    success: true,
    message: '用户已删除'
  });
});

// ===== 全局错误处理中间件 =====

/**
 * ValidationError 错误处理
 * 
 * 自动捕获 validateAsync 抛出的 ValidationError
 * 返回友好的错误信息
 */
app.use((error, req, res, next) => {
  if (error instanceof ValidationError) {
    console.log('\n[错误] ValidationError 被捕获');
    console.log('错误数量:', error.getErrorCount());
    console.log('字段错误:', error.getFieldErrors());

    return res.status(error.statusCode).json(error.toJSON());
  }

  // 其他错误
  console.error('\n[错误] 服务器错误:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message
  });
});

// ===== 启动服务器 =====

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  Express 集成示例服务器已启动`);
  console.log(`  监听端口: ${PORT}`);
  console.log(`========================================\n`);
  console.log(`可用的 API 端点:`);
  console.log(`  POST   http://localhost:${PORT}/users - 创建用户`);
  console.log(`  GET    http://localhost:${PORT}/users - 获取所有用户`);
  console.log(`  GET    http://localhost:${PORT}/users/:id - 获取单个用户`);
  console.log(`  PATCH  http://localhost:${PORT}/users/:id - 部分更新用户`);
  console.log(`  PUT    http://localhost:${PORT}/users/:id - 替换用户`);
  console.log(`  DELETE http://localhost:${PORT}/users/:id - 删除用户`);
  console.log(`\n========================================\n`);

  // 打印测试命令
  printTestCommands();
});

// ===== 测试命令 =====

function printTestCommands() {
  console.log(`测试命令（使用 curl）:\n`);

  console.log(`# 1. 创建用户（成功）`);
  console.log(`curl -X POST http://localhost:${PORT}/users \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"name":"John Doe","email":"john@example.com","password":"password123","age":30,"role":"user"}'\n`);

  console.log(`# 2. 创建用户（失败 - 缺少必填字段）`);
  console.log(`curl -X POST http://localhost:${PORT}/users \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"name":"Jane"}'\n`);

  console.log(`# 3. 创建用户（失败 - 额外字段被拒绝）`);
  console.log(`curl -X POST http://localhost:${PORT}/users \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"name":"Bob","email":"bob@example.com","password":"password123","extraField":"not allowed"}'\n`);

  console.log(`# 4. 获取所有用户`);
  console.log(`curl http://localhost:${PORT}/users\n`);

  console.log(`# 5. 获取单个用户（替换 ID）`);
  console.log(`curl http://localhost:${PORT}/users/1\n`);

  console.log(`# 6. 部分更新用户（成功 - 只更新 name）`);
  console.log(`curl -X PATCH http://localhost:${PORT}/users/1 \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"name":"John Updated"}'\n`);

  console.log(`# 7. 部分更新用户（成功 - 允许额外字段）`);
  console.log(`curl -X PATCH http://localhost:${PORT}/users/1 \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"age":31,"extraField":"allowed"}'\n`);

  console.log(`# 8. 替换用户（成功 - 必须提供所有必填字段）`);
  console.log(`curl -X PUT http://localhost:${PORT}/users/1 \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"name":"John Replaced","email":"john.new@example.com","password":"newpassword123","age":32}'\n`);

  console.log(`# 9. 删除用户`);
  console.log(`curl -X DELETE http://localhost:${PORT}/users/1\n`);

  console.log(`========================================\n`);
}

// 导出 app 用于测试
module.exports = app;

