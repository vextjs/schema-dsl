# 自定义链式方法

> **最后更新**: 2026-06-18

当你想给已有 builder 增加方法时，看本页：

```ts
s('string!').tenantId().label('租户')
```

这和自定义 DSL 类型、`s.xxx()` factory 都不是一回事。

| 扩展类型 | 示例 | 含义 |
|----------|------|------|
| 自定义 DSL 类型 | `'tenant-id!'` | 被 DSL parser 解析成 schema 的字面量。 |
| 自定义 factory | `s.tenantId()` | 创建 builder 的 namespace 方法。 |
| 自定义链式方法 | `s('string!').tenantId()` | 添加到已有 builder 上的方法。 |

## 添加运行时 builder 方法

`registerExtension()` 可以注册 DSL 字面量和 namespace factory，但不会自动给 `DslBuilder.prototype` 增加方法。扩展 setup 里需要提供运行时方法：

```ts
import { DslBuilder, type IDslBuilder } from 'schema-dsl/pure';

export function installTenantIdChainMethod() {
  const proto = DslBuilder.prototype as unknown as {
    tenantId?: (this: IDslBuilder) => IDslBuilder;
  };

  proto.tenantId ??= function tenantId(this: IDslBuilder) {
    return this.pattern(/^tenant_[a-z0-9]+$/);
  };
}
```

方法应保持幂等，避免热重载、重复测试 setup 或插件重复安装时反复覆盖。

## 添加 TypeScript builder 提示

```ts
import type { IDslBuilder } from 'schema-dsl/pure';

declare module 'schema-dsl/pure' {
  interface IDslBuilder {
    tenantId(): this;
  }
}
```

这样 `s('string!').tenantId()` 就能获得 builder 方法提示。

## 添加直接 String 链式提示

只有项目明确使用直接 String 链式源码时，才增加这部分：

```ts
import 'schema-dsl/string-types';
import type { IDslBuilder } from 'schema-dsl/pure';

declare module 'schema-dsl/string-types' {
  interface SchemaDslStringExtensions {
    tenantId(): IDslBuilder;
  }
}
```

直接 String 链式源码仍需要以下任一路径：

- 通过 `schema-dsl/transform` 或 `schema-dsl/esbuild` 做编译期转换；
- 通过 `schema-dsl/register-string` 显式安装 String 扩展；
- 在明确接受 v1 String 扩展行为时使用兼容/root 入口。

## 为自定义方法配置 transform

转换直接 String 链式源码时，需要追加方法名：

```ts
import { transformSchemaDsl } from 'schema-dsl/transform';

const result = transformSchemaDsl(
  'export const tenant = "string!".tenantId().label("租户")',
  {
    filename: 'schema.ts',
    additionalMethods: ['tenantId']
  }
);
```

如果链式调用从自定义 DSL 字面量开始，还要允许这个字面量：

```ts
transformSchemaDsl(
  'export const tenant = "tenant-id!".tenantId()',
  {
    filename: 'schema.ts',
    additionalMethods: ['tenantId'],
    additionalTypes: ['tenant-id']
  }
);
```

## 推荐包结构

可复用扩展建议把运行时实现和类型声明放在一起：

```text
src/schema-dsl/
  chain-methods.ts
  chain-methods.d.ts
  transform.ts
```

实现文件负责安装 builder 方法。声明文件负责增强 `schema-dsl/pure`，只有需要直接 String 链式源码时才增强 `schema-dsl/string-types`。transform 配置文件导出 `additionalMethods` 和 `additionalTypes` 供构建工具使用。

---

## 对应示例文件

**示例入口**: [custom-chain-methods.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/custom-chain-methods.ts)
**说明**: 安装自定义 builder 方法，验证 builder 写法，并校验直接 String 链式源码的 transform 配置。
