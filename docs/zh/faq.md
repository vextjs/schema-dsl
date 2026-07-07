# 常见问题解答 (FAQ)

## 基础问题

### Q: schema-dsl 适合解决什么问题？

**A**: schema-dsl 适合把验证规则写成紧凑、可序列化、便于在配置、API、前端表单和后端服务之间共享的形式。

```typescript
import { s } from 'schema-dsl/pure';

const schema = s({
  username: 'string:3-32!',
  email: 'email!'
});
```

**主要区别**：
- 更简洁的 DSL 语法
- 字段需要元数据或自定义约束时，可继续使用链式 builder
- 支持数据库 Schema 导出
- 内置常见验证器（username、password、phone）
- 基于 JSON Schema 标准

---

### Q: 如何安装 schema-dsl？

```bash
npm install schema-dsl
```

**Node.js 版本要求**：`>=18.0.0`

当前版本以 `Node.js >=18.0.0` 为运行时基线，不再承诺旧 Node 版本兼容。

---

### Q: 支持 ES Modules 吗？

**A**: 支持。

```javascript
// 公开文档推荐入口
import { s, validate } from 'schema-dsl/pure';

const schema = s({ email: 'email!' });
const result = validate(schema, { email: 'test@example.com' });
```

### Q: i18n 目录加载支持哪些语言包文件格式？

**A**: 在 **Node.js >= 18.0.0** 下，`s.config({ i18n: '/path/to/locales' })` 默认支持：

- `.js`（CommonJS 语言包）
- `.cjs`
- `.json`
- `.jsonc`
- `.json5`

**推荐**：如果你的项目是 `type: module` / ESM，优先使用 `.cjs`、`.json`、`.jsonc`、`.json5`，兼容性最稳定。

`.js` / `.cjs` 语言包会作为可信 Node 代码执行。如果 locale 目录可能包含不可信文件，请配置 `s.config({ i18n: '/path/to/locales', codeLocaleFiles: 'deny' })`，仅加载 `.json`、`.jsonc`、`.json5`。

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
import { s } from 'schema-dsl/pure';

const schema = s({
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

**A**: String 扩展属于显式兼容/易用性路径。新的公开示例默认使用 `schema-dsl/pure` + `s`，因为它同时支持纯 DSL 字符串、`s('...')` 和 `s.xxx()`，并且不会往 `String.prototype` 上安装方法。

```typescript
import { s } from 'schema-dsl/pure';

const schema = s({
  email: s('email!')
    .label('邮箱地址')
    .messages({
      'required': '{{#label}}不能为空',
      'format': '请输入有效的{{#label}}'
    }),

  username: s('string:3-32!')
    .pattern(/^[a-z0-9_]+$/)
    .label('用户名')
    .username('medium')
});
```

如果确实想使用直接字符串链式，请参考 [String 扩展](string-extensions.md) 中的显式 runtime/type 入口。

---

## 验证问题

### Q: 如何验证数据？

**A**: 使用 `validate()` 函数或 `Validator` 类：

```javascript
// 方式1：便捷函数
import { s, validate } from 'schema-dsl/pure';

const schema = s({ email: 'email!' });
const result = validate(schema, data);

// 方式2：Validator 实例
import { Validator } from 'schema-dsl/pure';

const validator = new Validator();
const result = validator.validate(schema, data);
```

---

### Q: 验证结果的格式是什么？

**A**: 返回对象包含：

```javascript
{
  valid: true/false,      // 是否通过
  data: {},               // 当前实现会返回本次验证数据，失败时也便于定位输入
  errors: []              // 成功时为空数组，失败时包含详细错误
}
```

---

### Q: 如何获取所有错误而不是只有第一个？

**A**: 默认就会返回全部错误。如果你只想保留首条错误，可以显式关闭 `allErrors`：

```javascript
validate(schema, data, { allErrors: false });
```

如果你需要一个提前停止的 Validator，也可以使用 `new Validator({ allErrors: false })`。注意：构造期已经关闭 `allErrors` 的 Validator 无法在单次调用时恢复 AJV 没有收集的错误；默认 Validator 和 root helpers 可以通过 `{ allErrors: false }` 在单次调用中只保留首条格式化错误。

---

### Q: 如何使用默认值？

**A**: 使用 `.default()` 方法：

```javascript
import { s, validate } from 'schema-dsl/pure';

const schema = s({
  status: s('string').default('active'),
  count: s('integer').default(0)
});

const result = validate(schema, {});
console.log(result.data);
// { status: 'active', count: 0 }
```

---

## 性能问题

### Q: schema-dsl 的性能怎么样？

**A**: 当前 benchmark 应作为项目本地吞吐证据，而不是永久营销结论。最新本地运行记录如下：

| 场景 | schema-dsl 吞吐 |
|------|-----------|
| S1 简单有效对象 | ~1.672M ops/s |
| S2 无效对象，不做 i18n 格式化 | ~169K ops/s |
| S3 嵌套有效对象 | ~1.443M ops/s |

**结论**:
- ✅ 在这台本地机器上，热路径验证已处于百万 ops/sec 级别。
- ✅ 内置缓存可避免复用 schema 时重复解析。
- ✅ 这些数字适合作为回归基线；运行时、依赖或 schema 复杂度变化后应重新跑 benchmark。

**环境**: Node.js v20.20.2，Windows x64，运行时间 2026-07-07T03:20:24.821Z。

---

### Q: 有效/无效数据场景性能差异为什么大？

**A**: 无效数据吞吐高度依赖错误收集和格式化方式。schema-dsl 会把热验证路径和本地化消息渲染分开，因此原始无效数据 benchmark 可以接近有效数据 benchmark。启用自定义格式化、i18n 或大型嵌套错误输出后，应使用自己的真实 schema 与错误输出重新测量。

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
    ttl: 0           // 不按时间过期，由 LRU 管理生命周期
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

**A**: schema-dsl 当前通过 `CacheManager` 委托 `cache-hub` 的 `MemoryCache` 实现编译缓存：

```javascript
const validator = new Validator({
  cache: {
    maxSize: 5000,   // 最大缓存5000条
    ttl: 0           // 不按时间过期，由 LRU 管理生命周期
  }
});

// 缓存统计
const stats = validator.getCacheStats();
console.log(stats);
// {
//   hits: 8500,
//   misses: 150,
//   hitRate: '98.27',
//   size: 150,
//   maxSize: 5000,
//   enabled: true
// }
```

---

### Q: 如何批量验证？

**A**: 使用 `SchemaUtils.validateBatch()`：

```javascript
import { SchemaUtils, Validator } from 'schema-dsl/pure';

const validator = new Validator();
const batch = SchemaUtils.validateBatch(schema, [data1, data2, data3], validator.getAjv());

console.log(batch.summary.valid);
console.log(batch.results[0].valid);
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
1. 只追求绝对吞吐量，且不需要 DSL 动态能力
2. 需要把每个值约束都建模成 TypeScript 静态类型
3. 验证规则完全静态，永远不需要序列化、存储或配置化编辑

---

### Q: 为什么不做成纯编译时库？

**A**: 因为会失去核心价值：

**失去的能力**:
```javascript
// ❌ 无法从数据库读取规则
const rules = await db.findOne({ entity: 'user' });
const schema = s(rules);

// ❌ 无法多租户动态规则
function getTenantSchema(tenantId) {
  return s(tenantConfig[tenantId]);
}

// ❌ 无法通过 API 传输
res.json({ validationRules: rules });

// ❌ 无法后台配置表单验证
```

**保留的能力**:
```javascript
// ✅ 完全动态
const schema = s({
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
- 增益：规则紧凑、可序列化，可跨运行时边界存储、传输、编辑和共享
- 成本：TypeScript 无法把每个 DSL 约束都细化成精确静态值域类型

---

## 错误处理

### Q: 如何自定义错误消息？

**A**: 使用 `.messages()` 方法：

```javascript
username: s('string:3-32!').label('用户名')
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
import { Locale } from 'schema-dsl/pure';

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

**A**: 当前返回的是 slash path：

```javascript
'username'           // 顶层字段
'user/name'          // 嵌套字段
'items/0/name'       // 数组元素
```

---

## 数据库导出

### Q: 如何导出为 MongoDB Schema？

```javascript
import { exporters } from 'schema-dsl/pure';

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
username: s('string:3-32!').description('用户登录名，只能包含字母数字')
```

MySQL 会生成 `COMMENT`，PostgreSQL 会生成 `COMMENT ON COLUMN`。

---

## TypeScript 支持

### Q: schema-dsl 支持 TypeScript 吗？

**A**: 支持。公开 TypeScript 示例推荐 `schema-dsl/pure` + `s`：简单字段用纯 DSL 字符串，需要 builder 提示时用 `s('...')`，需要最完整方法发现时用 `s.xxx()` factory。

```typescript
import { s, validate, Validator } from 'schema-dsl/pure';

const schema = s({
  username: 'string:3-32!',
  email: s('email!').label('邮箱地址').error({
    required: '请输入邮箱地址'
  })
});

const validator = new Validator({ allErrors: true });
const result = validate(schema, data);
if (result.valid) {
  console.log(result.data);
}
```

---

### Q: TypeScript 下如何写出更稳妥的链式提示？

**A**: 想保留 DSL 语法并获得 builder 方法提示时，建议从 `s('...')` 开始链式调用：

```typescript
const schema = s({
  email: s('email!')
    .label('邮箱')
    .error({ format: '请输入有效邮箱地址' })
});
```

---

## 更多问题

如果您有其他问题：

1. 查看 [完整文档](doc-index.md)
2. 查看 [DSL 语法指南](dsl-syntax.md)
3. 查看 [API 参考](api-reference.md)
4. 提交 [GitHub Issue](https://github.com/vextjs/schema-dsl/issues)

---

## 相关文档

- [快速开始](quick-start.md)
- [DSL 语法](dsl-syntax.md)
- [验证指南](validation-guide.md)
- [导出指南](export-guide.md)
- [错误处理](error-handling.md)

---

## 对应示例文件

**示例入口**: [faq.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/faq.ts)  
**说明**: 把 FAQ 里最常被复制的 4 类场景放在一个可运行示例中: 单次验证、多语言错误、批量验证、缓存统计。

