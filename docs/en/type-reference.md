# schema-dsl complete type list

This page lists the built-in DSL types and shows how to use the same type through the recommended authoring entries: plain DSL strings, `s('...')` builder seeds, and `s.xxx()` factories.

---

## 📊 Supported types

### basic type

| type | schema-dsl DSL | JSON Schema | Description |
|------|----------|-------------|------|
| string | `string` | `{ type: 'string' }` | text type |
| number | `number` | `{ type: 'number' }` | floating point number |
| integer | `integer` | `{ type: 'integer' }` | integer |
| integer alias | `int` | `{ type: 'integer' }` | Alias of `integer` |
| Boolean | `boolean` | `{ type: 'boolean' }` | true/false |
| object | `object` | `{ type: 'object' }` | Nested objects |
| array | `array` | `{ type: 'array' }` | array |
| null value | `null` | `{ type: 'null' }` | null value |
| arbitrary | `any` | `{}` | any type |
| any alias | `mixed` | `{}` | Alias of `any` |

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
| binary alias | `buffer` | `contentEncoding: base64` | Alias of `binary` |
| ObjectId | `objectId` | `pattern: ^[0-9a-fA-F]{24}$` | MongoDB ObjectId |
| ObjectId alias | `objectid` | `pattern: ^[0-9a-fA-F]{24}$` | Lowercase alias of `objectId` |
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
| float alias | `float` | `{ type: 'number' }` | Alias of `number` |
| double alias | `double` | `{ type: 'number' }` | Alias of `number` |
| decimal alias | `decimal` | `{ type: 'number' }` | Alias of `number` |

---

## 📝 Type usage examples

### basic type

```javascript
import { s } from 'schema-dsl/pure';

// string
const schema1 = s({ name: 'string' });

// number
const schema2 = s({ age: 'number' });

// integer
const schema3 = s({ count: 'integer' });

// boolean
const schema4 = s({ active: 'boolean' });

// object
const schema5 = s({
  user: {
    name: 'string',
    age: 'number'
  }
});

// array
const schema6 = s({ tags: 'array<string>' });

// object array
const schema6b = s({
  items: s.array({
    name: 'string!',
    quantity: 'number:1-999!'
  })
});

//null value
const schema7 = s({ value: 'null' });

// any type
const schema8 = s({ data: 'any' });
```

---

### Parameterized DSL types

```javascript
//Mobile phone number (default cn)
const schema1 = s({ mobile: 'phone:cn!' });

// ID card
const schema2 = s({ idCard: 'idCard:cn!' });

// credit card
const schema3 = s({ card: 'creditCard:visa!' });

// license plate number
const schema4 = s({ plate: 'licensePlate:cn!' });

// postal code
const schema5 = s({ zip: 'postalCode:cn!' });

// passport
const schema6 = s({ passportNo: 'passport:cn!' });
```

---

### format type

```javascript
// Mail
const schema1 = s({ email: 'email!' });

// URL
const schema2 = s({ website: 'url' });

// UUID
const schema3 = s({ id: 'uuid!' });

// date
const schema4 = s({ birthday: 'date' });

// date time
const schema5 = s({ created_at: 'datetime!' });

// time
const schema6 = s({ start_time: 'time' });

// IP address
const schema7 = s({
  ipv4_addr: 'ipv4',
  ipv6_addr: 'ipv6'
});
```

---

### special type

```javascript
//Binary data (Base64)
const schema = s({
  avatar: 'binary' // Avatar image (Base64 encoding)
});
```

---

## Authoring entry matrix

| Goal | Recommended form | Example |
|------|------------------|---------|
| Shortest schema object | Plain DSL string | `s({ email: 'email!' })` |
| DSL seed plus chain methods | `s('...')` | `s('string:3-32!').label('Username')` |
| Full method discovery | `s.xxx()` factory | `s.email().label('Email').require()` |
| Isolated framework runtime | `runtime.s` | `runtime.s({ email: 'email!' })` |
| Direct string-chain source | String Extensions or transform | `'email!'.label('Email')` |

Factory examples:

```javascript
import { s } from 'schema-dsl/pure';

const schema = s({
  name: s.string().min(1).max(50).require(),
  age: s.number().min(18).max(120),
  email: s.email().label('Email').require(),
  tags: s.array('string:1-30').min(1).max(10),
  lines: s.array({ name: 'string!', quantity: 'number:1-999!' }),
  status: s.enum('active', 'inactive', 'pending').default('active')
});
```

### Factory support boundary

Not every DSL type has a same-name `s.xxx()` factory. Built-in factories cover the most common types and entry points:

| Category | Direct factories |
|----------|------------------|
| Basic types | `s.string()`, `s.number()`, `s.integer()`, `s.int()`, `s.boolean()`, `s.object()`, `s.array()`, `s.any()`, `s.mixed()` |
| Format types | `s.email()`, `s.url()`, `s.uri()`, `s.uuid()`, `s.ip()`, `s.ipv4()`, `s.ipv6()`, `s.date()`, `s.datetime()`, `s.time()`, `s.slug()` |
| Common presets | `s.phone(country?)`, `s.username(preset?)`, `s.password(strength?)` |
| Other built-in types | Use `s('objectId!')`, `s('hexColor')`, or `s.type('objectId')` |

`s.array(item)` and `.items(item)` accept a DSL string, builder, DSL object, or standard JSON Schema:

```javascript
s.array('string:1-30')
s.array(s.string().min(1).require())
s.array({ name: 'string!', quantity: 'number:1-999!' })
s.array({ type: 'string', minLength: 1 }) // standard JSON Schema
s.array({ enum: ['small', 'large'] })     // JSON Schema fragment without type is preserved
```

If an object-array child field is named like a JSON Schema keyword, such as `enum`, `pattern`, or `minimum`, wrap the DSL object with `s({ ... })` to make the intent explicit:

```javascript
s.array(s({
  enum: 'string!',
  pattern: 'string'
}))
```

---

## 📚 Related documents

- [DSL Syntax Guide](./dsl-syntax.md) - Full syntax description
- [Quick Start](./quick-start.md) - Get started in 5 minutes
- [String extension](./string-extensions.md) - chain call

---

## ❓ FAQ

### Q1: How should I express alternative field types?

A: schema-dsl splits this type of requirements into two categories:

- Single field cross-type union: use `types:` syntax
- Make conditional branches based on other fields: use `s.match()`

```javascript
const schema = s({
  value: 'types:string|number',
  contactType: 'email|phone',
  contact: s.match('contactType', {
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


---

## Corresponding sample file

**Example entry**: [type-reference.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/type-reference.ts)
**Description**: Use a schema to string together commonly used built-in types, parameterized DSL types and runtime error paths to facilitate quick validation of the actual support range.
