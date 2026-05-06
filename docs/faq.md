# 常见问题解答 (FAQ)

> **更新时间**: 2025-12-25  


---

## 📑 目录

- [基础问题](#基础问题)
- [DSL 语法问题](#dsl-语法问题)
- [验证问题](#验证问题)
- [性能问题](#性能问题)
- [设计理念](#设计理念)
- [错误处理](#错误处理)
- [数据库导出](#数据库导出)
- [TypeScript 支持](#typescript-支持)

---

## 基础问题

### Q: SchemaI-DSL 和 Joi、Yup 有什么区别？

**A**: SchemaI-DSL 采用 DSL 语法，更简洁：

```javascript
// SchemaI-DSL - 简洁
const schema = dsl({
  username: 'string:3-32!',
  email: 'email!'
});

// Joi - 繁琐
const schema = Joi.object({
  username: Joi.string().min(3).max(32).required(),
  email: Joi.string().email().required()
});
```

**主要区别**：
- 更简洁的 DSL 语法
- 支持数据库 Schema 导出
- 内置常见验证器（username、password、phone）
- 基于 JSON Schema 标准

---

### Q: 如何安装 SchemaI-DSL？

```bash
npm install schema-dsl
```

**Node.js 版本要求**：`>=18.0.0`

当前 TypeScript 重构版以 `Node.js >=18.0.0` 为唯一运行时基线，不再承诺旧 Node 版本兼容。

---

### Q: 支持 ES Modules 吗？

**A**: 支持。

```javascript
// CommonJS
const { dsl, validate } = require('schema-dsl');

// ES Modules（named import）
import { dsl, validate } from 'schema-dsl';

// ES Modules（default import）
import dslDefault from 'schema-dsl';
```

### Q: i18n 目录加载支持哪些语言包文件格式？

**A**: 在 **Node.js >= 18.0.0** 下，`dsl.config({ i18n: '/path/to/locales' })` 默认支持：

- `.js`（CommonJS 语言包）
- `.cjs`
- `.json`
- `.jsonc`
- `.json5`

**推荐**：如果你的项目是 `type: module` / ESM，优先使用 `.cjs`、`.json`、`.jsonc`、`.json5`，兼容性最稳定。

---

## DSL 语法问题

### Q: `'string:3-32!'` 是什么意思？

**A**: 这是 DSL 语法：
- `string` - 类型
- `3-32` - 长度范围（最小3，最大32）
- `!` - 必填

更多示例：
```javascript
'string:10'      // 最大长度10
'string:3-'      // 最小长度3
'number:0-100'   // 数值范围0-100
'email!'         // 必填邮箱
'a|b|c'          // 枚举值
```

---

### Q: 如何定义数组？

**A**: 使用 `array` 类型：

```javascript
// 简单数组
tags: 'array'

// 带长度约束
tags: 'array:1-10'      // 1-10个元素
tags: 'array!1-10'      // 必填，1-10个元素

// 带元素类型
tags: 'array<string>'   // 字符串数组
tags: 'array<number>'   // 数字数组
tags: 'array<string:1-20>'  // 带约束的字符串数组
```

---

### Q: 如何定义嵌套对象？

**A**: 直接嵌套即可：

```javascript
const schema = dsl({
  user: {
    name: 'string!',
    address: {
      city: 'string!',
      zip: 'string:5-10!'
    }
  }
});
```

---

### Q: 如何使用 String 扩展？

**A**: 字符串可以直接链式调用方法：

```javascript
const schema = dsl({
  email: 'email!'
    .label('邮箱地址')
    .messages({
      'required': '{{#label}}不能为空',
      'format': '请输入有效的{{#label}}'
    }),

  username: 'string:3-32!'
    .pattern(/^[a-z0-9_]+$/)
    .label('用户名')
    .username('medium')
});
```

---

## 验证问题

### Q: 如何验证数据？

**A**: 使用 `validate()` 函数或 `Validator` 类：

```javascript
// 方式1：便捷函数
const { dsl, validate } = require('schema-dsl');
const result = validate(schema, data);

// 方式2：Validator 实例
const { Validator } = require('schema-dsl');
const validator = new Validator();
const result = validator.validate(schema, data);
```

---

### Q: 验证结果的格式是什么？

**A**: 返回对象包含：

```javascript
{
  valid: true/false,    // 是否通过
  errors: [],           // 错误数组（如果有）
  data: {},             // 验证后的数据（可能包含默认值）
  performance: {        // 性能信息
    duration: 1.5       // 验证耗时（毫秒）
  }
}
```

---

### Q: 如何获取所有错误而不是只有第一个？

**A**: 默认就是返回所有错误。如果只需要第一个：

```javascript
const validator = new Validator({ allErrors: false });
```

---

### Q: 如何使用默认值？

**A**: 使用 `.default()` 方法：

```javascript
const schema = dsl({
  status: 'string'.default('active'),
  count: 'integer'.default(0)
});

const result = validate(schema, {});
console.log(result.data);
// { status: 'active', count: 0 }
```

---

## 性能问题

### Q: Schema-DSL 的性能怎么样？

**A**: 性能优秀，排名第3：

| 库名 | 每秒操作数 | 排名 |
|------|-----------|------|
| Ajv | 2,000,000 ops/s | 🥇 第1 |
| Zod | 526,316 ops/s | 🥈 第2 |
| **Schema-DSL** | **277,778 ops/s** | 🥉 **第3** |
| Joi | 97,087 ops/s | 第4 |
| Yup | 60,241 ops/s | 第5 |

**结论**:
- ✅ 比 Joi 快 **2.86倍**
- ✅ 比 Yup 快 **4.61倍**
- ✅ 对大多数应用足够（27万+ ops/s）

---

### Q: 为什么比 Zod 慢？

**A**: 因为 Schema-DSL 使用**运行时解析 DSL**，而 Zod 是**编译时构建**。

**权衡**:
```text
损失: 比 Zod 慢 1.9倍
换来:
  ✅ 代码量减少 65%
  ✅ 完全动态的验证规则
  ✅ 多租户/配置驱动支持
  ✅ 前后端共享规则
```

---

### Q: 什么时候性能会成为瓶颈？

**A**: 以下场景才可能成为瓶颈：

1. **API 网关**（每秒 >50万次验证）
2. **高并发服务**（每秒 >50万次请求）
3. **实时数据处理**（毫秒级延迟要求）

**大多数应用**（每秒 <10万次验证）不会遇到性能瓶颈。

---

### Q: 验证速度慢怎么办？

**A**: 使用预编译和缓存：

```javascript
// 1. 使用预编译
const validator = new Validator();
const validateUser = validator.compile(userSchema);

// 2. 启用缓存

const validator = new Validator({
  cache: {
    maxSize: 5000,   // 缓存5000个Schema
    ttl: 3600000     // 1小时过期
  }
});

// 3. 复用 Validator 实例
// ❌ 错误：每次都创建新实例
app.post('/api/users', (req, res) => {
  const validator = new Validator();  // 慢
  // ...
});

// ✅ 正确：复用实例
const validator = new Validator();
app.post('/api/users', (req, res) => {
  const result = validator.validate(schema, req.body);  // 快
  // ...
});
```

---

### Q: 缓存如何工作？

**A**: SchemaI-DSL 内置 LRU 缓存：

```javascript
const validator = new Validator({
  cache: {
    maxSize: 5000,   // 最大缓存5000条
    ttl: 3600000     // 1小时过期
  }
});

// 缓存统计
const stats = validator.cache.getStats();
console.log(stats);
// {
//   size: 150,      // 当前缓存数
//   hits: 8500,     // 缓存命中次数
//   misses: 150,    // 缓存未命中次数
//   evictions: 0    // 驱逐次数
// }
```

---

### Q: 如何批量验证？

**A**: 使用 `validateBatch()`：

```javascript
const results = validator.validateBatch(schema, [data1, data2, data3]);
// 返回结果数组
```

---

## 设计理念

### Q: 为什么选择运行时解析而不是编译时构建？

**A**: 这是有意的设计选择，优先考虑**灵活性**而非**极致性能**。

**运行时解析的优势**:
1. ✅ **完全动态** - 可从配置/数据库动态生成规则
2. ✅ **多租户支持** - 每个租户不同规则，零代码修改
3. ✅ **可序列化** - 可存储、传输、共享
4. ✅ **前后端共享** - 一套规则，两端使用
5. ✅ **低代码基础** - 可视化配置表单验证

**编译时构建的限制**:
- ❌ Schema 固定，无法动态调整
- ❌ 无法序列化和传输
- ❌ 多租户困难
- ❌ 无法从数据库读取规则

**详细说明**: [设计理念文档](design-philosophy.md)

---

### Q: Schema-DSL 适合什么场景？

**A**: ✅ **最适合的场景**:

1. **多租户 SaaS 系统** - 每个租户不同验证规则
2. **后台管理系统** - 管理员配置表单验证
3. **配置驱动开发** - 验证规则存储在配置/数据库
4. **低代码/无代码平台** - 可视化表单构建器
5. **快速原型开发** - 5分钟上手，代码量最少
6. **前后端共享验证** - 一套规则，两端使用

⚠️ **不适合的场景**:
1. 极致性能要求（>50万 ops/s）→ 推荐 **Zod** 或 **Ajv**
2. TypeScript 强类型推断 → 推荐 **Zod**
3. 静态验证规则 → 推荐 **Zod**

---

### Q: 为什么不做成像 Zod 那样的编译时库？

**A**: 因为会失去核心价值：

**失去的能力**:
```javascript
// ❌ 无法从数据库读取规则
const rules = await db.findOne({ entity: 'user' });
const schema = dsl(rules);

// ❌ 无法多租户动态规则
function getTenantSchema(tenantId) {
  return dsl(tenantConfig[tenantId]);
}

// ❌ 无法通过 API 传输
res.json({ validationRules: rules });

// ❌ 无法后台配置表单验证
```

**保留的能力**:
```javascript
// ✅ 完全动态
const schema = dsl({
  username: `string:${config.min}-${config.max}!`
});

// ✅ 可序列化
JSON.stringify({ username: 'string:3-32!' });

// ✅ 前后端共享
// 后端定义 → API传输 → 前端使用
```

---

### Q: 性能和灵活性如何平衡？

**A**: Schema-DSL 的设计优先级：

```text
灵活性 > 易用性 > 性能
```

**权衡结果**:
- 损失：比 Zod 慢 1.9倍
- 换来：完全的动态性 + 代码量减少 65%
- 结论：对大多数应用（<10万 ops/s）足够

**如果需要极致性能**: 推荐使用 Zod（526k ops/s）或 Ajv（2M ops/s）

---

## 错误处理

### Q: 如何自定义错误消息？

**A**: 使用 `.messages()` 方法：

```javascript
username: 'string:3-32!'
  .label('用户名')
  .messages({
    'min': '{{#label}}太短了',
    'max': '{{#label}}太长了',
    'required': '请输入{{#label}}'
  })
```

---

### Q: 如何支持多语言？

**A**: 使用 `Locale` 类：

```javascript
const { Locale } = require('schema-dsl');

// 添加语言包
Locale.addLocale('zh-CN', {
  'required': '{{#label}}不能为空',
  'min': '{{#label}}长度不能少于{{#limit}}'
});

// 验证时指定语言
validator.validate(schema, data, { locale: 'zh-CN' });
```

---

### Q: 错误路径格式是什么？

**A**: JSON Pointer 格式：

```javascript
'/username'           // 顶层字段
'/user/name'          // 嵌套字段
'/items/0/name'       // 数组元素
```

---

## 数据库导出

### Q: 如何导出为 MongoDB Schema？

```javascript
const { exporters } = require('schema-dsl');

const exporter = new exporters.MongoDBExporter();
const mongoSchema = exporter.export(schema);
```

---

### Q: 如何导出为 MySQL DDL？

```javascript
const exporter = new exporters.MySQLExporter();
const ddl = exporter.export('table_name', schema);
```

---

### Q: 如何导出为 PostgreSQL DDL？

```javascript
const exporter = new exporters.PostgreSQLExporter({ schema: 'public' });
const ddl = exporter.export('table_name', schema);
```

---

### Q: 导出时如何添加注释？

**A**: 使用 `.description()`：

```javascript
username: 'string:3-32!'
  .description('用户登录名，只能包含字母数字')
```

MySQL 会生成 `COMMENT`，PostgreSQL 会生成 `COMMENT ON COLUMN`。

---

## TypeScript 支持

### Q: SchemaI-DSL 支持 TypeScript 吗？

**A**: 支持，类型定义在 `index.d.ts`：

```typescript
import { dsl, validate, DslBuilder, Validator } from 'schema-dsl';

const schema = dsl({
  username: 'string:3-32!',
  email: 'email!'
});

const result = validate(schema, data);
if (result.valid) {
  console.log(result.data);
}
```

---

### Q: 如何获得 String 扩展的类型提示？

**A**: 类型定义包含全局 String 扩展：

```typescript
// TypeScript 会识别这些方法
const schema = dsl({
  email: 'email!'.label('邮箱').messages({ ... })
});
```

---

## 更多问题

如果您有其他问题：

1. 查看 [完整文档](doc-index.md)
2. 查看 [DSL 语法指南](dsl-syntax.md)
3. 查看 [API 参考](api-reference.md)
4. 提交 [GitHub Issue](https://github.com/schema-dsl/schema-dsl/issues)

---

## 相关文档

- [快速开始](quick-start.md)
- [DSL 语法](dsl-syntax.md)
- [验证指南](validation-guide.md)
- [导出指南](export-guide.md)
- [错误处理](error-handling.md)

