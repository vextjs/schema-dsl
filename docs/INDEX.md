# schema-dsl 文档索引

> **更新时间**: 2025-12-29  
> **用途**: 所有文档的快速导航  
> **文档数量**: 27个文档（总计 12,450+ 行）

---

## 📑 目录

### 快速导航
- [🚀 快速开始](#-快速开始) - 入门必读
- [📖 核心文档](#-核心文档) - 主要功能文档
- [🎯 功能索引](#-功能索引) - 按功能查找
- [🗄️ 导出器](#️-导出器) - 数据库Schema导出
- [🛠️ 工具类](#️-工具类utilities) - 辅助工具
- [📖 使用指南](#-使用指南guides) - 完整教程
- [🔧 故障排查](#-故障排查troubleshooting) - 问题解决
- [📝 示例代码](#-示例代码examples) - 完整示例
- [❓ 常见问题](#-常见问题faq) - FAQ

---

## 🚀 快速开始

| 文档 | 阅读时间 | 说明 |
|------|----------|------|
| [README.md](../README.md) | 3分钟 | 项目介绍、安装和快速开始 ⭐ |
| [quick-start.md](quick-start.md) | 5分钟 | 5分钟快速上手教程 ⭐ |
| [design-philosophy.md](design-philosophy.md) | 15分钟 | **设计理念与性能权衡** ⭐⭐⭐ |
| [FEATURE-INDEX.md](FEATURE-INDEX.md) | 10分钟 | 完整功能索引 ⭐ |
| [best-practices.md](best-practices.md) | 15分钟 | 最佳实践指南 ⭐⭐⭐ |
| [faq.md](faq.md) | 5分钟 | 常见问题解答 |

---

## 📖 核心文档

### DSL 语法（核心功能）

| 文档 | 行数 | 说明 |
|------|------|------|
| [dsl-syntax.md](dsl-syntax.md) | 2815行 | **DSL语法完整指南**（最重要）⭐⭐⭐ |
| [string-extensions.md](string-extensions.md) | 465行 | **String扩展文档** ⭐⭐ |
| [plugin-system.md](plugin-system.md) | 580行 | **插件系统指南** ⭐⭐ |
| [api-reference.md](api-reference.md) | 534行 | API完整参考 ⭐⭐ |
| [validate.md](validate.md) | 452行 | validate方法详解 ⭐ |
| [**validate-async.md**](validate-async.md) | ~700行 | **异步验证方法详解** ⭐⭐⭐ |
| [**schema-utils-chaining.md**](schema-utils-chaining.md) | ~680行 | **Schema链式复用方法** ⭐⭐⭐ |
| [**schema-utils-best-practices.md**](schema-utils-best-practices.md) | ~500行 | **SchemaUtils最佳实践与常见陷阱** ⭐⭐⭐ |
| [**schema-utils-advanced-issues.md**](schema-utils-advanced-issues.md) | ~600行 | **SchemaUtils深入问题分析** ⭐⭐ |

---

## 🎯 功能索引

### 核心API

| 功能 | 文档 | 代码位置 |
|------|------|---------|
| dsl() 函数 | [api-reference.md](api-reference.md#dsl-函数) | `lib/adapters/DslAdapter.js` |
| DslBuilder 类 | [api-reference.md](api-reference.md#dslbuilder-类) | `lib/core/DslBuilder.js` |
| String 扩展 | [string-extensions.md](string-extensions.md) | `lib/core/StringExtensions.js` |
| Validator 类 | [validate.md](validate.md) | `lib/core/Validator.js` |
| validate() 函数 | [api-reference.md](api-reference.md) | `index.js` |
| validateAsync() 函数 | [validate-async.md](validate-async.md) | `index.js` |
| ValidationError 类 | [validate-async.md](validate-async.md#validationerror) | `lib/errors/ValidationError.js` |
| SchemaUtils 链式调用 | [schema-utils-chaining.md](schema-utils-chaining.md) | `lib/utils/SchemaUtils.js` |


---

## 🗄️ 导出器

> 将 JSON Schema 转换为数据库 DDL 和验证规则

> ⚠️ **重要提示**: 请先阅读 [**导出限制说明**](export-limitations.md)，了解哪些特性无法导出到数据库 Schema。

### 导出限制说明 ⚠️

| 文档 | 说明 |
|------|------|
| [**export-limitations.md**](export-limitations.md) | **导出限制完整说明**（必读）⭐⭐⭐ |

**主要内容**:
- ❌ 不支持导出的特性（条件验证、自定义验证器等）
- ⚠️ 部分支持的特性（正则、范围、枚举等）
- ✅ 完全支持的特性（基础类型、必填约束等）
- 数据库特定限制对比（MongoDB/MySQL/PostgreSQL）
- 最佳实践建议（分层验证、文档化约束等）

### MongoDB 导出器

| 文档 | 行数 | 说明 |
|------|------|------|
| [mongodb-exporter.md](mongodb-exporter.md) | ~200行 | MongoDB 导出器完整指南 |

**主要功能**:
- `export()` - 导出 $jsonSchema 验证规则
- `generateCreateCommand()` - 生成创建集合命令（含验证）
- `generateCommand()` - 生成完整 runCommand 命令
- `MongoDBExporter.export()` - 静态快速导出方法

### MySQL 导出器

| 文档 | 行数 | 说明 |
|------|------|------|
| [mysql-exporter.md](mysql-exporter.md) | ~220行 | MySQL 导出器完整指南 |

**主要功能**:
- `export()` - 导出 CREATE TABLE DDL
- `generateIndex()` - 生成 CREATE INDEX DDL
- 支持 ENGINE、CHARSET、COLLATE 配置

### PostgreSQL 导出器

| 文档 | 行数 | 说明 |
|------|------|------|
| [postgresql-exporter.md](postgresql-exporter.md) | ~280行 | PostgreSQL 导出器完整指南 |

**主要功能**:
- `export()` - 导出 CREATE TABLE DDL（含 CHECK 约束）
- `generateIndex()` - 生成索引 DDL（支持 btree/gin/gist/hash）
- 支持 Schema 命名空间和 COMMENT

---

## 🛠️ 工具类（Utilities）

| 文档 | 行数 | 说明 |
|------|------|------|
| [type-converter.md](type-converter.md) | ~250行 | TypeConverter - 类型转换工具 |
| [schema-helper.md](schema-helper.md) | ~220行 | SchemaHelper - Schema 辅助工具 |
| [cache-manager.md](cache-manager.md) | ~250行 | CacheManager - LRU缓存管理 |

### TypeConverter 主要功能
- `toMongoDBType()` - 转换为 MongoDB 类型
- `toMySQLType()` - 转换为 MySQL 类型  
- `toPostgreSQLType()` - 转换为 PostgreSQL 类型
- `extractConstraints()` - 提取约束信息
- `mergeSchemas()` - 合并多个 Schema

### SchemaHelper 主要功能
- `isValidSchema()` - 验证 Schema 合法性
- `cloneSchema()` - 深度克隆 Schema
- `flattenSchema()` - 扁平化嵌套 Schema
- `getFieldPaths()` - 获取所有字段路径
- `summarizeSchema()` - 生成 Schema 摘要

### CacheManager 主要功能
- LRU 缓存策略（最近最少使用淘汰）
- TTL 过期支持
- 缓存统计（命中率、大小等）
- 线程安全设计

---

## 📖 使用指南（Guides）

| 文档 | 行数 | 说明 |
|------|------|------|
| [validation-guide.md](validation-guide.md) | ~400行 | 数据验证完整指南 |
| [export-guide.md](export-guide.md) | ~350行 | 数据库导出完整指南 |
| [error-handling.md](error-handling.md) | ~640行 | 错误处理最佳实践 |

### 验证指南内容
- 基础验证流程
- 字段类型验证（字符串/数字/布尔/数组/对象）
- 常用业务验证模式
- 批量验证与性能优化
- 错误处理最佳实践

### 导出指南内容
- MongoDB/MySQL/PostgreSQL 导出对比
- 配置与自定义选项
- 自动化迁移脚本
- 版本管理与最佳实践
- **⚠️ [导出限制说明](export-limitations.md) - 哪些特性无法导出** ⭐⭐⭐


- 数据库导出概述
- MongoDB/MySQL/PostgreSQL 导出教程
- 多数据库同步方案
- 类型映射参考表
- 最佳实践与常见问题

---

## 📝 示例代码（Examples）

| 文件 | 说明 |
|------|------|
| [joi-style.js](../examples/joi-style.js) | Joi 风格完整示例 |
| [dsl-style.js](../examples/dsl-style.js) | DSL 风格完整示例 |
| [string-extensions.js](../examples/string-extensions.js) | String 扩展示例 |
| [password-reset/](../examples/password-reset/) | 密码重置表单示例 |

---

## ❓ 常见问题（FAQ）

| 文档 | 说明 |
|------|------|
| [faq.md](faq.md) | 常见问题与解答 |

**热门问题**:
- DSL 语法与 Joi 语法的区别？
- 如何自定义验证规则？
- 如何优化验证性能？
- 不同数据库的类型映射？
- 如何处理验证错误？

---

## 🔧 开发指南

| 文档 | 说明 |
|------|------|
| [CONTRIBUTING.md](../CONTRIBUTING.md) | 贡献指南 |
| [DOCUMENTATION-ISSUES.md](../DOCUMENTATION-ISSUES.md) | 文档审核报告 |

---

## 📊 版本信息

| 文档 | 说明 |
|------|------|
| [STATUS.md](../STATUS.md) | 项目状态（243个测试全部通过）|
| [CHANGELOG.md](../CHANGELOG.md) | 更新日志 |

---

## 📁 文档统计

| 分类 | 文档数 | 总行数 |
|------|--------|--------|
| 核心文档 | 4 | ~4,266 |
| 导出器文档 | 3 | ~700 |
| 工具类文档 | 3 | ~720 |
| 使用指南 | 3 | ~1,390 |
| 其他文档 | 9 | ~500 |
| **合计** | **22** | **~7,576** |

---

**图例说明**:
- ⭐ 重点推荐文档
- ⭐⭐ 核心文档
- ⭐⭐⭐ 必读文档

**最后更新**: 2025-12-29


