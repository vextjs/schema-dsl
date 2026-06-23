# Custom validation keywords

`Validator.addKeyword(name, definition)` is used to register custom keywords with the underlying AJV instance.

It is for extending validation rules, such as `isEven`, `maxWords`, or `startsWithPrefix`. If you want to define reusable business field types such as `tenant-id!`, `s('tenant-id!')`, or `s.tenantId('corp')`, start with [Custom DSL Types](custom-extensions.md).

The current implementation is internally compatible with the object-based registration of AJV 8, so you can continue to use the two-parameter writing method of v1 without exposing deprecated warnings to the caller.

```javascript
import { Validator } from 'schema-dsl/pure';
const validator = new Validator();
validator.addKeyword('isEven', {
  type: 'number',
  validate: (_schema, data) => data % 2 === 0
});
```

## When to use it

| Need | Recommended entry |
|---|---|
| Define a business field type once and use it from pure DSL, `s('...')`, and `s.xxx()` | [Custom DSL Types](custom-extensions.md) |
| Add a low-level validation keyword to JSON Schema validation | `Validator.addKeyword()` |
| Register a group of business types for one project or framework | [Framework Integration](framework-extension-setup.md) |
| Package install, uninstall, and hook lifecycle | [Plugin Manager (Advanced)](plugin-system.md) |

For more AJV keyword definitions, please refer to the AJV official documentation.

---

## Corresponding sample file

**Example entry**: [add-keyword.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/add-keyword.ts)
**Description**: Cover the minimum registration and validation path of `Validator.addKeyword()`, and directly display the success/failure results.
