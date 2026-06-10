# Validator class overview

`Validator` is an encapsulation of AJV, providing compilation caching, error formatting, custom keywords and batch validation capabilities.

```javascript
const { Validator, dsl } = require('schema-dsl');
const validator = new Validator();
const schema = dsl({ email: 'email!' });
console.log(validator.validate(schema, { email: 'test@example.com' }));
```

## Cache configuration

`Validator` The constructor supports two cache writing methods:

```javascript
new Validator({ cache: true }); // Use default cache configuration
new Validator({ cache: false }); // Turn off caching

new Validator({
  cache: {
	enabled: true,
	maxSize: 500,
	ttl: 60 * 60 * 1000
  }
});
```

> If you wish to pass in a DSL object directly (e.g. `validate({ email: 'email!' }, data)`), please use the top-level convenience functions `validate()` / `validateAsync()`; `Validator` instance methods are still recommended to receive the conversion results of standard JSON Schema or `dsl({...})`.

Related methods: `compile()`, `validate()`, `validateAsync()`, `validateBatch()`, `addKeyword()`, `addFormat()`.

---

## Corresponding sample file

**Example entry**: [validator.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/validator.ts)
**Description**: Covers `new Validator()`’s common configuration, single validation, compilation cache hits and `validateBatch()` reuse paths.
