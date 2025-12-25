# Plans 目录说明

本目录用于存储 SchemaIO 项目的**需求文档、设计方案、技术方案**。

---

## 📁 目录结构

```
plans/
├── README.md                # 本文件
├── TEMPLATE.md              # 方案文档模板
├── requirements/            # 需求文档
│   └── req-refactor-v1.0.md
├── bugs/                    # Bug修复方案
├── optimizations/           # 性能优化方案
├── refactoring/             # 代码重构方案
├── security/                # 安全加固方案
├── database/                # 数据库变更方案
├── api/                     # API开发方案
└── scripts/                 # 脚本开发方案
```

---

## 📝 文档命名规范

### 格式

```
{类型前缀}-{功能描述}-v{版本号}.md
```

### 类型前缀

| 前缀 | 类型 | 示例 |
|------|------|------|
| `req-` | 需求文档 | req-changelog-opt-v1.0.md |
| `bug-` | Bug修复 | bug-dsl-parse-v1.1.md |
| `opt-` | 性能优化 | opt-cache-strategy-v1.2.md |
| `ref-` | 代码重构 | ref-adapter-pattern-v1.0.md |
| `sec-` | 安全加固 | sec-input-validation-v1.3.md |
| `db-` | 数据库变更 | db-add-index-v2.0.md |
| `api-` | API开发 | api-export-graphql-v2.1.md |
| `script-` | 脚本开发 | script-migration-v1.5.md |

### 版本号规则

- 使用该需求首次计划或实施的版本号
- 格式: `vX.Y` 或 `vX.Y.Z`
- 版本号必须后置（在文件名末尾）

---

## 📋 文档必需章节

每个方案文档必须包含以下章节（详见 [TEMPLATE.md](TEMPLATE.md)）：

1. **需求背景** - 为什么要做这个需求
2. **技术方案** - 如何实现
3. **实现清单** - 具体要做哪些事
4. **风险评估** - 可能的问题和影响
5. **验证方式** - 如何验证实现正确
6. **后续优化** - 还有哪些可以改进的

---

## 🔗 与其他文档的关联

### 与 STATUS.md 的关联

- STATUS.md 中的每个需求都应该有对应的 plans/ 文档
- plans/ 文档完成后，更新 STATUS.md 中的状态

### 与 CHANGELOG.md 的关联

- 需求实施完成后，在 CHANGELOG.md 中记录变更
- CHANGELOG.md 应该引用对应的 plans/ 文档

### 示例

```markdown
<!-- STATUS.md -->
| 需求标题 | 状态 | 详细 |
|---------|------|------|
| 重构为适配器模式 | ✅ 已完成 | [详见方案](plans/requirements/req-refactor-v1.0.md) |

<!-- CHANGELOG.md -->
### v1.0.0 - 2025-12-24

**功能**:
- 重构为适配器模式架构 [详见方案](plans/requirements/req-refactor-v1.0.md)
```

---

## 🎯 使用流程

### 1. 创建方案文档

```bash
# 1. 选择合适的目录
cd plans/requirements/  # 或其他类型目录

# 2. 复制模板
cp ../TEMPLATE.md req-new-feature-v1.1.md

# 3. 编辑文档，填写各章节
```

### 2. 评审和确认

- 方案编写完成后，请求团队评审
- 确认方案可行后，开始实施

### 3. 实施过程

- 按照"实现清单"逐项实施
- 更新 STATUS.md 状态

### 4. 实施完成

- 执行"验证方式"中的验证步骤
- 更新 CHANGELOG.md
- 关闭对应的 Issue

---

## 📊 当前状态

### 已有方案文档

| 文档 | 类型 | 状态 | 版本 |
|------|------|------|------|
| req-refactor-v1.0.md | 需求 | ✅ 已完成 | v1.0.0 |

### 待创建方案文档

根据 [STATUS.md](../STATUS.md) 中的规划，以下需求需要创建方案文档：

- [ ] `req-chain-adapter-v1.1.md` - ChainAdapter实现
- [ ] `opt-performance-v1.2.md` - 性能优化
- [ ] `api-typescript-v1.3.md` - TypeScript类型定义

---

## ❓ 常见问题

### Q1: 什么时候需要创建方案文档？

**答**: 以下情况需要创建方案文档：
- 新功能开发
- 重要的代码重构
- 数据库结构变更
- 性能优化
- 安全加固

简单的 Bug 修复可以不创建方案文档。

### Q2: 方案文档和 Issue 的区别？

**答**:
- **Issue**: 描述问题或需求（What）
- **方案文档**: 详细的技术方案和实施计划（How）

通常流程：Issue → 方案文档 → 实施 → 验证

### Q3: 方案文档需要多详细？

**答**: 根据复杂度决定：
- **简单需求**: 1-2页，简要说明技术方案
- **中等需求**: 3-5页，包含详细实现清单
- **复杂需求**: 5-10页，包含架构图、时序图等

---

## 📚 参考资料

- [方案文档模板](TEMPLATE.md)
- [项目状态](../STATUS.md)
- [更新日志](../CHANGELOG.md)
- [贡献指南](../CONTRIBUTING.md)

---

**最后更新**: 2025-12-24  
**维护者**: SchemaIO Team

