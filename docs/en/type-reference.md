# schema-dsl type reference

> **Updated**: 2026-05-08

---

## 📊 Supported types

### basic type

| type | schema-dsl DSL | JSON Schema | Description |
|------|----------|-------------|------|
| string | `string` | `{ type: 'string' }` | text type |
| number | `number` | `{ type: 'number' }` | floating point number |
| integer | `integer` | `{ type: 'integer' }` | integer |
| Boolean | `boolean` | `{ type: 'boolean' }` | true/false |
| object | `object` | `{ type: 'object' }` | Nested objects |
| array | `array` | `{ type: 'array' }` | array |
| null value | `null` | `{ type: 'null' }` | null value |
| arbitrary | `any` | `{}` | any type |

---

### format type (string based)

| type | schema-dsl DSL | JSON Schema format | Description |
|------|----------|-------------------|------|
| Mail | `email` | `email` | Email address |
| URL | `url` | `uri` | URL |
| URI | `uri` | `uri` | URI string |
| UUID | `uuid` | `uuid` | UUID format |
| IP（IPv4/IPv6） | `ip` | `anyOf(ipv4, ipv6)` | Dual stack IP |
| date | `date` | `date` | YYYY-MM-DD |
| date time | `datetime` | `date-time` | ISO 8601 |
| time | `time` | `time` | HH:mm:ss |
| hostname | `hostname` | `hostname` | hostname |
| IPv4 | `ipv4` | `ipv4` | IPv4 address |
| IPv6 | `ipv6` | `ipv6` | IPv6 address |

---

### special type

| type | schema-dsl DSL | JSON Schema | Description |
|------|----------|-------------|------|
| binary | `binary` | `contentEncoding: base64` | Base64 encoding |
| ObjectId | `objectId` | `pattern: ^[0-9a-fA-F]{24}$` | MongoDB ObjectId |
| HexColor | `hexColor` | `pattern: ^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$` | CSS hexadecimal color |
| MAC address | `macAddress` | `pattern: ^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$` | MAC address |
| Cron | `cron` | `pattern: ...` | Cron expression |
| Slug | `slug` | `pattern: ^[a-z0-9]+(?:-[a-z0-9]+)*$` | URL Slug |
| Chinese name | `chineseName` | `pattern: ^[\u4e00-\u9fa5]{2,10}$` | Chinese name |
| Chinese text | `chinese` | `pattern: ^[\u4e00-\u9fa5]+$` | Pure Chinese text |
| Email domain extension | `emailDomain` | `format: email` | Email + domain name extension validation |
| Alphanumeric only | `alphanum` | `alphanum: true` | Custom AJV keyword |
| lowercase string | `lower` | `lowercase: true` | Custom AJV keyword |
| uppercase string | `upper` | `uppercase: true` | Custom AJV keyword |
| JSON string | `json` | `jsonString: true` | Custom AJV keyword |
| port number | `port` | `port: true` | integer port number |

---

## 📝 Type usage examples

### basic type

```javascript
const { dsl } = require('schema-dsl');

// string
const schema1 = dsl({ name: 'string' });

// number
const schema2 = dsl({ age: 'number' });

// integer
const schema3 = dsl({ count: 'integer' });

// boolean
const schema4 = dsl({ active: 'boolean' });

// object
const schema5 = dsl({
  user: {
    name: 'string',
    age: 'number'
  }
});

// array
const schema6 = dsl({ tags: 'array<string>' });

//null value
const schema7 = dsl({ value: 'null' });

// any type
const schema8 = dsl({ data: 'any' });
```

---

### Parameterized DSL types

```javascript
//Mobile phone number (default cn)
const schema1 = dsl({ mobile: 'phone:cn!' });

// ID card
const schema2 = dsl({ idCard: 'idCard:cn!' });

// credit card
const schema3 = dsl({ card: 'creditCard:visa!' });

// license plate number
const schema4 = dsl({ plate: 'licensePlate:cn!' });

// postal code
const schema5 = dsl({ zip: 'postalCode:cn!' });

// passport
const schema6 = dsl({ passportNo: 'passport:cn!' });
```

---

### format type

```javascript
// Mail
const schema1 = dsl({ email: 'email!' });

// URL
const schema2 = dsl({ website: 'url' });

// UUID
const schema3 = dsl({ id: 'uuid!' });

// date
const schema4 = dsl({ birthday: 'date' });

// date time
const schema5 = dsl({ created_at: 'datetime!' });

// time
const schema6 = dsl({ start_time: 'time' });

// IP address
const schema7 = dsl({
  ipv4_addr: 'ipv4',
  ipv6_addr: 'ipv6'
});
```

---

### special type

```javascript
//Binary data (Base64)
const schema = dsl({
  avatar: 'binary' // Avatar image (Base64 encoding)
});
```

---

## Correspondence between 🔄 and joi

### Complete comparison table

| joi | schema-dsl DSL | Description |
|-----|--------------|------|
| `Joi.string()` | `'string'` | string |
| `Joi.string().email()` | `'email'` | Mail |
| `Joi.string().uri()` | `'url'` | URL |
| `Joi.string().uuid()` | `'uuid'` | UUID |
| `Joi.string().ip()` | `'ipv4'` or `'ipv6'` | IP address |
| `Joi.string().min(3).max(32)` | `'string:3-32'` | length range |
| `Joi.string().required()` | `'string!'` | Required |
| `Joi.number()` | `'number'` | number |
| `Joi.number().min(0).max(100)` | `'number:0-100'` | Number range |
| `Joi.number().integer()` | `'integer'` | integer |
| `Joi.boolean()` | `'boolean'` | Boolean |
| `Joi.date()` | `'date'` or `'datetime'` | date |
| `Joi.array()` | `'array'` | array |
| `Joi.array().items(Joi.string())` | `'array<string>'` | string array |
| `Joi.array().min(1).max(10)` | `'array:1-10'` | array length |
| `Joi.object()` | `{ ... }` | object |
| `Joi.any()` | `'any'` | any type |
| `Joi.binary()` | `'binary'` | binary |
| `Joi.valid('a','b','c')` | `'a\|b\|c'` | enumerate |

---

## 📚 Related documents

- [DSL Syntax Guide](./dsl-syntax.md) - Full syntax description
- [Quick Start](./quick-start.md) - Get started in 5 minutes
- [String extension](./string-extensions.md) - chain call

---

## ❓ FAQ

### Q1: Why is there no API to call `Joi.alternatives()` directly?

A: schema-dsl splits this type of requirements into two categories:

- Single field cross-type union: use `types:` syntax
- Make conditional branches based on other fields: use `dsl.match()`

```javascript
const schema = dsl({
  value: 'types:string|number',
  contactType: 'email|phone',
  contact: dsl.match('contactType', {
    email: 'email!',
    phone: 'phone:cn!'
  })
});
```

### Q2: Why is `integer` not `number().integer()`?

A: schema-dsl uses JSON Schema standard, `integer` is an independent type.

### Q3: Doesn't abbreviation support?

A: Abbreviations such as `s`/`n`/`i`/`b` are not supported. Use the complete type name (`string`/`number`/`integer`/`boolean`) to reduce learning costs.

---

**Last updated**: 2026-05-08

---

## Corresponding sample file

**Example entry**: [type-reference.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/type-reference.ts)
**Description**: Use a schema to string together commonly used built-in types, parameterized DSL types and runtime error paths to facilitate quick validation of the actual support range.
