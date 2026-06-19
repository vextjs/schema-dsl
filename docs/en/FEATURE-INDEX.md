# schema-dsl feature index

> **Last updated**: 2026-06-18
> **Purpose**: Find the right document by capability.

Use this page when you know the capability you need but not the document name. For a complete page-by-page map, see [Document Map](doc-index.md).

## Define Schemas

| Capability | Primary documents |
|------------|-------------------|
| Write compact DSL strings | [DSL Syntax](dsl-syntax.md), [Quick Start](quick-start.md) |
| Define object schemas | [DSL Syntax](dsl-syntax.md), [DSL Object Support](validate-dsl-object-support.md) |
| Mark fields required or optional | [Optional Marker ?](optional-marker-guide.md), [Type Reference](type-reference.md) |
| Use enum values | [Enum](enum.md), [DSL Syntax](dsl-syntax.md) |
| Use multiple accepted types | [Union Types](union-types.md), [Union Type Guide](union-type-guide.md), [Multi-type Support](multi-type-support.md) |
| Use numeric ranges and comparison operators | [Number Operators](number-operators.md), [DSL Syntax](dsl-syntax.md) |
| Use builder chain methods | [Chain Method List](chain-methods.md), [TypeScript Guide](typescript-guide.md) |
| Use direct String chain helpers | [String Extensions](string-extensions.md), [TypeScript Guide](typescript-guide.md) |

## Validate Data

| Capability | Primary documents |
|------------|-------------------|
| Validate synchronously | [validate()](validate.md), [Validation Guide](validation-guide.md) |
| Validate asynchronously | [validateAsync()](validate-async.md), [Error Handling](error-handling.md) |
| Validate multiple records | [Batch Validation](validate-batch.md), [Validation Guide](validation-guide.md) |
| Reuse a Validator instance | [Validator](validator.md), [Performance Guide](performance-guide.md) |
| Precompile schemas | [compile()](compile.md), [Validator](validator.md) |
| Add conditional rules | [Conditional API](conditional-api.md), [Validation Guide](validation-guide.md) |
| Format and customize errors | [Error Handling](error-handling.md), [i18n User Guide](i18n-user-guide.md) |

## Runtime, TypeScript, and Side Effects

| Capability | Primary documents |
|------------|-------------------|
| Understand TypeScript inference boundaries | [TypeScript Guide](typescript-guide.md), [API Reference](api-reference.md) |
| Choose `schema-dsl/pure` vs `schema-dsl/runtime` | [Runtime Isolation](runtime-isolation.md), [Quick Start](quick-start.md) |
| Use side-effect-controlled entries | [String Extensions](string-extensions.md), [Runtime Isolation](runtime-isolation.md) |
| Isolate runtime state by app, plugin, tenant, or worker | [Runtime Isolation](runtime-isolation.md), [Runtime Locale Support](runtime-locale-support.md) |
| Work with locale and messages at runtime | [Runtime Locale Support](runtime-locale-support.md), [Dynamic Locale](dynamic-locale.md) |

## Export and Interoperate

| Capability | Primary documents |
|------------|-------------------|
| Understand JSON Schema output | [JSON Schema Basics](json-schema-basics.md), [API Reference](api-reference.md) |
| Export database schemas | [Export Guide](export-guide.md), [Export Limitations](export-limitations.md) |
| Export to MongoDB | [MongoDB Exporter](mongodb-exporter.md), [Export Guide](export-guide.md) |
| Export to MySQL | [MySQL Exporter](mysql-exporter.md), [Export Guide](export-guide.md) |
| Export to PostgreSQL | [PostgreSQL Exporter](postgresql-exporter.md), [Export Guide](export-guide.md) |
| Export schema documentation | [Markdown Exporter](markdown-exporter.md), [Export Guide](export-guide.md) |
| Convert schema types | [TypeConverter](type-converter.md), [JSON Schema Basics](json-schema-basics.md) |

## Reuse and Extend

| Capability | Primary documents |
|------------|-------------------|
| Reuse schema fragments | [SchemaUtils](schema-utils.md), [SchemaUtils Chaining](schema-utils-chaining.md) |
| Apply schema utility patterns | [SchemaUtils Best Practices](schema-utils-best-practices.md), [SchemaUtils Advanced Issues](schema-utils-advanced-issues.md) |
| Analyze or transform schema objects | [SchemaHelper](schema-helper.md), [CacheManager](cache-manager.md) |
| Choose an extension path | [Extension Overview](extensions-overview.md), [Framework Integration](framework-extension-setup.md) |
| Register custom DSL types | [Custom DSL Types](plugin-type-registration.md), [Extension Overview](extensions-overview.md) |
| Add custom factories | [Custom s.xxx() Factories](custom-factories.md), [Custom DSL Types](plugin-type-registration.md) |
| Add custom chain methods | [Custom Chain Methods](custom-chain-methods.md), [String Extensions](string-extensions.md) |
| Add custom keywords | [Custom Validation Keywords](add-keyword.md), [Advanced Extension Recipes](custom-extensions-guide.md) |
| Package plugin lifecycle and hooks | [Plugin Manager (Advanced)](plugin-system.md), [Advanced Extension Recipes](custom-extensions-guide.md) |

## Internationalize

| Capability | Primary documents |
|------------|-------------------|
| Use built-in locale support | [i18n Overview](i18n.md), [Multi-language Support](multi-language.md) |
| Configure i18n in an application | [i18n User Guide](i18n-user-guide.md), [Runtime Locale Support](runtime-locale-support.md) |
| Switch language dynamically | [Dynamic Locale](dynamic-locale.md), [Frontend i18n Guide](frontend-i18n-guide.md) |
| Add a custom locale | [Add Custom Locale](add-custom-locale.md), [i18n User Guide](i18n-user-guide.md) |

## Operate in Production

| Capability | Primary documents |
|------------|-------------------|
| Choose production patterns | [Best Practices](best-practices.md), [Project Structure Best Practices](best-practices-project-structure.md) |
| Improve performance | [Performance Guide](performance-guide.md), [CacheManager](cache-manager.md) |
| Review security-sensitive usage | [Security Checklist](security-checklist.md), [Export Limitations](export-limitations.md) |
| Diagnose common failures | [Troubleshooting](troubleshooting.md), [FAQ](faq.md) |

## API Reference

| Need | Primary documents |
|------|-------------------|
| Full public API details | [API Reference](api-reference.md) |
| Compact API entry point | [API Overview](api.md) |
| Documentation by page | [Document Map](doc-index.md) |

## Examples

| Resource | Purpose |
|----------|---------|
| [examples/docs](https://github.com/vextjs/schema-dsl/blob/main/examples/docs) | Runnable companion examples for documentation pages. |
| [feature-index.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/feature-index.ts) | Representative example connecting DSL, String extensions, and exporters. |
| [chain-methods.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/chain-methods.ts) | Runnable coverage for field builder chain methods. |
| [extensions-overview.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/extensions-overview.ts) | Runnable overview of extension paths. |
| [object-dsl-builder.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/object-dsl-builder.ts) | Object builder chaining, required-field control, and object schema conversion. |
| [real-world.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/real-world.ts) | Production-style composition for users, products, orders, queries, defaults, and async validation. |
