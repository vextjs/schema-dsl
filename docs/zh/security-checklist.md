# 安全注意事项

本页整理 schema 定义、自定义 validator 和导出器使用时需要注意的安全问题。第一次快速上手不需要先读这里；当 schema 涉及凭据、URL、正则或生成数据库约束时，再回到本页核对。

## 发布 schema 相关代码前

- 运行 `npm audit --audit-level=moderate`。
- 确认文档示例不包含真实密钥、Token 或密码。
- 自定义正则应避免灾难性回溯。
- 自定义 validator 不应执行不可信输入生成的代码。

## 当前建议

依赖升级后应重新运行完整测试与构建验证。

---

## 对应示例文件

**示例入口**: [security-checklist.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/security-checklist.ts)  
**说明**: 使用占位 token、受限字符集和显式 URL 校验，示范文档中“不要暴露真实凭据”“正则要有界”的落地写法。

