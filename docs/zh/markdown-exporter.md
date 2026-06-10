# Markdown 导出器

> **功能**: 将 JSON Schema 导出为人类可读的 Markdown 文档  
> **语言支持**: 中文、英文、日文

---

## 📑 目录

- [快速开始](#快速开始)
- [API 参考](#api-参考)
- [使用示例](#使用示例)
- [多语言支持](#多语言支持)
- [自定义选项](#自定义选项)

---

## 快速开始

### 安装

```bash
npm install schema-dsl
```

### 基本用法

```javascript
const { dsl, exporters } = require('schema-dsl');

// 定义 Schema
const schema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120'
});

// 导出为 Markdown
const markdown = exporters.MarkdownExporter.export(schema, {
  title: '用户注册 API',
  locale: 'zh-CN'
});

console.log(markdown);
```

**生成的 Markdown**:

```markdown
# 用户注册 API

## 字段列表

| 字段名 | 类型 | 必填 | 约束 | 说明 |
|--------|------|------|------|------|
| username | 字符串 | ✅ | 长度: 3-32 | - |
| email | 邮箱 | ✅ | - | - |
| age | 数字 | ❌ | 范围: 18-120 | - |

## 示例数据

\```json
{
  "username": "example",
  "email": "user@example.com"
}
\```

## 约束规则

**必填字段**: `username`, `email`

**可选字段**: `age`
```

---

## API 参考

### MarkdownExporter.export(schema, options)

导出 JSON Schema 为 Markdown 文档。

**参数**:

- `schema` (Object) - JSON Schema 对象
- `options` (Object) - 导出选项
  - `title` (String) - 文档标题，默认: `'Schema 文档'`
  - `locale` (String) - 语言代码，默认: `'en-US'`
    - 支持: `'zh-CN'` (中文), `'en-US'` (英文), `'ja-JP'` (日文)
  - `includeExample` (Boolean) - 是否包含示例数据，默认: `true`
  - `includeDescription` (Boolean) - 是否包含描述，默认: `true`

**返回值**: `String` - Markdown 文本

---

## 使用示例

### 示例 1: 基础用法

```javascript
const schema = dsl({
  name: 'string:1-50!',
  email: 'email!'
});

const markdown = exporters.MarkdownExporter.export(schema, {
  title: '用户信息'
});

console.log(markdown);
```

### 示例 2: 使用标签

```javascript
const schema = dsl({
  name: 'string:1-50!'.label('姓名'),
  email: 'email!'.label('邮箱地址'),
  age: 'number:18-120'.label('年龄')
});

const markdown = exporters.MarkdownExporter.export(schema, {
  title: '用户注册表单',
  locale: 'zh-CN'
});
```

**生成结果**:

| 字段名 | 类型 | 必填 | 约束 | 说明 |
|--------|------|------|------|------|
| name | 字符串 | ✅ | 长度: 1-50 | 姓名 |
| email | 邮箱 | ✅ | - | 邮箱地址 |
| age | 数字 | ❌ | 范围: 18-120 | 年龄 |

### 示例 3: 复杂 Schema

```javascript
const productSchema = dsl({
  'id': 'string:24!'.label('产品ID'),
  'name': 'string:1-100!'.label('产品名称'),
  'price': 'number:0.01-!'.label('价格 (USD)'),
  'stock': 'integer:0-!'.label('库存数量'),
  'category': 'electronics|clothing|books|other!'.label('类别'),
  'tags': 'array:1-10<string:1-20>'.label('标签'),
  'description': 'string:500'.label('产品描述'),
  'active': 'boolean'.label('是否上架')
});

const markdown = exporters.MarkdownExporter.export(productSchema, {
  title: '产品信息 Schema',
  locale: 'zh-CN',
  includeExample: true
});
```

### 示例 4: 不包含示例

```javascript
const markdown = exporters.MarkdownExporter.export(schema, {
  title: 'API 文档',
  includeExample: false  // 不生成示例数据
});
```

---

## 多语言支持

### 支持的语言

| 语言代码 | 语言名称 | 示例 |
|---------|---------|------|
| `zh-CN` | 简体中文 | 字符串、数字、必填 |
| `en-US` | 英文 | String, Number, Required |
| `ja-JP` | 日文 | 文字列、数値、必須 |

### 中文示例

```javascript
const markdown = exporters.MarkdownExporter.export(schema, {
  title: '用户注册 API',
  locale: 'zh-CN'
});
```

**输出**:
- 字段列表 (Fields)
- 类型: 字符串、数字、布尔值
- 必填: ✅ / ❌

### 英文示例

```javascript
const markdown = exporters.MarkdownExporter.export(schema, {
  title: 'User Registration API',
  locale: 'en-US'
});
```

**输出**:
- Fields
- Type: String, Number, Boolean
- Required: ✅ / ❌

### 日文示例

```javascript
const markdown = exporters.MarkdownExporter.export(schema, {
  title: 'ユーザー登録 API',
  locale: 'ja-JP'
});
```

**输出**:
- フィールド一覧
- タイプ: 文字列、数値、ブール値
- 必須: ✅ / ❌

---

## 自定义选项

### 完整配置示例

```javascript
const markdown = exporters.MarkdownExporter.export(schema, {
  // 文档标题
  title: 'API 文档 - 用户模块',
  
  // 语言设置
  locale: 'zh-CN',
  
  // 是否包含示例数据
  includeExample: true,
  
  // 是否包含 Schema 描述
  includeDescription: true
});
```

### 保存为文件

```javascript
const fs = require('fs');

const markdown = exporters.MarkdownExporter.export(schema, {
  title: 'API Documentation',
  locale: 'en-US'
});

// 保存为 Markdown 文件
fs.writeFileSync('./API.md', markdown, 'utf-8');
console.log('Markdown 文档已生成: API.md');
```

---

## 类型映射表

### 基本类型

| Schema 类型 | 中文 | 英文 | 日文 |
|------------|------|------|------|
| string | 字符串 | String | 文字列 |
| number | 数字 | Number | 数値 |
| integer | 整数 | Integer | 整数 |
| boolean | 布尔值 | Boolean | ブール値 |
| array | 数组 | Array | 配列 |
| object | 对象 | Object | オブジェクト |

### 格式类型

| 格式 | 中文 | 英文 | 日文 |
|------|------|------|------|
| email | 邮箱 | Email | メールアドレス |
| url | 网址 | URL | URL |
| date | 日期 | Date | 日付 |
| uuid | UUID | UUID | UUID |

---

## 高级用法

### 与其他导出器结合

```javascript
const { dsl, exporters } = require('schema-dsl');

const schema = dsl({
  username: 'string:3-32!',
  email: 'email!'
});

// 导出为 Markdown (人类可读)
const markdown = exporters.MarkdownExporter.export(schema, {
  title: '用户 Schema',
  locale: 'zh-CN'
});

// 导出为 MongoDB Schema
const mongoSchema = exporters.MongoDBExporter.export(schema, {
  collectionName: 'users'
});

// 导出为 MySQL DDL
const mysqlDDL = exporters.MySQLExporter.export('users', schema);

// 导出为 PostgreSQL DDL
const pgDDL = exporters.PostgreSQLExporter.export('users', schema);

console.log('Markdown 文档:\n', markdown);
console.log('\nMongoDB Schema:\n', mongoSchema);
console.log('\nMySQL DDL:\n', mysqlDDL);
console.log('\nPostgreSQL DDL:\n', pgDDL);
```

---

## 常见问题

### Q: 如何自定义字段说明？

A: 使用 `.label()` 方法：

```javascript
const schema = dsl({
  email: 'email!'.label('用户邮箱地址')
});
```

### Q: 生成的示例数据是什么？

A: 示例数据包含所有**必填字段**，值根据类型和约束自动生成：
- 邮箱: `user@example.com`
- 数字: 使用 `minimum` 或 `0`
- 字符串: `'example'`
- 布尔值: `true`

### Q: 如何隐藏某些字段？

A: Markdown 导出器会导出所有字段。如需隐藏，请在生成前移除字段。

### Q: 支持嵌套对象吗？

A: 当前版本主要支持扁平结构。嵌套对象会显示为 "对象" 类型。

---

## 完整示例

```javascript
const { dsl, exporters } = require('schema-dsl');
const fs = require('fs');

// 定义用户注册 Schema
const userRegistrationSchema = dsl({
  // 基本信息
  'username': 'string:3-32!'.label('用户名'),
  'email': 'email!'.label('邮箱地址'),
  'password': 'string:8-32!'.label('密码'),
  
  // 个人信息
  'realName': 'string:1-50'.label('真实姓名'),
  'age': 'integer:18-120'.label('年龄'),
  'gender': 'male|female|other'.label('性别'),
  
  // 其他
  'acceptTerms': 'boolean!'.label('同意条款')
});

// 生成中文文档
const zhDoc = exporters.MarkdownExporter.export(userRegistrationSchema, {
  title: '用户注册 API 文档',
  locale: 'zh-CN',
  includeExample: true
});

// 生成英文文档
const enDoc = exporters.MarkdownExporter.export(userRegistrationSchema, {
  title: 'User Registration API Documentation',
  locale: 'en-US',
  includeExample: true
});

// 保存文档
fs.writeFileSync('./docs/USER_REGISTRATION_ZH.md', zhDoc);
fs.writeFileSync('./docs/USER_REGISTRATION_EN.md', enDoc);

console.log('✅ 文档已生成');
```

---

## 对应示例文件

**示例入口**: [markdown-exporter.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/markdown-exporter.ts)  
**说明**: 覆盖 `MarkdownExporter.export()` 的中英文文档生成和标题/字段落点检查，适合作为文档导出最小样板。

---

**文档更新日期**: 2026-06-10
**版本**: v2.0.8

