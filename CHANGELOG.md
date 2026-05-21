# Changelog

All notable changes to this project will be documented in this file.

> 📂 **Detailed changes**: see [`changelogs/`](./changelogs/) for full notes on major versions.

---

## Unreleased

### Fixes

- Security: replace the custom regex ReDoS heuristic in `CustomKeywords` with `safe-regex`, so catastrophic patterns such as `((a)+)+$` are rejected before execution.
- Validation: stop caching `DslBuilder.toSchema()` results inside `Validator`, so chain mutations made after the first validation call are honored by both `validate()` and `validateAsync()`.
- Validation: make `ConditionalBuilder` cache `Validator` instances by constructor-level option set, so repeated calls with different `allErrors` / `useDefaults` configurations no longer reuse a stale validator.
- Exporters: fix MySQL integer sizing so `TypeConverter.toMySQLType()` checks both `minimum` and `maximum` before choosing `TINYINT` / `SMALLINT` / `INT`, avoiding undersized column types.
- Exporters: escape Markdown table cell content in `MarkdownExporter`, so field names, constraint text, and multiline descriptions containing `|` or newlines no longer break rendered tables.
- Tests: add focused regression coverage for unsafe regex rejection while preserving the existing invalid-regex error path.

## Version History

| Version | Date | Type | Key Theme |
|---------|------|------|-----------|
| [2.0.0] | 2026-05-09 | Major | Full release: BC-2/4/5/6/7 fixes, string:N compat, English comments, 58 enriched examples, 1053 tests [View](./changelogs/v2.0.0.md) |
| [2.0.0-beta.2] | 2026-04-12 | Major | Full TypeScript rewrite: ESM+CJS dual format, AJV 8, tsup build, 1052 tests passing [View](./changelogs/v2.0.0-beta.2.md) |
| [v1.2.5] | 2026-03-09 | Patch | Feature: `DslBuilder.toJsonSchema()` — exports clean JSON Schema, strips internal markers |
| [v1.2.4] | 2026-03-09 | Patch | P1 Fix: `enum:a,b,c` comma-separated format parsing completely broken |
| [v1.2.3] | 2026-03-03 | Patch | Feature: i18n sub-directory merging; collaborative locale maintenance with auto-merge + conflict detection [View](./changelogs/v1.2.3.md) |
| [v1.2.2] | 2026-02-06 | Minor | Major feature: smart type coercion — auto-converts string numbers, full Web API support [View](./changelogs/v1.2.2.md) |
| [v1.1.8] | 2026-01-30 | Patch | Feature: smart argument detection, simplified syntax `dsl.error.throw('key', 'locale')` [View](./changelogs/v1.1.8.md) |
| [v1.1.7] | 2026-01-27 | Patch | Fix: error message path display — all error types now show field name only |
| [v1.1.6] | 2026-01-23 | Patch | Fix: enum and additionalProperties error message template variables not substituted [View](./changelogs/v1.1.6.md) |
| [v1.1.5] | 2026-01-17 | Patch | Feature: error config object format; locale messages now support `{ code, message }` object format [View](./changelogs/v1.1.5.md) |
| [v1.1.4] | 2026-01-13 | Patch | TS fix: remove duplicate function signatures + multilingual docs improvements [View](./changelogs/v1.1.4.md) |
| [v1.1.3] | 2026-01-09 | Patch | Fix: type error message template variables not substituted [View](./changelogs/v1.1.3.md) |
| [v1.1.2] | 2026-01-06 | Patch | Feature: numeric comparison operators + bug fixes [View](./changelogs/v1.1.2.md) |
| [v1.1.1] | 2026-01-06 | Patch | Feature: ConditionalBuilder independent message support [View](./changelogs/v1.1.1.md) |
| [v1.1.0] | 2026-01-05 | Minor | Major: cross-type union validation + enhanced plugin system [View](./changelogs/v1.1.0.md) |
| [v1.0.9] | 2026-01-04 | Patch | Major improvement: complete i18n support + full TypeScript types [View](./changelogs/v1.0.9.md) |
| v1.0.8 | 2026-01-04 | Patch | Improvement: enhanced error message filtering |
| v1.0.7 | 2026-01-04 | Patch | Fix: dsl.match/dsl.if nesting now supports dsl() wrapper |
| v1.0.6 | 2026-01-04 | Patch | 🚨 Critical fix: TypeScript type pollution |
| v1.0.5 | 2026-01-04 | Patch | Test coverage raised to 97% |
| v1.0.4 | 2025-12-31 | Patch | Full TypeScript support, validateAsync, ValidationError |
| v1.0.3 | 2025-12-31 | Patch | ⚠️ Breaking change: single-value syntax fix |
| v1.0.2 | 2025-12-31 | Patch | 15 new validators, complete docs, 75 tests |
| v1.0.1 | 2025-12-31 | Patch | Enum support, auto type detection, unified error messages |
| [v1.0.0] | 2025-12-29 | Pre-release | Initial release [View](./changelogs/v1.0.0.md) |

---

## [2.0.0] — 2026-05-09

### Breaking Changes (v1 → v2)

- **BC-2**: `DslAdapter.parseObject()` now returns `ObjectDslBuilder` (chainable: `.strict()`, `.requireAll()`, `.toSchema()`, `.toJsonSchema()`) instead of plain `JSONSchema`. Call `.toSchema()` to get the raw schema.
- **BC-4**: `DslAdapter.typeMap` is now a Proxy getter; `DslAdapter.registerType()` method added for direct registration.
- **BC-5**: `ConditionalBuilder.require(field)` method added for v1 field-requirement compatibility.
- **BC-6**: `Validator.validateAsync()` added; async custom validators in sync `validate()` now return `{ valid: false }` with an error message instead of silently passing.
- **BC-7**: `string:N` single-value DSL now expands to `{ minLength: N, maxLength: N }` (exactLength compat, consistent with v1 behavior).

### New Features

- **ObjectDslBuilder**: New class wrapping object schemas; supports `.strict()`, `.requireAll()`, `.toSchema()`, `.toJsonSchema()`, `.toString()`.
- **validateAsync()**: Full async validation support with typed return (`Promise<T>`); throws `ValidationError` on failure.
- **installStringExtensions()**: Opt-in String.prototype extension; auto-installed at module load for v1 compatibility.

### Documentation & Examples

- 58 example files in `examples/docs/` fully enriched (90–130+ lines each) with complete API coverage.
- All code comments translated to English (CJK locales and output strings preserved).
- `docs/api-reference.md`: fixed 4 doc inconsistencies (string:N behavior, validateAsync signature, LocaleMessage params, exactOptionalPropertyTypes notes).

### Quality

- 1053 tests passing (all 67 test files green).
- 0 TypeScript errors in source and examples.
- ESM + CJS dual format build.

---

## [Unreleased]

- docs: aligned 58-to-58 `docs/*.md` ↔ `examples/docs/*.ts` mapping, switched to stable example entry links
- docs: completed runnable coverage for advanced APIs in `api-reference`, added `ErrorFormatter` reference, corrected `FEATURE-INDEX` method descriptions
- chore: cleaned up legacy top-level `examples/*` entry paths, unified example entry points and `.tmp` workspace visibility

---

## Links

- [GitHub Repository](https://github.com/vextjs/schema-dsl)
- [Online Documentation](https://vextjs.github.io/schema-dsl)
- [Detailed Changelogs](./changelogs/)
- [Contributing Guide](./CONTRIBUTING.md)

[Unreleased]: https://github.com/vextjs/schema-dsl/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/vextjs/schema-dsl/compare/v2.0.0-beta.2...v2.0.0
[2.0.0-beta.2]: https://github.com/vextjs/schema-dsl/releases/tag/v2.0.0-beta.2
[v1.2.5]: https://github.com/vextjs/schema-dsl/compare/v1.2.4...v1.2.5
[v1.2.4]: https://github.com/vextjs/schema-dsl/compare/v1.2.3...v1.2.4
[v1.2.3]: https://github.com/vextjs/schema-dsl/compare/v1.2.2...v1.2.3
[v1.2.2]: https://github.com/vextjs/schema-dsl/compare/v1.1.8...v1.2.2
[v1.1.8]: https://github.com/vextjs/schema-dsl/compare/v1.1.7...v1.1.8
[v1.1.7]: https://github.com/vextjs/schema-dsl/compare/v1.1.6...v1.1.7
[v1.1.6]: https://github.com/vextjs/schema-dsl/compare/v1.1.5...v1.1.6
[v1.1.5]: https://github.com/vextjs/schema-dsl/compare/v1.1.4...v1.1.5
[v1.1.4]: https://github.com/vextjs/schema-dsl/compare/v1.1.3...v1.1.4
[v1.1.3]: https://github.com/vextjs/schema-dsl/compare/v1.1.2...v1.1.3
[v1.1.2]: https://github.com/vextjs/schema-dsl/compare/v1.1.1...v1.1.2
[v1.1.1]: https://github.com/vextjs/schema-dsl/compare/v1.1.0...v1.1.1
[v1.1.0]: https://github.com/vextjs/schema-dsl/compare/v1.0.9...v1.1.0
[v1.0.9]: https://github.com/vextjs/schema-dsl/compare/v1.0.8...v1.0.9
[v1.0.0]: https://github.com/vextjs/schema-dsl/releases/tag/v1.0.0

