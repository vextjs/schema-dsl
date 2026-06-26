# Unreleased

## 2026-06-26

- Hardened schema object construction and validation for reserved property names such as `__proto__`, including DSL object parsing, schema utility merges, conditional/custom-validator stripping paths, exporter examples, v1-compatible `JSONSchemaCore`, and `Validator.quickValidate()`.
- Bounded the static `Validator.quickValidate()` AJV schema cache with LRU eviction, explicit `clearQuickValidateCache()`, cache stats, and `resetRuntimeState()` cleanup.
- Added compatibility-safe i18n hardening through `codeLocaleFiles: 'deny'`, letting trusted deployments keep `.js/.cjs` locale packs while untrusted locale directories can stay JSON-only.

## 2026-06-24

- Fixed follow-up validation edge cases so conditional validation honors `{ allErrors: false }` after merging base and conditional errors, runs conditionals through Draft 7 `dependencies` and local `definitions` / `$defs` `$ref` targets including nested local refs and encoded JSON Pointer segments, preserves `prefixItems + items` semantics during conditional stripping, keeps boolean `false` schemas in `SchemaUtils.pick()`, prunes dependent constraints in `SchemaUtils.omit()`, and makes `SchemaHelper` stable comparison/hash generation distinguish runtime function references and circular arrays.

## 2026-06-23

- Fixed validation option edge cases so root helpers and `Validator` honor per-call smart-coercion opt-outs, `{ allErrors: false }` returns only the first error, custom `validate` keyword boolean failures carry a stable error, `SchemaUtils.pick()` preserves object-level constraints, `SchemaHelper` accepts modern JSON Schema shapes with stable clone/hash/compare behavior, and plugin installation is idempotent.
- Fixed conditional validation execution in JSON Schema applicators including `patternProperties`, `additionalProperties`, `propertyNames`, `contains`, `prefixItems`, and `dependentSchemas`; also tightened raw JSON Schema string keyword detection and PostgreSQL export loss reporting for CHECK-backed scalar constraints.
- Fixed raw JSON Schema input detection so keyword-only schemas such as `{ enum: [...] }`, `{ const: ... }`, and Draft 7 boolean schemas are treated as JSON Schema without stealing DSL object definitions whose field names collide with JSON Schema keywords.
- Fixed runtime and conditional branch schema classification so DSL object inputs such as `{ properties: { enabled: 'boolean!' } }` still compile as schema-dsl definitions, while raw JSON Schema branches and boolean schemas stay valid passthrough inputs.
- Aligned `Validator.validateBatch()` with single-item validation so smart coercion, conditionals, and custom validators run consistently.
- Updated `SchemaUtils.partial(schema, fields)` to preserve the full schema and make only the selected fields optional; `SchemaUtils.extend()` now preserves base schema metadata while merging extension fields.
- Expanded type inference for runtime DSL aliases, bare pipe enums, comma/pipe enum syntax, `types:` unions, constrained array item syntax, JSON Schema `const`, nullable type arrays, and boolean schemas.
- Added `SchemaCompileError`, structured schema compile errors in `validate()`, broader conditional/custom validator walker coverage, and exporter `exportWithReport()` loss reporting for more unsupported JSON Schema keywords and tuple item schemas.
- Documented the source-vs-npm release boundary for the new side-effect-controlled entry points so README and Quick Start examples are not mistaken for guarantees about an older npm latest package.
- Moved Babel AST packages for `schema-dsl/transform` to optional peer dependencies, tightened CI gates, and narrowed npm package files to built output and public metadata.
- Kept package CI coverage on Node.js 18 while limiting the Rspress website build to Node.js 20/22, matching the current Rspack runtime requirement.

## 2026-06-18

- Added the shared `s` / `dsl` namespace API: `s === dsl`, `dsl('email!')` remains the explicit DSL seed entry, and built-in factories such as `s.email()`, `s.string()`, `s.number()`, `s.array(item)`, `s.enum(...)`, and `s.type(name)` map to the same builder/schema implementation.
- Added field-level `.require()` as an alias of `.required()` while preserving the existing conditional `dsl.if(...).require(field)` API.
- Added custom DSL extension registration with optional namespace factories through `defineExtension()` / `registerExtension()` and runtime-scoped `runtime.registerExtension()`, including declaration-merging friendly `DslNamespaceFactories` types.
- Expanded chain semantics so `.min()` / `.max()` map to string length, number range, or array item count according to the current builder type, and added array `.items(item)`.
- Added DSL object support for object-array items through `s.array({ ... })` and `s.array().items({ ... })`, while preserving raw JSON Schema item passthrough.
- Aligned String extension and runtime namespace contracts: direct String chains now include `.items(item)`, while `runtime.s` / `runtime.dsl` typings expose callable DSL seeds and factories without root-only helpers such as `config()`, `if()`, `match()` and `error`.
- Tightened namespace extension validation so custom factory names must be valid JavaScript/TypeScript identifiers, cannot collide with builder chain methods, runtime reset/replace clears scoped factories, tuple-style nested `_required` markers are stripped, and `dsl.error.create()` keeps its `I18nError` type.
- Added tests and type fixtures covering no-opt-in String type behavior, opt-in direct String chains, `s`/`dsl` package exports, custom namespace augmentation, runtime-scoped namespace isolation, and transform support for `.require()`.
- Updated README, API reference, TypeScript guide, String extension docs, DSL syntax docs, runtime isolation docs, custom DSL type docs, runnable examples, and website-facing documentation for the unified chain API.
- Reorganized the extension documentation into an "Extensions and Integration" path with focused pages for extension overview, custom DSL types, custom `s.xxx()` factories, custom chain methods, validation keywords, framework setup, and advanced plugin lifecycle usage.

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
