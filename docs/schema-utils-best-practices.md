# SchemaUtils 最佳实践

## 推荐用法

- 使用 `SchemaUtils.reusable()` 封装可复用字段工厂。
- 使用 `SchemaUtils.extend()` 组合基础 Schema 与业务扩展字段。
- 使用 `pick()` / `omit()` / `partial()` 生成派生 Schema，避免手写重复定义。

## 注意事项

- 派生 Schema 后仍需用 `validate()` 或 `Validator` 做回归验证。
- 对外导出标准 JSON Schema 时，优先在 Builder 阶段使用 `toJsonSchema()`，或在导出前显式清理内部字段。

---

## 对应示例文件

**示例入口**: [schema-utils-best-practices.ts](https://github.com/vextjs/schema-dsl/blob/v2/examples/docs/schema-utils-best-practices.ts)  
**说明**: 以创建、公开返回、局部更新三个场景展示字段库复用与派生 schema 的推荐组织方式。

