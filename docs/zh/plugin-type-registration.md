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

当插件或测试只需要移除一个 Builder 侧自定义类型时，使用 `DslBuilder.unregisterType('orderCode')`；只有确实要清空全部自定义类型（例如隔离测试收尾）时，才使用 `DslBuilder.clearCustomTypes()`。

插件化扩展可结合 [plugin-system.md](./plugin-system.md) 使用。

---

## 对应示例文件

**示例入口**: [plugin-type-registration.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/plugin-type-registration.ts)  
**说明**: 覆盖 `TypeRegistry.register()`、`DslBuilder.registerType()`，以及通过 `DslBuilder.unregisterType()` / `DslBuilder.clearCustomTypes()` 清理注册状态的路径。

