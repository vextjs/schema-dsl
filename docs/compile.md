# compile 方法

`Validator.compile(schema, cacheKey?)` 会将 JSON Schema 编译为 AJV 验证函数，并在传入 `cacheKey` 时复用缓存。

## 方法签名

```javascript
validator.compile(schema, cacheKey?)
```

## 参数

- `schema` - JSON Schema 对象
- `cacheKey` - 可选缓存键；传入后，同一个 `Validator` 实例内可复用已编译结果

## 返回值

返回 AJV 验证函数，可直接像普通函数一样调用；执行结果为 `true / false`，错误详情挂在 `validate.errors` 上。

```javascript
const { Validator, dsl } = require('schema-dsl');
const validator = new Validator();
const schema = dsl({ name: 'string!' });
const validate = validator.compile(schema, 'user-schema');
console.log(validate({ name: 'Rocky' }));
```

## 适用场景

- 同一份 schema 需要重复校验多次时，先 `compile()` 再复用编译结果
- 需要自己控制缓存键，避免重复编译开销
- 想把编译和执行拆开，接入自定义流程

## 注意事项

- `cacheKey` 的缓存作用域是当前 `Validator` 实例，不跨实例共享
- 如果只是对同一份 schema 做批量校验，也可以直接使用 `validator.validateBatch()`

