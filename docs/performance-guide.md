# 性能优化指南

## 建议

- 复用同一个 schema 对象，让默认验证器缓存命中。
- 通过 `dsl.config({ cache })` 或 `new Validator({ cache })` 调整缓存策略。
- 对热点路径避免在循环中重复构造 DSL。
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

**示例入口**: [performance-guide.ts](https://github.com/vextjs/schema-dsl/blob/v2/examples/docs/performance-guide.ts)  
**说明**: 展示复用同一个 schema / validator、读取缓存统计，以及 `SchemaUtils.withPerformance()` 包装后的耗时输出。

