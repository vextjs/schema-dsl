/**
 * 数据库导出示例
 *
 * 演示如何将JSON Schema导出为MongoDB、MySQL、PostgreSQL Schema
 * 包含v2.0.1 String扩展特性
 */

const { dsl, exporters } = require('../index');

// ========== 1. 定义用户Schema（使用String扩展）==========

const userSchema = dsl({
  id: 'string!',
  // ✨ String扩展：username带正则验证
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('用户名'),
  // ✨ String扩展：email带标签
  email: 'email!'
    .label('邮箱地址'),
  password: 'string:8-64!',
  age: 'number:18-120',
  gender: 'male|female|other',
  status: 'active|inactive|pending',
  role: 'user|admin|moderator',
  createdAt: 'date!',
  updatedAt: 'date!',
  profile: {
    bio: 'string:500',
    // ✨ String扩展：website带描述
    website: 'url'.description('个人主页'),
    avatar: 'url'.label('头像URL'),
    location: 'string:100'
  },
  preferences: {
    language: 'en|zh|ja|ko',
    theme: 'light|dark|auto',
    emailNotifications: 'boolean',
    smsNotifications: 'boolean'
  }
});

console.log('========== 用户Schema（JSON Schema格式） ==========');
console.log(JSON.stringify(userSchema, null, 2));

// ========== 2. 导出为MongoDB Schema ==========

console.log('\n========== MongoDB验证Schema ==========');
const mongoExporter = new exporters.MongoDBExporter({ strict: true });
const mongoSchema = mongoExporter.export(userSchema);
console.log(JSON.stringify(mongoSchema, null, 2));

// 生成MongoDB命令
console.log('\n========== MongoDB创建集合命令 ==========');
const mongoCommand = mongoExporter.generateCommand('users', userSchema);
console.log(mongoCommand);

// ========== 3. 导出为MySQL DDL ==========

console.log('\n========== MySQL CREATE TABLE ==========');
const mysqlExporter = new exporters.MySQLExporter({
  engine: 'InnoDB',
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci'
});
const mysqlDDL = mysqlExporter.export('users', userSchema);
console.log(mysqlDDL);

// 生成索引
console.log('\n========== MySQL索引 ==========');
console.log(mysqlExporter.generateIndex('users', 'username', { unique: true }));
console.log(mysqlExporter.generateIndex('users', 'email', { unique: true }));
console.log(mysqlExporter.generateIndex('users', 'status'));

// ========== 4. 导出为PostgreSQL DDL ==========

console.log('\n========== PostgreSQL CREATE TABLE ==========');
const pgExporter = new exporters.PostgreSQLExporter({ schema: 'public' });
const pgDDL = pgExporter.export('users', userSchema);
console.log(pgDDL);

// 生成索引
console.log('\n========== PostgreSQL索引 ==========');
console.log(pgExporter.generateIndex('users', 'username', { unique: true, method: 'btree' }));
console.log(pgExporter.generateIndex('users', 'email', { unique: true, method: 'btree' }));
console.log(pgExporter.generateIndex('users', 'status', { method: 'hash' }));

// ========== 5. 多表导出示例 ==========

console.log('\n========== 多表导出示例 ==========');

// 文章表
const articleSchema = dsl({
  id: 'string!',
  title: 'string:1-200!',
  content: 'string!',
  authorId: 'string!',
  categoryId: 'string!',
  status: 'draft|published|archived',
  tags: 'array<string:1-50>',
  viewCount: 'number',
  likeCount: 'number',
  createdAt: 'date!',
  updatedAt: 'date!'
});

// 评论表
const commentSchema = dsl({
  id: 'string!',
  articleId: 'string!',
  userId: 'string!',
  content: 'string:1-500!',
  parentId: 'string',
  status: 'pending|approved|rejected',
  createdAt: 'date!'
});

console.log('\n--- MySQL多表DDL ---');
console.log(mysqlExporter.export('articles', articleSchema));
console.log('\n');
console.log(mysqlExporter.export('comments', commentSchema));

console.log('\n--- PostgreSQL多表DDL ---');
console.log(pgExporter.export('articles', articleSchema));
console.log('\n');
console.log(pgExporter.export('comments', commentSchema));

console.log('\n✅ 数据库导出示例完成！');


