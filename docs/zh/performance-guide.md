# 性能优化指南

## 建议

- 复用同一个 schema 对象，让默认验证器缓存命中。
- 通过 `dsl.config({ cache })` 或 `new Validator({ cache })` 调整缓存策略。
- 对热点路径避免在循环中重复构造 DSL。
- 服务端应复用长生命周期的 `Validator` 实例；每次请求都新建会重置 AJV 和实例缓存。
- 如果你已经自行管理 Ajv 实例，再考虑 `SchemaUtils.validateBatch()` 这类低层批量路径。

## 推荐做法

```typescript
import { Validator, dsl } from 'schema-dsl';

const schema = dsl({
	email: 'email!',
	age: 'number:18-100'
});

const validator = new Validator({
	cache: { maxSize: 500, statsEnabled: true }
});

validator.validate(schema, { email: 'a@example.com', age: 20 });
validator.validate(schema, { email: 'b@example.com', age: 21 });

console.log(validator.getCacheStats());
```

## 请求级 DSL 与内存边界

调用 `dsl()` 本身不会保留无限增长的全局状态。生产环境真正需要避免的不是“每次请求调用 `dsl()` 必然泄漏”，而是在热点路径上生成无限多种不同的 schema 结构。

```typescript
// 通常安全，但仍慢于启动时转换：
// 结构稳定，验证阶段可以复用编译缓存。
app.post('/users', (req, res) => {
	const schema = dsl({ email: 'email!', age: 'number:18-100' });
	const result = validate(schema, req.body);
	res.json(result);
});

// 长运行服务中应避免：
// 每个请求都生成不同结构，缓存几乎无法命中。
app.post('/dynamic', (req, res) => {
	const schema = dsl({ [`field_${req.id}`]: 'string!' });
	const result = validate(schema, req.body);
	res.json(result);
});
```

内置缓存对“相同 schema 结构被重复使用”的场景有效。它无法让无限多、从不重复的新 schema 变便宜：schema-dsl 自身的受控缓存有容量边界，但每次未命中仍要承担转换和 AJV 编译成本。

## 服务端 Validator 生命周期

普通 API 请求中不要每次都创建新的 `Validator`：

```typescript
// 不推荐放在请求处理函数里
app.post('/users', (req, res) => {
	const validator = new Validator();
	res.json(validator.validate(userSchema, req.body));
});
```

如果实例没有被长期持有，这通常不是长期内存泄漏；问题在于它会丢弃实例级缓存，并让新的 AJV / 缓存对象不断进入分配和 GC。推荐使用一个应用级 validator，或按不同配置 profile 维护少量 validator。

对确实不可复用、基数很高的一次性动态 schema，可以隔离这条路径并让 validator 短生命周期存在，但不要把请求内创建的 validator 或 schema 对象存入应用级集合。

## 什么时候需要更低层优化

- 你要长期复用同一个 `Validator` 实例并观察命中率。
- 你需要显式控制缓存大小、TTL 或统计开关。
- 你已经维护自己的 Ajv 实例，需要走 `SchemaUtils.validateBatch()`。

## 验证命令

```powershell
npm test
npm run bench
```

---

## 对应示例文件

**示例入口**: [performance-guide.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/performance-guide.ts)  
**说明**: 展示复用同一个 schema / validator、读取缓存统计，以及 `SchemaUtils.withPerformance()` 包装后的耗时输出。

