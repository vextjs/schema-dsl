# JSON Schema Basics

schema-dsl uses JSON Schema Draft 7 as its baseline and keeps a few internal fields for its validators. It also executes selected newer applicator keywords, including `minContains` / `maxContains`; this extension does not imply full Draft 2019-09 or 2020-12 support.

Common fields:

- `type`
- `properties`
- `required`
- `minLength` / `maxLength`
- `minimum` / `maximum`
- `format`
- `enum`
- `items`
- `additionalItems`
- `contains` with schema-dsl `minContains` / `maxContains` range support

When outputting pure JSON Schema, please use `toJsonSchema()`.

```javascript
const emailField = s('email!').label('mailbox');

emailField.toSchema();
// Contains internal fields such as _label / _customMessages

emailField.toJsonSchema();
// Pure JSON Schema, suitable for exporting to external systems

const objectSchema = s({
	email: emailField,
	age: s('number:18-100')
});
// s({... }) entry directly returns Draft 7 style object

const containsRangeSchema = {
	type: 'array',
	contains: { type: 'number' },
	minContains: 2,
	maxContains: 3
};
// Executed consistently by validate(), validateAsync(), and compile().
```

---

## Corresponding sample file

**Example entry**: [json-schema-basics.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/json-schema-basics.ts)
**Description**: Directly compare the output differences between `toSchema()` and `toJsonSchema()`, and display the JSON Schema structure returned by the object entry.
