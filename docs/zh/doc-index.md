# schema-dsl 文档索引

> **更新时间**: 2026-06-10
> **用途**: 所有文档的快速导航  
> **在线文档**: [中文首页](/schema-dsl/zh/)
> **文档数量**: `README.md + docs/*.md` 共 59 份

---

## 📑 目录

### 快速导航
- [快速开始](#doc-index-quick-start) - 入门必读
- [核心文档](#doc-index-core-docs) - 主要功能文档
- [功能索引](#doc-index-feature-map) - 按功能查找
- [导出器](#doc-index-exporters) - 数据库 Schema 导出
- [工具类](#doc-index-utilities) - 辅助工具
- [使用指南](#doc-index-guides) - 完整教程
- [补充文档](#doc-index-supplemental) - 其余未在专题区展开的文档
- [故障排查](#doc-index-troubleshooting) - 问题解决
- [开发与贡献](#doc-index-contributing) - 贡献指南
- [示例代码](#doc-index-examples) - 完整示例
- [常见问题](#doc-index-faq) - FAQ

---

<a id="doc-index-quick-start"></a>

## 🚀 快速开始

| 文档 | 阅读时间 | 说明 |
|------|----------|------|
| [README.md](https://github.com/vextjs/schema-dsl/blob/main/README.md) | 3分钟 | 项目介绍、安装和快速开始 ⭐ |
| [quick-start.md](quick-start.md) | 5分钟 | 5分钟快速上手教程 ⭐ |
| [design-philosophy.md](design-philosophy.md) | 15分钟 | **设计理念与性能权衡** ⭐⭐⭐ |
| [FEATURE-INDEX.md](FEATURE-INDEX.md) | 10分钟 | 完整功能索引 ⭐ |
| [best-practices.md](best-practices.md) | 15分钟 | 最佳实践指南 ⭐⭐⭐ |
| [faq.md](faq.md) | 5分钟 | 常见问题解答 |

---

<a id="doc-index-core-docs"></a>

## 📖 核心文档

### DSL 语法（核心功能）

| 文档 | 说明 |
|------|------|
| [dsl-syntax.md](dsl-syntax.md) | **DSL语法完整指南**（最重要）⭐⭐⭐ |
| [string-extensions.md](string-extensions.md) | **String扩展文档** ⭐⭐ |
| [plugin-system.md](plugin-system.md) | **插件系统指南** ⭐⭐ |
| [api-reference.md](api-reference.md) | API完整参考 ⭐⭐ |
| [validate.md](validate.md) | validate方法详解 ⭐ |
| [**validate-async.md**](validate-async.md) | **异步验证方法详解** ⭐⭐⭐ |
| [**schema-utils-chaining.md**](schema-utils-chaining.md) | **Schema链式复用方法** ⭐⭐⭐ |
| [**schema-utils-best-practices.md**](schema-utils-best-practices.md) | **SchemaUtils最佳实践与常见陷阱** ⭐⭐⭐ |
| [**schema-utils-advanced-issues.md**](schema-utils-advanced-issues.md) | **SchemaUtils深入问题分析** ⭐⭐ |

---

<a id="doc-index-feature-map"></a>

## 🎯 功能索引

### 核心API

| 功能 | 文档 | 代码位置 |
|------|------|---------|
| dsl() 函数 | [api-reference.md](api-reference.md#dsl-函数) | `src/index.ts` / `src/adapters/DslAdapter.ts` |
| DslBuilder 类 | [api-reference.md](api-reference.md#dslbuilder-类) | `src/core/DslBuilder.ts` |
| String 扩展 | [string-extensions.md](string-extensions.md) | `src/core/StringExtensions.ts` |
| Validator 类 | [validate.md](validate.md) | `src/core/Validator.ts` |
| validate() 函数 | [api-reference.md](api-reference.md) | `src/index.ts` |
| validateAsync() 函数 | [validate-async.md](validate-async.md) | `src/index.ts` |
| ValidationError 类 | [validate-async.md](validate-async.md#validationerror) | `src/errors/ValidationError.ts` |
| SchemaUtils 链式调用 | [schema-utils-chaining.md](schema-utils-chaining.md) | `src/utils/SchemaUtils.ts` |


---

<a id="doc-index-exporters"></a>

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

| 文档 | 说明 |
|------|------|
| [mongodb-exporter.md](mongodb-exporter.md) | MongoDB 导出器完整指南 |

**主要功能**:
- `export()` - 导出 $jsonSchema 验证规则
- `generateCreateCommand()` - 生成创建集合命令（含验证）
- `generateCommand()` - 生成完整 runCommand 命令
- `MongoDBExporter.export()` - 静态快速导出方法

### MySQL 导出器

| 文档 | 说明 |
|------|------|
| [mysql-exporter.md](mysql-exporter.md) | MySQL 导出器完整指南 |

**主要功能**:
- `export()` - 导出 CREATE TABLE DDL
- `generateIndex()` - 生成 CREATE INDEX DDL
- 支持 ENGINE、CHARSET、COLLATE 配置

### PostgreSQL 导出器

| 文档 | 说明 |
|------|------|
| [postgresql-exporter.md](postgresql-exporter.md) | PostgreSQL 导出器完整指南 |

**主要功能**:
- `export()` - 导出 CREATE TABLE DDL（含 CHECK 约束）
- `generateIndex()` - 生成索引 DDL（支持 btree/gin/gist/hash）
- 支持 Schema 命名空间和 COMMENT

---

<a id="doc-index-utilities"></a>

## 🛠️ 工具类（Utilities）

| 文档 | 说明 |
|------|------|
| [type-converter.md](type-converter.md) | TypeConverter - 类型转换工具 |
| [schema-helper.md](schema-helper.md) | SchemaHelper - Schema 辅助工具 |
| [cache-manager.md](cache-manager.md) | CacheManager - LRU缓存管理 |

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

<a id="doc-index-guides"></a>

## 📖 使用指南（Guides）

| 文档 | 说明 |
|------|------|
| [validation-guide.md](validation-guide.md) | 数据验证完整指南 |
| [export-guide.md](export-guide.md) | 数据库导出完整指南 |
| [error-handling.md](error-handling.md) | 错误处理最佳实践 |

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

<a id="doc-index-supplemental"></a>

## 🧩 补充文档

> 上方专题区主要按学习路径和主题组织；以下补充索引列出当前尚未在专题区单独展开的其余文档，确保导航覆盖 `docs/*.md` 全量文档。

| 文档 | 标题 / 说明 |
|------|-------------|
| [add-custom-locale.md](add-custom-locale.md) | 添加自定义语言包指南 |
| [add-keyword.md](add-keyword.md) | addKeyword 方法 |
| [api.md](api.md) | API 参考入口 |
| [best-practices-project-structure.md](best-practices-project-structure.md) | Schema-DSL 项目最佳实践示例 |
| [compile.md](compile.md) | compile 方法 |
| [conditional-api.md](conditional-api.md) | 链式条件 API - ConditionalBuilder |
| [custom-extensions-guide.md](custom-extensions-guide.md) | 自定义扩展指南 |
| [dynamic-locale.md](dynamic-locale.md) | 动态多语言配置指南 |
| [enum.md](enum.md) | 枚举功能文档 |
| [frontend-i18n-guide.md](frontend-i18n-guide.md) | 前端动态切换语言 - 最佳实践指南 |
| [i18n-user-guide.md](i18n-user-guide.md) | 多语言支持用户指南 |
| [i18n.md](i18n.md) | 多语言配置指南 |
| [index.md](index.md) | 站点首页文案（文件内未单独声明 H1） |
| [json-schema-basics.md](json-schema-basics.md) | JSON Schema 基础 |
| [label-vs-description.md](label-vs-description.md) | label vs description 使用指南 |
| [markdown-exporter.md](markdown-exporter.md) | Markdown 导出器 |
| [multi-language.md](multi-language.md) | 多语言支持 |
| [multi-type-support.md](multi-type-support.md) | 多类型支持设计说明 |
| [number-operators.md](number-operators.md) | 数字比较运算符 (v1.1.2+) |
| [optional-marker-guide.md](optional-marker-guide.md) | schema-dsl 可选标记 ? 支持 |
| [performance-guide.md](performance-guide.md) | 性能优化指南 |
| [plugin-type-registration.md](plugin-type-registration.md) | 自定义类型注册 |
| [runtime-locale-support.md](runtime-locale-support.md) | 运行时多语言支持 - schema-dsl |
| [runtime-isolation.md](runtime-isolation.md) | 使用 `schema-dsl/runtime` 隔离运行时状态 |
| [schema-utils.md](schema-utils.md) | Schema 工具函数文档 |
| [security-checklist.md](security-checklist.md) | 安全检查清单 |
| [troubleshooting.md](troubleshooting.md) | 常见问题排查指南 |
| [type-reference.md](type-reference.md) | schema-dsl 类型参考 |
| [typescript-guide.md](typescript-guide.md) | TypeScript 使用指南 |
| [union-type-guide.md](union-type-guide.md) | 一个字段支持多种类型 |
| [union-types.md](union-types.md) | 跨类型联合验证 - types: 语法 |
| [validate-batch.md](validate-batch.md) | validateBatch 方法 |
| [validate-dsl-object-support.md](validate-dsl-object-support.md) | validate() 函数支持 DSL 对象说明 |
| [validator.md](validator.md) | Validator 类概述 |

---

<a id="doc-index-examples"></a>

## 📝 示例代码（Examples）

| 文件 | 说明 |
|------|------|
| [quick-start.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/quick-start.ts) | 快速开始示例 |
| [dsl-syntax.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/dsl-syntax.ts) | DSL 风格完整示例 |
| [string-extensions.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/string-extensions.ts) | String 扩展示例 |
| [runtime-isolation.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/runtime-isolation.ts) | runtime 适配器隔离示例 |
| [troubleshooting.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/troubleshooting.ts) | 排障与错误定位示例 |

---

<a id="doc-index-faq"></a>

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

<a id="doc-index-troubleshooting"></a>

## 🔧 故障排查

| 文档 | 说明 |
|------|------|
| [troubleshooting.md](troubleshooting.md) | 常见错误、排查步骤与可复制修复示例 |

---

<a id="doc-index-contributing"></a>

## 🛠️ 开发与贡献

| 文档 | 说明 |
|------|------|
| [CONTRIBUTING.md](https://github.com/vextjs/schema-dsl/blob/main/CONTRIBUTING.md) | 贡献指南 |

---

## 📊 版本信息

| 文档 | 说明 |
|------|------|
| [STATUS.md](https://github.com/vextjs/schema-dsl/blob/main/STATUS.md) | 项目状态（当前测试与发布状态）|
| [CHANGELOG.md](https://github.com/vextjs/schema-dsl/blob/main/CHANGELOG.md) | 更新日志 |

---

## 📁 文档统计

| 指标 | 当前值 |
|------|--------|
| `docs/*.md` 文档数 | **58** |
| `README.md + docs/*.md` 文档数 | **59** |
| 文档总行数 | **持续演进（以仓库实时内容为准）** |
| 测试文件数 | **75** |
| 最近一次全量验证 | **76 files / 1114 tests passed** |

---

**图例说明**:
- ⭐ 重点推荐文档
- ⭐⭐ 核心文档
- ⭐⭐⭐ 必读文档

---

## 对应示例文件

**示例入口**: [doc-index.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/doc-index.ts)  
**说明**: 用一个最小入口脚本串起快速开始、编译校验和文档导出，帮助读者从索引页直接落到可运行示例。

---

**最后更新**: 2026-06-10


