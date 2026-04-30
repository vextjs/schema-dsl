# Validator 类概述

`Validator` 是对 AJV 的封装，提供编译缓存、错误格式化、自定义关键字和批量验证能力。

```javascript
const { Validator, dsl } = require('schema-dsl');
const validator = new Validator();
const schema = dsl({ email: 'email!' });
console.log(validator.validate(schema, { email: 'test@example.com' }));
```

相关方法：`compile()`、`validate()`、`validateAsync()`、`validateBatch()`、`addKeyword()`、`addFormat()`。

