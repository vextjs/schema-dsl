# schema-dsl document index

> **Update time**: 2026-06-10
> **Purpose**: Quick navigation of all documents
> **Online Documentation**: [English home](/schema-dsl/)
> **Number of documents**: `README.md + docs/*.md` 59 in total

---

## 📑 Table of Contents

### Quick navigation
- [Quick Start](#doc-index-quick-start) - A must-read for getting started
- [Core Documents](#doc-index-core-docs) - Main functional documents
- [Function Index](#doc-index-feature-map) - Search by function
- [Exporter](#doc-index-exporters) - Database Schema export
- [Tools](#doc-index-utilities) - Auxiliary tools
- [Usage Guide](#doc-index-guides) - Complete Tutorial
- [Supplementary Documents](#doc-index-supplemental) - Other documents not expanded in the topic area
- [Troubleshooting](#doc-index-troubleshooting) - Problem Solving
- [Development and Contribution](#doc-index-contributing) - Contribution Guide
- [Sample code](#corresponding-sample-file) - Complete example
- [Frequently Asked Questions](#doc-index-faq) - FAQ

---

<a id="doc-index-quick-start"></a>

## 🚀 Quick start

| document | reading time | Description |
|------|----------|------|
| [README.md](https://github.com/vextjs/schema-dsl/blob/main/README.md) | 3 minutes | Project introduction, installation and quick start ⭐ |
| [quick-start.md](quick-start.md) | 5 minutes | 5-minute quick tutorial ⭐ |
| [design-philosophy.md](design-philosophy.md) | 15 minutes | **Design Concepts and Performance Tradeoffs** ⭐⭐⭐ |
| [FEATURE-INDEX.md](FEATURE-INDEX.md) | 10 minutes | Full feature index ⭐ |
| [best-practices.md](best-practices.md) | 15 minutes | Best Practice Guide ⭐⭐⭐ |
| [faq.md](faq.md) | 5 minutes | FAQ |

---

<a id="doc-index-core-docs"></a>

## 📖 Core Documentation

### DSL syntax (core functionality)

| document | Description |
|------|------|
| [dsl-syntax.md](dsl-syntax.md) | **Complete Guide to DSL Syntax** (Most Important) ⭐⭐⭐ |
| [string-extensions.md](string-extensions.md) | **String extension document** ⭐⭐ |
| [plugin-system.md](plugin-system.md) | **Plugin System Guide** ⭐⭐ |
| [api-reference.md](api-reference.md) | API Complete Reference ⭐⭐ |
| [validate.md](validate.md) | Detailed explanation of validate method ⭐ |
| [**validate-async.md**](validate-async.md) | **Detailed explanation of asynchronous validation method** ⭐⭐⭐ |
| [**schema-utils-chaining.md**](schema-utils-chaining.md) | **Schema chain reuse method** ⭐⭐⭐ |
| [**schema-utils-best-practices.md**](schema-utils-best-practices.md) | **SchemaUtils Best Practices and Common Pitfalls** ⭐⭐⭐ |
| [**schema-utils-advanced-issues.md**](schema-utils-advanced-issues.md) | **SchemaUtils in-depth problem analysis** ⭐⭐ |

---

<a id="doc-index-feature-map"></a>

## 🎯 Function index

### Core API

| Function | document | code location |
|------|------|---------|
| dsl() function | [api-reference.md](api-reference.md#dsl-function) | `src/index.ts` / `src/adapters/DslAdapter.ts` |
| DslBuilder class | [api-reference.md](api-reference.md#dslbuilder-class) | `src/core/DslBuilder.ts` |
| String extension | [string-extensions.md](string-extensions.md) | `src/core/StringExtensions.ts` |
| Validator class | [validate.md](validate.md) | `src/core/Validator.ts` |
| validate() function | [api-reference.md](api-reference.md) | `src/index.ts` |
| validateAsync() function | [validate-async.md](validate-async.md) | `src/index.ts` |
| ValidationError class | [validate-async.md](validate-async.md#basic-example) | `src/errors/ValidationError.ts` |
| SchemaUtils chain call | [schema-utils-chaining.md](schema-utils-chaining.md) | `src/utils/SchemaUtils.ts` |


---

<a id="doc-index-exporters"></a>

## 🗄️ Exporter

> Convert JSON Schema to database DDL and validation rules

> ⚠️ **Important Tip**: Please read [**Export Restrictions**](export-limitations.md) first to understand which features cannot be exported to the database Schema.

### Export restriction description ⚠️

| document | Description |
|------|------|
| [**export-limitations.md**](export-limitations.md) | **Full Description of Export Limitations** (Must Read) ⭐⭐⭐ |

**Main content**:
- ❌ Exported features (conditional validation, custom validators, etc.) are not supported
- ⚠️ Partially supported features (regular, range, enumeration, etc.)
- ✅ Fully supported features (base types, required constraints, etc.)
- Comparison of database-specific limitations (MongoDB/MySQL/PostgreSQL)
- Best practice recommendations (layered validation, documented constraints, etc.)

### MongoDB exporter

| document | Description |
|------|------|
| [mongodb-exporter.md](mongodb-exporter.md) | A Complete Guide to the MongoDB Exporter |

**Main functions**:
- `export()` - ​​Export $jsonSchema validation rules
- `generateCreateCommand()` - ​​Generate creation set command (including validation)
- `generateCommand()` - ​​generates the complete runCommand command
- `MongoDBExporter.export()` - ​​Static quick export method

### MySQL exporter

| document | Description |
|------|------|
| [mysql-exporter.md](mysql-exporter.md) | A Complete Guide to the MySQL Exporter |

**Main functions**:
- `export()` - ​​Export CREATE TABLE DDL
- `generateIndex()` - ​​Generate CREATE INDEX DDL
- Supports ENGINE, CHARSET, COLLATE configuration

### PostgreSQL exporter

| document | Description |
|------|------|
| [postgresql-exporter.md](postgresql-exporter.md) | A Complete Guide to the PostgreSQL Exporter |

**Main functions**:
- `export()` - ​​Export CREATE TABLE DDL (with CHECK constraints)
- `generateIndex()` - ​​Generate index DDL (supports btree/gin/gist/hash)
- Support Schema namespace and COMMENT

---

<a id="doc-index-utilities"></a>

<a id="tools"></a>

## 🛠️ Utilities

| document | Description |
|------|------|
| [type-converter.md](type-converter.md) | TypeConverter - Type conversion tool |
| [schema-helper.md](schema-helper.md) | SchemaHelper - Schema helper tool |
| [cache-manager.md](cache-manager.md) | CacheManager - LRU cache management |

### TypeConverter main functions
- `toMongoDBType()` - ​​Convert to MongoDB type
- `toMySQLType()` - ​​Convert to MySQL type
- `toPostgreSQLType()` - ​​Convert to PostgreSQL type
- `extractConstraints()` - ​​Extract constraint information
- `mergeSchemas()` - ​​Merge multiple schemas

### SchemaHelper main functions
- `isValidSchema()` - ​​Verify Schema validity
- `cloneSchema()` - ​​Deep Clone Schema
- `flattenSchema()` - ​​Flatten nested Schema
- `getFieldPaths()` - ​​Get all field paths
- `summarizeSchema()` - ​​Generate Schema summary

### CacheManager main functions
- LRU cache policy (least recently used eviction)
- TTL expiration support
- Cache statistics (hit rate, size, etc.)
- Thread safe design

---

<a id="doc-index-guides"></a>

## 📖 Guides

| document | Description |
|------|------|
| [validation-guide.md](validation-guide.md) | The Complete Guide to Data Validation |
| [export-guide.md](export-guide.md) | Complete Guide to Database Export |
| [error-handling.md](error-handling.md) | Error handling best practices |

### Validation guide content
- Basic validation process
- Field type validation (string/number/boolean/array/object)
- Common business validation modes
- Batch validation and performance optimization
- Error handling best practices

### Export guide content
- MongoDB/MySQL/PostgreSQL export comparison
- Configuration and customization options
- Automated migration script
- Version management and best practices
- **⚠️ [Export restriction description](export-limitations.md) - Which features cannot be exported** ⭐⭐⭐


- Database export overview
- MongoDB/MySQL/PostgreSQL export tutorial
- Multi-database synchronization solution
- Type mapping reference table
- Best Practices and FAQs

---

<a id="doc-index-supplemental"></a>

## 🧩 Supplementary documentation

> The top topic area is mainly organized by learning paths and topics; the following supplementary index lists the remaining documents that have not been separately expanded in the topic area to ensure that the navigation covers all `docs/*.md` documents.

| document | Title/Description |
|------|-------------|
| [add-custom-locale.md](add-custom-locale.md) | Guide to adding custom language packs |
| [add-keyword.md](add-keyword.md) | addKeyword method |
| [api.md](api.md) | API reference entrance |
| [best-practices-project-structure.md](best-practices-project-structure.md) | schema-dsl project best practice examples |
| [compile.md](compile.md) | compile method |
| [conditional-api.md](conditional-api.md) | Chained Condition API - ConditionalBuilder |
| [custom-extensions-guide.md](custom-extensions-guide.md) | Custom extension guide |
| [dynamic-locale.md](dynamic-locale.md) | Dynamic Multilingual Configuration Guide |
| [enum.md](enum.md) | Enum function documentation |
| [frontend-i18n-guide.md](frontend-i18n-guide.md) | Dynamically switching languages ​​on the front end - a best practice guide |
| [i18n-user-guide.md](i18n-user-guide.md) | Multi-language support user guide |
| [i18n.md](i18n.md) | Multilingual Configuration Guide |
| [index.md](index.md) | Site home page copy (H1 is not separately stated in the document) |
| [json-schema-basics.md](json-schema-basics.md) | JSON Schema Basics |
| [label-vs-description.md](label-vs-description.md) | label vs description usage guide |
| [markdown-exporter.md](markdown-exporter.md) | Markdown exporter |
| [multi-language.md](multi-language.md) | Multi-language support |
| [multi-type-support.md](multi-type-support.md) | Multi-type support design instructions |
| [number-operators.md](number-operators.md) | Numeric comparison operators (v1.1.2+) |
| [optional-marker-guide.md](optional-marker-guide.md) | schema-dsl optional tag? supported |
| [performance-guide.md](performance-guide.md) | Performance Optimization Guide |
| [plugin-type-registration.md](plugin-type-registration.md) | Custom type registration |
| [runtime-locale-support.md](runtime-locale-support.md) | Runtime multi-language support - schema-dsl |
| [runtime-isolation.md](runtime-isolation.md) | Runtime state isolation with `schema-dsl/runtime` |
| [schema-utils.md](schema-utils.md) | Schema tool function documentation |
| [security-checklist.md](security-checklist.md) | Safety Checklist |
| [troubleshooting.md](troubleshooting.md) | FAQ troubleshooting guide |
| [type-reference.md](type-reference.md) | schema-dsl type reference |
| [typescript-guide.md](typescript-guide.md) | TypeScript usage guide |
| [union-type-guide.md](union-type-guide.md) | One field supports multiple types |
| [union-types.md](union-types.md) | Cross-type union validation - types: syntax |
| [validate-batch.md](validate-batch.md) | validateBatch method |
| [validate-dsl-object-support.md](validate-dsl-object-support.md) | validate() function supports DSL object specification |
| [validator.md](validator.md) | Validator class overview |

---

<a id="doc-index-examples"></a>

## 📝Examples

| document | Description |
|------|------|
| [quick-start.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/quick-start.ts) | Quick start example |
| [dsl-syntax.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/dsl-syntax.ts) | DSL style complete example |
| [string-extensions.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/string-extensions.ts) | String extension example |
| [runtime-isolation.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/runtime-isolation.ts) | Runtime adapter isolation example |
| [troubleshooting.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/troubleshooting.ts) | Troubleshooting and error location examples |

---

<a id="doc-index-faq"></a>

## ❓ Frequently Asked Questions (FAQ)

| document | Description |
|------|------|
| [faq.md](faq.md) | Frequently Asked Questions and Answers |

**Popular Questions**:
- What is the difference between DSL syntax and Joi syntax?
- How to customize validation rules?
- How to optimize validation performance?
- Type mapping for different databases?
- How to handle validation errors?

---

<a id="doc-index-troubleshooting"></a>

## 🔧 Troubleshooting

| document | Description |
|------|------|
| [troubleshooting.md](troubleshooting.md) | Common errors, troubleshooting steps and reproducible repair examples |

---

<a id="doc-index-contributing"></a>

## 🛠️ Development and contribution

| document | Description |
|------|------|
| [CONTRIBUTING.md](https://github.com/vextjs/schema-dsl/blob/main/CONTRIBUTING.md) | Contribution Guide |

---

## 📊 Version information

| document | Description |
|------|------|
| [STATUS.md](https://github.com/vextjs/schema-dsl/blob/main/STATUS.md) | Project status (current testing and release status)|
| [CHANGELOG.md](https://github.com/vextjs/schema-dsl/blob/main/CHANGELOG.md) | Change log |

---

## 📁 Document Statistics

| index | current value |
|------|--------|
| `docs/*.md` Number of documents | **58** |
| `README.md + docs/*.md` Number of documents | **59** |
| Total number of lines in the document | **Continuous evolution (subject to the real-time content of the warehouse)** |
| Number of test files | **75** |
| The latest full validation | **76 files / 1114 tests passed** |

---

**Legend description**:
- ⭐ Key recommended documents
- ⭐⭐ Core Documentation
- ⭐⭐⭐ Must-read documents

---

## Corresponding sample file

**Example entry**: [doc-index.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/doc-index.ts)
**Description**: Use a minimal entry script to string together quick start, compilation validation and document export to help readers jump directly from the index page to runnable examples.

---

**Last updated**: 2026-06-10
