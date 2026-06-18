# schema-dsl 文档地图

> **最后更新**: 2026-06-18
> **用途**: 按左侧菜单相同的任务路径查找全部已发布文档。
> **在线文档**: [中文首页](/schema-dsl/zh/)

本页是文档地图。左侧菜单仍是文档站的主导航真相源；本页用于给已经知道大致方向的读者提供紧凑、可搜索的总览。

## 开始

| 文档 | 何时阅读 |
|------|----------|
| [首页](index.md) | 了解产品定位和文档站入口。 |
| [快速上手](quick-start.md) | 第一个可运行 schema、验证结果和常见使用路径。 |
| [设计理念](design-philosophy.md) | 理解 schema-dsl 为什么采用紧凑 DSL、JSON Schema 输出和运行时验证。 |
| [TypeScript 指南](typescript-guide.md) | 类型推导边界、编辑器提示和 TypeScript 使用方式。 |

## Schema 写法

| 文档 | 何时阅读 |
|------|----------|
| [DSL 语法](dsl-syntax.md) | 字符串与对象 schema 的完整 DSL 语法。 |
| [完整类型列表](type-reference.md) | 基础类型、格式、factory 调用和类型相关行为。 |
| [链式字段方法列表](chain-methods.md) | 完整字段 builder 方法列表和入口支持。 |
| [可选标记 ?](optional-marker-guide.md) | 可选字段语法和 required 字段行为。 |
| [多类型支持](multi-type-support.md) | 字段支持多类型的设计说明。 |
| [联合类型](union-types.md) | `types:` 语法和跨类型验证。 |
| [联合类型指南](union-type-guide.md) | 一个字段接受多种类型的实用指南。 |
| [数字比较运算符](number-operators.md) | 数字比较运算符和范围写法。 |
| [枚举](enum.md) | 枚举语法和允许值验证。 |
| [String 扩展](string-extensions.md) | JavaScript String 链式 helper 与副作用受控入口。 |

## 验证与运行时

| 文档 | 何时阅读 |
|------|----------|
| [validate()](validate.md) | 同步验证 helper 和返回结构。 |
| [validateAsync()](validate-async.md) | 异步验证与 `ValidationError` 行为。 |
| [批量验证](validate-batch.md) | 批量数据验证和汇总结果。 |
| [DSL 对象支持](validate-dsl-object-support.md) | 直接把 DSL 对象定义传给验证 helper。 |
| [验证指南](validation-guide.md) | 端到端验证场景、失败路径和选项。 |
| [Validator](validator.md) | Validator 类、生命周期和缓存行为。 |
| [条件 API](conditional-api.md) | ConditionalBuilder 与条件验证链。 |
| [错误处理](error-handling.md) | 错误格式化、消息和恢复模式。 |
| [编译](compile.md) | 重复验证前预编译 schema。 |
| [运行时隔离](runtime-isolation.md) | app、plugin、tenant 或 worker 边界下的隔离运行时状态。 |

## 导出与互操作

| 文档 | 何时阅读 |
|------|----------|
| [JSON Schema 基础](json-schema-basics.md) | schema-dsl 输出涉及的 JSON Schema 概念。 |
| [导出指南](export-guide.md) | JSON Schema 如何映射到数据库和 Markdown 导出器。 |
| [导出限制](export-limitations.md) | 哪些验证语义无法被数据库 DDL 表达。 |
| [MongoDB 导出](mongodb-exporter.md) | MongoDB `$jsonSchema` 和集合命令。 |
| [MySQL 导出](mysql-exporter.md) | MySQL DDL 和类型映射。 |
| [PostgreSQL 导出](postgresql-exporter.md) | PostgreSQL DDL、schema 和索引。 |
| [Markdown 导出](markdown-exporter.md) | 从 schema 生成 Markdown 文档。 |
| [TypeConverter](type-converter.md) | JSON Schema 到数据库类型的转换工具。 |

## 复用与工具

| 文档 | 何时阅读 |
|------|----------|
| [SchemaUtils](schema-utils.md) | schema 复用、组合、过滤和工具导出。 |
| [SchemaUtils 链式调用](schema-utils-chaining.md) | 链式复用操作。 |
| [SchemaUtils 最佳实践](schema-utils-best-practices.md) | 可复用 schema 的实践模式和常见陷阱。 |
| [SchemaUtils 进阶问题](schema-utils-advanced-issues.md) | 更深入的边界问题和维护说明。 |
| [SchemaHelper](schema-helper.md) | schema 分析和辅助工具。 |
| [CacheManager](cache-manager.md) | LRU 缓存行为和缓存管理 API。 |
| [label vs description](label-vs-description.md) | UI 标签和 schema 描述的区别。 |

## 国际化

| 文档 | 何时阅读 |
|------|----------|
| [i18n 概览](i18n.md) | 国际化模型和 locale 概念。 |
| [多语言支持](multi-language.md) | 内置多语言行为。 |
| [i18n 用户指南](i18n-user-guide.md) | 面向使用者的 i18n 配置和用法。 |
| [前端 i18n 指南](frontend-i18n-guide.md) | 前端语言切换模式。 |
| [添加自定义语言包](add-custom-locale.md) | 添加自定义语言包。 |
| [动态语言切换](dynamic-locale.md) | 运行时语言切换。 |
| [运行时 locale 支持](runtime-locale-support.md) | 运行时验证中的 locale 行为。 |

## 扩展与集成

| 文档 | 何时阅读 |
|------|----------|
| [扩展概览](extensions-overview.md) | 在自定义类型、factory、链式方法、关键字、runtime 隔离和插件之间选择路径。 |
| [自定义 DSL 类型](plugin-type-registration.md) | 注册 `tenant-id!` 这样的可复用 DSL 字面量。 |
| [自定义 s.xxx() 工厂](custom-factories.md) | 暴露可发现的 namespace factory。 |
| [自定义链式方法](custom-chain-methods.md) | 给已有 builder 添加方法，并配置 transform 支持。 |
| [自定义校验关键字](add-keyword.md) | 添加自定义 AJV keyword。 |
| [框架集成与目录结构](framework-extension-setup.md) | 为应用和框架组织可复用扩展模块。 |
| [插件管理器（高级）](plugin-system.md) | 插件生命周期、hook 和集成编排。 |
| [高级扩展组合指南](custom-extensions-guide.md) | 组合自定义类型、factory、关键字、多语言、runtime 隔离和插件。 |

## 生产实践与排错

| 文档 | 何时阅读 |
|------|----------|
| [最佳实践](best-practices.md) | 生产项目中的推荐用法。 |
| [项目结构最佳实践](best-practices-project-structure.md) | 在真实项目中组织 schema-dsl。 |
| [性能指南](performance-guide.md) | 性能调优和缓存注意事项。 |
| [安全检查清单](security-checklist.md) | schema 使用和导出的安全审查清单。 |
| [故障排查](troubleshooting.md) | 常见失败和可复现修复方式。 |
| [FAQ](faq.md) | 常见问题的短答案。 |

## 参考与索引

| 文档 | 何时阅读 |
|------|----------|
| [API 参考](api-reference.md) | 完整公开 API 参考。 |
| [API 概览](api.md) | 紧凑 API 入口。 |
| [文档地图](doc-index.md) | 本页，按 sidebar 路径组织。 |
| [功能索引](FEATURE-INDEX.md) | 按能力查找对应文档。 |

## 示例

| 资源 | 用途 |
|------|------|
| [examples/docs](https://github.com/vextjs/schema-dsl/blob/main/examples/docs) | 文档页对应的 companion examples。 |
| [doc-index.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/doc-index.ts) | 串起快速开始、编译和文档导出的最小入口脚本。 |

当前验证命令和测试数量以仓库脚本与项目 Profile 为准，不在本页维护静态统计。
