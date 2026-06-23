# schema-dsl document map

This page is a document map. The left sidebar keeps the main learning path, while this page also lists smaller reference and appendix pages for readers who already know the area they need.

## Start

| Document | When to read it |
|----------|-----------------|
| [Home](index.md) | Landing page and primary product positioning. |
| [Quick Start](quick-start.md) | First successful schema, validation result, and common usage path. |
| [Design Philosophy](design-philosophy.md) | Why schema-dsl favors concise DSL, JSON Schema output, and runtime validation. |
| [TypeScript Guide](typescript-guide.md) | Type inference boundaries, editor hints, and TypeScript usage patterns. |

## Schema Authoring

| Document | When to read it |
|----------|-----------------|
| [DSL Syntax](dsl-syntax.md) | Complete DSL grammar for string and object schemas. |
| [Complete Type List](type-reference.md) | Supported base types, formats, factory calls, and type-oriented behavior. |
| [Chain Method List](chain-methods.md) | Complete field builder method list and entry support. |
| [Optional Marker ?](optional-marker-guide.md) | Optional field syntax and required-field behavior. |
| [Multi-type Support](multi-type-support.md) | Design notes for fields that accept multiple types. |
| [Union Types](union-types.md) | `types:` syntax and cross-type validation. |
| [Union Type Guide](union-type-guide.md) | Practical guide for one field accepting multiple types. |
| [Number Operators](number-operators.md) | Numeric comparison operators and range notation. |
| [Enum](enum.md) | Enumeration syntax and allowed-value validation. |
| [String Extensions](string-extensions.md) | JavaScript String chain helpers and side-effect-controlled entries. |

## Validation and Runtime

| Document | When to read it |
|----------|-----------------|
| [validate()](validate.md) | Synchronous validation helper and result shape. |
| [validateAsync()](validate-async.md) | Async validation and `ValidationError` behavior. |
| [Batch Validation](validate-batch.md) | Validating arrays of data with aggregate results. |
| [DSL Object Support](validate-dsl-object-support.md) | Passing DSL object definitions directly to validation helpers. |
| [Validation Guide](validation-guide.md) | End-to-end validation scenarios, failures, and options. |
| [Validator](validator.md) | Validator class usage, lifecycle, and cache behavior. |
| [Conditional API](conditional-api.md) | ConditionalBuilder and conditional validation chains. |
| [Error Handling](error-handling.md) | Error formatting, messages, and recovery patterns. |
| [compile()](compile.md) | Compiling schemas before repeated validation. |
| [Runtime Isolation](runtime-isolation.md) | Isolated runtime state for app, plugin, tenant, or worker boundaries. |

## Export and Interop

| Document | When to read it |
|----------|-----------------|
| [JSON Schema Basics](json-schema-basics.md) | JSON Schema concepts used by schema-dsl output. |
| [Export Guide](export-guide.md) | How JSON Schema maps to database and Markdown exporters. |
| [Export Limitations](export-limitations.md) | Which validation semantics cannot be represented by database DDL. |
| [MongoDB Exporter](mongodb-exporter.md) | MongoDB `$jsonSchema` output and collection commands. |
| [MySQL Exporter](mysql-exporter.md) | MySQL DDL and type mapping. |
| [PostgreSQL Exporter](postgresql-exporter.md) | PostgreSQL DDL, schemas, and indexes. |
| [Markdown Exporter](markdown-exporter.md) | Markdown documentation output from schemas. |
| [TypeConverter](type-converter.md) | JSON Schema to database type conversion utilities. |

## Reuse and Utilities

| Document | When to read it |
|----------|-----------------|
| [SchemaUtils](schema-utils.md) | Schema reuse, composition, filtering, and helper exports. |
| [SchemaUtils Chaining](schema-utils-chaining.md) | Chain-style reuse operations. |
| [SchemaUtils Best Practices](schema-utils-best-practices.md) | Practical patterns and common pitfalls for reusable schemas. |
| [SchemaUtils Advanced Issues](schema-utils-advanced-issues.md) | Deeper edge cases and maintenance notes. |
| [SchemaHelper](schema-helper.md) | Schema analysis and helper utilities. |
| [CacheManager](cache-manager.md) | LRU cache behavior and cache management APIs. |
| [label vs description](label-vs-description.md) | Difference between UI labels and schema descriptions. |

## Internationalization

| Document | When to read it |
|----------|-----------------|
| [i18n Overview](i18n.md) | Internationalization model and supported locale concepts. |
| [Multi-language Support](multi-language.md) | Built-in multilingual behavior. |
| [i18n User Guide](i18n-user-guide.md) | User-facing i18n configuration and usage. |
| [Frontend i18n Guide](frontend-i18n-guide.md) | Frontend language switching patterns. |
| [Add Custom Locale](add-custom-locale.md) | Adding custom language packs. |
| [Dynamic Locale](dynamic-locale.md) | Runtime locale switching. |
| [Runtime Locale Support](runtime-locale-support.md) | Locale behavior during runtime validation. |

## Extensions and Integration

| Document | When to read it |
|----------|-----------------|
| [Extension Overview](extensions-overview.md) | Choose between custom business types, validation keywords, runtime isolation, and plugins. |
| [Custom Extensions](custom-extensions.md) | Define reusable business types once for pure DSL, `s('...')`, and `s.xxx()` entries. |
| [Custom Validation Keywords](add-keyword.md) | Add custom AJV keywords. |
| [Framework Integration](framework-extension-setup.md) | Organize reusable extension modules for applications and frameworks. |
| [Plugin Manager (Advanced)](plugin-system.md) | Plugin lifecycle, hooks, and integration orchestration. |

## Production and Troubleshooting

| Document | When to read it |
|----------|-----------------|
| [Best Practices](best-practices.md) | Recommended usage patterns for production projects. |
| [Project Structure Best Practices](best-practices-project-structure.md) | Organizing schema-dsl in a real project. |
| [Performance Guide](performance-guide.md) | Performance tuning and cache considerations. |
| [Security Notes](security-checklist.md) | Security notes for schema usage, custom validators, and export. |
| [Troubleshooting](troubleshooting.md) | Common failures and reproducible fixes. |
| [FAQ](faq.md) | Short answers to common questions. |

## Reference and Index

| Document | When to read it |
|----------|-----------------|
| [API Reference](api-reference.md) | Full public API reference. |
| [API Overview](api.md) | Compact API entry point. |
| [Document Map](doc-index.md) | This page, organized by topic. |
| [Feature Index](FEATURE-INDEX.md) | Capability-oriented lookup across documents. |

## Examples

| Resource | Purpose |
|----------|---------|
| [examples/docs](https://github.com/vextjs/schema-dsl/blob/main/examples/docs) | Companion examples for the documentation pages. |
| [doc-index.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/doc-index.ts) | Small entry script that connects quick start, compilation, and document export. |

For current validation commands and test counts, use the repository scripts and project Profile rather than static numbers on this page.
