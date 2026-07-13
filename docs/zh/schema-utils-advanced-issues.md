# SchemaUtils 深入问题分析

## 常见问题

### 内部字段泄漏

链式 DSL 会产生 `_label`、`_customMessages`、`_required` 等内部字段。面向 OpenAPI 或外部系统时，应在 Builder 阶段使用 `toJsonSchema()` 输出纯净 JSON Schema。

### required 同步

`pick()`、`omit()`、`partial()` 会在受支持的嵌套 Schema 位置同步 `required`，包括对象属性、元组与追加数组项、组合、依赖和本地定义。`partial(schema, fields)` 只让选中的对象顶层字段变为可选，并保留无关约束。

### 深拷贝限制

`SchemaUtils.clone()` 会保留函数引用，克隆 `RegExp` 与 `Date`，支持循环引用，并保留属性描述符。函数仍属于仅运行时值：克隆不会让包含函数的 Schema 变得可序列化或跨进程稳定。

---

## 对应示例文件

**示例入口**: [schema-utils-advanced-issues.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/schema-utils-advanced-issues.ts)  
**说明**: 覆盖内部字段泄漏、`required` 同步和 `clone()` 深拷贝边界三个最容易踩坑的点。

