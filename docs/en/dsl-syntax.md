# A complete guide to DSL syntax

> **Update time**: 2026-06-18

---

This page is the main reference for writing schema rules. Read it after [Quick Start](quick-start.md), then use [Type Reference](type-reference.md) and [Validation Guide](validation-guide.md) for deeper behavior.

## quick start

```javascript
import { s } from 'schema-dsl/pure';

//Basic type
const schema = s({
  name: 'string!', // required string
  age: 'number', // optional number
  email: 'email!', // required email
  active: 'boolean', // Boolean value
  tags: 'array<string>' // String array
});

// Factory entry for stronger method discovery:
const emailField = s.email().label('Email').require();
```

---

## Complete list of types

### basic type

| type | DSL | Description |
|------|-----|------|
| string | `string` | text type |
| number | `number` | floating point number |
| integer | `integer` | integer |
| Boolean | `boolean` | true/false |
| object | `object` | Nested objects |
| array | `array` | array type |
| null value | `null` | null value |
| arbitrary | `any` | any type |

### format type

| type | DSL | Description |
|------|-----|------|
| Mail | `email` | Email address |
| URL | `url` | URL |
| URI | `uri` | URI address |
| UUID | `uuid` | UUID format |
| date | `date` | YYYY-MM-DD |
| date time | `datetime` | ISO 8601 |
| time | `time` | HH:mm:ss |
| hostname | `hostname` | hostname |
| IP（IPv4 / IPv6） | `ip` | Automatically accept IPv4 or IPv6 |
| IPv4 | `ipv4` | IPv4 address |
| IPv6 | `ipv6` | IPv6 address |
| binary | `binary` | Base64 encoding |

### special type

| type | DSL | Description |
|------|-----|------|
| ObjectId | `objectId` | MongoDB ObjectId |
| Hexadecimal color | `hexColor` | CSS hex color |
| MAC address | `macAddress` | MAC address |
| Cron expression | `cron` | Standard cron expressions |
| URL Slug | `slug` | URL-friendly logo composed of lowercase letters/numbers/dash lines |
| Chinese name | `chineseName` | 2 to 10 Chinese characters |
| Pure Chinese text | `chinese` | Only Chinese characters allowed |
| Email domain name validation | `emailDomain` | Domain name constraint type based on email format |
| Alphanumeric | `alphanum` | Letters and numbers only |
| All lowercase string | `lower` | Automatically constrain to lowercase strings |
| all caps string | `upper` | Automatically constrain to uppercase strings |
| JSON string | `json` | The content must be a legal JSON string |
| port number | `port` | integer port number |


---

## basic grammar

### 1. Type definition

```javascript
//Basic type
'string' // string
'number' // number
'integer' // integer
'boolean' // boolean

// format type
'email' // Email
'url'         // URL
'date' // date
'uuid'        // UUID
```

### 2. Required and optional marks

Use `!` to mark required fields and `?` to explicitly mark optional fields:

```javascript
const schema = s({
  username: 'string!', // required
  nickname: 'string', // optional (default)
  bio: 'string?', // Explicitly optional (equivalent to string)
  email: 'email?' // Optional email
});
```
**Description**:
- `!` - ​​required tag, field must exist
- `?` - ​​optional tag, field can be omitted (explicit expression)
- Unmarked - optional by default (field can be omitted)

**recommend**:
- Clearly mark required fields using `!`
- Use `?` to enhance code readability when you need to explicitly express "optional"

### 3. Object required

Two methods are supported:

```javascript
// Method 1: Required inside the field
const schema1 = s({
  user: {
    name: 'string!', // name is required (user is optional)
    email: 'email!' // email is required
  }
});

// Method 2: The object itself is required ✅ Recommended
const schema2 = s({
  'user!': { // user itself is required
    name: 'string', // name optional
    email: 'email' // email optional
  }
});
```

---

## constraint syntax

### 1. String length

```javascript
'string:10' // Exact length 10 (exactLength: minLength=10, maxLength=10)
'string:-10' // Maximum length 10
'string:3-32' // length range 3-32
'string:10-' // Minimum length 10 (no maximum limit)
```

**Example**:
```javascript
const schema = s({
  username: 'string:3-32!', // 3-32 characters, required
  bio: 'string:500', // Maximum 500 characters
  password: 'string:8-' // minimum 8 characters
});
```

### 2. Numeric range

```javascript
'number:100' // Maximum value 100
'number:0-100' // Range 0-100
'number:18-' // minimum value 18
```

**Example**:
```javascript
const schema = s({
  age: 'number:18-120',         // 18-120
  score: 'number:100',          // 0-100
  price: 'number:0-'            // ≥0
});
```

### 3. Enumeration values

Use `|` to separate enumeration values:

```javascript
const schema = s({
  status: 'active|inactive|pending',
  gender: 'male|female|other!',
  role: 'admin|user|guest'
});
```

### 4. `types:` Union type

When a field needs to accept multiple different types, you can use the `types:` prefix to generate a union type:

```javascript
const schema = s({
  contact: 'types:email|phone',
  price: 'types:number:0-|string:1-20',
  payload: 'types:object|array<object>'
});
```

This syntax will be compiled into the `oneOf` structure, which is suitable for scenarios where "any one of the types is satisfied".

**Applicable scenarios**:
- Contact information allows email or mobile phone number
- Price fields allow numeric values ​​or description strings
- Compatible with multiple input formats for the same field in the history interface

### 5. Special constraints

Support format-specific constraints:

```javascript
'phone:cn' // China mobile phone number
'idCard:cn' // Chinese ID card
'creditCard:visa' // Visa credit card
'licensePlate:cn' // Chinese license plate
'postalCode:cn' // China postal code
'passport:cn' // Chinese passport
```

**Example**:
```javascript
const schema = s({
  mobile: 'phone:cn!',
  id: 'idCard:cn',
  card: 'creditCard:mastercard'
});
```

---

## Array syntax

### 1. Basic array

```javascript
'array' // Array of any type
'array<string>' // string array
'array<number>' // array of numbers
'array<integer>' // integer array
```

### 2. Array length constraints

```javascript
'array:1-10' // 1-10 elements
'array!1-10' // 1-10 elements, required
'array:1-' // at least 1 element
'array:-10' // up to 10 elements
'array:1-10<string>' // 1-10 string elements
```

**Example**:
```javascript
const schema = s({
  tags: 'array!1-10<string>', // required, 1-10 strings
  scores: 'array:1-5<number>', // optional, 1-5 numbers
  items: 'array:1-<string>' // at least 1 string
});
```

### 3. Array element constraints

```javascript
const schema = s({
  tags: 'array<string:1-20>', // 1-20 characters per string
  scores: 'array<number:0-100>', // each number 0-100
  ids: 'array<integer:1->' // Each integer ≥ 1
});
```

### 4. Nested arrays

```javascript
// two-dimensional array
const schema = s({
  matrix: 'array<array<number>>'
});

// array of objects
const schema = s({
  users: 'array<object>',
  // or more detailed definition
  items: {
    type: 'array',
    items: {
      name: 'string!',
      age: 'number'
    }
  }
});
```

---

## object syntax

### 1. Basic objects

```javascript
const schema = s({
  user: {
    name: 'string!',
    email: 'email!',
    age: 'number'
  }
});
```

### 2. Nested objects

```javascript
const schema = s({
  user: {
    profile: {
      bio: 'string:500',
      social: {
        twitter: 'url',
        github: 'url'
      }
    }
  }
});
```

### 3. Mixed nesting

```javascript
const schema = s({
  'user!': { // user required
    name: 'string!', // name is required
    contacts: 'array!1-5<object>', // 1-5 contact information
    tags: 'array<string:1-20>' // String array
  }
});
```

---

## Conditional validation (Match)

Supports more elegant conditional validation syntax `s.match` and `s.if`.

### 1. s.match (recommended)

Similar to `switch-case`, the validation rules for the current field are determined based on the value of a certain field.

**grammar**:
```javascript
s.match(field, {
  value1: 'schema1',
  value2: 'schema2',
  _default: 'defaultSchema' // optional
})
```

**Example**:
```javascript
const schema = s({
  contactType: 'email|phone',

  //Determine the rules for contact based on the value of contactType
  contact: s.match('contactType', {
    email: 'email!', // when contactType=email
    phone: 'string:11!', // when contactType=phone
    _default: 'string' // other situations
  })
});
```

**Handling non-English values**:
If the condition value contains Chinese, numbers or special characters, just add quotes to the key name:

```javascript
discount: s.match('level', {
  'Normal user': 'number:0-5',
  'VIP-1':   'number:0-20',
  '100':     'number:0-50'
})
```

### 2. s.if (simple condition)

Suitable for simple two-choice scenarios.

**grammar**:
```javascript
s.if(conditionField, thenSchema, elseSchema)
```

**Example**:
```javascript
const schema = s({
  isVip: 'boolean',

  // If it is VIP, discount 0-50, otherwise 0-10
  discount: s.if('isVip', 'number:0-50', 'number:0-10')
});
```

---

## Advanced usage

### 1. Chain call

> ⚠️ `.custom()` supports synchronous custom logic; the asynchronous custom validator that returns `Promise` should be executed through `validateAsync()`.

```javascript
const schema = s({
  username: s('string:3-32!').pattern(/^[a-zA-Z0-9_]+$/)
    .label('username')
    .messages({
      'pattern': 'can only contain letters, numbers and underscores'
    }),

  email: s('email!').label('email address')
    .description('Used to log in and receive notifications')
    .custom((value) => {
      if (value.endsWith('@blocked.example')) return 'This email domain name is not allowed to be registered';
    })
});
```

### 2. Default validator

```javascript
const schema = s({
  username: s('string!').username('5-20'), // Automatic regularization + length
  phone: s('string!').phone('cn'), // China mobile phone number
  password: s('string!').password('strong') // Strong password
});
```

---

<a id="comparison-of-implementation-plans"></a>

## Things to note

### 1. Condition validation

⚠️ **Note**: DSL strings do not support direct writing of conditional logic

```javascript
'string | number' // ❌ not supported
```

**Solution**: Use `s.match` (recommended)

```javascript
// ✅ Recommendation: use s.match
const schema = s({
  vipLevel: 'string',
  discount: s.match('vipLevel', {
    gold:   'number:0-50',
    silver: 'number:0-20',
    normal: 'number:0-5'
  })
});
```

---

### 2. Array constraints

✅ **Recommended**: Use concise DSL syntax
```javascript
'array!1-10<string:1-20>' // 1-10 elements, 1-20 characters each
```

⚠️ **Also**: Use the complete JSON Schema format (not recommended, too cumbersome)
```javascript
{
  type: 'array',
  items: { type: 'string' },
  minItems: 1,
  maxItems: 10
}
```

---

### 3. Regularity validation

⚠️ **Note**: DSL strings do not support writing regular rules directly

```javascript
'string:/^[a-z]+$/' // ❌ Not supported
```

**Solution**: Use `.pattern()` method
```javascript
s('string!').pattern(/^[a-z]+$/) // ✅ Recommended
```

---

### 4. Custom validation

⚠️ **Note**: DSL strings do not support custom logic

```javascript
'string!@custom' // ❌ Not supported
```

**Solution**: Use `.custom()` method to carry custom logic; synchronization logic can be used `validate()` / `validateAsync()`, Promise-returning logic must use `validateAsync()`
```javascript
s('string!').custom((value) => {
  // Custom synchronization logic
  if (value === 'reserved') {
    return 'The value is not available';
  }
})
```

Asynchronous validation (such as database duplication checking) can be placed in Promise-returning `.custom()` and executed through `validateAsync()`; it can also be executed separately in the business layer after the structure validation passes.

---

### 5. Detailed definition of object array

⚠️ **Note**: DSL abbreviation does not support detailed definition of object arrays

```javascript
'array<object{name:string,age:number}>' // ❌ Not supported
```

**Solution**: Use full object definition
```javascript
const schema = s({
  users: {
    type: 'array',
    items: {
      name: 'string!',
      age: 'number:18-'
    }
  }
});
```

---

## Complete example

### User registration form

```javascript
import { s } from 'schema-dsl/pure';

const schema = s({
  //Basic information
  username: s('string:3-32!').username().label('username'),
  password: s('string!').password('strong').label('password'),
  email: s('email!').label('mailbox'),
  phone: s('string!').phone('cn').label('mobile number'),

  // personal data
  'profile!': {
    realName: 'string:2-50',
    gender: 'male|female|other',
    birthday: 'date',
    bio: 'string:500'
  },

  //Address information
  addresses: 'array:1-5<object>', // 1-5 addresses

  // Label
  tags: 'array:1-10<string:1-20>', // 1-10 tags, each 1-20 characters

  // Agree to the terms
  agree: 'boolean!'
});
```

### E-commerce product Schema

```javascript
const schema = s({
  // Basic product information
  title: 'string:1-100!',
  price: 'number:0-!',
  stock: 'integer:0-',
  status: 'on_sale|off_sale|sold_out!',

  // product details
  'details!': {
    description: 'string:10000',
    images: 'array!1-10<url>',
    specs: 'array<object>',
    tags: 'array:1-20<string:1-30>'
  },

  // SKU information
  skus: {
    type: 'array',
    minItems: 1,
    items: {
      sku_code: 'string!',
      price: 'number!',
      stock: 'integer!'
    }
  }
});
```

### API request validation

```javascript
const schema = s({
  // Query parameters
  page: 'integer:1-',
  pageSize: 'integer:10-100',
  keyword: 'string:1-50',

  // filter conditions
  filters: {
    category: 'array<string>',
    priceRange: {
      min: 'number:0-',
      max: 'number:0-'
    },
    status: 'active|inactive'
  },

  // sort
  sort: {
    field: 'price|created_at|sales',
    order: 'asc|desc'
  }
});
```

---

## FAQ

### Q1: Why was the abbreviation function removed?

**A**: To reduce learning costs and reduce ambiguity. Using the full type name is more clear, especially for newbies.

### Q2: How to write array length constraints?

**A**: Support writing directly in DSL:
```javascript
'array!1-10<string>' // Recommended
```

### Q3: How to define an object array?

**A**: Use full object definition:
```javascript
const schema = s({
  users: {
    type: 'array',
    items: {
      name: 'string!',
      email: 'email!'
    }
  }
});
```

### Q4: Doesn’t it support conditional validation?

**A**: Supported. It is recommended to use `s.match`:
```javascript
s.match('vipLevel', { gold: 'number:0-50', silver: 'number:0-20' })
```

### Q5: Can I use regular validation?

**A**: Yes, use `.pattern()` method:
```javascript
s('string!').pattern(/^[a-z]+$/)
```

---

## Related documents

- [Type Reference](./type-reference.md) - Complete list of types
- [String extension](./string-extensions.md) - chain call
- [Quick Start](./quick-start.md) - Get started in 5 minutes

---

## Corresponding sample file

**Example entry**: [dsl-syntax.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/dsl-syntax.ts)
**Description**: Covers the basic types, constraints, enumerations, arrays and nested object writing methods of DSL syntax in Batch 1, and can be run directly for reference.

---

**Last updated**: 2026-05-08
**Author**: schema-dsl Team
