# 自定义类型注册

当前版本通过 `TypeRegistry` 提供类型注册能力。

```javascript
const { TypeRegistry, dsl } = require('schema-dsl');

TypeRegistry.register('evenNumber', {
  baseSchema: { type: 'number', multipleOf: 2 }
});

const schema = dsl({ value: 'evenNumber!' });
```

插件化扩展可结合 [plugin-system.md](./plugin-system.md) 使用。

