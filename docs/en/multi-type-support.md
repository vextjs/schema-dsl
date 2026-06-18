# Multi-type support design instructions

---

## 📖 Quick navigation

- **Single Type Validation** (this document)
- **[Union type validation](./union-types.md)** - Use `types:` syntax to do true cross-type joint validation

---

## 🎯 Design principles

schema-dsl implements multi-type support through the type-independent Builder mode.

### core design

```javascript
// DslBuilder type independent
// All types use the same Builder, the difference lies in the parsing stage

class DslBuilder {
  constructor(dslString) {
    // Parse the DSL string and extract type information
    this._baseSchema = this._parseSimple(dslString);
    //Type information is stored in _baseSchema.type
  }
}
```

---


## 📊 Type support matrix

| DSL string | parsing type | Supported methods |
|----------|---------|-----------|
| `'string'` | string | pattern, min, max, label, messages |
| `'number'` | number | min, max, integer, label, messages |
| `'email'` | string+format | pattern, label, messages |
| `'url'` | string+format | pattern, label, messages |
| `'boolean'` | boolean | label, messages |
| `'date'` | string+format | min, max, label, messages |

---

## 🔧 Implementation mechanism

### 1. Type analysis (DslBuilder constructor)

```javascript
_parseSimple(dslString) {
  //Extract base type
  if (dslString.startsWith('string')) {
    return { type: 'string', ...parseConstraints(dslString) };
  }
  if (dslString.startsWith('number')) {
    return { type: 'number', ...parseConstraints(dslString) };
  }
  if (dslString === 'email') {
    return { type: 'string', format: 'email' };
  }
  //... more types
}
```

### 2. Method adaptation (method internal check type)

```javascript
pattern(regex, message) {
  // Only string types support pattern
  if (this._baseSchema.type === 'string') {
    this._baseSchema.pattern = regex.source || regex;
    if (message) {
      this._customMessages['pattern'] = message;
    }
  } else {
    console.warn('pattern() only works for string types');
  }
  return this;
}
```

---

## 💡 String extended multi-type support

The String extension only supports string types, which is a design decision:

```javascript
// ✅ Correct: String type uses String extension
email: s('email!').pattern(/custom/).label('email')
username: s('string:3-32!').pattern(/^\w+$/).label('username')

// ❌ Not applicable: numeric types should not use String extension
age: s('number:18-120').label('age') // ✅ label can be used
age: s('number:18-120').pattern(/\d/) // ⚠️ will be ignored (numbers do not support pattern)
```

### Why is it designed this way?

1. **Type Safety**: Avoid calling string methods on numeric types
2. **Clear semantics**: `'number:18-120'` itself expresses constraints
3. **Simplicity first**: 80% of complex verifications are strings, focus on optimizing string experience

---

## 🎨 Recommended usage of various types

### String type (supports chaining)

```javascript
const schema = s({
  // ✨ Simple fields: pure DSL
  name: 'string:1-50!',

  // ✨ Complex fields: String extended chaining
  email: s('email!').pattern(/custom/)
    .messages({ 'format': 'The email format is incorrect' })
    .label('email address'),

  username: s('string:3-32!').pattern(/^[a-zA-Z0-9_]+$/)
    .messages({ 'pattern': 'Can only contain letters, numbers, and underscores' })
    .label('username')
});
```

### Numeric type (pure DSL)

```javascript
const schema = s({
  // Concise constraint expression
  age: 'number:18-120', // range
  price: 'number:0-999999!', // required + range
  count: 'integer:1-100', // integer

  // When label is required
  score: s('number:0-100').label('score'),

  // ⚠️ Numeric types rarely require complex validation, if necessary, custom can be used
  amount: s('number:0-10000').custom(value => value % 100 === 0) // Must be a multiple of 100
    .label('amount')
});
```

### Boolean type (pure DSL)

```javascript
const schema = s({
  // Boolean type is very simple
  isActive: 'boolean',
  agreeTerms: 'boolean!',

  // When label is required
  emailNotification: s('boolean').label('Email Notification')
});
```

### Date type (pure DSL)

```javascript
const schema = s({
  //Date constraints
  birthday: 'date',
  createdAt: 'date!',

  // Need to verify the range available custom
  appointmentDate: s('date!').custom(value => {
      const date = new Date(value);
      return date > new Date(); // must be a future date
    })
    .label('appointment date')
});
```

### Enumeration types (pure DSL)

```javascript
const schema = s({
  // Enumeration values ​​are separated by |
  status: 'active|inactive|pending',
  role: 'user|admin|moderator',

  // When label is required
  gender: s('male|female|other').label('gender')
});
```

### Array types (pure DSL)

```javascript
const schema = s({
  //Array element type
  tags: 'array<string>',
  scores: 'array<number>',

  // Array element constraints
  tags: 'array<string:1-20>', // element length 1-20

  // Use object array when complex validation is required
  items: {
    type: 'array',
    items: {
      name: 'string:1-50!',
      price: 'number:0-10000!'
    }
  }
});
```

---

## 🚀 Expand new types

The current version gives priority to extending types by exposing runtime APIs, rather than requiring business parties to modify the internal `DslAdapter` / `ErrorCodes` source code.

### Recommended entrance

```javascript
import { DslBuilder, TypeRegistry } from 'schema-dsl/pure';

TypeRegistry.register('evenNumber', {
  baseSchema: { type: 'number', multipleOf: 2 }
});

DslBuilder.registerType('phone-cn-lite', {
  type: 'string',
  pattern: '^1[3-9]\\d{9}$',
  minLength: 11,
  maxLength: 11
});
```

### Usage

```javascript
const schema = s({
  phone: 'phone-cn-lite!',
  luckyNumber: 'evenNumber'
});
```

---

## 📋 Type method compatibility matrix

| method | string | number | boolean | date | array |
|------|--------|--------|---------|------|-------|
| `.pattern()` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `.label()` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `.messages()` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `.description()` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `.custom()` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `.default()` | ✅ | ✅ | ✅ | ✅ | ✅ |

**Conditional validation**: Use `s.match()` or `s.if()` static method.
**Description**:
- ✅ Fully supported
- ❌ Not supported (will be ignored or warned)

---

## 🎯 Best Practices

### 1. Choose expression according to type

```javascript
// ✅ String: chained for complex validation
username: s('string:3-32!').pattern(/^\w+$/).label('username')

// ✅ Numbers: DSL for simple constraints
age: 'number:18-120'

// ✅ Enumeration: the simplest way to use DSL
status: 'active|inactive'
```

### 2. String extension is only used for strings

```javascript
// ✅ Correct
email: s('email!').pattern(/custom/)

// ❌ Not recommended (although no error will be reported, the pattern will be ignored)
age: s('number:18-120').pattern(/\d+/)
```

### 3. Use custom for complex validation

```javascript
// For any type, use custom for complex validation
amount: s('number:0-10000').custom(value => value % 100 === 0)
  .label('amount')
```

---

## 💡 Summary

The multi-type support of schema-dsl adopts type-independent Builder + method intelligent adaptation design:

1. **Unified Entry**: All types pass DslBuilder
2. **Type Aware**: Methods internally check type compatibility
3. **Simple first**: String extension focuses on strings (80% of complex scenarios)
4. **Progressive enhancement**: Use DSL for simple, chained for complex, and custom for special

**Design philosophy**: Make the most common scenarios (string validation) the simplest, and keep the DSL simple for other types.

---

## Corresponding sample file

**Example entry**: [multi-type-support.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/multi-type-support.ts)
**Description**: The recommended way to use an object to cover string, number, Boolean, date, array and enumeration fields at the same time, as well as the corresponding success/failure validation path.
