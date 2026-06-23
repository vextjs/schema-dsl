# 自定义校验关键字

`Validator.addKeyword(name, definition)` 用于向底层 AJV 实例注册自定义关键字。

它适合扩展“验证规则”，例如 `isEven`、`maxWords`、`startsWithPrefix`。如果你想定义可复用业务字段类型，例如 `tenant-id!`、`s('tenant-id!')`、`s.tenantId('corp')`，请优先阅读 [自定义 DSL 类型](custom-extensions.md)。

当前实现内部已经兼容 AJV 8 的对象式注册，因此可以继续使用 v1 的两参数写法，而不会把 deprecated 警告暴露给调用方。

```javascript
import { Validator } from 'schema-dsl/pure';
const validator = new Validator();
validator.addKeyword('isEven', {
  type: 'number',
  validate: (_schema, data) => data % 2 === 0
});
```

## 什么时候使用它

| 需求 | 推荐入口 |
|---|---|
| 定义业务字段类型，并希望纯 DSL、`s('...')`、`s.xxx()` 都能使用 | [自定义 DSL 类型](custom-extensions.md) |
| 给已有 JSON Schema 增加一个底层校验关键字 | `Validator.addKeyword()` |
| 在一个项目或框架里注册一组业务类型 | [框架集成与目录结构](framework-extension-setup.md) |
| 封装安装、卸载和 hook 生命周期 | [插件管理器（高级）](plugin-system.md) |

更多 AJV 关键字定义请参考 AJV 官方文档。

---

## 对应示例文件

**示例入口**: [add-keyword.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/add-keyword.ts)  
**说明**: 覆盖 `Validator.addKeyword()` 的最小注册与验证路径，直接展示成功 / 失败两种结果。

