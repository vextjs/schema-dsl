# One field supports multiple types

> Use `.pattern()` method to match multiple formats

> ⚠️ This document describes the method of "matching multiple formats with the same string field".
> If you need true union semantics across underlying types, such as `string | number | null`, please use [types: syntax](./union-types.md) in preference.

---

## Basic usage

```javascript
const { dsl, validate } = require('schema-dsl');

// Email or mobile phone number
const schema = dsl({
  contact: dsl('string!')
    .pattern(/^([^\s@]+@[^\s@]+\.[^\s@]+|1[3-9]\d{9})$/)
    .messages({ pattern: 'Must be email or mobile phone number' })
});

validate(schema, { contact: 'test@example.com' });  // ✅
validate(schema, { contact: '13800138000' });       // ✅
validate(schema, { contact: 'invalid' });           // ❌
```
**Description**:
- Use `|` in regular expressions to represent "or", and brackets `()` to group
- Use `.messages()` to set error messages and support multiple languages

---

## Common examples

### User login (username or email)

```javascript
const loginSchema = dsl({
  username: dsl('string:3-32!')
    .pattern(/^([^\s@]+@[^\s@]+\.[^\s@]+|[a-zA-Z0-9_]+)$/)
    .messages({ pattern: 'Must be email or username' }),
  password: 'string:8-32!'
});
```

### Contact information (email or mobile phone number)

```javascript
const schema = dsl({
  contact: dsl('string!')
    .pattern(/^([^\s@]+@[^\s@]+\.[^\s@]+|1[3-9]\d{9})$/)
    .messages({ pattern: 'Must be email or mobile phone number' })
});
```

### URL (http or https)

```javascript
const schema = dsl({
  website: dsl('string!')
    .pattern(/^https?:\/\/.+$/)
    .messages({ pattern: 'Must be a URL starting with http or https' })
});
```

---

## Support multiple languages

```javascript
//Use multi-language key
const schema = dsl({
  contact: dsl('string!')
    .pattern(/^([^\s@]+@[^\s@]+\.[^\s@]+|1[3-9]\d{9})$/)
    .messages({ pattern: 'pattern.emailOrPhone' }) // Multi-language key
});

//Specify language when validating
validate(schema, { contact: 'invalid' }, { locale: 'zh-CN' }); // Chinese: must be email or mobile phone number
validate(schema, { contact: 'invalid' }, { locale: 'en-US' }); // English: Must be an email or phone number
```

**Built-in multi-language key**:
- `pattern.emailOrPhone` - ​​Email or mobile phone number
- `pattern.usernameOrEmail` - ​​username or email
- `pattern.httpOrHttps` - ​​http or https URL

---

## Regular expression quick check

```javascript
// Email or mobile phone number
/^([^\s@]+@[^\s@]+\.[^\s@]+|1[3-9]\d{9})$/

// http or https
/^https?:\/\/.+$/

// Username or email
/^([^\s@]+@[^\s@]+\.[^\s@]+|[a-zA-Z0-9_]{3,32})$/

// Numeric ID or UUID
/^(\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i

//Multiple email domain names
/^[^\s@]+@(gmail\.com|qq\.com|163\.com)$/

// Chinese or US mobile phone number
/^(1[3-9]\d{9}|\+1\d{10})$/
```

---


## Complete example

```javascript
const { dsl, validate } = require('schema-dsl');

const registerSchema = dsl({
  name: 'string:1-50!',
  contact: dsl('string!')
    .pattern(/^([^\s@]+@[^\s@]+\.[^\s@]+|1[3-9]\d{9})$/)
    .messages({ pattern: 'Must be email or mobile phone number' })
});

const testData = [
  { name: 'Zhang San', contact: 'zhangsan@example.com' },
  { name: 'Li Si', contact: '13800138000' },
  { name: 'Wang Wu', contact: 'invalid' }
];

testData.forEach((data, index) => {
  const result = validate(registerSchema, data);
  console.log(`Test ${index + 1}:`, result.valid? '✅': '❌');
  if (!result.valid) {
    console.log('Error:', result.errors[0].message);
  }
});
```

**Output**:
```text
Test 1: ✅
Test 2: ✅
Test 3: ❌
  Error: Must be email or mobile phone number
```

---

## Corresponding sample file

**Example entry**: [union-type-guide.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/union-type-guide.ts)
**Description**: Shows the "single string field matching multiple formats" solution based on `.pattern()`, and the corresponding error messages in Chinese and English.
