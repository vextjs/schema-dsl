# 扩展概览

当你想扩展 schema-dsl，但还不确定应该使用自定义扩展、校验关键字、runtime 隔离还是插件封装时，先看本页。

扩展系统有多个层次。它们可以组合，但解决的问题不同。

## 我应该用哪种扩展？

| 目标 | 推荐文档 | 典型结果 |
|------|----------|----------|
| 定义一次可复用业务类型 | [自定义扩展](custom-extensions.md) | `'tenant-id:corp!'`、`s('tenant-id:corp!')`、`s.tenantId('corp')` |
| 保留直接 String 链式源码 | [String 扩展](string-extensions.md) | transform 或显式 String 支持 |
| 增加校验关键字 | [自定义校验关键字](add-keyword.md) | `{ type: 'number', isEven: true }` |
| 按 app、tenant、plugin 或 worker 隔离扩展 | [框架集成与目录结构](framework-extension-setup.md)、[运行时隔离](runtime-isolation.md) | `const runtime = createRuntime({ types })` |
| 协调插件安装、卸载与 hook | [插件管理器（高级）](plugin-system.md) | `pluginManager.install(schemaDsl, 'plugin')` |

## 自定义扩展入口

自定义扩展章节统一承载 DSL 字面量、`s('...')` seed builder、`s.xxx()` factory、参数，以及普通业务类型不再暴露自定义 base builder 方法的约定：

```ts
const schema = s({
  compact: 'tenant-id:corp!',
  named: s('tenant-id:corp!').label('租户'),
  typed: s.tenantId('corp').label('租户').require()
});
```

## 全局扩展与 runtime 作用域扩展

如果应用启动期只加载一套扩展，使用 `schema-dsl/pure` 的全局入口：

```ts
import { registerExtensions } from 'schema-dsl/pure';

export const s = registerExtensions([
  {
    literal: 'tenant-id',
    factoryName: 'tenantId',
    segmentMode: 'params',
    params: {
      scope: { kind: 'enum', values: ['tenant', 'corp'], default: 'tenant' }
    },
    schema({ scope }) {
      return {
        type: 'string',
        pattern: scope === 'corp' ? '^corp_[a-z0-9]+$' : '^tenant_[a-z0-9]+$'
      };
    }
  }
] as const);
```

如果框架、插件宿主、租户、测试套件或 worker 需要隔离扩展状态，使用 `schema-dsl/runtime`：

```ts
import { createRuntime } from 'schema-dsl/runtime';

const runtime = createRuntime();

runtime.registerExtensions([
  {
    literal: 'tenant-id',
    factoryName: 'tenantId',
    segmentMode: 'params',
    params: {
      scope: { kind: 'enum', values: ['tenant', 'corp'], default: 'tenant' }
    },
    schema({ scope }) {
      return {
        type: 'string',
        pattern: scope === 'corp' ? '^corp_[a-z0-9]+$' : '^tenant_[a-z0-9]+$'
      };
    }
  }
] as const);
```

## 推荐阅读顺序

1. 可复用业务类型、参数和 `s.xxx()` factory，看 [自定义扩展](custom-extensions.md)。
2. 需要新增 validator keyword，看 [自定义校验关键字](add-keyword.md)。
3. 准备接入真实应用或框架前，看 [框架集成与目录结构](framework-extension-setup.md)。
4. 只有需要插件生命周期和 hook 编排时，再看 [插件管理器（高级）](plugin-system.md)。

---

## 对应示例文件

**示例入口**: [extensions-overview.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/extensions-overview.ts)
**说明**: 并排展示自定义扩展、runtime 作用域类型和自定义校验关键字路径。
