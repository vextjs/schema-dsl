# Enum function documentation

## 📖 Overview

The Enum feature allows you to define fields that can only take on a specific set of values. schema-dsl supports multiple enumeration types and syntax formats.

---

## ✨ Core Features

- ✅ **String Enumeration** - Limit the range of string values
- ✅ **Boolean Enumeration** - true/false Boolean values
- ✅ **Number Enumeration** - Numeric Value Limitation
- ✅ **Integer Enumeration** - Integer value limitation (no decimals allowed)
- ✅ **Decimal Enumeration** - supports decimal values
- ✅ **Automatic Type Recognition** - Intelligent recognition of enumeration types
- ✅ **Multiple syntax** - short and full form
- ✅ **Required Support** - Enum fields can be marked as required
- ✅ **Chained API** - supports.label() and.messages()

---

## 📝 Grammar format

### basic grammar

```javascript
// Abbreviated form (automatically recognizes type)
'value1|value2|value3'

// Full form (explicitly specify the type)
'enum:value1|value2|value3' // String enumeration
'enum:type:value1|value2|value3' // Enumeration of specified type

//Required tag
'value1|value2!'
'enum:type:value1|value2!'
```

### Supported enumeration types

| type | grammar | Example |
|------|------|------|
| string | `'value1\|value2'` | `'active\|inactive'` |
| string (explicit) | `'enum:value1\|value2'` | `'enum:admin\|user'` |
| Boolean (auto) | `'true\|false'` | `'true\|false'` |
| boolean (explicit) | `'enum:boolean:true\|false'` | `'enum:boolean:true\|false'` |
| Digital (auto) | `'1\|2\|3'` | `'1\|2\|3'` |
| Number (explicit) | `'enum:number:1\|2\|3'` | `'enum:number:1\|2\|3'` |
| integer | `'enum:integer:1\|2\|3'` | `'enum:integer:1\|2\|3'` |
| decimal | `'1.0\|1.5\|2.0'` | `'1.0\|1.5\|2.0'` |

---

## 🚀 Quick start

### 1. String enumeration

```javascript
import { s, validate } from 'schema-dsl/pure';

// short form
const schema = s({
  status: 'active|inactive|pending'
});

// verify
validate(schema, { status: 'active' }); // ✅ Passed
validate(schema, { status: 'unknown' }); // ❌ failed
```

### 2. Boolean enumeration

```javascript
// Automatically recognized as a Boolean value
const schema = s({
  isPublic: 'true|false',
  validated: 'true|false!' // required
});

// verify
validate(schema, { isPublic: true, validated: false }); // ✅ Passed
validate(schema, { isPublic: 'true' }); // ❌ failed (string)
```

### 3. Number enumeration

```javascript
// Automatically recognized as a number
const schema = s({
  priority: '1|2|3',
  rating: '1.0|1.5|2.0|2.5' // Decimal
});

// verify
validate(schema, { priority: 1, rating: 2.0 }); // ✅ Passed
validate(schema, { priority: '1' }); // ❌ failed (string)
```

---

## 📚 Detailed usage

### Required enumeration

```javascript
const schema = s({
  // String enum required
  role: 'admin|user|guest!',

  // Boolean enumeration required
  agreeTerms: 'true|false!',

  // Required for digital enumeration
  level: '1|2|3!'
});

// Required fields are missing
validate(schema, {}); // ❌ failed
```

### Explicitly specify the type

```javascript
const schema = s({
  //Explicitly specify the string
  status: 'enum:active|inactive',

  //Explicitly specify the boolean value
  flag: 'enum:boolean:true|false',

  //Explicitly specify the number
  priority: 'enum:number:1|2|3',

  // Explicitly specify integers (decimals are prohibited)
  level: 'enum:integer:1|2|3'
});
```

### Chained API

```javascript
const schema = s({
  status: s('active|inactive|archived')
    .label('article status')
    .messages({
      'string.enum': 'Status must be: draft, published or archived'
    })
});
```

### enum in array

```javascript
const schema = s({
  tags: 'array<enum:tech|business|lifestyle>',
  permissions: 'array<enum:read|write|delete>'
});

validate(schema, {
  tags: ['tech', 'business'],
  permissions: ['read', 'write']
}); // ✅ Pass
```

### Enums in nested objects

```javascript
const schema = s({
  user: {
    name: 'string!',
    role: 'admin|user|guest',
    status: 'active|inactive'
  },
  settings: {
    theme: 'light|dark|auto',
    language: 'en|zh-CN|ja'
  }
});
```

---

## 🎯 Practical application scenarios

### User management system

```javascript
const userSchema = s({
  username: 'string:3-32!',
  email: 'email!',
  role: 'admin|moderator|user|guest!',
  status: 'active|inactive|suspended|banned',
  emailVerified: 'true|false',
  permissionLevel: s('0|1|2|3|4|5').default(0),
  preferences: {
    theme: 'light|dark|auto',
    language: 'en|zh-CN|zh-TW|ja|ko',
    notifications: 'all|mentions|none'
  }
});
```

### Order management

```javascript
const orderSchema = s({
  orderId: 'string!',
  status: 'pending|processing|completed|cancelled!',
  priority: s('1|2|3').default(2),
  payment: {
    method: 'card|paypal|crypto!',
    status: 'pending|success|failed!'
  }
});
```

### Content management

```javascript
const postSchema = s({
  title: 'string:5-100!',
  status: 'draft|published|archived!',
  visibility: 'public|private|unlisted',
  category: 'tech|business|lifestyle|education'
});
```

---

## ⚙️ Advanced features

### default value

```javascript
const schema = s({
  theme: s('light|dark|auto').default('auto'),
  language: s('en|zh-CN').default('en')
});
```

### Custom error message

#### Use the 'enum' key uniformly (recommended)✅

All enumeration types use `'enum'` to define error messages, which is the simplest and most direct:

```javascript
// String enumeration
const schema = s({
  status: s('active|inactive|pending').messages({
    'enum': 'Status must be: activated, inactive or pending'
  })
});

//Boolean enumeration
const schema = s({
  isActive: s('true|false').messages({
    'enum': 'Must be true or false'
  })
});

//Number enumeration
const schema = s({
  priority: s('1|2|3').messages({
    'enum': 'Priority must be 1, 2 or 3'
  })
});

//Integer enumeration
const schema = s({
  level: s('enum:integer:1|2|3').messages({
    'enum': 'Level must be 1, 2 or 3'
  })
});
```
**Description**:
- ✅ All enumeration types use the `'enum'` key uniformly
- ✅ Simple and easy to understand, no need to remember different types of key names
- ✅ Automatically infer the type, users only care about the error message content

#### Advanced usage: Customize messages by type (optional)

If you need to customize different error messages for different types of enumerations, you can use the `type.enum` format:

```javascript
const schema = s({
  status: s('active|inactive').messages({
    'string.enum': 'String enumeration error' // Special for string enumeration
  }),
  priority: s('1|2|3').messages({
    'number.enum': 'Number enumeration error' //Special for number enumeration
  }),
  flag: s('true|false').messages({
    'boolean.enum': 'Boolean enumeration error' //Special for Boolean enumeration
  })
});
```

**Priority**: `type.enum` > `enum` > Global default

**Suggestion**: In 99% of scenarios, it is enough to use `'enum'` directly ✅

### Multi-language support

```javascript
s.config({
  i18n: {
    'zh-CN': {
      'field.status': 'status',
      'enum.status': 'Status must be: activated, inactive or pending'
    }
  }
});

const schema = s({
  status: s('active|inactive|pending').label('field.status')
});
```

---

## 🔍 Type identification rules

### Automatic recognition logic

```javascript
// 1. All values are 'true' or 'false' → boolean enumeration
'true|false'  → { type: 'boolean', enum: [true, false] }

// 2. All values are numbers → numeric enumeration
'1|2|3'  → { type: 'number', enum: [1, 2, 3] }

// 3. Contains decimals → numeric enumeration
'1.0|1.5|2.0'  → { type: 'number', enum: [1.0, 1.5, 2.0] }

// 4. Other cases → string enumeration
'active|inactive'  → { type: 'string', enum: ['active', 'inactive'] }
```

### Explicitly specify the type

```javascript
// Force string type (even if the value looks like a number)
'enum:string:1|2|3'  → { type: 'string', enum: ['1', '2', '3'] }

// Force boolean type
'enum:boolean:true|false'  → { type: 'boolean', enum: [true, false] }

// Force numeric type
'enum:number:1|2|3'  → { type: 'number', enum: [1, 2, 3] }

// Force integer type (decimals are prohibited)
'enum:integer:1|2|3'  → { type: 'integer', enum: [1, 2, 3] }
```

---

## ❌ Error handling

### Invalid enumeration value

```javascript
// Boolean enum only accepts 'true' and 'false'
try {
  s({ flag: 'enum:boolean:true|false|maybe' });
} catch (error) {
  // Error: Invalid boolean enum value: maybe
}

//Number enum only accepts numbers
try {
  s({ value: 'enum:number:1|2|abc' });
} catch (error) {
  // Error: Invalid number enum value: abc
}
```

### type mismatch

Enumerations are type-validated automatically:

```javascript
const schema = s({ priority: '1|2|3' });

// Error: passed in string
validate(schema, { priority: '1' });
// ❌ Failure: priority must be of numeric type (automatic type checking)

// Error: Passed in number out of range
validate(schema, { priority: 999 });
// ❌ Failure: priority must be one of the following values: 1, 2, 3 (enumeration check)
```
**Description**:
- Type errors are automatically validated by the schema (such as passing a string to a numeric enumeration)
- Enumeration range errors use `'enum'` error message

---

## 📊 Performance

Excellent enumeration validation performance:

```javascript
const schema = s({
  status: 'active|inactive|pending',
  priority: '1|2|3',
  flag: 'true|false'
});

//Performance test: 10,000 verifications
// Average verifications per second: 270,000+ times
```

---

## 🔄 Compatibility

### Compatible with older versions

```javascript
// v1.0.x syntax (still supported)
'value1|value2|value3'

// v1.1.0 new syntax
'enum:value1|value2|value3'
'enum:type:value1|value2|value3'
```

### Does not affect other types

```javascript
// Other types with colon are not affected
const schema = s({
  username: 'string:3-32', // ✅ working normally
  age: 'number:18-120', // ✅ working normally
  phone: 'phone:cn', // ✅ working normally
  status: 'active|inactive' // ✅ The enumeration is working properly
});
```

---

## 📖 Related documents

- [Basic usage](https://github.com/vextjs/schema-dsl/blob/main/README.md)
- [Validation Rules](./validation-guide.md)
- [API Reference](./api-reference.md)
- [Sample code](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/enum.ts)

---

## Corresponding sample file

**Example entry**: [enum.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/enum.ts)
**Description**: Overrides the success/failure path for string, number, boolean, and array element enumerations and displays a custom enumeration error message.
