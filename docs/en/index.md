---
pageType: home

hero:
  name: schema-dsl
  text: Progressive TypeScript schema DSL
  tagline: Concise field rules · Progressive s API · Validation · Schema reuse · Export · i18n
  image:
    src: /favicon.svg
    alt: schema-dsl logo
  actions:
    - theme: brand
      text: Get started quickly
      link: /quick-start
    - theme: alt
      text: Document index
      link: /doc-index
    - theme: alt
      text: GitHub
      link: https://github.com/vextjs/schema-dsl

features:
  - title: Progressive schema authoring
    details: Define concise field rules with DSL strings, s('...') seed builders, or discoverable s.xxx() factories.
  - title: Validation runtime
    details: Validate synchronously, asynchronously, or in batches with AJV-backed fallback and cache-aware runtime behavior.
  - title: Multi-format export
    details: The same schema can be exported to MongoDB, MySQL, PostgreSQL and Markdown documents.
  - title: Internationalization
    details: Built-in multi-language error messages and dynamic locale switching, suitable for sharing validation rules between the server and front-end.
  - title: Extensions and plugins
    details: Add custom DSL types, formats, validators and packaged plugins across pure, seed-builder and namespace-factory entries.
  - title: TypeScript friendly
    details: Provides TypeScript declarations and discoverable namespace factories for modern Node.js and TypeScript projects.
---

## Entrance navigation

- Online documentation: [English home](/schema-dsl/)
- Local document index: [doc-index.md](./doc-index.md)
- Quick start: [quick-start.md](./quick-start.md)
- Function index: [FEATURE-INDEX.md](./FEATURE-INDEX.md)

---

## Corresponding sample file

**Example entry**: [home.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/home.ts)
**Description**: Covering the DSL definition, convenient validation and compilation reuse path displayed on the home page, it can be used as the general entry template for Batch 1.
