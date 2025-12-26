# 贡献指南

感谢您对 SchemaIO 的关注！我们欢迎所有形式的贡献。

---

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [测试要求](#测试要求)

---

## 行为准则

请遵守我们的行为准则，保持尊重和友好的交流环境。

---

## 如何贡献

### 报告 Bug

发现 Bug？请[创建 Issue](https://github.com/yourusername/schema-dsl/issues)，并提供以下信息：

- **环境信息**: Node.js 版本、操作系统
- **重现步骤**: 详细的步骤描述
- **期望行为**: 您期望发生什么
- **实际行为**: 实际发生了什么
- **错误信息**: 完整的错误堆栈

**示例**:
```markdown
### 环境
- Node.js: v18.0.0
- OS: Windows 11

### 重现步骤
1. 运行 `const schema = dsl('string:3-32!')`
2. 验证数据 `validator.validate(schema, 'ab')`
3. 期望返回验证失败，但返回成功

### 期望行为
应该验证失败，因为长度小于3

### 实际行为
验证通过

### 错误信息
无错误信息
```

### 提出功能请求

有好的想法？请[创建 Feature Request](https://github.com/yourusername/schema-dsl/issues)，说明：

- **功能描述**: 您想要什么功能
- **使用场景**: 这个功能解决什么问题
- **期望API**: 您期望的API设计
- **替代方案**: 是否有替代方案

### 提交代码

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## 开发流程

### 1. 克隆仓库

```bash
git clone https://github.com/yourusername/schema-dsl.git
cd schema-dsl
```

### 2. 安装依赖

```bash
npm install
```

### 3. 运行测试

```bash
# 运行单元测试
npm test

# 运行集成测试
npm run test:integration

# 运行所有测试
npm run test:all

# 生成覆盖率报告
npm run coverage
```

### 4. 运行示例

```bash
# 运行 Joi 风格示例
node examples/joi-style.js

# 运行 DSL 风格示例
node examples/dsl-style.js

# 运行导出示例
node examples/export-demo.js
```

### 5. 代码检查

```bash
npm run lint
```

### 6. 提交代码

请遵循[提交规范](#提交规范)。

---

## 代码规范

### 命名规范

- **变量/函数**: camelCase（`userName`, `getUserName`）
- **类**: PascalCase（`Validator`, `JSONSchemaCore`）
- **常量**: UPPER_SNAKE_CASE（`MAX_LENGTH`, `DEFAULT_VALUE`）
- **私有方法**: 前缀下划线（`_internalMethod`）

### 代码风格

- 使用 2 空格缩进
- 字符串使用单引号 `'`
- 分号结尾
- 每行最多 100 字符
- 函数最多 50 行

### 注释规范

使用 JSDoc 注释：

```javascript
/**
 * 验证数据
 * 
 * @param {Object} schema - JSON Schema 对象
 * @param {*} data - 待验证的数据
 * @param {Object} options - 验证选项
 * @returns {Object} 验证结果
 * 
 * @example
 * const result = validator.validate(schema, data);
 */
validate(schema, data, options = {}) {
  // 实现...
}
```

### 错误处理

必须包含错误处理：

```javascript
try {
  // 可能抛出错误的代码
  const result = dangerousOperation();
  return result;
} catch (error) {
  // 记录错误
  console.error('Operation failed:', error);
  // 抛出或返回错误
  throw new Error(`Operation failed: ${error.message}`);
}
```

---

## 提交规范

### Git 忽略规则

以下目录包含 AI 生成的临时文件或本地报告，**不应提交到 Git**：

- `plans/`: 需求分析、设计方案、技术规划文档
- `reports/`: 执行报告、分析报告、审计日志
- `.temp/`: 临时状态文件

请确保您的 `.gitignore` 文件包含以上目录。

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 提交类型

- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

**示例**:

```
feat(validator): add batch validation support

Add validateBatch() method to validate multiple data items at once.
This improves performance when validating large datasets.

Closes #123
```

```
fix(dsl): fix enum parsing with spaces

Fixed issue where enum values with spaces were not trimmed correctly.

Before: ['a ', ' b', ' c']
After: ['a', 'b', 'c']

Fixes #456
```

### Scope 说明

- `core`: 核心类（JSONSchemaCore, Validator）
- `adapters`: 适配器（Joi, DSL）
- `exporters`: 导出器（MongoDB, MySQL, PostgreSQL）
- `validators`: 验证器扩展
- `utils`: 工具函数
- `docs`: 文档
- `tests`: 测试

---

## 测试要求

### 单元测试

每个新功能必须包含单元测试：

```javascript
describe('新功能', () => {
  it('应该正常工作', () => {
    const result = newFeature();
    expect(result).to.equal(expectedValue);
  });

  it('应该处理边界情况', () => {
    expect(() => newFeature(null)).to.throw();
  });
});
```

### 测试覆盖率

- **目标覆盖率**: ≥ 80%
- **核心功能**: ≥ 90%
- **工具函数**: ≥ 70%

### 运行测试

```bash
# 快速测试
npm test

# 完整测试+覆盖率
npm run coverage
```

---

## Pull Request 流程

### 1. 创建 PR

- 标题清晰描述更改
- 详细说明更改内容
- 关联相关 Issue
- 提供测试结果

### 2. PR 检查清单

- [ ] 代码通过所有测试
- [ ] 添加了新的测试
- [ ] 更新了相关文档
- [ ] 遵循代码规范
- [ ] 提交信息符合规范
- [ ] 无合并冲突

### 3. 代码审查

维护者会审查您的代码，可能会：

- 提出修改建议
- 请求补充测试
- 讨论实现方案

请耐心等待并积极响应反馈。

### 4. 合并

通过审查后，维护者会合并您的 PR。

---

## 开发技巧

### 调试

使用 Node.js 调试器：

```bash
node inspect examples/joi-style.js
```

或使用 VSCode 调试配置。

### 性能测试

```bash
node test/benchmarks/validation-speed.js
```

### 文档预览

更新文档后，可以使用 Markdown 预览工具查看效果。

---

## 获取帮助

- **提问**: [GitHub Discussions](https://github.com/yourusername/schema-dsl/discussions)
- **Bug 报告**: [GitHub Issues](https://github.com/yourusername/schema-dsl/issues)
- **邮件**: your-email@example.com

---

## 许可证

贡献代码即表示您同意将代码以 [MIT](LICENSE) 许可证发布。

---

**感谢您的贡献！** 🎉

