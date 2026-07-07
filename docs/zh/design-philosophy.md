# Schema-DSL 设计理念

## 核心想法

schema-dsl 的核心是：验证规则应该容易编写、容易存储，也容易跨运行时边界传递。

因此 DSL 会先保持为普通数据，再在验证前编译：

```typescript
import { s, validate } from 'schema-dsl/pure';

const userSchema = s({
  email: 'email!',
  username: s('string:3-32!').label('用户名'),
  age: s.number().min(18).max(120).require()
});

const result = validate(userSchema, {
  email: 'test@example.com',
  username: 'rocky',
  age: 30
});
```

公开文档默认推荐 `schema-dsl/pure` + `s`：

| 入口 | 适合场景 |
|------|----------|
| `s({ email: 'email!' })` | 最短纯 DSL 配置 |
| `s('email!').label('邮箱')` | DSL 种子 + builder 元数据或自定义约束 |
| `s.email().label('邮箱').require()` | 最完整的 TypeScript 方法发现 |

兼容导出 `dsl` 仍会保留，但新的公开示例统一使用更短的 `s` 命名空间。

---

## 为什么选择运行时解析

运行时解析是刻意选择。它让验证规则可以脱离源码存在。

### 动态配置

```typescript
import { s } from 'schema-dsl/pure';

const config = await loadValidationConfig();

const schema = s({
  username: `string:${config.username.min}-${config.username.max}!`,
  email: 'email!'
});
```

当规则来自数据库、租户配置、远程 API 或后台管理界面时，仍然可以使用同一套模式。

### 序列化与传输

```typescript
const schemaConfig = {
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120'
};

await saveSchemaConfig(JSON.stringify(schemaConfig));

const schema = s(schemaConfig);
```

因为规则是数据，所以可以存入 JSON、通过 API 传输、缓存、审阅，并被不同服务复用。

### 多租户规则

```typescript
function getTenantSchema(tenantId: string) {
  const rules = tenantRules[tenantId];

  return s({
    username: `string:${rules.username.min}-${rules.username.max}!`,
    email: 'email!'
  });
}
```

新增租户可以是配置变更，而不是源码变更。

---

## TypeScript 边界

schema-dsl 将编写提示和运行时约束分开：

- 纯 DSL 字符串保持源码紧凑，并支持 `InferDslString<'email!'>` 这类轻量值类型推导。
- `s('...')` 返回公开 builder 类型，因此种子之后的方法有完整编辑器提示。
- `s.xxx()` factory 的方法发现最完整，因为字段从明确 factory 开始。
- 长度范围、正则、自定义验证器、本地化消息和租户规则属于运行时 schema 约束，不会变成精确 TypeScript 值域类型。

直接字符串链式仍是显式 opt-in 路径，适合主动选择 String 扩展体验的项目；它不是默认公开编写路径。

---

## 运行时边界

按隔离需求选择入口：

| 入口 | 是否安装 String 扩展 | 运行时状态 |
|------|----------------------|------------|
| `schema-dsl/pure` | 否 | 共享包级状态 |
| `schema-dsl/runtime` | 否 | 通过 `createRuntime()` 创建隔离状态 |
| root `schema-dsl` | 兼容行为 | 共享包级状态 |

`schema-dsl/runtime` 不导出顶层 `s`，需要先创建 runtime：

```typescript
import { createRuntime } from 'schema-dsl/runtime';

const runtime = createRuntime({
  types: {
    tenantId: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
  }
});

const schema = runtime.s({
  id: 'tenantId!',
  email: runtime.s.email().require()
});
```

---

## 架构流程

```text
DSL 字符串或 builder
  -> 规范化 DSL 定义
  -> JSON Schema 兼容 schema
  -> 编译后的 validator
  -> ValidationResult
```

parser 和 compiler 都是运行时组件，因此同一份 schema 定义可以来自静态源码、配置、数据库记录或 API 响应。

---

## 性能定位

性能很重要，但设计理念页不再承载永久对比结论。当前本地 benchmark 应作为回归基线：

| 场景 | schema-dsl 吞吐 |
|------|-----------|
| S1 简单有效对象 | ~1.672M ops/s |
| S2 无效对象，不做 i18n 格式化 | ~169K ops/s |
| S3 嵌套有效对象 | ~1.443M ops/s |

环境：Node.js v20.20.2，Windows x64，运行时间 2026-07-07T03:20:24.821Z。

调优建议见 [性能优化指南](performance-guide.md)。

---

## 适用场景

当验证规则需要具备以下特征时，schema-dsl 比较合适：

- 足够紧凑，便于编写和审阅
- 可序列化、可传输
- 可从配置或租户数据生成
- 可在前端和后端之间共享
- 可随数据模型导出或生成文档

如果项目要求每条验证规则都精确映射成 TypeScript 静态值域类型，或只关心不含 DSL 的手写热路径，schema-dsl 可能不是最合适的选择。

---

## 对应示例文件

**示例入口**: [design-philosophy.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/design-philosophy.ts)
**说明**: 展示配置规则、序列化、反序列化和验证的设计闭环。
