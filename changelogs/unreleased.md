# Unreleased

## 2026-06-17

- Added `schema-dsl/runtime` with `createRuntime()` plus `createSchemaDslRuntime()` / `createSchemaDslAdapter()` aliases for instance-scoped Locale messages, per-call `messageProvider`, TypeRegistry scope, PATTERNS overrides, Validator/AJV instances, custom keyword messages, conditional branch parsing, async custom validator fallback messages, `I18nError` creation, runtime lifecycle configuration, cache clearing, stats and disposal.
- Aligned `schema-dsl/runtime` validation calls with the root helper's `{ coerce: false }` alias so runtime users can disable schema-dsl smart coercion per call.
- Tightened runtime-created builder lifecycle handling so builder validation uses the live runtime validator without retaining it, and rejects validation after the runtime is disposed.
- Added runtime isolation tests, docs, and runnable examples; clarified that `schema-dsl/pure` only avoids `String.prototype` installation and does not isolate runtime state.
- Added side-effect-controlled package entries for `schema-dsl/pure`, `schema-dsl/compat`, `schema-dsl/register-string`, `schema-dsl/string-types`, `schema-dsl/transform`, and `schema-dsl/esbuild`.
- Added compile-time String-chain DSL transform documentation and runnable API reference examples covering pure import, explicit String registration, transform output, and the optional esbuild adapter.
- Expanded the compile-time String-chain transform to cover the full built-in String extension method set by default, naked pipe enums, `additionalMethods` for user-defined chains, strict diagnostics for root imports / parse failures / unconfigured extension methods, and the opt-in `schema-dsl/string-types` TypeScript declaration entry.
- Added a `test:types` route for the opt-in String-chain TypeScript fixtures, covering source imports, package exports, no-opt-in errors, and user extension augmentation.

## 2026-06-16

- Fixed SQL exporter hardening gaps: MySQL string comments now escape backslashes/control characters, MySQL table options are validated, PostgreSQL identifiers are quoted by default with guarded raw mode, and PostgreSQL numeric defaults/check constraints reject non-finite values.
- Fixed Markdown export hardening gaps in both `MarkdownExporter` and `SchemaUtils.toMarkdown()` by HTML-escaping table content, titles and descriptions while keeping table pipe/newline formatting stable.
- Fixed `renderTemplate()` so placeholders only resolve own properties, preserving inherited names such as `{constructor}` and `{toString}` as literal placeholders.
- Changed the default schema compile cache TTL to `0` so compiled schema reuse is governed by LRU capacity rather than time-based expiration, and synchronized `CacheManager.options` runtime updates with the underlying `cache-hub` cache.
- Documented the process-global nature of custom type registration across ESM/CJS entrypoints and the startup/test cleanup boundary.
- Fixed verified parser, validator, builder, utility, registry and exporter regressions covering conditional discriminator presence, typed enum parsing, invalid constraint diagnostics, async custom validators in combinators, schema-aware cloning, primitive type override protection, SQL/MongoDB export safety, and nested SchemaUtils documentation output.
