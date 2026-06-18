# Validator 类概述

`Validator` 是对 AJV 的封装，提供编译缓存、错误格式化、自定义关键字和批量验证能力。

```javascript
import { Validator, s } from 'schema-dsl/pure';
const validator = new Validator();
const schema = s({ email: 'email!' });
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

缓存归属于 `Validator` 实例。服务端建议在应用启动时创建实例并复用：

```javascript
const validator = new Validator({ cache: { maxSize: 500 } });

app.post('/users', (req, res) => {
  res.json(validator.validate(userSchema, req.body));
});
```

在每个请求处理函数里 `new Validator()`，如果实例没有被长期持有，通常不属于保留型内存泄漏；但它会丢弃上一个 AJV 实例和编译缓存。这个模式会增加对象分配、GC 和 schema 编译工作量，只应放在隔离的一次性验证路径里，并且不要保存这些实例。

缓存只对重复出现的 schema 结构有效。如果每个请求都产生从未见过的动态 schema，缓存条目会持续轮换，每次未命中仍要支付编译成本。应限制动态 schema 形态数量，或把这类校验放到隔离的短生命周期路径中。

> 如果你希望直接传入 DSL 对象（例如 `validate({ email: 'email!' }, data)`），请使用顶层便捷函数 `validate()` / `validateAsync()`；`Validator` 实例方法仍建议接收标准 JSON Schema 或 `s({...})` 的转换结果。

相关方法：`compile()`、`validate()`、`validateAsync()`、`validateBatch()`、`addKeyword()`、`addFormat()`。

---

## 对应示例文件

**示例入口**: [validator.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/validator.ts)  
**说明**: 覆盖 `new Validator()` 的常见配置、单次验证、编译缓存命中和 `validateBatch()` 复用路径。

