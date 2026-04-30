# compile 方法

`Validator.compile(schema, cacheKey?)` 会将 JSON Schema 编译为 AJV 验证函数，并在传入 `cacheKey` 时复用缓存。

```javascript
const { Validator, dsl } = require('schema-dsl');
const validator = new Validator();
const schema = dsl({ name: 'string!' });
const validate = validator.compile(schema, 'user-schema');
console.log(validate({ name: 'Rocky' }));
```

