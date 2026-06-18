# Performance Optimization Guide

## suggestion

- Reuse the same schema object and let the default validator cache hit.
- Adjust caching policy via `s.config({ cache })` or `new Validator({ cache })`.
- Avoid repeatedly constructing DSL in loops for hotspot paths.
- Reuse a long-lived `Validator` instance in servers; creating one per request resets the validator engine and the instance cache.
- If you already manage low-level validation instances yourself, consider batch paths like `SchemaUtils.validateBatch()`.

## Current benchmark baseline

Latest local run:

| Scenario | schema-dsl throughput |
|------|-----------|
| S1 simple valid object | ~1.185M ops/s |
| S2 invalid object without i18n formatting | ~1.178M ops/s |
| S3 nested valid object | ~941K ops/s |

Environment: Node.js v20.20.2, Windows x64, run time 2026-06-18T08:49:22.365Z.

Use these numbers as a regression baseline for this project. Re-run the benchmark when Node.js, dependencies, schema complexity, or error formatting behavior changes.

## Recommended practices

```typescript
import { Validator, s } from 'schema-dsl/pure';

const schema = s({
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

## Request-time DSL and memory boundaries

Calling `s()` itself does not keep unbounded global state. The common production risk is not "every request calls `s()` and therefore always leaks"; the risk is creating an unlimited number of different schema structures on a hot path.

```typescript
// Usually safe but still slower than startup conversion:
// the structure is stable, so validation can reuse the compile cache.
app.post('/users', (req, res) => {
	const schema = s({ email: 'email!', age: 'number:18-100' });
	const result = validate(schema, req.body);
	res.json(result);
});

// Avoid this pattern in long-running services:
// every request creates a different schema shape, so cache hits are unlikely.
app.post('/dynamic', (req, res) => {
	const schema = s({ [`field_${req.id}`]: 'string!' });
	const result = validate(schema, req.body);
	res.json(result);
});
```

The built-in cache helps when the same schema structure is reused. It cannot make an unbounded stream of never-repeated schemas cheap: schema-dsl's managed cache is bounded, but each miss still pays conversion and validator compilation cost.

## Validator lifecycle in servers

Do not create a new `Validator` for every normal API request:

```typescript
// Not recommended in request handlers
app.post('/users', (req, res) => {
	const validator = new Validator();
	res.json(validator.validate(userSchema, req.body));
});
```

This is not usually a long-term memory leak if the instance is not retained, but it discards the per-instance cache and forces new validator/cache objects through allocation and garbage collection. Prefer one application-level validator, or a small set of validators for distinct option profiles.

For truly one-off, high-cardinality dynamic schemas, isolate that path and keep the validator short-lived, but do not store request-created validators or schema objects in application-level collections.

## When is lower-level optimization needed?

- You need to reuse the same `Validator` instance for a long time and observe the hit rate.
- You need to explicitly control cache size, TTL, or statistics switches.
- You maintain low-level validation instances and need to use `SchemaUtils.validateBatch()`.

## Verify command

```powershell
npm test
npm run bench
```

---

## Corresponding sample file

**Example entry**: [performance-guide.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/performance-guide.ts)
**Description**: Shows the time-consuming output after reusing the same schema/validator, reading cache statistics, and `SchemaUtils.withPerformance()` packaging.
