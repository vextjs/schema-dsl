# 迁移到 schema-dsl v3

schema-dsl v3 只引入一项有意的破坏性变化：导入或 require 包 root 时，不再修改 `String.prototype`。

## Root 导入

root 与 `schema-dsl/pure` 暴露同一套无副作用核心 API。已经使用 `s(...)`、`dsl(...)`、`validate(...)`、builder、exporter 或 `schema-dsl/runtime` 的代码，可保留原有 API 调用。

```typescript
import { s, validate } from 'schema-dsl';

const schema = s({ email: 'email!' });
const result = validate(schema, { email: 'user@example.com' });
```

## 直接 String 链式

直接在字符串字面量上调用方法的代码，必须在应用启动阶段显式启用：

```typescript
import 'schema-dsl/register-string';
import 'schema-dsl/string-types'; // 仅 TypeScript
import { s } from 'schema-dsl';

const schema = s({ email: 'email!'.description('登录邮箱') });
```

需要用单一入口明确保留 v1/v2 运行时行为时，可导入 `schema-dsl/compat`。库通常应使用 `s('email!').description(...)` 这类 builder，避免修改宿主原型。

## Required、optional 与 null

- `!` 表示属性必填；编译完整对象并读取标准 JSON Schema `required[]`。
- `?` 表示属性可缺省，不代表允许 `null`。
- 允许 `null` 必须显式使用 null union，例如 `types:string|null` 或 raw JSON Schema `{ type: ['string', 'null'] }`。
- v3 不新增 `isRequired()` / `isOptional()`；`_required` / `_optional` 只是内部兼容细节。

## ValidationResult

`valid` 与归一化后的 `data` 保持稳定。canonical error 使用 `path`、`message`、`keyword`；旧 `field`、`type`、`expected` 别名在 v3.0 继续兼容但已弃用。新集成应在自己的公共边界从 canonical 字段映射。

## 入口矩阵

| 入口 | 导入时修改 String |
|---|:---:|
| `schema-dsl` | 否 |
| `schema-dsl/pure` | 否 |
| `schema-dsl/runtime` | 否 |
| `schema-dsl/string-types` | 无运行时代码 |
| `schema-dsl/compat` | 是，显式选择 |
| `schema-dsl/register-string` | 是，显式选择 |
