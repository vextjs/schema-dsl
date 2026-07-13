# Performance Optimization Guide

## Recommendations

- Reuse the same schema object and let the default validator cache hit.
- Adjust caching policy via `s.config({ cache })` or `new Validator({ cache })`.
- Avoid repeatedly constructing DSL in loops for hotspot paths.
- Reuse a long-lived `Validator` instance in servers; creating one per request resets the validator engine and the instance cache.
- If you already manage low-level validation instances yourself, consider batch paths like `SchemaUtils.validateBatch()`.

## Current benchmark baseline

Every value in this section comes from the tracked `test/benchmarks/performance-docs-snapshot.json`; values from separate benchmark reports are no longer combined. Environment: Node.js v20.20.2, win32-x64, Zod 4.3.6; run start time 2026-07-13T09:55:17.579Z.

This full matrix contains 19 comparable scenarios counted in the winner summary plus one async throw-path diagnostic scenario (`AV2_THROW`) that is not counted. Among comparable scenarios, schema-dsl wins 14/19 and Zod wins 5/19. Near-parity scenarios can change winner between runs, so treat the matrix as a regression signal for this repository, not as a permanent public performance claim.

| ID | Scenario | schema-dsl | Zod | Result |
|---|---|---:|---:|---|
| S1 | valid | 1.792M | 1.427M | schema-dsl 1.26x |
| S2 | invalid | 158.10K | 12.77K | schema-dsl 12.38x |
| S3 | format | 14.19K | 13.48K | schema-dsl 1.05x |
| C1 | coerce | 3.852M | 3.221M | schema-dsl 1.20x |
| C2 | coerce off | 635.40K | 29.86K | schema-dsl 21.28x |
| U1 | union | 2.723M | 10.295M | Zod 3.78x |
| U2 | union | 2.690M | 5.977M | Zod 2.22x |
| E1 | enum | 10.370M | 14.025M | Zod 1.35x |
| A1 | array | 1.061M | 268.34K | schema-dsl 3.95x |
| A2 | array | 33.43K | 27.63K | schema-dsl 1.21x |
| D1 | deep | 777.96K | 2.101M | Zod 2.70x |
| L1 | large object | 110.41K | 83.25K | schema-dsl 1.33x |
| COND1 | conditional | 10.30K | 17.48K | Zod 1.70x |
| COND2 | conditional | 9.48K | 7.80K | schema-dsl 1.22x |
| CV1 | custom | 6.747M | 6.090M | schema-dsl 1.11x |
| CV2 | custom | 182.50K | 33.26K | schema-dsl 5.49x |
| AV1 | async | 1.943M | 1.021M | schema-dsl 1.90x |
| AV2 | async | 39.00K | 38.94K | schema-dsl 1.00x |
| AV2_THROW | async throw | 40.55K | 29.75K | schema-dsl 1.36x |
| COLD1 | cold | 13.60K | 7.34K | schema-dsl 1.85x |

The matrix documents semantic differences in its JSON report. It compares the closest supported behavior rather than claiming that every pair has identical implementation semantics.

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
npm run bench:smoke
npm run bench:conditional
npm run bench:full
npm run bench:cache
npm run bench:guard:smoke
npm run bench:guard:full
```

The guard runs each tracked scenario three times and uses the median. On the same Node.js version, platform, and CPU, the schema-dsl/Zod ratio must remain at least 75% of baseline. If absolute throughput falls below the threshold, it is marked `CALIBRATED` only when the same-run Zod workload shows the same host-load slowdown; otherwise the gate still fails. Different environments use only the same-run relative ratio. Zod is a pinned calibration workload, not a product-performance claim.

---

## Corresponding sample file

**Example entry**: [performance-guide.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/performance-guide.ts)
**Description**: Shows schema and validator reuse, cache statistics, and timing metadata added by `SchemaUtils.withPerformance()`.
