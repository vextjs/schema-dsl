# schema-dsl feature index


> **Update time**: 2026-06-10
> **PURPOSE**: Quickly find all features and their documentation locations

---

## 📑 Table of Contents

- [Core API](#core-api)
- [Validation function](#validation-function)
- [Exporter](#exporter)
- [Tool function](#dsl-function)
- [Error handling](#error-handling)
- [Configuration Management](#configuration-management)
- [Sample code](#sample-code)

---

## Core API

### dsl() function

**Function**: DSL main entrance, supports string and object definition

**Usage Example**:
```javascript
const { dsl } = require('schema-dsl');

//String definition
const builder = dsl('email!');

// Object definition
const schema = dsl({
  username: 'string:3-32!',
  email: 'email!'
});
```

**Document Location**:
- 📖 [API Reference - dsl() function](./api-reference.md#dsl-function)
- 📖[Quick Start](./quick-start.md)
- 📖 [DSL Syntax Guide](./dsl-syntax.md)

**Code location**: `src/index.ts` / `src/adapters/DslAdapter.ts`

---

### DslBuilder class

**Function**: Schema builder, supports chain calls

**Available methods**:
- ✅ `pattern(regex, message?)` - ​​Regular validation
- ✅ `label(text)` - ​​Field labels
- ✅ `messages(obj)` - ​​Custom error message
- ✅ `description(text)` - ​​Field Description
- ✅ `custom(fn)` - ​​Custom validator
- ✅ `when(field, opts)` - ​​Condition Validation
- ✅ `default(value)` - ​​Default value
- ✅ `toSchema()` - ​​Convert to JSON Schema (including internal markup fields)
- ✅ `toJsonSchema()` - ​​Convert to pure JSON Schema (automatically clean up internal tags such as `_required`/`_customMessages`, suitable for OpenAPI / external systems)
- ✅ `validate(data)` - ​​Validation data
- ✅ `validateNestingDepth(schema, maxDepth)` - ​​Detect nesting depth (static method)

**Default validator method**:
- ✅ `username(preset?)` - ​​Username validation (preset: 'short'|'medium'|'long'|'5-20')
- ✅ `password(strength?)` - ​​Password strength validation (strength: 'weak'|'medium'|'strong'|'veryStrong')
- ✅ `phone(country?)` - ​​Mobile phone number validation (country: 'cn'|'us'|'uk'|'hk'|'tw'|'international')

**Usage Example**:
```javascript
//Basic chain call
const schema = dsl('string:3-32!')
  .pattern(/^[a-zA-Z0-9_]+$/)
  .label('username')
  .messages({ 'pattern': 'Can only contain letters, numbers and underscores' });

// Use default validator
const userSchema = dsl({
  username: dsl('string!').username(), // Automatically set 3-32 length + regular
  password: dsl('string!').password('strong'), // Strong password validation
  phone: dsl('string!').phone('cn') // China mobile phone number validation
});
```

**Document Location**:
- 📖 [API Reference - DslBuilder Class](./api-reference.md#dslbuilder-class)
- 📖[String extended document](./string-extensions.md)

**Code location**: `src/core/DslBuilder.ts`

---

### String extension

**Function**: JavaScript root entry can be directly called by string chain by default; TypeScript complex fields are first wrapped with `dsl()` to obtain complete type hints

**Available methods**: Same as DslBuilder

**Usage Example**:
```javascript
const schema = dsl({
  email: 'email!'.pattern(/custom/).label('email'),
  username: 'string:3-32!'.pattern(/^\w+$/).label('username')
});
```

**Document Location**:
- 📖[String extension complete document](./string-extensions.md)
- 📖 [README](https://github.com/vextjs/schema-dsl/blob/main/README.md)


**Code location**: `src/core/StringExtensions.ts`

---

## Validation function

### Validator class

**Feature**: JSON Schema validator (ajv based)

**Available methods**:
- ✅ `validate(schema, data, options)` - ​​Validation data
- ✅ `compile(schema, cacheKey)` - ​​Compile Schema
- ✅ `validateBatch(schema, dataArray)` - ​​Batch Validation
- ✅ `addKeyword(name, definition)` - ​​Add custom keywords
- ✅ `addFormat(name, validator)` - ​​Add custom format
- ✅ `clearCache()` - ​​Clear cache
- ✅ `Validator.create(options)` - ​​Create instance (static method)
- ✅ `Validator.quickValidate(schema, data)` - ​​Quick validation (static method)

**Usage Example**:
```javascript
const { Validator } = require('schema-dsl');

const validator = new Validator();
const result = validator.validate(schema, data);

console.log(result.valid);   // true/false
console.log(result.errors); // Error list
```

**Document Location**:
- 📖 [API Reference - Validator Class](./api-reference.md#validator-class)
- 📖 [Detailed explanation of validate method](./validate.md)
- 📖[Quick Start](./quick-start.md)

**Code location**: `src/core/Validator.ts`

---

### validate() convenience function

**Function**: Singleton validation, no need for new Validator()

**Usage Example**:
```javascript
const { dsl, validate } = require('schema-dsl');

const schema = dsl({ email: 'email!' });
const result = validate(schema, { email: 'test@example.com' });
```

**Document Location**:
- 📖 [API Reference - validate() function](./api-reference.md)
- 📖[Quick Start](./quick-start.md#1-hello-world-in-30-seconds)

**Code location**: `src/index.ts` (default singleton export)

---

## exporter

### MongoDBExporter

**Function**: Export MongoDB $jsonSchema format

**Available methods**:
- ✅ `export(schema)` - ​​Export Schema
- ✅ `generateCreateCommand(collectionName, schema)` - ​​Generate createCollection command
- ✅ `generateCommand(collectionName, schema)` - ​​Generate executable command string
- ✅ `MongoDBExporter.export(schema)` - ​​Quick export (static method)

**Usage Example**:
```javascript
const { exporters } = require('schema-dsl');

const exporter = new exporters.MongoDBExporter();
const mongoSchema = exporter.export(jsonSchema);

// Generate command
const command = exporter.generateCommand('users', jsonSchema);
console.log(command);
```

**Document Location**:
- 📖[Database Export Guide](./export-guide.md)
- 📖[Sample code](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/feature-index.ts)

**Code location**: `src/exporters/MongoDBExporter.ts`

---

### MySQLExporter

**Function**: Export MySQL CREATE TABLE DDL

**Available methods**:
- ✅ `export(tableName, schema, options)` - ​​Export DDL
- ✅ `MySQLExporter.export(tableName, schema)` - ​​Quick export (static method)

**Usage Example**:
```javascript
const { exporters } = require('schema-dsl');

const exporter = new exporters.MySQLExporter();
const ddl = exporter.export('users', jsonSchema);

console.log(ddl);
// CREATE TABLE `users` (
//   `username` VARCHAR(32) NOT NULL,
//   ...
// );
```

**Document Location**:
- 📖[Database Export Guide](./export-guide.md)
- 📖[Sample code](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/feature-index.ts)

**Code location**: `src/exporters/MySQLExporter.ts`

---

### PostgreSQLExporter

**Function**: Export PostgreSQL CREATE TABLE DDL

**Available methods**:
- ✅ `export(tableName, schema, options)` - ​​Export DDL
- ✅ `PostgreSQLExporter.export(tableName, schema)` - ​​Quick export (static method)

**Usage Example**:
```javascript
const { exporters } = require('schema-dsl');

const exporter = new exporters.PostgreSQLExporter();
const ddl = exporter.export('users', jsonSchema);

console.log(ddl);
// CREATE TABLE public.users (
//   username VARCHAR(32) NOT NULL,
//   ...
// );
```

**Document Location**:
- 📖[Database Export Guide](./export-guide.md)
- 📖[Sample code](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/feature-index.ts)

**Code location**: `src/exporters/PostgreSQLExporter.ts`

---

## Utility function

### SchemaUtils

**Function**: Schema reuse, merge, and operation tools

**Available methods**:
- ✅ `reusable(factory)` - ​​Create reusable snippets
- ✅ `createLibrary(fragments)` - ​​Create snippet library
- ✅ `extend(baseSchema, extensions)` - ​​Extended Schema
- ✅ `pick(schema, fields)` - ​​Filter fields
- ✅ `omit(schema, fields)` - ​​Exclude fields
- ✅ `partial(schema, fields?)` - ​​Change fields to optional
- ✅ `validateBatch(schema, dataArray, ajvInstance)` - ​​Batch validation with summary statistics
- ✅ `withPerformance(validator)` - ​​Pack performance information for Validator
- ✅ `toMarkdown(schema)` - ​​Export to Markdown
- ✅ `toHTML(schema)` - ​​Export to HTML
- ✅ `clone(schema)` - ​​Deep Clone

**Usage Example**:
```javascript
const { SchemaUtils, dsl } = require('schema-dsl');

// Schema reuse
const emailField = SchemaUtils.reusable(() => dsl('email!'));

const schema1 = dsl({ email: emailField() });
const schema2 = dsl({ contactEmail: emailField() });

//Schema merge
const extended = SchemaUtils.extend(schema1, { age: 'number' });
```

**Document Location**:
- 📖 [API Reference - SchemaUtils](./api-reference.md#utility-functions)

**Code location**: `src/utils/SchemaUtils.ts`

---

### TypeConverter

**Function**: Type conversion tool (JSON Schema ↔ Database type)

**Available methods**:
- ✅ `toJSONSchemaType(nativeType)` - ​​Convert to JSON Schema `type` string
- ✅ `toMongoDBType(jsonSchemaType)` - ​​Convert to MongoDB BSON type
- ✅ `toMySQLType(jsonSchemaType, schema?)` - ​​Convert to MySQL data type
- ✅ `toPostgreSQLType(jsonSchemaType, schema?)` - ​​Convert to PostgreSQL data type
- ✅ `normalizePropertyName(name)` - ​​Normalized attribute name
- ✅ `formatToRegex(format)` - ​​Convert format validation to regular format

**Document Location**:
- 📖 [TypeConverter Documentation](./type-converter.md)

**Code location**: `src/utils/TypeConverter.ts`

---

### SchemaHelper

**Feature**: Schema analysis and auxiliary tools

**Available methods**:
- ✅ `isValidSchema(schema)` - ​​Verify Schema validity
- ✅ `generateSchemaId(schema)` - ​​Generate content-based Schema ID
- ✅ `getFieldPaths(schema)` - ​​Extract field path
- ✅ `flattenSchema(schema)` - ​​Flat Schema
- ✅ `cloneSchema(schema)` - ​​Clone Schema
- ✅ `extractRequiredFields(schema)` - ​​Extract required fields
- ✅ `compareSchemas(schema1, schema2)` - ​​Compare Schema
- ✅ `simplifySchema(schema)` - ​​Simplified Schema
- ✅ `isValidPropertyName(name)` - ​​Verify attribute name
- ✅ `getSchemaComplexity(schema)` - ​​Evaluate complexity
- ✅ `summarizeSchema(schema)` - ​​Generate summary

**Document Location**:
- 📖[SchemaHelper Documentation](./schema-helper.md)

**Code location**: `src/utils/SchemaHelper.ts`

---

## Error handling

### ErrorFormatter

**Function**: Format validation error message

**Available methods**:
- ✅ `new ErrorFormatter(locale?, messages?)` - ​​Create formatter
- ✅ `format(error, locale?)` - ​​Format single error into message string
- ✅ `formatDetailed(errors, locale?, customMessages?, alreadyMerged?)` - ​​Format error array as standard error entry

**Document Location**:
- 📖 [API reference - ErrorFormatter / MessageTemplate / underlying parsing tool](./api-reference.md)
- 📖[Error handling document](./error-handling.md)

**Code location**: `src/core/ErrorFormatter.ts`

---

### ErrorCodes

**Function**: Error code definition

**Code location**: `src/core/ErrorCodes.ts`

---

### MessageTemplate

**Feature**: Error message template

**Available methods**:
- ✅ `render(template, vars)` - ​​Rendering Template
- ✅ `MessageTemplate.render(template, vars)` - ​​Fast rendering (static method)
- ✅ `MessageTemplate.renderBatch(templates, vars)` - ​​Batch rendering (static method)

**Document Location**:
- 📖 [API Reference - MessageTemplate](./api-reference.md#messagetemplate)

**Code location**: `src/core/MessageTemplate.ts`

---

### Type registration and template tools

**Features**: Template rendering, JSON Schema appearance and custom type registration capabilities for advanced integration

**Available exports**:
- ✅ `renderTemplate(template, params)`
- ✅ `JSONSchemaCore`
- ✅ `TypeRegistry`

**Document Location**:
- 📖 [API Reference - renderTemplate / JSONSchemaCore / Type Registration and Internal Parsing Boundaries](./api-reference.md)

**Code location**: `src/core/TemplateEngine.ts` / `src/core/JSONSchemaCore.ts` / `src/parser/TypeRegistry.ts`

---

### Locale

**Feature**: International support

**Available methods**:
- ✅ `setLocale(locale)` - ​​Set language
- ✅ `getLocale()` - ​​Get current language
- ✅ `addLocale(locale, messages)` - ​​Add language pack
- ✅ `setMessages(messages)` - ​​Set global messages
- ✅ `getMessage(code, customMessages)` - ​​Get news
- ✅ `getAvailableLocales()` - ​​Get available languages
- ✅ `reset()` - ​​Reset

**Supported languages**:
- ✅ en-US (English)
- ✅ zh-CN (Chinese)
- ✅ ja-JP (Japanese)
- ✅ es-ES (Spanish)
- ✅ fr-FR (French)

**Document Location**:
- 📖 [API Reference - Locale](./api-reference.md)

**Code location**: `src/core/Locale.ts`

---

## Configuration management

### CacheManager

**Function**: Schema compilation cache management

**Available methods**:
- ✅ `get(key)` - ​​Get cache
- ✅ `set(key, value)` - ​​Set cache
- ✅ `has(key)` - ​​Check cache
- ✅ `delete(key)` - ​​Delete cache
- ✅ `clear()` - ​​Clear cache
- ✅ `size()` - ​​cache size

**Document Location**:
- 📖 [CacheManager Documentation](./cache-manager.md)

**Code location**: `src/core/CacheManager.ts`

---

### CustomKeywords

**Function**: Custom validation keywords

**Available Keywords**:
- ✅ `regex` - ​​Regular validation
- ✅ `validate` - ​​Custom function validation

**Usage Example**:
```javascript
const { Validator, CustomKeywords } = require('schema-dsl');

const validator = new Validator();
CustomKeywords.registerAll(validator.getAjv());

const schema = {
  type: 'string',
  regex: '^[a-z]+$'
};
```

**Document Location**:
- 📖[Error handling document](./error-handling.md)

**Code location**: `src/validators/CustomKeywords.ts`

---

## Sample code

### Full sample directory

**Basic example**:
- 📄 [dsl-syntax.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/dsl-syntax.ts) - Basic DSL usage
- 📄 [string-extensions.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/string-extensions.ts) - String extension example

**Scenario example**:
- 📄 [quick-start.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/quick-start.ts) - Basic form validation starting point for user registration
- 📄 [validation-guide.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/validation-guide.ts) - Examples of failure paths, error handling and rule combinations

**Export example**:
- 📄 [feature-index.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/feature-index.ts) - representative example of feature index

---

## Function coverage check

### ✅ Fully documented

1. ✅ DSL syntax - `docs/dsl-syntax.md` (line 2815)
2. ✅ String extension - `docs/string-extensions.md`
3. ✅ Validator class - `docs/validate.md`
4. ✅ API Reference - `docs/api-reference.md`
5. ✅ Quick Start - `docs/quick-start.md`
6. ✅ Database export - `README.md` + `docs/export-guide.md`
7. ✅ Custom validation - `README.md`
8. ✅ Schema Tool - `docs/schema-utils.md` + `docs/schema-helper.md`

### ⚠️ Documentation needs to be supplemented

1. ⚠️ ErrorFormatter - currently covered in the API reference and error handling documents; if you need to focus more on the entry, you can add special documents later
2. ⚠️ PluginManager - can add a more focused API/Hook quick check
3. ⚠️Performance & Benchmarks - Supplementary to Independent Diagnostics Manual
4. ⚠️ How to run the example - can supplement the unified TypeScript example compilation instructions
5. ⚠️ Error handling - more complete framework integration cases can be added

### 📝Plan supplement

- [ ] Supplement `ErrorFormatter` special document
- [ ] Added Plugin Hook quick reference documentation
- [ ] Supplemented unified running instructions for TypeScript examples
- [ ] Supplementary Performance Tuning/Benchmark Interpretation Manual

---

## Related documents

- 📖 [README.md](https://github.com/vextjs/schema-dsl/blob/main/README.md) - Project Introduction
- 📖[Quick Start](./quick-start.md) - 5 minutes to get started
- 📖 [DSL Syntax Guide](./dsl-syntax.md) - Complete syntax
- 📖 [String extension](./string-extensions.md) - String extension features
- 📖[API Reference](./api-reference.md) - Complete API
- 📖 [CHANGELOG](https://github.com/vextjs/schema-dsl/blob/main/CHANGELOG.md) - Update log

---

## Corresponding sample file

**Example entry**: [feature-index.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/feature-index.ts)
**Description**: The three representative capabilities of concatenating DSL, String extension and exporter in a single file serve as a quick entry point to the functional index page.

---

**Last updated**: 2026-06-10
**Maintainer**: schema-dsl Team
