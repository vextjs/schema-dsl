---
name: 🐛 Bug 报告
about: 报告一个问题帮助我们改进
title: '[BUG] '
labels: 'bug'
assignees: ''
---

## 🐛 Bug 描述

请清晰简洁地描述遇到的问题。

## 🔄 重现步骤

1. 执行 '...'
2. 调用 '....'
3. 看到错误 '....'

## ✅ 期望行为

描述你期望发生什么。

## ❌ 实际行为

描述实际发生了什么。

## 📝 代码示例

```javascript
const { dsl, validate } = require('schema-dsl');

const schema = dsl({
  // 你的 schema 定义
});

const result = validate(schema, {
  // 你的测试数据
});
```

## 🌍 环境信息

- **schema-dsl 版本**: [例如 v2.3.0]
- **Node.js 版本**: [例如 v18.0.0]
- **操作系统**: [例如 Windows 11 / macOS 14 / Ubuntu 22.04]
- **包管理器**: [npm / yarn / pnpm]

## 📎 附加信息

添加任何其他有助于解释问题的信息（截图、错误日志等）。

## ✔️ 检查清单

- [ ] 我已搜索现有 Issues，未发现重复问题
- [ ] 我已阅读 [文档](https://github.com/vextjs/schema-dsl#readme)
- [ ] 我已提供完整的重现步骤
- [ ] 我已提供环境信息
