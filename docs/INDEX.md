# SchemaIO 文档索引

**快速导航**: 所有 API 文档和使用指南的完整列表

---

## 🌟 类型系统（核心功能）⭐

SchemaIO 提供了**6种强大的类型类**和**72个方法**，支持链式调用。

| 类型 | 方法数 | 亮点功能 | 文档 |
|------|--------|---------|------|
| **StringType** | **18个** | IPv4/IPv6/Hostname/Trim/Lowercase | [📖 详细文档](types/string-type.md) ⭐ |
| **NumberType** | 12个 | Integer/Port/Precision/Multiple | [📖 详细文档](types/number-type.md) |
| **BooleanType** | 5个 | Truthy/Falsy/Strict | [📖 详细文档](types/boolean-type.md) |
| **ObjectType** | 15个 | 嵌套/动态键/Unknown | [📖 详细文档](types/object-type.md) |
| **ArrayType** | 12个 | Unique/Ordered/Sparse | [📖 详细文档](types/array-type.md) |
| **DateType** | 10个 | ISO/Timestamp/Range | [📖 详细文档](types/date-type.md) |

**类型系统总览**: [TYPES.md - 完整指南](TYPES.md) 🔥

---

## 🚀 快速开始

| 文档 | 说明 |
|------|------|
| [README.md](../README.md) | 项目介绍、安装和快速开始 |
| [quick-start.md](quick-start.md) | 5分钟快速上手教程 |

---

## 📚 核心概念

| 文档 | 说明 |
|------|------|
| [adapter-pattern.md](adapter-pattern.md) | 适配器模式架构说明 |
| [json-schema-basics.md](json-schema-basics.md) | JSON Schema 基础知识 |

---

## 🎯 适配器 API（Adapters）

### Joi 风格 API

| 文档 | 方法 | 说明 |
|------|------|------|
| [joi-string.md](joi-string.md) | `joi.string()` | 创建字符串类型 Schema |
| [joi-number.md](joi-number.md) | `joi.number()` | 创建数字类型 Schema |
| [joi-integer.md](joi-integer.md) | `joi.integer()` | 创建整数类型 Schema |
| [joi-boolean.md](joi-boolean.md) | `joi.boolean()` | 创建布尔类型 Schema |
| [joi-object.md](joi-object.md) | `joi.object()` | 创建对象类型 Schema |
| [joi-array.md](joi-array.md) | `joi.array()` | 创建数组类型 Schema |
| [joi-compile.md](joi-compile.md) | `joi.compile()` | 编译对象 Schema |

### DSL 风格 API

| 文档 | 说明 |
|------|------|
| [dsl-syntax.md](dsl-syntax.md) | **DSL 语法完整指南** ⭐ |
| [dsl-basic-types.md](dsl-basic-types.md) | 基本类型定义 |
| [dsl-constraints.md](dsl-constraints.md) | 约束条件语法 |
| [dsl-nested-objects.md](dsl-nested-objects.md) | 嵌套对象支持 |
| [dsl-arrays.md](dsl-arrays.md) | 数组类型语法 |

---

## ✅ 核心类（Core Classes）

### JSONSchemaCore

| 文档 | 方法 | 说明 |
|------|------|------|
| [jsonschemacore.md](jsonschemacore.md) | 类概述 | JSONSchemaCore 类完整说明 |
| [set-type.md](set-type.md) | `setType()` | 设置 Schema 类型 |
| [set-required.md](set-required.md) | `setRequired()` | 设置必填字段 |
| [set-property.md](set-property.md) | `setProperty()` | 设置单个属性 |
| [set-properties.md](set-properties.md) | `setProperties()` | 设置多个属性 |
| [get-schema.md](get-schema.md) | `getSchema()` | 获取 Schema 对象 |

### Validator

| 文档 | 方法 | 说明 |
|------|------|------|
| [validator.md](validator.md) | 类概述 | Validator 类完整说明 |
| [validate.md](validate.md) | `validate()` | 验证数据 |
| [compile.md](compile.md) | `compile()` | 编译 Schema |
| [validate-batch.md](validate-batch.md) | `validateBatch()` | 批量验证 |
| [add-keyword.md](add-keyword.md) | `addKeyword()` | 添加自定义关键字 |
| [add-format.md](add-format.md) | `addFormat()` | 添加自定义格式 |

---

## 🗄️ 导出器（Exporters）

### MongoDB 导出器

| 文档 | 方法 | 说明 |
|------|------|------|
| [mongodb-exporter.md](mongodb-exporter.md) | 类概述 | MongoDB 导出器完整说明 |
| [mongodb-export.md](mongodb-export.md) | `export()` | 导出 MongoDB Schema |
| [mongodb-generate-command.md](mongodb-generate-command.md) | `generateCommand()` | 生成创建集合命令 |

### MySQL 导出器

| 文档 | 方法 | 说明 |
|------|------|------|
| [mysql-exporter.md](mysql-exporter.md) | 类概述 | MySQL 导出器完整说明 |
| [mysql-export.md](mysql-export.md) | `export()` | 导出 MySQL DDL |
| [mysql-generate-index.md](mysql-generate-index.md) | `generateIndex()` | 生成索引 DDL |

### PostgreSQL 导出器

| 文档 | 方法 | 说明 |
|------|------|------|
| [postgresql-exporter.md](postgresql-exporter.md) | 类概述 | PostgreSQL 导出器完整说明 |
| [postgresql-export.md](postgresql-export.md) | `export()` | 导出 PostgreSQL DDL |
| [postgresql-generate-index.md](postgresql-generate-index.md) | `generateIndex()` | 生成索引 DDL |

---

## 🛠️ 工具类（Utilities）

| 文档 | 说明 |
|------|------|
| [type-converter.md](type-converter.md) | TypeConverter - 类型转换工具 |
| [schema-helper.md](schema-helper.md) | SchemaHelper - Schema 辅助工具 |

---

## 📖 使用指南（Guides）

| 文档 | 说明 |
|------|------|
| [validation-guide.md](validation-guide.md) | 数据验证完整指南 |
| [export-guide.md](export-guide.md) | 数据库导出完整指南 |
| [custom-validation.md](custom-validation.md) | 自定义验证扩展 |
| [performance-tips.md](performance-tips.md) | 性能优化建议 |
| [best-practices.md](best-practices.md) | 最佳实践 |

---

## 📝 示例代码（Examples）

| 文件 | 说明 |
|------|------|
| [joi-style.js](../examples/joi-style.js) | Joi 风格完整示例 |
| [dsl-style.js](../examples/dsl-style.js) | DSL 风格完整示例 |
| [export-demo.js](../examples/export-demo.js) | 数据库导出示例 |

---

## 🔧 开发指南

| 文档 | 说明 |
|------|------|
| [CONTRIBUTING.md](../CONTRIBUTING.md) | 贡献指南 |
| [architecture.md](architecture.md) | 架构设计说明 |

---

## 📊 版本信息

| 文档 | 说明 |
|------|------|
| [STATUS.md](../STATUS.md) | 项目状态 |
| [CHANGELOG.md](../CHANGELOG.md) | 更新日志 |

---

**图例说明**:
- ⭐ 重点推荐文档
- 🆕 新增功能

**文档版本**: v1.0.0  
**最后更新**: 2025-12-24

