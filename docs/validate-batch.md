# validateBatch 方法

`Validator.validateBatch(schema, dataArray)` 用同一个已编译 Schema 验证多条数据。

```javascript
const { Validator, dsl } = require('schema-dsl');
const validator = new Validator();
const schema = dsl({ email: 'email!' });
const results = validator.validateBatch(schema, [
  { email: 'a@example.com' },
  { email: 'bad' }
]);
console.log(results);
```

