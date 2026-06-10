# Unreleased

## 2026-06-10

- **[Fixed]** Bound Validator/AJV compiled schema lifecycle: repeated DSL definitions and DslBuilder materialization now reuse stable schema cache keys, cache eviction and `clearCache()` release AJV internal schema refs, `_removeAdditional` uses a bounded internal compile cache, locale flatten cache is bounded and revision-aware, and official plugin uninstall paths clean custom formats, types, keywords, global plugin state, and Validator caches.
