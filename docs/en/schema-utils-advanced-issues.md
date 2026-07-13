# SchemaUtils in-depth problem analysis

## FAQ

### internal field leak

The chained DSL will generate internal fields such as `_label`, `_customMessages`, `_required`, etc. When targeting OpenAPI or external systems, `toJsonSchema()` should be used in the Builder phase to output clean JSON Schema.

### required synchronization

`pick()`, `omit()`, and `partial()` synchronize `required` across supported nested Schema positions, including object properties, tuple and additional items, compositions, dependencies, and local definitions. `partial(schema, fields)` only makes the selected object-level fields optional while preserving unrelated constraints.

### deep copy limit

`SchemaUtils.clone()` preserves function references, clones `RegExp` and `Date` values, supports circular references, and retains property descriptors. Functions remain runtime-only values: cloning does not make a Schema containing functions serializable or stable across processes.

---

## Corresponding sample file

**Example entry**: [schema-utils-advanced-issues.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/schema-utils-advanced-issues.ts)
**Description**: Covers the three most vulnerable points of internal field leakage, `required` synchronization and `clone()` deep copy boundaries.
