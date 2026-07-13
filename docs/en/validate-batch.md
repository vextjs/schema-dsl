# validateBatch method

`Validator.validateBatch(schema, dataArray)` Use the same compiled Schema to validate multiple pieces of data.

## method signature

```javascript
validator.validateBatch(schema, dataArray)
```

## return value

Returns an array, each item is consistent with the return structure of a single `validator.validate()`:

- `valid` - passed or not
- `data` - Validated data (when passed)
- `errors` - error list (on failure)

```javascript
[
  { valid: true, data: { email: 'a@example.com' }, errors: [] },
  { valid: false, data: { email: 'bad' }, errors: [/* ... */] }
]
```

```javascript
import { Validator, s } from 'schema-dsl/pure';
const validator = new Validator();
const schema = s({ email: 'email!' });
const results = validator.validateBatch(schema, [
  { email: 'a@example.com' },
  { email: 'bad' }
]);
console.log(results);
```

## Applicable scenarios

- Batch validation before importing data
- Pre-checking a large number of records under the same schema
- I hope to compile the schema only once and then reuse it for the entire batch of data.

---

## Corresponding sample file

**Example entry**: [validate-batch.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/validate-batch.ts)
**Description**: Covers `Validator.validateBatch()`’s single compilation, multiple data reuse, and failed item error output.
