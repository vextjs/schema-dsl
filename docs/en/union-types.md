# Cross-type union validation - types: syntax

## Overview

The `types:` syntax allows you to define cross-type joint validation, supporting field matching of multiple different data types.

### characteristic

✅ **Concise syntax** - `'types:string|number'` One line to do it
✅ **With restraints** - `'types:string:3-10|number:0-100'`
✅ **Custom extensions** - Supports reusable type registration
✅ **Multi-language** - full i18n support

---

## quick start

### Basic usage

```javascript
import { s, validate } from 'schema-dsl/pure';

//Define union type
const schema = s({
  value: 'types:string|number'
});

// verify
validate(schema, { value: 'hello' }); // ✅ Passed
validate(schema, { value: 123 }); // ✅ Passed
validate(schema, { value: true }); // ❌ failed
```

### With constraints

```javascript
const schema = s({
  value: 'types:string:3-10|number:0-100!'
});

validate(schema, { value: 'abc' }); // ✅ Passed
validate(schema, { value: 50 }); // ✅ Passed
validate(schema, { value: 'ab' }); // ❌ too short
validate(schema, { value: 101 }); // ❌ out of range
```

---

## Grammar instructions

### basic format

```text
types:type1|type2|type3[!]
```

- `types:` - ​​fixed prefix
- `type1|type2` - ​​list of types, separated by `|`
- `!` - ​​optional required tag

### constrained format

```text
types:type1:constraint1|type2:constraint2
```

---

## Supported types

### built-in types

All built-in types are available in `types:`:

- **Basic types**: `string`, `number`, `integer`, `boolean`, `null`, `any`
- **Format type**: `email`, `url`, `uuid`, `date`, `datetime`, `time`
- **Special types**: `phone`, `idCard`, `objectId`, `hexColor`, etc.

### Plug-in custom type

Custom types registered via plugins can also be used:

```javascript
import { DslBuilder, PluginManager } from 'schema-dsl/pure';

//Register custom type
DslBuilder.registerType('order-id', {
  type: 'string',
  pattern: /^ORD[0-9]{12}$/.source,
  minLength: 15,
  maxLength: 15
});

// used in types:
const schema = s({
  identifier: 'types:uuid|order-id'
});
```

---

## Practical application scenarios

### Scenario 1: User registration (email or mobile phone number)

```javascript
const registerSchema = s({
  username: 'string:3-20!',
  password: 'string:8-20!',
  contact: 'types:email|phone!' // Email or mobile phone number
});
```

### Scenario 2: Flexible price input

```javascript
const productSchema = s({
  price: 'types:number:0-|string:1-20' // Numeric price or "negotiable"
});

validate(productSchema, { price: 99.99 }); // ✅ Number
validate(productSchema, { price: 'Negotiable' }); // ✅ String
```

### Scenario 3: Order query (order number or SKU)

```javascript
// Register the custom type first
DslBuilder.registerType('order-id', { ... });
DslBuilder.registerType('sku', { ... });

const querySchema = s({
  identifier: 'types:order-id|sku!'
});
```

---

## Plug-in Development Guide

### Register a custom type

```javascript
//In the install method of the plug-in
install(schemaDsl, options, context) {
  const { DslBuilder } = schemaDsl;

  //Register DSL type
  DslBuilder.registerType('custom-type', {
    type: 'string',
    pattern: /^CUSTOM-\d+$/.source,
    minLength: 8,
    maxLength: 20
  });

  // Register ajv format at the same time (optional)
  const validator = schemaDsl.getDefaultValidator();
  const ajv = validator.getAjv();
  ajv.addFormat('custom-type', {
    validate: /^CUSTOM-\d+$/
  });
}
```

### DslBuilder API

#### `DslBuilder.registerType(name, schema)`

Register a custom type.
**Parameters**:
- `name` (string) - type name
- `schema` (Object|Function) - JSON Schema object or generated function

#### `DslBuilder.hasType(type)`

Check if the type is registered.

#### `DslBuilder.getCustomTypes()`

Get all registered custom types.

#### `DslBuilder.unregisterType(name)`

Remove one custom type registered through `DslBuilder.registerType()` / `TypeRegistry`.

#### `DslBuilder.clearCustomTypes()`

Clear all custom types (mainly for testing).

---

## Multi-language support

### Chinese

```javascript
validate(schema, { value: true }, { locale: 'zh-CN' });
// Error: "Must match one of the following types"
```

### English

```javascript
validate(schema, { value: true }, { locale: 'en-US' });
// Error: "Must match one of the following types"
```

Supported languages: `zh-CN`, `en-US`, `es-ES`, `fr-FR`, `ja-JP`

---

## best practices

### 1. Prioritize the use of built-in types

```javascript
// ✅ Recommended
'types:email|phone'

// ⚠️ Not recommended (poor performance)
'types:string:custom-email-pattern|string:custom-phone-pattern'
```

### 2. Fair use restrictions

```javascript
// ✅ Clear constraints
'types:string:3-32|number:0-100'

// ❌ Too loose
'types:string|number' // no constraints
```

### 3. Plug-in type naming convention

```javascript
// ✅ Use kebab-case
DslBuilder.registerType('order-id', { ... });
DslBuilder.registerType('phone-cn', { ... });

// ❌ Not recommended
DslBuilder.registerType('OrderID', { ... });
DslBuilder.registerType('phone_cn', { ... });
```

---

## Things to note

### oneOf semantics

`types:` The syntax internally uses JSON Schema's `oneOf`, which means "exactly matches one of the types".

### Performance considerations

Union types verify each type in turn until a match is found. The more types, the greater the performance overhead.

**suggestion**:
- The number of union types is controlled within 5
- Put the most commonly used types first

---

## Related documents

- [Extension Overview](./extensions-overview.md)
- [Custom Extensions](./custom-extensions.md)
- [Contribution Guide](https://github.com/vextjs/schema-dsl/blob/main/CONTRIBUTING.md)

---

## Version history

- **v1.1.0** - First release of cross-type joint validation function

---

## Corresponding sample file

**Example entry**: [union-types.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/union-types.ts)
**Description**: Overrides `oneOf` generation of `types:` syntax, string/number unions, and paths for mixing built-in and custom types.
