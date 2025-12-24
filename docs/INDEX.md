# SchemaIO 2.0 文档索引

> **版本**: v2.0.0  
> **更新日期**: 2025-12-24  

快速导航：所有 API 文档和使用指南的完整列表

---

## 📚 核心概念

| 文档 | 说明 | 状态 |
|------|------|------|
| [getting-started.md](getting-started.md) | 快速入门指南 | 🔄 待编写 |
| [core-concepts.md](core-concepts.md) | 核心概念和设计理念 | 🔄 待编写 |
| [type-system.md](type-system.md) | 类型系统详解 | 🔄 待编写 |
| [validation-flow.md](validation-flow.md) | 验证流程详解 | 🔄 待编写 |

---

## 🎨 API风格

| 文档 | 说明 | 状态 |
|------|------|------|
| [joi-style-api.md](joi-style-api.md) | Joi风格链式调用API | 🔄 待编写 |
| [dsl-style-api.md](dsl-style-api.md) | DSL风格简洁API | 🔄 待编写 |
| [json-schema-api.md](json-schema-api.md) | JSON Schema标准API | 🔄 待编写 |
| [functional-api.md](functional-api.md) | 函数式组合API | 🔄 待编写 |

---

## 🔧 核心API

### Schema构建

| 文档 | API | 说明 | 状态 |
|------|-----|------|------|
| [schema-builder.md](api/schema-builder.md) | `SchemaBuilder` | Schema构建器 | 🔄 待编写 |
| [type-system.md](api/type-system.md) | `TypeSystem` | 类型系统 | 🔄 待编写 |

### 验证

| 文档 | API | 说明 | 状态 |
|------|-----|------|------|
| [validator.md](api/validator.md) | `Validator` | 验证引擎 | 🔄 待编写 |
| [error-formatter.md](api/error-formatter.md) | `ErrorFormatter` | 错误格式化 | 🔄 待编写 |

### 缓存

| 文档 | API | 说明 | 状态 |
|------|-----|------|------|
| [cache-manager.md](api/cache-manager.md) | `CacheManager` | 缓存管理器 | 🔄 待编写 |

---

## 📦 内置类型

| 文档 | 类型 | 说明 | 状态 |
|------|------|------|------|
| [string-type.md](types/string-type.md) | `string` | 字符串类型 | 🔄 待编写 |
| [number-type.md](types/number-type.md) | `number` | 数字类型 | 🔄 待编写 |
| [boolean-type.md](types/boolean-type.md) | `boolean` | 布尔类型 | 🔄 待编写 |
| [date-type.md](types/date-type.md) | `date` | 日期类型 | 🔄 待编写 |
| [object-type.md](types/object-type.md) | `object` | 对象类型 | 🔄 待编写 |
| [array-type.md](types/array-type.md) | `array` | 数组类型 | 🔄 待编写 |
| [custom-types.md](types/custom-types.md) | 自定义类型 | 如何创建自定义类型 | 🔄 待编写 |

---

## 🔍 验证器

| 文档 | 验证器 | 说明 | 状态 |
|------|--------|------|------|
| [built-in-validators.md](validators/built-in-validators.md) | 内置验证器 | min/max/pattern等 | 🔄 待编写 |
| [format-validators.md](validators/format-validators.md) | 格式验证器 | email/url/uuid等 | 🔄 待编写 |
| [custom-validators.md](validators/custom-validators.md) | 自定义验证器 | 如何创建自定义验证器 | 🔄 待编写 |

---

## 📤 导出器

| 文档 | 导出器 | 说明 | 状态 |
|------|--------|------|------|
| [json-schema-export.md](exporters/json-schema-export.md) | JSON Schema | 导出为JSON Schema | 🔄 待编写 |
| [mongodb-export.md](exporters/mongodb-export.md) | MongoDB | 导出为Mongoose Schema | 🔄 待编写 |
| [mysql-export.md](exporters/mysql-export.md) | MySQL | 导出为MySQL DDL | 🔄 待编写 |
| [postgresql-export.md](exporters/postgresql-export.md) | PostgreSQL | 导出为PostgreSQL DDL | 🔄 待编写 |

---

## 🔌 插件系统

| 文档 | 说明 | 状态 |
|------|------|------|
| [plugin-system.md](plugins/plugin-system.md) | 插件系统架构 | 🔄 待编写 |
| [creating-plugins.md](plugins/creating-plugins.md) | 如何创建插件 | 🔄 待编写 |
| [plugin-examples.md](plugins/plugin-examples.md) | 插件示例 | 🔄 待编写 |

---

## 📖 使用指南

| 文档 | 说明 | 状态 |
|------|------|------|
| [validation-guide.md](guides/validation-guide.md) | 验证完整指南 | 🔄 待编写 |
| [nested-objects.md](guides/nested-objects.md) | 嵌套对象验证 | 🔄 待编写 |
| [async-validation.md](guides/async-validation.md) | 异步验证 | 🔄 待编写 |
| [error-handling.md](guides/error-handling.md) | 错误处理最佳实践 | 🔄 待编写 |
| [performance-optimization.md](guides/performance-optimization.md) | 性能优化指南 | 🔄 待编写 |
| [migration-from-v1.md](guides/migration-from-v1.md) | 从v1.0迁移指南 | 🔄 待编写 |

---

## 💡 示例

| 文档 | 说明 | 状态 |
|------|------|------|
| [examples/user-registration.md](examples/user-registration.md) | 用户注册表单验证 | 🔄 待编写 |
| [examples/api-validation.md](examples/api-validation.md) | API请求验证 | 🔄 待编写 |
| [examples/config-validation.md](examples/config-validation.md) | 配置文件验证 | 🔄 待编写 |
| [examples/database-schema.md](examples/database-schema.md) | 数据库Schema生成 | 🔄 待编写 |

---

## 🔧 开发者文档

| 文档 | 说明 | 状态 |
|------|------|------|
| [contributing.md](../CONTRIBUTING.md) | 贡献指南 | 🔄 待编写 |
| [architecture.md](architecture.md) | 架构设计文档 | 🔄 待编写 |
| [testing-guide.md](testing-guide.md) | 测试指南 | 🔄 待编写 |

---

## 📝 更新日志

- **v2.0.0** (2025-12-24)
  - 初始文档结构创建
  - 核心引擎实现完成

---

## 🔗 外部资源

- [GitHub仓库](https://github.com/yourusername/schemaio)
- [NPM包](https://www.npmjs.com/package/schemaio)
- [问题反馈](https://github.com/yourusername/schemaio/issues)

---

**文档编写进度**: 0/50+ (0%)  
**下一步**: 实现内置类型后，开始编写API文档

