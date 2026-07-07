# Unreleased

## 2026-07-07

- **FastPlan correctness**: Fixed root raw JSON Schema cache invalidation for caller-owned nested constraint mutations and made root simple custom-validator fast paths honor the active global Locale default messages.
- **FastPlan Phase 3 verification**: Re-ran local Node.js v20.20.2 / Windows x64 benchmarks after the primitive/enum optimization review. The library baseline is S1 simple valid `~1.672M ops/s`, S2 invalid without i18n formatting `~169K ops/s`, and S3 nested valid `~1.443M ops/s`; repeated Zod scenario runs were `15/19`, `16/19`, and `16/19`, with U1 union string and E1 enum as the stable remaining Zod-leading scenarios and several near-1x scenarios treated as benchmark noise, not public performance claims.
- **Docs consistency**: Synced the FAQ and design philosophy benchmark tables with the maintained 2026-07-07 performance-guide baseline.

## 2026-07-06

- **Performance tooling**: Declared `tinybench@2.9.0` as a direct devDependency, captured the Batch 0 before baseline, added JSON-capable benchmark reports, added `bench:smoke` / `bench:full` / `bench:cache`, and added root / pure / runtime / Validator entry-matrix coverage.
- **Validation hot path**: Added instance-local schema runtime metadata caching, shared smart-coercion candidate reuse, lazy error-format context creation, runtime normalization caching, and fast-path skips for schemas without Conditional, async custom validators, or AJV-skipped-property traversal needs.
- **Validator correctness**: Extended the `__proto__` skipped-property compensation path across schema applicators used by the metadata fast path, with regression coverage for `allOf`.
- **Performance baseline**: Updated the maintained local benchmark baseline on Node.js v20.20.2 / Windows x64: S1 simple valid `~1.574M ops/s`, S2 invalid without i18n formatting `~321K ops/s`, and S3 nested valid `~1.427M ops/s`.
- **Zod scenario matrix**: Added `bench:zod`, included the extended Zod comparison matrix in `bench:smoke` / `bench:full`, and recorded git dirty state in scenario JSON metadata for reproducible performance attribution.
- **FastPlan groundwork**: Added the private `ValidationPlan` skeleton and schema runtime metadata slots with Phase 1 fallback semantics, so future fast-path subsets can be introduced behind explicit feature gates without changing public APIs.
- **FastPlan execution layer**: Expanded the private `ValidationPlan` valid-path subset to scalar / enum / primitive union / homogeneous array / object / email format schemas, added root and `DslBuilder` plan caches, optimized single-field smart coercion, and added guarded sync/async custom-validator fast paths while preserving AJV / Conditional / custom fallback behavior for unsupported or invalid cases.
- **FastPlan benchmark result**: On the initial local Node.js v20.20.2 / Windows x64 Zod full matrix, schema-dsl won 15/19 scenarios; remaining Zod-leading scenarios were recorded as follow-up optimization tail items rather than public performance claims.

## 2026-07-02

- **Brand visual**: Refined the documentation logo SVG to a cleaner routed `s` trace with a reduced-motion-safe trace animation in the SVG asset.
- **Website i18n**: Disabled browser-language auto redirects so the default `/schema-dsl/` entry remains English.
