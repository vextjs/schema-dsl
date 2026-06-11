# Markdown exporter

> **FEATURE**: Export JSON Schema to human-readable Markdown document
> **Language support**: Chinese, English, Japanese

---

## 📑 Table of Contents

- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Usage example](#usage-example)
- [Multi-language support](#multi-language-support)
- [Custom options](#custom-options)

---

## quick start

### Install

```bash
npm install schema-dsl
```

### Basic usage

```javascript
const { dsl, exporters } = require('schema-dsl');

//define Schema
const schema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120'
});

// Export to Markdown
const markdown = exporters.MarkdownExporter.export(schema, {
  title: 'User Registration API',
  locale: 'zh-CN'
});

console.log(markdown);
```

**Generated Markdown**:

```markdown
# User registration API

## Field list

| Field name | Type | Required | Constraints | Description |
|--------|------|------|------|------|
| username | string | ✅ | length: 3-32 | - |
| email | Email | ✅ | - | - |
| age | number | ❌ | range: 18-120 | - |

## Sample data

\```json
{
  "username": "example",
  "email": "user@example.com"
}
\```

## Constraint rules

**Required fields**: `username`, `email`

**Optional field**: `age`
```

---

## API reference

### MarkdownExporter.export(schema, options)

Export JSON Schema to Markdown document.
**Parameters**:

- `schema` (Object) - JSON Schema object
- `options` (Object) - Export options
  - `title` (String) - document title, default: `'Schema Documentation'`
  - `locale` (String) - Language code, default: `'en-US'`
    - Support: `'zh-CN'` (Chinese), `'en-US'` (English), `'ja-JP'` (Japanese)
  - `includeExample` (Boolean) - Whether to include sample data, default: `true`
  - `includeDescription` (Boolean) - Whether to include a description, default: `true`

**Return value**: `String` - ​​Markdown text

---

## Usage example

### Example 1: Basic usage

```javascript
const schema = dsl({
  name: 'string:1-50!',
  email: 'email!'
});

const markdown = exporters.MarkdownExporter.export(schema, {
  title: 'User information'
});

console.log(markdown);
```

### Example 2: Using tags

```javascript
const schema = dsl({
  name: 'string:1-50!'.label('name'),
  email: 'email!'.label('email address'),
  age: 'number:18-120'.label('age')
});

const markdown = exporters.MarkdownExporter.export(schema, {
  title: 'User registration form',
  locale: 'zh-CN'
});
```

**Generate results**:

| Field name | type | Required | constraint | Description |
|--------|------|------|------|------|
| name | string | ✅ | Length: 1-50 | Name |
| email | Mail | ✅ | - | Email address |
| age | number | ❌ | Range: 18-120 | age |

### Example 3: Complex Schema

```javascript
const productSchema = dsl({
  'id': 'string:24!'.label('Product ID'),
  'name': 'string:1-100!'.label('product name'),
  'price': 'number:0.01-!'.label('Price (USD)'),
  'stock': 'integer:0-!'.label('Stock quantity'),
  'category': 'electronics|clothing|books|other!'.label('category'),
  'tags': 'array:1-10<string:1-20>'.label('label'),
  'description': 'string:500'.label('Product Description'),
  'active': 'boolean'.label('Whether it is on the shelves')
});

const markdown = exporters.MarkdownExporter.export(productSchema, {
  title: 'Product Information Schema',
  locale: 'zh-CN',
  includeExample: true
});
```

### Example 4: No examples included

```javascript
const markdown = exporters.MarkdownExporter.export(schema, {
  title: 'API Documentation',
  includeExample: false // Do not generate sample data
});
```

---

## Multi-language support

### Supported languages

| language code | Language name | Example |
|---------|---------|------|
| `zh-CN` | Simplified Chinese | String, number, required |
| `en-US` | English | String, Number, Required |
| `ja-JP` | Japanese | Literal string, value, required |

### Chinese example

```javascript
const markdown = exporters.MarkdownExporter.export(schema, {
  title: 'User Registration API',
  locale: 'zh-CN'
});
```

**Output**:
- Field list (Fields)
- Type: string, number, boolean
- Required: ✅ / ❌

### English example

```javascript
const markdown = exporters.MarkdownExporter.export(schema, {
  title: 'User Registration API',
  locale: 'en-US'
});
```

**Output**:
- Fields
- Type: String, Number, Boolean
- Required: ✅ / ❌

### Japanese example

```javascript
const markdown = exporters.MarkdownExporter.export(schema, {
  title: 'User Login API',
  locale: 'ja-JP'
});
```

**Output**:
- Field list
- Type: string, number, boolean
- Required: ✅ / ❌

---

## Custom options

### Complete configuration example

```javascript
const markdown = exporters.MarkdownExporter.export(schema, {
  //Document title
  title: 'API Documentation - User Module',

  // language settings
  locale: 'zh-CN',

  // Whether to include sample data
  includeExample: true,

  // Whether to include Schema description
  includeDescription: true
});
```

### save as file

```javascript
const fs = require('fs');

const markdown = exporters.MarkdownExporter.export(schema, {
  title: 'API Documentation',
  locale: 'en-US'
});

// Save as Markdown file
fs.writeFileSync('./API.md', markdown, 'utf-8');
console.log('Markdown document has been generated: API.md');
```

---

## type mapping table

### basic type

| Schema type | Chinese | English | Japanese |
|------------|------|------|------|
| string | string | String | Text column |
| number | number | Number | value |
| integer | integer | Integer | integer |
| boolean | Boolean value | Boolean | Boolean |
| array | array | Array | Arrange |
| object | object | Object | Object |

### format type

| Format | Chinese | English | Japanese |
|------|------|------|------|
| email | Mail | Email | Email address |
| url | URL | URL | URL |
| date | date | Date | Daily payment |
| uuid | UUID | UUID | UUID |

---

## Advanced usage

### Combine with other exporters

```javascript
const { dsl, exporters } = require('schema-dsl');

const schema = dsl({
  username: 'string:3-32!',
  email: 'email!'
});

// Export to Markdown (human readable)
const markdown = exporters.MarkdownExporter.export(schema, {
  title: 'User Schema',
  locale: 'zh-CN'
});

// Export to MongoDB Schema
const mongoSchema = exporters.MongoDBExporter.export(schema, {
  collectionName: 'users'
});

//Export as MySQL DDL
const mysqlDDL = exporters.MySQLExporter.export('users', schema);

// Export to PostgreSQL DDL
const pgDDL = exporters.PostgreSQLExporter.export('users', schema);

console.log('Markdown document:\n', markdown);
console.log('\nMongoDB Schema:\n', mongoSchema);
console.log('\nMySQL DDL:\n', mysqlDDL);
console.log('\nPostgreSQL DDL:\n', pgDDL);
```

---

## FAQ

### Q: How to customize field descriptions?

A: Use `.label()` for the display name and `.description()` for the field note. When both are present, Markdown output includes both pieces of metadata.

```javascript
const schema = dsl({
  email: 'email!'
    .label('Email Address')
    .description('Primary login email')
});
```

### Q: What is the sample data generated?

A: The sample data contains all **required fields**, and values ​​are automatically generated based on types and constraints:
- Email: `user@example.com`
- Number: Use `minimum` or `0`
- String: `'example'`
- Boolean value: `true`

### Q: How to hide certain fields?

A: The Markdown exporter will export all fields. To hide, remove the field before generating.

### Q: Are nested objects supported?

A: The current version mainly supports flat structure. Nested objects appear as type "Object".

---

## Complete example

```javascript
const { dsl, exporters } = require('schema-dsl');
const fs = require('fs');

//Define user registration Schema
const userRegistrationSchema = dsl({
  //Basic information
  'username': 'string:3-32!'.label('username'),
  'email': 'email!'.label('email address'),
  'password': 'string:8-32!'.label('password'),

  // personal information
  'realName': 'string:1-50'.label('real name'),
  'age': 'integer:18-120'.label('age'),
  'gender': 'male|female|other'.label('gender'),

  // other
  'acceptTerms': 'boolean!'.label('Agree to the terms')
});

//Generate Chinese document
const zhDoc = exporters.MarkdownExporter.export(userRegistrationSchema, {
  title: 'User Registration API Documentation',
  locale: 'zh-CN',
  includeExample: true
});

//Generate English document
const enDoc = exporters.MarkdownExporter.export(userRegistrationSchema, {
  title: 'User Registration API Documentation',
  locale: 'en-US',
  includeExample: true
});

// save document
fs.writeFileSync('./docs/USER_REGISTRATION_ZH.md', zhDoc);
fs.writeFileSync('./docs/USER_REGISTRATION_EN.md', enDoc);

console.log('✅ Document has been generated');
```

---

## Corresponding sample file

**Example entry**: [markdown-exporter.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/markdown-exporter.ts)
**Description**: Covers the Chinese and English document generation and title/field placement check of `MarkdownExporter.export()`, suitable as a minimum template for document export.

---

**Document update date**: 2026-06-10
**Version**: v2.0.9
