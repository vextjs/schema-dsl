# 安全政策

## 支持的版本

我们目前支持以下版本的安全更新：

| 版本 | 支持状态 |
| ------- | ------------------ |
| 2.3.x   | :white_check_mark: |
| 2.2.x   | :white_check_mark: |
| 2.1.x   | :white_check_mark: |
| < 2.0   | :x:                |

## 报告安全漏洞

我们非常重视 SchemaIO 的安全性。如果你发现了安全漏洞，请**不要**公开披露，而是通过以下方式报告：

### 报告渠道

**优先方式**：发送邮件至 **rockyshi1993@gmail.com**

邮件标题格式：`[SECURITY] SchemaIO - 简短描述`

### 应包含的信息

请在报告中包含以下信息：

1. **漏洞描述**：清晰描述安全问题
2. **影响范围**：受影响的版本
3. **重现步骤**：详细的重现步骤
4. **PoC 代码**：如果可能，提供概念验证代码
5. **潜在影响**：漏洞可能造成的影响
6. **建议修复**：如果有修复建议

### 报告模板

```markdown
## 漏洞类型
[例如：注入攻击、拒绝服务、信息泄露]

## 影响版本
[例如：v2.0.0 - v2.3.0]

## 漏洞描述
[详细描述]

## 重现步骤
1. ...
2. ...

## PoC 代码
```javascript
// 你的 PoC 代码
```

## 潜在影响
[描述可能的影响]

## 建议修复
[如果有]
```

### 响应时间

- **初步确认**：1-2 个工作日
- **漏洞评估**：3-5 个工作日
- **修复发布**：根据严重程度，7-30 天

### 严重程度分级

我们使用 CVSS 3.1 评分系统：

- **严重**（9.0-10.0）：立即修复，< 7 天
- **高危**（7.0-8.9）：优先修复，< 14 天
- **中危**（4.0-6.9）：计划修复，< 30 天
- **低危**（0.1-3.9）：常规修复，< 90 天

## 安全最佳实践

使用 SchemaIO 时，请遵循以下最佳实践：

### 1. 输入验证

```javascript
// ✅ 推荐：使用 SchemaIO 验证所有外部输入
const schema = dsl({
  username: 'string:3-32!'.pattern(/^[a-zA-Z0-9_]+$/),
  email: 'email!',
  age: 'number:0-150'
});

const result = validate(schema, userInput);
if (!result.valid) {
  throw new Error('Invalid input');
}
```

### 2. 避免动态执行

```javascript
// ❌ 危险：不要从不可信源动态执行代码
const schemaStr = req.body.schema; // 来自用户输入
eval(schemaStr); // 危险！

// ✅ 安全：使用预定义的 Schema
const allowedSchemas = {
  user: userSchema,
  post: postSchema
};
const schema = allowedSchemas[req.body.schemaType];
```

### 3. 限制资源使用

```javascript
// ✅ 推荐：限制数组大小，防止 DoS
const schema = dsl({
  tags: 'array:1-100<string:1-50>' // 限制数组和元素大小
});
```

### 4. 保持更新

定期更新到最新版本以获得安全补丁：

```bash
npm update schema-dsl
```

### 5. 依赖审计

定期运行安全审计：

```bash
npm audit
npm audit fix
```

## 已知的安全问题

### 已修复的漏洞

目前没有已知的安全漏洞。

查看历史安全公告：[Security Advisories](https://github.com/vextjs/schema-dsl/security/advisories)

## 安全相关配置

### ReDoS 防护

SchemaIO 内置了对正则表达式拒绝服务（ReDoS）的防护：

```javascript
// 内部会检测和缓存安全的正则表达式
const schema = dsl({
  username: 'string'.pattern(/^[a-zA-Z0-9_]+$/)
});
```

### 自定义验证器安全

使用自定义验证器时注意：

```javascript
// ⚠️ 注意：自定义验证器中的异步操作
const schema = dsl({
  email: 'email!'.custom(async (value) => {
    // 确保设置超时，防止挂起
    const exists = await checkEmailExists(value, { timeout: 5000 });
    if (exists) return '邮箱已被占用';
  })
});
```

## 致谢

我们感谢所有负责任地披露安全问题的研究人员。

如果你报告了有效的安全漏洞，我们会在修复后的发布说明中致谢（除非你要求匿名）。

---

**最后更新**：2025-12-29  
**联系方式**：rockyshi1993@gmail.com
