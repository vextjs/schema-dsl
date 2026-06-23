# 框架集成与目录结构

框架接入应把 schema-dsl 扩展当作可复用的应用资产，类似语言包。扩展定义、类型声明、runtime setup 和可选 transform 配置应放在一个稳定目录里。

## 推荐目录

```text
src/schema-dsl/
  index.ts              # 导出配置后的 s / runtime
  extensions.ts         # 自定义 DSL 类型定义数组，单一真相源
  types.d.ts            # 可选，仅动态注册或兼容场景需要
  runtime.ts            # createRuntime() 隔离封装
  transform.ts          # 可选，仅直接 String 链式源码需要
  locales/
    en-US.ts
    zh-CN.ts
```

这种结构能让自定义类型在服务、测试、worker、OpenAPI 生成和验证链路之间复用。

## 应用级 setup

如果应用启动期只加载一套扩展，使用这种方式：

```ts
import { registerExtensions, resetRuntimeState } from 'schema-dsl/pure';

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

export function resetSchemaDslExtensionsForTests() {
  resetRuntimeState();
}
```

业务代码从 `src/schema-dsl/index.ts` 导入这个配置后的 `s`。测试需要清理全局扩展状态时调用 `resetSchemaDslExtensionsForTests()`。

## runtime 作用域 setup

如果每个 app、tenant、plugin、worker 或测试 fixture 都需要隔离扩展状态，使用 runtime 作用域 setup：

```ts
import { createRuntime } from 'schema-dsl/runtime';

export function createAppSchemaRuntime() {
  const runtime = createRuntime();

  const s = runtime.registerExtensions([
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

  return { runtime, s };
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

优先通过 `registerExtensions([... ] as const)` 导出的 `s` 获得 `s.xxx()` 类型提示。只有继续使用动态 `registerExtension()`、旧 module augmentation，或需要给第三方扩展包补类型时，才维护 `.d.ts` 文件：

```ts
import type { IDslBuilder } from 'schema-dsl/pure';

declare module 'schema-dsl/pure' {
  interface DslNamespaceFactories {
    tenantId(): IDslBuilder;
  }
}
```

只有框架作者体验包含直接 String 链式源码时，才增强 `schema-dsl/string-types`。

## 推荐配置

- 应用级扩展通过配置后的 `s` 导出，不要在 request 中动态注册。
- 框架、租户、worker 和隔离测试边界使用 `createRuntime()`。
- 扩展定义作为 DSL、`s('...')` 和 `s.xxx()` 入口的单一真相源。
- 只有支持直接 String 链式源码时才维护 transform 选项。
- TypeScript 提示优先来自 `registerExtensions([... ] as const)`；动态/兼容场景再维护 `.d.ts`。
- 隔离测试中用 `resetRuntimeState()` 清理全局扩展状态。
- 插件或应用卸载时 dispose runtime 实例。

---

## 对应示例文件

**示例入口**: [framework-extension-setup.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/framework-extension-setup.ts)
**说明**: 演示应用级 installer、runtime 作用域 installer、transform 配置、验证和清理。
