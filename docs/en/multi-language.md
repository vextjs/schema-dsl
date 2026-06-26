# Multi-language support

Multilingual capabilities are provided by `Locale`, `s.config({ i18n })` and authentication options `locale`.

Common entrances:

- Switch default language at runtime: `Locale.setLocale('en-US')`
- Runtime supplementary language pack: `Locale.addLocale('en-US', messages)`
- Scan language packs from directory: `s.config({ i18n: '/path/to/locales' })`
- Single validation coverage language: `validator.validate(schema, data, { locale: 'en-US' })`

Currently i18n directory scanning supports these language pack files: `.js`, `.cjs`, `.json`, `.jsonc`, `.json5`. `.js` / `.cjs` files are trusted code files and remain enabled by default for compatibility; use `s.config({ i18n: '/path/to/locales', codeLocaleFiles: 'deny' })` for JSON-only directory loading.

For more information, see:

- [i18n.md](./i18n.md)
- [i18n-user-guide.md](./i18n-user-guide.md)
- [dynamic-locale.md](./dynamic-locale.md)

---

## Corresponding sample file

**Example entry**: [multi-language.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/multi-language.ts)
**Description**: Minimal runtime example showing default language, per-coverage `locale`, and list of available languages.
