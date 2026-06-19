# schema-dsl 功能索引

> **最后更新**: 2026-06-18
> **用途**: 按能力查找对应文档。

当你知道自己要解决的能力问题、但不知道文档名称时，使用本页。若要逐页查看全部文档，请看 [文档地图](doc-index.md)。

## 定义 Schema

| 能力 | 主要文档 |
|------|----------|
| 编写紧凑 DSL 字符串 | [DSL 语法](dsl-syntax.md), [快速上手](quick-start.md) |
| 定义对象 schema | [DSL 语法](dsl-syntax.md), [DSL 对象支持](validate-dsl-object-support.md) |
| 标记必填或可选字段 | [可选标记 ?](optional-marker-guide.md), [类型参考](type-reference.md) |
| 使用枚举值 | [枚举](enum.md), [DSL 语法](dsl-syntax.md) |
| 允许多个类型 | [联合类型](union-types.md), [联合类型指南](union-type-guide.md), [多类型支持](multi-type-support.md) |
| 使用数字范围和比较运算符 | [数字比较运算符](number-operators.md), [DSL 语法](dsl-syntax.md) |
| 使用 builder 链式方法 | [链式字段方法列表](chain-methods.md), [TypeScript 指南](typescript-guide.md) |
| 使用直接 String 链式 helper | [String 扩展](string-extensions.md), [TypeScript 指南](typescript-guide.md) |

## 验证数据

| 能力 | 主要文档 |
|------|----------|
| 同步验证 | [validate()](validate.md), [验证指南](validation-guide.md) |
| 异步验证 | [validateAsync()](validate-async.md), [错误处理](error-handling.md) |
| 批量验证 | [批量验证](validate-batch.md), [验证指南](validation-guide.md) |
| 复用 Validator 实例 | [Validator](validator.md), [性能指南](performance-guide.md) |
| 预编译 schema | [编译](compile.md), [Validator](validator.md) |
| 添加条件规则 | [条件 API](conditional-api.md), [验证指南](validation-guide.md) |
| 格式化和自定义错误 | [错误处理](error-handling.md), [i18n 用户指南](i18n-user-guide.md) |

## 运行时、TypeScript 与副作用

| 能力 | 主要文档 |
|------|----------|
| 理解 TypeScript 类型推导边界 | [TypeScript 指南](typescript-guide.md), [API 参考](api-reference.md) |
| 选择 `schema-dsl/pure` 或 `schema-dsl/runtime` | [运行时隔离](runtime-isolation.md), [快速上手](quick-start.md) |
| 使用副作用受控入口 | [String 扩展](string-extensions.md), [运行时隔离](runtime-isolation.md) |
| 按 app、plugin、tenant 或 worker 隔离运行时状态 | [运行时隔离](runtime-isolation.md), [运行时 locale 支持](runtime-locale-support.md) |
| 在运行时处理 locale 和消息 | [运行时 locale 支持](runtime-locale-support.md), [动态语言切换](dynamic-locale.md) |

## 导出与互操作

| 能力 | 主要文档 |
|------|----------|
| 理解 JSON Schema 输出 | [JSON Schema 基础](json-schema-basics.md), [API 参考](api-reference.md) |
| 导出数据库 schema | [导出指南](export-guide.md), [导出限制](export-limitations.md) |
| 导出到 MongoDB | [MongoDB 导出](mongodb-exporter.md), [导出指南](export-guide.md) |
| 导出到 MySQL | [MySQL 导出](mysql-exporter.md), [导出指南](export-guide.md) |
| 导出到 PostgreSQL | [PostgreSQL 导出](postgresql-exporter.md), [导出指南](export-guide.md) |
| 导出 schema 文档 | [Markdown 导出](markdown-exporter.md), [导出指南](export-guide.md) |
| 转换 schema 类型 | [TypeConverter](type-converter.md), [JSON Schema 基础](json-schema-basics.md) |

## 复用与扩展

| 能力 | 主要文档 |
|------|----------|
| 复用 schema 片段 | [SchemaUtils](schema-utils.md), [SchemaUtils 链式调用](schema-utils-chaining.md) |
| 使用 schema 工具实践模式 | [SchemaUtils 最佳实践](schema-utils-best-practices.md), [SchemaUtils 进阶问题](schema-utils-advanced-issues.md) |
| 分析或转换 schema 对象 | [SchemaHelper](schema-helper.md), [CacheManager](cache-manager.md) |
| 选择扩展路径 | [扩展概览](extensions-overview.md), [框架集成与目录结构](framework-extension-setup.md) |
| 注册自定义 DSL 类型 | [自定义 DSL 类型](plugin-type-registration.md), [扩展概览](extensions-overview.md) |
| 添加自定义 factory | [自定义 s.xxx() 工厂](custom-factories.md), [自定义 DSL 类型](plugin-type-registration.md) |
| 添加自定义链式方法 | [自定义链式方法](custom-chain-methods.md), [String 扩展](string-extensions.md) |
| 添加自定义关键字 | [自定义校验关键字](add-keyword.md), [高级扩展组合指南](custom-extensions-guide.md) |
| 封装插件生命周期和 hook | [插件管理器（高级）](plugin-system.md), [高级扩展组合指南](custom-extensions-guide.md) |

## 国际化

| 能力 | 主要文档 |
|------|----------|
| 使用内置 locale 支持 | [i18n 概览](i18n.md), [多语言支持](multi-language.md) |
| 在应用中配置 i18n | [i18n 用户指南](i18n-user-guide.md), [运行时 locale 支持](runtime-locale-support.md) |
| 动态切换语言 | [动态语言切换](dynamic-locale.md), [前端 i18n 指南](frontend-i18n-guide.md) |
| 添加自定义语言包 | [添加自定义语言包](add-custom-locale.md), [i18n 用户指南](i18n-user-guide.md) |

## 生产使用

| 能力 | 主要文档 |
|------|----------|
| 选择生产实践模式 | [最佳实践](best-practices.md), [项目结构最佳实践](best-practices-project-structure.md) |
| 优化性能 | [性能指南](performance-guide.md), [CacheManager](cache-manager.md) |
| 审查安全相关用法 | [安全检查清单](security-checklist.md), [导出限制](export-limitations.md) |
| 诊断常见失败 | [故障排查](troubleshooting.md), [FAQ](faq.md) |

## API 参考

| 需求 | 主要文档 |
|------|----------|
| 完整公开 API 细节 | [API 参考](api-reference.md) |
| 紧凑 API 入口 | [API 概览](api.md) |
| 按页面查找文档 | [文档地图](doc-index.md) |

## 示例

| 资源 | 用途 |
|------|------|
| [examples/docs](https://github.com/vextjs/schema-dsl/blob/main/examples/docs) | 文档页对应的可运行示例。 |
| [feature-index.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/feature-index.ts) | 串联 DSL、String 扩展和导出器的代表性示例。 |
| [chain-methods.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/chain-methods.ts) | 覆盖字段 builder 链式方法的可运行示例。 |
| [extensions-overview.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/extensions-overview.ts) | 覆盖扩展路径总览的可运行示例。 |
| [object-dsl-builder.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/object-dsl-builder.ts) | 覆盖对象 builder 链式写法、必填字段控制和对象 schema 转换。 |
| [real-world.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/real-world.ts) | 覆盖用户、商品、订单、查询、默认值和异步校验的生产式组合示例。 |
