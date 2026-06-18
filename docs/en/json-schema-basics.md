# JSON Schema Basics

schema-dsl generates JSON Schema Draft 7 style objects with a few additional internal fields reserved for use by validators.

Common fields:

- `type`
- `properties`
- `required`
- `minLength` / `maxLength`
- `minimum` / `maximum`
- `format`
- `enum`
- `items`

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
```

---

## Corresponding sample file

**Example entry**: [json-schema-basics.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/json-schema-basics.ts)
**Description**: Directly compare the output differences between `toSchema()` and `toJsonSchema()`, and display the JSON Schema structure returned by the object entry.
