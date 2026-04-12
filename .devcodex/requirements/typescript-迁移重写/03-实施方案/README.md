# 03-实施方案

> **关联计划**: [`../04-实施计划.md`](../04-实施计划.md)  
> **实施分支**: `v2`  
> **方案状态**: ✅ Phase 1~11 已完成，Phase 12 清理中

## 说明

本次 TypeScript 迁移重写采用 **12 Phase 分层实施策略**，完整计划（含每 Phase 文件清单和验收标准）见 `04-实施计划.md`。

`03-实施方案/` 目录记录各 Phase 的具体实施要点和决策记录。

---

## Phase 实施概要

| Phase | 内容 | 核心决策 | 状态 |
|:-----:|------|---------|:----:|
| 1 | 工程骨架 | tsup + vitest + ESLint 9 flat config；NodeNext 模块规范 | ✅ |
| 2 | 类型定义 | `DslDefinition` 改为 interface（避免 TS2456 循环引用）；`exactOptionalPropertyTypes:true` | ✅ |
| 3 | 基础模块 | TemplateEngine 注入防护；ValidationError 继承 Error（C-03 fix）| ✅ |
| 4 | 解析管线 | 统一 TypeRegistry→DslParser→ConstraintParser→SchemaCompiler 单管线；修复 17 处 bug | ✅ |
| 5 | 语言包 | 5 个语言包（zh-CN/en-US/ja-JP/fr-FR/es-ES）；addFormats 双重转换兼容 AJV v8 | ✅ |
| 6 | Locale+Validator | CustomKeywords.registerAll()；`exactLength` 自定义关键字；V-Y01~V-Y07 修复 | ✅ |
| 7 | DslBuilder | 构造器委托 DslParser；`min()`/`max()` 仅适用 string 类型；`toString()` 返回 JSON Schema | ✅ |
| 8 | Conditional+Utils | `assert()` 抛 ValidationError（C-03 fix）；StringExtensions 柯里化 | ✅ |
| 9 | 导出器 | 4 个导出器（MySQL/PostgreSQL/MongoDB/Markdown）；`exactLength` 处理兼容 | ✅ |
| 10 | 入口文件 | `src/index.ts` 30 个导出；`dsl.match()` 内联；VERSION 动态读取 package.json | ✅ |
| 11 | 测试 | 12 个测试文件，191 个测试用例全部通过；不从 index.ts 导入（规避 StringExtensions 副作用）| ✅ |
| 12 | 清理 | 删除 `lib/`、`index.js`、`index.mjs`、`index.d.ts` | 🚧 |

---

## 关键技术决策记录

### DA-03 fix：`string:N` 语义统一
- **问题**：v1 中 `string:N`（单值）在 DslAdapter 和 DslBuilder 中行为不一致
- **决策**：统一为 `exactLength: N`（精确长度，自定义 AJV 关键字），不再使用 `maxLength`
- **影响**：测试中所有 `string:100` 期望从 `maxLength: 100` 改为 `exactLength: 100`

### DB-03 fix：负数范围支持
- **问题**：v1 范围解析正则 `/^(\d+)-(\d+)$/` 不支持负数
- **决策**：改为 `/^(-?\d*\.?\d*)-(-?\d*\.?\d*)$/`

### V-Y01 fix：AJV 选项过滤
- **问题**：schema-dsl 自定义选项（`cache`/`locale`/`strict` 等）透传给 AJV 导致警告
- **决策**：`NON_AJV_KEYS` Set 过滤后再传入 `new Ajv()`

### StringExtensions 副作用隔离
- **问题**：`src/index.ts` 模块加载时自动调用 `installStringExtensions()`，在 Vitest 环境中触发 `Cannot assign to read only property 'length'`
- **决策**：测试文件不从 `src/index.ts` 导入，直接导入各模块（`DslParser`/`DslBuilder`/`Validator`）
