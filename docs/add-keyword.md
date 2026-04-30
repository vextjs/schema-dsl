# addKeyword 方法

`Validator.addKeyword(name, definition)` 用于向底层 AJV 实例注册自定义关键字。

```javascript
const { Validator } = require('schema-dsl');
const validator = new Validator();
validator.addKeyword('isEven', {
  type: 'number',
  validate: (_schema, data) => data % 2 === 0
});
```

更多 AJV 关键字定义请参考 AJV 官方文档。

