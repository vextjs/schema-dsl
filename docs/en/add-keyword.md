# addKeyword method

`Validator.addKeyword(name, definition)` is used to register custom keywords with the underlying AJV instance.

The current implementation is internally compatible with the object-based registration of AJV 8, so you can continue to use the two-parameter writing method of v1 without exposing deprecated warnings to the caller.

```javascript
const { Validator } = require('schema-dsl');
const validator = new Validator();
validator.addKeyword('isEven', {
  type: 'number',
  validate: (_schema, data) => data % 2 === 0
});
```

For more AJV keyword definitions, please refer to the AJV official documentation.

---

## Corresponding sample file

**Example entry**: [add-keyword.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/add-keyword.ts)
**Description**: Cover the minimum registration and validation path of `Validator.addKeyword()`, and directly display the success/failure results.
