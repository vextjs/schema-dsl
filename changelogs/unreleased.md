# Unreleased

## 2026-06-16

- Fixed SQL exporter hardening gaps: MySQL string comments now escape backslashes/control characters, MySQL table options are validated, PostgreSQL identifiers are quoted by default with guarded raw mode, and PostgreSQL numeric defaults/check constraints reject non-finite values.
- Fixed Markdown export hardening gaps in both `MarkdownExporter` and `SchemaUtils.toMarkdown()` by HTML-escaping table content, titles and descriptions while keeping table pipe/newline formatting stable.
- Fixed `renderTemplate()` so placeholders only resolve own properties, preserving inherited names such as `{constructor}` and `{toString}` as literal placeholders.
- Changed the default schema compile cache TTL to `0` so compiled schema reuse is governed by LRU capacity rather than time-based expiration, and synchronized `CacheManager.options` runtime updates with the underlying `cache-hub` cache.
- Documented the process-global nature of custom type registration across ESM/CJS entrypoints and the startup/test cleanup boundary.
