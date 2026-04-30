# Validator 类概述

`Validator` 是对 AJV 的封装，提供编译缓存、错误格式化、自定义关键字和批量验证能力。

```javascript
const { Validator, dsl } = require('schema-dsl');
const validator = new Validator();
const schema = dsl({ email: 'email!' });
console.log(validator.validate(schema, { email: 'test@example.com' }));
```

## 缓存配置

`Validator` 构造器支持两种缓存写法：

```javascript
new Validator({ cache: true });   // 使用默认缓存配置
new Validator({ cache: false });  // 关闭缓存

new Validator({
  cache: {
	enabled: true,
	maxSize: 500,
	ttl: 60 * 60 * 1000
  }
});
```

> 如果你希望直接传入 DSL 对象（例如 `validate({ email: 'email!' }, data)`），请使用顶层便捷函数 `validate()` / `validateAsync()`；`Validator` 实例方法仍建议接收标准 JSON Schema 或 `dsl({...})` 的转换结果。

相关方法：`compile()`、`validate()`、`validateAsync()`、`validateBatch()`、`addKeyword()`、`addFormat()`。

