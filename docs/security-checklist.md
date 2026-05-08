# 安全检查清单

## 发布前检查

- 运行 `npm audit --audit-level=moderate`。
- 确认文档示例不包含真实密钥、Token 或密码。
- 自定义正则应避免灾难性回溯。
- 自定义 validator 不应执行不可信输入生成的代码。

## 当前建议

依赖升级后应重新运行完整测试与构建验证。

---

## 对应示例文件

**示例入口**: [security-checklist.ts](https://github.com/vextjs/schema-dsl/blob/v2/examples/docs/security-checklist.ts)  
**说明**: 使用占位 token、受限字符集和显式 URL 校验，示范文档中“不要暴露真实凭据”“正则要有界”的落地写法。

