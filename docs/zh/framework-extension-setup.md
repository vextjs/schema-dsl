# 框架集成与目录结构

> **最后更新**: 2026-06-18

框架接入应把 schema-dsl 扩展当作可复用的应用资产，类似语言包。自定义类型、factory、链式方法、runtime setup 和 transform 配置应放在一个稳定目录里。

## 推荐目录

```text
src/schema-dsl/
  index.ts              # 对外 setup 入口
  types.ts              # 自定义 DSL 字面量和类型注册
  factories.ts          # s.xxx() / runtime.s.xxx() factory
  chain-methods.ts      # builder 方法实现
  transform.ts          # 给构建工具使用的 additionalMethods / additionalTypes
  runtime.ts            # createRuntime() 隔离封装
  locales/
    en-US.ts
    zh-CN.ts
```

这种结构能让自定义类型在服务、测试、worker、OpenAPI 生成和验证链路之间复用。

## 应用级 setup

如果应用启动期只加载一套扩展，使用这种方式：

```ts
import { s, resetRuntimeState } from 'schema-dsl/pure';

export function installSchemaDslExtensions() {
  s.registerExtension({
    literal: 'tenant-id',
    factoryName: 'tenantId',
    schema: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
  });
}

export function resetSchemaDslExtensionsForTests() {
  resetRuntimeState();
}
```

在应用 bootstrap 或框架插件启动时调用一次 installer。

## runtime 作用域 setup

如果每个 app、tenant、plugin、worker 或测试 fixture 都需要隔离扩展状态，使用 runtime 作用域 setup：

```ts
import { createRuntime } from 'schema-dsl/runtime';

export function createAppSchemaRuntime() {
  const runtime = createRuntime({
    types: {
      tenantId: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
    }
  });

  runtime.registerExtension({
    literal: 'tenant-id',
    factoryName: 'tenantId',
    schema: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
  });

  return runtime;
}
```

宿主实例卸载时调用 `runtime.dispose()`。

## transform setup

如果框架会编译直接 String 链式源码，把 transform 配置放在扩展 setup 旁边：

```ts
export const schemaDslTransformOptions = {
  additionalMethods: ['tenantId'],
  additionalTypes: ['tenant-id']
} as const;
```

框架 adapter 可以把这些选项传给 `transformSchemaDsl()` 或 `schemaDslEsbuildPlugin()`。

## TypeScript setup

把 module augmentation 放在会被框架或应用 tsconfig 包含的 `.d.ts` 文件里：

```ts
import type { IDslBuilder } from 'schema-dsl/pure';

declare module 'schema-dsl/pure' {
  interface DslNamespaceFactories {
    tenantId(): IDslBuilder;
  }

  interface IDslBuilder {
    tenantId(): this;
  }
}
```

只有框架作者体验包含直接 String 链式源码时，才增强 `schema-dsl/string-types`。

## 检查清单

- 全局扩展在启动期注册，不要在 request 中注册。
- 框架、租户、worker 和隔离测试边界使用 `createRuntime()`。
- transform 选项与扩展包放在一起维护。
- TypeScript 声明放在扩展包或 setup 模块里。
- 隔离测试中用 `resetRuntimeState()` 清理全局扩展状态。
- 插件或应用卸载时 dispose runtime 实例。

---

## 对应示例文件

**示例入口**: [framework-extension-setup.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/framework-extension-setup.ts)
**说明**: 演示应用级 installer、runtime 作用域 installer、transform 配置、验证和清理。
