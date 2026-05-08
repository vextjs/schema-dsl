# 自定义类型注册

当前版本通过 `TypeRegistry` 提供类型注册能力；如果你更偏向 DSL 侧入口，也可以使用 `DslBuilder.registerType()`，它内部会委托给 `TypeRegistry`。

```javascript
const { TypeRegistry, dsl } = require('schema-dsl');

TypeRegistry.register('evenNumber', {
  baseSchema: { type: 'number', multipleOf: 2 }
});

const schema = dsl({ value: 'evenNumber!' });
```

如果你希望统一从 Builder 侧管理自定义类型，也可以这样写：

```javascript
const { DslBuilder } = require('schema-dsl');

DslBuilder.registerType('orderCode', {
  type: 'string',
  pattern: '^ORD\\d{6}$'
});
```

插件化扩展可结合 [plugin-system.md](./plugin-system.md) 使用。

---

## 对应示例文件

**示例入口**: [plugin-type-registration.ts](https://github.com/vextjs/schema-dsl/blob/v2/examples/docs/plugin-type-registration.ts)  
**说明**: 同时覆盖 `TypeRegistry.register()` 和 `DslBuilder.registerType()` 两条入口，以及注册后的真实验证与清理流程。

