# Performance Optimization Guide

## suggestion

- Reuse the same schema object and let the default validator cache hit.
- Adjust caching policy via `dsl.config({ cache })` or `new Validator({ cache })`.
- Avoid repeatedly constructing DSL in loops for hotspot paths.
- If you already manage Ajv instances yourself, consider low-level batch paths like `SchemaUtils.validateBatch()`.

## Recommended practices

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

## When is lower-level optimization needed?

- You need to reuse the same `Validator` instance for a long time and observe the hit rate.
- You need to explicitly control cache size, TTL, or statistics switches.
- You have maintained your own Ajv instance and need to go `SchemaUtils.validateBatch()`.

## Verify command

```powershell
npm test
npm run bench
```

---

## Corresponding sample file

**Example entry**: [performance-guide.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/performance-guide.ts)
**Description**: Shows the time-consuming output after reusing the same schema/validator, reading cache statistics, and `SchemaUtils.withPerformance()` packaging.
