# SchemaIO 文档索引

> **版本**: v2.0.1  
> **更新时间**: 2025-12-25  
> **用途**: 所有文档的快速导航  

---

## 📑 目录

### 快速导航
- [🚀 快速开始](#-快速开始) - 入门必读
- [📖 核心文档](#-核心文档) - 主要功能文档
- [🎯 功能索引](#-功能索引) - 按功能查找
- [🗄️ 导出器](#️-导出器) - 数据库Schema导出
- [🧰 工具函数](#-工具函数) - 辅助工具
- [📝 示例代码](#-示例代码) - 完整示例

---

## 🚀 快速开始

| 文档 | 阅读时间 | 说明 |
|------|----------|------|
| [README.md](../README.md) | 3分钟 | 项目介绍、安装和快速开始 ⭐ |
| [quick-start.md](quick-start.md) | 5分钟 | 5分钟快速上手教程 ⭐ |
| [FEATURE-INDEX.md](FEATURE-INDEX.md) | 10分钟 | 完整功能索引（新增）⭐ |

---

## 📖 核心文档

### DSL 语法（核心功能）

| 文档 | 内容 | 说明 |
|------|------|------|
| [dsl-syntax.md](dsl-syntax.md) | 2815行 | **DSL语法完整指南**（最重要）⭐⭐⭐ |
| [string-extensions.md](string-extensions.md) | 465行 | **String扩展文档**（v2.0.1新特性）⭐⭐ |
| [api-reference.md](api-reference.md) | 534行 | API完整参考 ⭐⭐ |
| [validate.md](validate.md) | 452行 | validate方法详解 ⭐ |

---

## 🎯 功能索引

### 核心API

| 功能 | 文档 | 代码位置 |
|------|------|---------|
| dsl() 函数 | [api-reference.md](api-reference.md#dsl-函数) | `lib/adapters/DslAdapter.js` |
| DslBuilder 类 | [api-reference.md](api-reference.md#dslbuilder-类) | `lib/core/DslBuilder.js` |
| String 扩展 | [string-extensions.md](string-extensions.md) | `lib/core/StringExtensions.js` |
| Validator 类 | [validate.md](validate.md) | `lib/core/Validator.js` |
| validate() 便捷函数 | [api-reference.md](api-reference.md) | `index.js` |

### v2.0.1 新功能

| 功能 | 文档 | 示例代码 |
|------|------|---------|
| String扩展 | [string-extensions.md](string-extensions.md) | [string-extensions.js](../examples/string-extensions.js) |
| Schema复用 | [FEATURE-INDEX.md](FEATURE-INDEX.md#schemautils) | [v2.0.1-features.js](../examples/v2.0.1-features.js) |
| 批量验证 | [validate.md](validate.md#批量验证) | [v2.0.1-features.js](../examples/v2.0.1-features.js) |
| Schema工具 | [FEATURE-INDEX.md](FEATURE-INDEX.md#schemautils) | [v2.0.1-features.js](../examples/v2.0.1-features.js) |

---
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

