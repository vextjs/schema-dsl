# validateBatch 方法

`Validator.validateBatch(schema, dataArray)` 用同一个已编译 Schema 验证多条数据。

## 方法签名

```javascript
validator.validateBatch(schema, dataArray)
```

## 返回值

返回一个数组，每一项都与单次 `validator.validate()` 的返回结构一致：

- `valid` - 是否通过
- `data` - 验证后的数据（通过时）
- `errors` - 错误列表（失败时）

```javascript
[
  { valid: true, data: { email: 'a@example.com' }, errors: [] },
  { valid: false, data: { email: 'bad' }, errors: [/* ... */] }
]
```

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

## 适用场景

- 导入数据前的批量校验
- 同一 schema 下的大量记录预检查
- 希望只编译一次 schema，再对整批数据复用

---

## 对应示例文件

**示例入口**: [validate-batch.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/validate-batch.ts)  
**说明**: 覆盖 `Validator.validateBatch()` 的单次编译、多条数据复用，以及失败项错误输出。

