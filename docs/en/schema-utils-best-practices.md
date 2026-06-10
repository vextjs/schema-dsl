# SchemaUtils best practices

## Recommended usage

- Use `SchemaUtils.reusable()` to encapsulate the reusable field factory.
- Use `SchemaUtils.extend()` to combine base schema and business extension fields.
- Use `pick()` / `omit()` / `partial()` to generate derived schemas to avoid repeated definitions written by hand.

## Things to note

- After deriving the Schema, you still need to use `validate()` or `Validator` for regression validation.
- When exporting standard JSON Schema, it is preferable to use `toJsonSchema()` in the Builder stage, or explicitly clean up internal fields before exporting.

---

## Corresponding sample file

**Example entry**: [schema-utils-best-practices.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/schema-utils-best-practices.ts)
**Description**: Three scenarios of creation, public return, and partial update are used to demonstrate the recommended organization method of field library reuse and derived schema.
