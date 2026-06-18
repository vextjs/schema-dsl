# 自定义 DSL 类型

当你希望复用 `tenant-id!`、`orderCode`、`evenNumber!` 这样的 DSL 字面量时，使用自定义 DSL 类型。

当前版本通过 `TypeRegistry` 提供类型注册能力；如果你更偏向 Builder 侧入口，也可以使用 `DslBuilder.registerType()`，它内部会委托给同一个注册表。

## 什么时候创建自定义 DSL 类型

| 场景 | 示例 |
|------|------|
| 共享业务标识 | `tenant-id!`、`orderCode!` |
| 组织级格式 | `employee-id`、`sku`、`currency-code` |
| 可复用数字规则 | `evenNumber!`、`positiveAmount` |
| 框架级 schema 约定 | `entity-id!`、`resource-key` |

自定义 DSL 类型是一种可复用资产。请在应用、框架或插件启动期注册，然后在任何接受 DSL 字符串的地方使用。

## 使用 TypeRegistry 注册

```javascript
import { TypeRegistry, s } from 'schema-dsl/pure';

TypeRegistry.register('evenNumber', {
  baseSchema: { type: 'number', multipleOf: 2 }
});

const schema = s({ value: 'evenNumber!' });
```

## 使用 DslBuilder 注册

如果你希望统一从 Builder 侧管理自定义类型，也可以这样写：

```javascript
import { DslBuilder } from 'schema-dsl/pure';

DslBuilder.registerType('orderCode', {
  type: 'string',
  pattern: '^ORD\\d{6}$'
});
```

```javascript
import { s } from 'schema-dsl/pure';

const schema = s({
  id: 'orderCode!',
  optionalSku: 'sku'
});
```

## 需要可发现性时添加 factory

如果你希望 `tenant-id!` 和 `s.tenantId()` 同时存在，使用 `s.registerExtension()`：

```ts
import { s } from 'schema-dsl/pure';

s.registerExtension({
  literal: 'tenant-id',
  factoryName: 'tenantId',
  schema: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
});
```

factory 路径详见 [自定义 s.xxx() 工厂](custom-factories.md)。TypeScript 用户应补充 `DslNamespaceFactories` module augmentation，才能获得编辑器提示。

## runtime 作用域自定义类型

如果自定义类型需要按应用、租户、插件、worker 或测试 fixture 隔离，使用 `schema-dsl/runtime`：

```ts
import { createRuntime } from 'schema-dsl/runtime';

const runtime = createRuntime({
  types: {
    tenantId: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
  }
});

const schema = runtime.s({ tenant: 'tenantId!' });
```

这样自定义类型会保留在 runtime 实例中，而不是写入进程级全局注册表。

## 清理与生命周期

当插件或测试只需要移除一个 Builder 侧自定义类型时，使用 `DslBuilder.unregisterType('orderCode')`；只有确实要清空全部自定义类型（例如隔离测试收尾）时，才使用 `DslBuilder.clearCustomTypes()`。

自 `2.0.11` 起，自定义类型注册表在同一 Node.js 进程内会跨 ESM / CJS 入口共享。也就是说，`import { DslBuilder } from 'schema-dsl/pure';` 注册的类型可以被 `import * as schemaDsl from 'schema-dsl/pure'` 解析到，反向也成立。这适用于框架先把用户代码编译成 CJS、再由自身 ESM 链路生成 OpenAPI 或执行校验的场景。

该注册表按设计是进程级全局状态。请在应用或插件启动期一次性注册自定义类型，避免多个依赖分支重复定义同名类型；只有在插件显式卸载或隔离测试收尾时，才调用 `DslBuilder.unregisterType()` / `DslBuilder.clearCustomTypes()`。如果同一进程内同名注册发生多次，最后一次注册会生效。

可复用目录结构详见 [框架集成与目录结构](framework-extension-setup.md)。如果还需要插件生命周期和 hook 编排，再结合 [插件管理器（高级）](plugin-system.md) 使用。

---

## 对应示例文件

**示例入口**: [plugin-type-registration.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/plugin-type-registration.ts)  
**说明**: 覆盖 `TypeRegistry.register()`、`DslBuilder.registerType()`、自定义类型使用，以及通过 `DslBuilder.unregisterType()` / `DslBuilder.clearCustomTypes()` 清理注册状态的路径。

