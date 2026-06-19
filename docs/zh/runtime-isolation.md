# 运行时状态隔离

当框架、worker、插件宿主或多租户进程需要独立的 schema-dsl 运行时状态时，使用 `schema-dsl/runtime`。

`schema-dsl/pure` 只避免自动安装 `String.prototype` 扩展。它仍沿用 root API 的全局 Locale、TypeRegistry、PATTERNS 和默认 Validator 状态。

`schema-dsl/runtime` 不导出顶层 `s`。必须先创建 runtime，再使用该实例上的 `runtime.s(...)`、`runtime.s.email()` 或 `runtime.s(...)`。

## 快速开始

```typescript
import { createRuntime } from 'schema-dsl/runtime';

const runtime = createRuntime({
  locale: 'tenant-a',
  types: {
    tenantId: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
  },
  messages: {
    'tenant.user.missing': {
      code: 'TENANT_USER_MISSING',
      message: 'Tenant user {{#id}} is missing'
    }
  },
  messageProvider: ({ key, locale, fallback }) =>
    key === 'number.min' ? `[${locale}] {{#label}} must be >= {{#limit}}` : fallback
});

const schema = runtime.s({
  id: 'tenantId!',
  age: 'number:18-120'
});

const field = runtime.s.email().label('登录邮箱').require().toSchema();

const result = runtime.validate(schema, { id: 'tenant_demo', age: 16 });
```

`createSchemaDslRuntime()` 与 `createSchemaDslAdapter()` 是 `createRuntime()` 的等价别名。
`runtime.s` 与 `runtime.dsl` 是同一个命名空间对象。`runtime.s.email()` 这类 factory 会使用当前 runtime 自己的类型、pattern、消息和 validator 作用域。

## 隔离范围

| 运行时状态 | `createRuntime()` 是否隔离 |
|------------|:--------------------------:|
| 默认 locale 与单次调用 `locale` | 是 |
| 内联 `messages` 与 `messageProvider` | 是 |
| 自定义 DSL 类型与 `typeResolver` | 是 |
| `phone`、`idCard`、`creditCard`、`licensePlate`、`postalCode`、`passport`、`common` 的 pattern 覆盖 | 是 |
| Validator 实例与缓存 | 是 |
| custom keyword 消息 | 是 |
| 条件分支解析与消息 | 是 |
| 异步 custom validator fallback 消息 | 是 |
| runtime 创建的 `I18nError` | 是 |
| runtime 缓存生命周期与统计 | 是 |
| `runtime.s` / `runtime.dsl` 命名空间自定义 factory | 是 |
| `String.prototype` 安装 | 该入口不会安装 |

## 生命周期 API

runtime 应在 app、plugin 或 worker 生命周期边界创建。请求级差异通过 `validate(..., { locale, messages, messageProvider })` 传入，不要每个请求新建 runtime。

热重载使用 `configure(options, { mode })`：

- `merge` 将新的 messages、types 和 patterns 合并到当前 runtime。
- `replace` 使用 `options` 替换完整 runtime 本地 profile，同时保留内建 pattern 默认值。
- `reset` 清空 runtime 内 messages、types、patterns、strict/type resolver 状态后再应用 `options`。

使用 `clearCache()` 清理 runtime 持有的 validator 缓存，使用 `getStats()` 查看 message/type/pattern/cache 统计，在应用关闭、插件卸载或测试收尾时调用 `dispose()`。`dispose()` 可重复调用；dispose 后继续使用会抛出 `[schema-dsl/runtime] Runtime has been disposed`。

单次验证选项沿用 root helper 约定。当 runtime 验证调用需要拒绝数字或布尔字符串、不要使用 schema-dsl smart coercion 时，可传 `{ coerce: false }`、`{ smartCoerce: false }` 或 `{ coerceTypes: false }`。

## TypeScript 提示

`runtime.s.email()`、`runtime.s('string')`、`runtime.dsl('string')` 和 `runtime.compileField('string')` 返回与普通命名空间相同的链式 builder 形态，因此内建链式方法保留已有 TypeScript 提示。

自定义 runtime DSL 类型通过 `types`、`dynamicTypes` 或 `typeResolver` 传给 `createRuntime()`。自定义 namespace factory 使用 `runtime.registerExtension({ literal, factoryName, schema })`。自定义链式方法仍通过 builder 接口的 TypeScript module augmentation 提供类型声明，并在扩展代码里提供对应运行时方法。

## messageProvider 契约

`messageProvider` 接收：

```typescript
{
  key: string;
  params: Record<string, unknown>;
  locale: string;
  source: 'ajv' | 'customKeyword' | 'conditional' | 'customValidator' | 'i18nError' | 'runtime';
  fallback?: string | { code?: string | number; message: string };
}
```

provider 覆盖标准验证错误表、custom keyword、条件校验、异步 custom validator fallback 消息，以及 runtime 创建的 `I18nError`。显式传入的 `messages` 优先级仍高于 provider fallback。

## 什么时候不需要

如果只需要推荐的公开编写路径、避免原型污染且不需要隔离运行时状态，使用 `schema-dsl/pure`。只有兼容代码明确需要自动 String 链式安装时，才使用 root `schema-dsl`。

---

## 对应示例文件

**示例入口**: [runtime-isolation.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/runtime-isolation.ts)
**说明**: 覆盖隔离的 `createRuntime()` 状态、runtime 作用域 `s` factory、自定义 runtime 扩展、messageProvider、缓存生命周期和验证行为。
