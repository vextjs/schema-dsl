# 自定义 s.xxx() 工厂

> **最后更新**: 2026-06-18

当你希望一个可复用类型能从 namespace 对象上被编辑器发现时，使用自定义 factory：

```ts
s.tenantId().label('租户').require()
```

factory 和 DSL 字面量不是一回事。字面量适合紧凑配置（`'tenant-id!'`）；factory 适合方法发现和 typed builder。

## 用一份扩展定义注册 factory

```ts
import { s } from 'schema-dsl/pure';

s.registerExtension({
  literal: 'tenant-id',
  factoryName: 'tenantId',
  schema: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
});

const schema = s({
  tenant: s.tenantId().label('租户').require(),
  owner: 'tenant-id!'
});
```

`literal` 控制 DSL 字符串写法，`factoryName` 控制 `s.xxx()` 方法。两种写法共享同一个 JSON Schema 片段。

## TypeScript 声明

运行时注册会让 factory 在运行时可用。TypeScript 还需要 module augmentation，这样方法才会出现在编辑器提示中：

```ts
import type { IDslBuilder } from 'schema-dsl/pure';

declare module 'schema-dsl/pure' {
  interface DslNamespaceFactories {
    tenantId(): IDslBuilder;
  }
}
```

如果你的扩展包导出安装函数，建议把这段声明放在同一个包里，让下游导入 setup 模块后自然获得 factory 类型。

## 命名与冲突规则

- `factoryName` 必须是合法 JavaScript/TypeScript 标识符。
- 推荐小驼峰，例如 `tenantId`、`orderCode`、`currencyCode`。
- 不要复用内置 factory 名称，例如 `string`、`number`、`email`、`array`、`enum`、`type`。
- 不要使用 namespace helper 保留名，例如 `config`、`if`、`match`、`error`、`defineExtension`、`registerExtension`。

## runtime 作用域 factory

框架、租户、插件宿主和隔离测试可以把 factory 挂到 runtime 实例上：

```ts
import { createRuntime } from 'schema-dsl/runtime';

const runtime = createRuntime();

runtime.registerExtension({
  literal: 'tenant-id',
  factoryName: 'tenantId',
  schema: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
});

const schema = runtime.s({
  tenant: runtime.s.tenantId().require()
});
```

这样 factory 只存在于 `runtime.s` 上，不会修改进程级 namespace。

## 与链式方法的关系

`s.tenantId()` 是从自定义类型创建 builder。它不会自动给所有字符串 builder 增加 `.tenantId()` 方法。如果你想写 `s('string!').tenantId()`，请看 [自定义链式方法](custom-chain-methods.md)。

---

## 对应示例文件

**示例入口**: [custom-factories.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/custom-factories.ts)
**说明**: 在 `s` 上注册自定义 factory，同时演示对应 DSL 字面量和 runtime 作用域 factory。
