# 自定义校验关键字

`Validator.addKeyword(name, definition)` 用于向底层 AJV 实例注册自定义关键字。

当前实现内部已经兼容 AJV 8 的对象式注册，因此可以继续使用 v1 的两参数写法，而不会把 deprecated 警告暴露给调用方。

```javascript
import { Validator } from 'schema-dsl/pure';
const validator = new Validator();
validator.addKeyword('isEven', {
  type: 'number',
  validate: (_schema, data) => data % 2 === 0
});
```

更多 AJV 关键字定义请参考 AJV 官方文档。

---

## 对应示例文件

**示例入口**: [add-keyword.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/add-keyword.ts)  
**说明**: 覆盖 `Validator.addKeyword()` 的最小注册与验证路径，直接展示成功 / 失败两种结果。

