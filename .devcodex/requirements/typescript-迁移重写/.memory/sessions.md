# 需求级会话记忆 — typescript-迁移重写

> **需求路径**: `requirements/typescript-迁移重写/`  
> **最后更新**: 2026-04-11  
> **关联 Agent SUMMARY**: `../../.memory/clients/copilot/SUMMARY.md`

---

## 📨 会话摘要（时间倒序）

| 日期 | 会话 ID | 阶段 | 成果 | 待跟进 |
|------|---------|------|------|--------|
| 2026-04-11 | f55b0d80 | v2 测试迁移 + v1 兼容性验证 | Batch 1~4 完成(40文件)；v2 tests 693/693；v1 compat 723/972(74.4%)；修复 ConditionalBuilder/DslParser/TypeRegistry/Locale/ErrorFormatter 共 6 个 v2 源码 bug；创建 v1 CJS shim 层 | 🔄 v1 兼容性修复(212 个公共 API 问题)；Batch 5 测试迁移 |
| 2026-04-11 | f55b0d80 | Phase 11 测试 + Phase 12 清理 | 191/191 测试全通过；修复 ConstraintParser/TypeRegistry/SchemaCompiler/DslBuilder 测试 API 偏差；StringExtensions 副作用隔离；补写 03-实施方案/README + 05-实施进度 + .memory/sessions.md；删除 lib/ + index.js/mjs/d.ts | Phase 12 ✅；VL-004 修复完成 |
| 2026-04-10 | f55b0d80 | Phase 1~10 实施 | tsc zero error；50 个文件创建；17 处 v1 bug 修复 | Phase 11 测试 |
| 2026-04-10 | f55b0d80 | CP1→CP2→plan-review→CP3 | 完整确认流程；04-实施计划.md 创建 | Phase 1~12 实施 |
| 2026-04-10 | f55b0d80 | 技术方案审查（10 轮收敛）| 13 处增量修正；全部 🔴 问题已关闭 | 进入实施 |
| 2026-04-10 | f55b0d80 | Profile 生成 + 需求迁移 | profile 4 文件；需求/方案从 projects/ 迁移到 .devcodex/ | 技术方案审查 |

---

## 关键决策

1. **DA-03 fix**：`string:N` 统一为 `exactLength: N`（非 `maxLength`）
2. **管线统一**：TypeRegistry → DslParser → ConstraintParser → SchemaCompiler 单管线（替代 v1 双管线）
3. **测试隔离**：集成测试不 import `src/index.ts`，避免 StringExtensions 副作用
4. **toString() 语义变更**：v2 中 `DslBuilder.toString()` 返回 JSON Schema 字符串，非原始 DSL
5. **min()/max() 限制**：仅适用 string 类型，number 类型约束通过 DSL 字符串（`number:0-100`）传入

---

## 恢复线索（🔄 未完成项）

- ~~Phase 12 清理~~：✅ 已完成
- 🔄 **v1 兼容性修复**: 212 个公共 API 不兼容问题，需按优先级逐项修复
  - Top 1: `types:` 联合类型语法（33 失败）— DslParser 需添加 `types:` 前缀解析
  - Top 2: `dsl.match()` `_required` 缺失（32 失败）— DslBuilder/index 需修复 match 对象解析
  - Top 3: ConditionalBuilder `.and()/.or()` 消息 API（16 失败）
  - 详细分类见 `05-实施进度.md` §v1 兼容性验证结果
- 🔄 **v2 测试迁移**: Batch 5（10 文件）+ 剩余 2 文件待完成
- 📝 **过程改进记录**: PI-001~PI-003 已记录到 SUMMARY.md
