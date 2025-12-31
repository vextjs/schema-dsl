# schema-dsl 示例代码

本目录包含 schema-dsl 的各种功能示例。

## 📂 示例列表

### 基础示例
- [simple-example.js](simple-example.js) - 简单入门示例
- [dsl-style.js](dsl-style.js) - DSL 风格完整示例
- [enum.examples.js](enum.examples.js) - 枚举类型验证示例

### 扩展功能
- [string-extensions.js](string-extensions.js) - String 扩展功能（username、password、phone）
- [custom-extension.js](custom-extension.js) - 自定义扩展示例
- [array-dsl-example.js](array-dsl-example.js) - 数组 DSL 语法示例

### 数据库导出
- [export-demo.js](export-demo.js) - 导出为 MongoDB/MySQL/PostgreSQL Schema

### 国际化 (i18n)
- [dynamic-locale-configuration.js](dynamic-locale-configuration.js) - 动态语言配置示例
- [dynamic-locale-example.js](dynamic-locale-example.js) - 动态语言切换示例
- [i18n-full-demo.js](i18n-full-demo.js) - 完整国际化示例
- [i18n-memory-safety.examples.js](i18n-memory-safety.examples.js) - i18n 内存安全示例

### Schema 工具
- [schema-utils-chaining.examples.js](schema-utils-chaining.examples.js) - SchemaUtils 链式调用示例
- [dsl-match-example.js](dsl-match-example.js) - 条件验证 match 示例
- [new-features-comparison.js](new-features-comparison.js) - 新版本功能对比

### 插件系统
- [plugin-system.examples.js](plugin-system.examples.js) - 插件系统完整示例

### 实际应用
- [express-integration.js](express-integration.js) - Express 集成完整示例
- [middleware-usage.js](middleware-usage.js) - 中间件使用示例
- [user-registration/](user-registration/) - 用户注册流程完整示例
  - [schema.js](user-registration/schema.js) - Schema 定义
  - [routes.js](user-registration/routes.js) - 路由定义
  - [server.js](user-registration/server.js) - 服务器入口
- [password-reset/](password-reset/) - 密码重置流程示例
  - [schema.js](password-reset/schema.js) - Schema 定义
  - [test.js](password-reset/test.js) - 测试用例

## 🚀 快速开始

### 1. 安装依赖

```bash
cd schema-dsl
npm install
```

### 2. 运行示例

```bash
# 运行简单示例
node examples/simple-example.js

# 运行 String 扩展示例
node examples/string-extensions.js

# 运行导出示例
node examples/export-demo.js
```

### 3. 查看完整文档

访问 [docs/INDEX.md](../docs/INDEX.md) 查看完整文档索引。

## 📖 相关文档

- [DSL 语法文档](../docs/dsl-syntax.md)
- [String 扩展文档](../docs/string-extensions.md)
- [插件系统文档](../docs/plugin-system.md)
- [API 参考](../docs/api-reference.md)
- [最佳实践](../docs/best-practices.md)

## 🤝 贡献

欢迎提交新的示例！请参考 [CONTRIBUTING.md](../CONTRIBUTING.md)。
