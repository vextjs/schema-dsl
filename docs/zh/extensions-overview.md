# 扩展概览

> **最后更新**: 2026-06-18

当你想扩展 schema-dsl，但还不确定应该扩展自定义类型、`s.xxx()` 工厂、链式方法、校验关键字还是插件管理器时，先看本页。

扩展系统有多个层次。它们可以组合，但解决的问题不同。

## 我应该用哪种扩展？

| 目标 | 推荐文档 | 典型结果 |
|------|----------|----------|
| 复用 `tenantId!` 这样的 DSL 字面量 | [自定义 DSL 类型](plugin-type-registration.md) | `s({ tenant: 'tenantId!' })` |
| 暴露可发现的 factory | [自定义 s.xxx() 工厂](custom-factories.md) | `s.tenantId().require()` |
| 增加 builder 方法 | [自定义链式方法](custom-chain-methods.md) | `s('string!').tenantId()` |
| 保留直接 String 链式源码 | [自定义链式方法](custom-chain-methods.md)、[String 扩展](string-extensions.md) | transform 或显式 String 支持后的 `'string!'.tenantId()` |
| 增加校验关键字 | [自定义校验关键字](add-keyword.md) | `{ type: 'number', isEven: true }` |
| 按 app、tenant、plugin 或 worker 隔离扩展 | [框架集成与目录结构](framework-extension-setup.md)、[运行时隔离](runtime-isolation.md) | `const runtime = createRuntime({ types })` |
| 协调插件安装、卸载与 hook | [插件管理器（高级）](plugin-system.md) | `pluginManager.install(schemaDsl, 'plugin')` |
| 在一个扩展包里组合多种能力 | [高级扩展组合指南](custom-extensions-guide.md) | type + factory + keyword + locale |

## 三个 schema 编写层

自定义扩展最好按三个层次理解：

| 层次 | 控制什么 | 示例 |
|------|----------|------|
| DSL 类型 | 被 DSL parser 解析的可复用字面量 | `tenantId!` |
| namespace factory | `s` / `dsl` 上可点调用的方法 | `s.tenantId()` |
| 链式方法 | 已有 builder 上的新方法 | `s('string!').tenantId()` |

`registerExtension({ literal, factoryName, schema })` 可以用一份定义同时暴露前两个层次。自定义链式方法是另一件事，因为它还需要运行时 builder 方法和 TypeScript 接口增强。

## 全局扩展与 runtime 作用域扩展

如果应用启动期只加载一套扩展，使用 `schema-dsl/pure` 的全局入口：

```ts
import { s } from 'schema-dsl/pure';

s.registerExtension({
  literal: 'tenant-id',
  factoryName: 'tenantId',
  schema: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
});
```

如果框架、插件宿主、租户、测试套件或 worker 需要隔离扩展状态，使用 `schema-dsl/runtime`：

```ts
import { createRuntime } from 'schema-dsl/runtime';

const runtime = createRuntime({
  types: {
    tenantId: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
  }
});
```

## 推荐阅读顺序

1. 想复用字面量，先看 [自定义 DSL 类型](plugin-type-registration.md)。
2. 想要编辑器可发现的 factory，看 [自定义 s.xxx() 工厂](custom-factories.md)。
3. 想增加 builder 方法，看 [自定义链式方法](custom-chain-methods.md)。
4. 准备接入真实应用或框架前，看 [框架集成与目录结构](framework-extension-setup.md)。
5. 只有需要插件生命周期和 hook 编排时，再看 [插件管理器（高级）](plugin-system.md)。

---

## 对应示例文件

**示例入口**: [extensions-overview.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/extensions-overview.ts)
**说明**: 并排展示自定义 DSL 类型、namespace factory、runtime 作用域类型和自定义校验关键字四条路径。
