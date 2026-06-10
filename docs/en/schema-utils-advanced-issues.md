# SchemaUtils in-depth problem analysis

## FAQ

### internal field leak

The chained DSL will generate internal fields such as `_label`, `_customMessages`, `_required`, etc. When targeting OpenAPI or external systems, `toJsonSchema()` should be used in the Builder phase to output clean JSON Schema.

### required synchronization

After using `pick()`, `omit()`, `partial()`, you should check whether `required` meets expectations. The current implementation will handle the top-level required synchronously.

### deep copy limit

`SchemaUtils.clone()` Based on JSON serialization, non-JSON values ​​such as functions and `RegExp` instances are not retained.

---

## Corresponding sample file

**Example entry**: [schema-utils-advanced-issues.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/schema-utils-advanced-issues.ts)
**Description**: Covers the three most vulnerable points of internal field leakage, `required` synchronization and `clone()` deep copy boundaries.
