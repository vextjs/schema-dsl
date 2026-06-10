# compile method

`Validator.compile(schema, cacheKey?)` will compile the JSON Schema into an AJV validation function and reuse the cache when passing in `cacheKey`.

## method signature

```javascript
validator.compile(schema, cacheKey?)
```

## Parameters

- `schema` - ​​JSON Schema object
- `cacheKey` - ​​Optional cache key; after passing it in, the compiled results can be reused within the same `Validator` instance

## return value

Returns the AJV validation function, which can be called directly like a normal function; the execution result is `true / false`, and the error details are hung on `validate.errors`.

```javascript
const { Validator, dsl } = require('schema-dsl');
const validator = new Validator();
const schema = dsl({ name: 'string!' });
const validate = validator.compile(schema, 'user-schema');
console.log(validate({ name: 'Rocky' }));
```

## Applicable scenarios

- When the same schema needs to be validated multiple times, `compile()` first and then reuse the compilation results
- You need to control the cache keys yourself to avoid repeated compilation overhead.
- Want to separate compilation and execution and connect to custom process

## Things to note

- The cache scope of `cacheKey` is the current `Validator` instance and is not shared across instances.
- If you just do batch validation on the same schema, you can also use `validator.validateBatch()` directly.

---

## Corresponding sample file

**Example entry**: [compile.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/compile.ts)
**Description**: Covers the reuse of compilation results of `compile()`, hits of `cacheKey`, and reading error details from the validation function in failure scenarios.
