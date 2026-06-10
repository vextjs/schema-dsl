# schema-dsl optional tag? supported

**Version**: v1.1.4+
**Updated date**: 2026-01-13

---

## 📋 Function Overview

schema-dsl now supports explicit marking of optional fields using `?`, providing clearer semantic expression.

### Supported tags

| mark | meaning | Example | Description |
|------|------|------|------|
| `!` | Required | `string!` | Field must exist |
| `?` | Optional | `string?` | Fields can be omitted (explicit expression) |
| Unmarked | Optional (default) | `string` | Fields can be omitted (default behavior) |

---

## ✅Supported syntax

### 1. Basic type +?

```javascript
const { dsl, validate } = require('schema-dsl');

const schema = dsl({
  username: 'string!', // required string
  nickname: 'string', // optional string (default)
  bio: 'string?', // Explicit optional string
  email: 'email?' // Optional email
});

// verify
validate(schema, {}); // ✅ Passed (only username is required)
validate(schema, { username: 'test' }); // ✅ Passed
validate(schema, { username: 'test', bio: 'hi' }); // ✅ Passed
validate(schema, { username: 'test', email: 'invalid' }); // ❌ failed (email format error)
```

### 2. Constrained type +?

```javascript
const schema = dsl({
  username: 'string:3-32!', // required, length 3-32
  nickname: 'string:3-32?', // optional, length 3-32 when valid
  age: 'number:18-?', // optional, if there is a value ≥ 18
  score: 'number:0-100?' // Optional, 0-100 when there is a value
});

validate(schema, { username: 'test' }); // ✅ Passed
validate(schema, { username: 'test', age: 16 }); // ❌ failed (age<18)
validate(schema, { username: 'test', age: 20 }); // ✅ Passed
```

### 3. Format type +?

```javascript
const schema = dsl({
  email: 'email?', // optional email
  url: 'url?', // optional URL
  uuid: 'uuid?', // optional UUID
  date: 'date?', // optional date
  phone: 'phone:cn?' // Optional Chinese mobile phone number
});

validate(schema, {}); // ✅ Pass (all optional)
validate(schema, { email: 'test@example.com' }); // ✅ Passed
validate(schema, { email: 'invalid' }); // ❌ failed (format error)
```

### 4. Array type +?

```javascript
const schema = dsl({
  tags: 'array<string>?', // Optional string array
  items: 'array:1-10?', // Optional array, length 1-10
  numbers: 'array<number>?' // optional array of numbers
});

validate(schema, {}); // ✅ Passed
validate(schema, { tags: ['a', 'b'] }); // ✅ Passed
validate(schema, { tags: [] }); // ✅ Pass (empty array)
```

---

## 🎯 Semantic contrast

### string vs string?

Although both behave the same (both are optional), the semantics are different:

```javascript
// Method 1: Implicitly optional (default)
const schema1 = dsl({
  nickname: 'string'
});

// Method 2: Explicitly optional (recommended)
const schema2 = dsl({
  nickname: 'string?'
});
```

**Recommended scenarios for using `?`**:
- Need to make it clear "This field is intentionally designed to be optional"
- Improve code readability when comparing with other required fields
- Team specs require optional fields to be explicitly marked

**Example**:

```javascript
// ❌ Unclear: Which ones are intentionally optional? Which required marks are missing?
const schema = dsl({
  username: 'string!',
  nickname: 'string',
  bio: 'string',
  email: 'email!'
});

// ✅ Clarity: Clearly express design intent
const schema = dsl({
  username: 'string!', // required
  nickname: 'string?', // optional
  bio: 'string?', // optional
  email: 'email!' // required
});
```

---

## ⚠️ Notes

### 1.? in enumeration type?

Special attention is required when `?` appears in an enumeration value:

```javascript
// ❌ Error:? will be treated as part of the enumeration value
const schema1 = dsl({
  status: 'active|inactive?'
});
// Parsed as: enum ['active', 'inactive?']
// 'inactive' will fail validation!

// ✅ Correct: enums are optional by default
const schema2 = dsl({
  status: 'active|inactive'
});

// ✅ Correct: Use when enumeration is required!
const schema3 = dsl({
  status: 'active|inactive!'
});
```

### 2. Priority rules

When `!` and `?` are present at the same time (although not recommended), `!` takes precedence:

```javascript
// ⚠️ Not recommended: use both! and?
const schema = dsl({
  field: 'string!?' //! takes precedence, the field is required
});
```

### 3. Optional object fields

```javascript
// The object itself is optional, internal fields are required
const schema1 = dsl({
  user: {
    name: 'string!', // When user exists, name is required
    email: 'email!' // When user exists, email is required
  }
});

// The object itself is optional (explicit), internal fields are required
const schema2 = dsl({
  'user?': { // Explicitly optional
    name: 'string!',
    email: 'email!'
  }
});

// The object itself is required, internal fields are optional
const schema3 = dsl({
  'user!': { // Object required
    name: 'string?', // optional
    email: 'email?' // optional
  }
});
```

---

## 📊 Actual test results

### test statistics

- ✅ **string?** - Supported
- ✅ **string:3-32?** - Support
- ✅ **email?** - Support
- ✅ **number:18-?** - Support
- ✅ **array<string>?** - Supported
- ✅ **Relevant unit tests have been covered**

### test code

```javascript
const { dsl, validate } = require('schema-dsl');

//Test 1: string?
const schema1 = dsl({ name: 'string?' });
console.log(validate(schema1, {}).valid);              // true
console.log(validate(schema1, { name: 'test' }).valid); // true

//Test 2: email?
const schema2 = dsl({ email: 'email?' });
console.log(validate(schema2, {}).valid);                        // true
console.log(validate(schema2, { email: 'test@ex.com' }).valid); // true
console.log(validate(schema2, { email: 'invalid' }).valid);     // false ✅

//Test 3: string:3-32?
const schema3 = dsl({ username: 'string:3-32?' });
console.log(validate(schema3, {}).valid);                   // true
console.log(validate(schema3, { username: 'ab' }).valid);   // false ✅
console.log(validate(schema3, { username: 'test' }).valid); // true
```

---

## 🔧 Implementation details

### DslParser / DslBuilder markup processing

```javascript
// DslParser.parseString()
if (s.endsWith('!')) {
  required = true;
  s = s.slice(0, -1);
} else if (s.endsWith('?')) {
  s = s.slice(0, -1);
}

// DslBuilder constructor (compatible with chain entry)
this._required = s.endsWith('!');
this._optional = s.endsWith('?') && !this._required;
if (this._required || this._optional) s = s.slice(0, -1);
}
```

The current version will uniformly strip the trailing `!` / `?` in `DslParser.parseString()`, while the `DslBuilder` constructor retains the same compatibility processing, so both the string DSL and the chain builder can recognize the optional tag.

---

## 📝 Best Practices

### Recommended usage

```javascript
const { dsl } = require('schema-dsl');

// ✅ Recommended: Mark all fields explicitly
const schema = dsl({
  // Required fields - use!
  username: 'string:3-32!',
  password: 'string:8-!',
  email: 'email!',

  // Optional fields - use?
  nickname: 'string:3-32?',
  bio: 'string:500?',
  avatar: 'url?',
  phone: 'phone:cn?',

  //Object fields
  'profile!': { // Object required
    age: 'number:18-?', // Age is optional
    gender: 'male|female|other?', // Gender is optional
  }
});
```

### code review checklist

During a code review, check for the following things:

- [ ] All required fields are marked with `!`
- [ ] Optional fields determine whether to use `?` according to team specifications
- [ ] There is no error in using `?` in an enumeration type (like `active|inactive?`)
- [ ] Optional fields of complex constraints are used correctly (such as `string:3-32?`)

---

## 🔄 Version compatibility

- **v1.1.3 and before**: `?` is ignored, but does not affect functionality (because it is optional by default)
- **v1.1.4+**: `?` is processed explicitly, the semantics are clearer

**Backwards Compatible**: ✅ Fully compatible, no modifications required to all existing code

---

## 📚 Related documents

- [Complete Guide to DSL Syntax](./dsl-syntax.md)
- [Type reference](./type-reference.md)
- [Cross-type joint validation](./union-types.md)

---

**Last updated**: 2026-01-13
**Author**: schema-dsl Team

---

## Corresponding sample file

**Example entry**: [optional-marker-guide.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/optional-marker-guide.ts)
**Description**: Cover the basic fields, object fields and default optional enumeration scenarios of `!` / `?` to directly display the success/failure path.
