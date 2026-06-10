# SchemaUtils 深入问题分析

## 常见问题

### 内部字段泄漏

链式 DSL 会产生 `_label`、`_customMessages`、`_required` 等内部字段。面向 OpenAPI 或外部系统时，应在 Builder 阶段使用 `toJsonSchema()` 输出纯净 JSON Schema。

### required 同步

使用 `pick()`、`omit()`、`partial()` 后应检查 `required` 是否符合预期，当前实现会同步处理顶层 required。

### 深拷贝限制

`SchemaUtils.clone()` 基于 JSON 序列化，不保留函数、`RegExp` 实例等非 JSON 值。

---

## 对应示例文件

**示例入口**: [schema-utils-advanced-issues.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/schema-utils-advanced-issues.ts)  
**说明**: 覆盖内部字段泄漏、`required` 同步和 `clone()` 深拷贝边界三个最容易踩坑的点。

