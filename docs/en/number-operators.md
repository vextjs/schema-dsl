# Numeric comparison operators

**Applicable types**: `number`, `integer`

## 📋 Quick overview

| operator | grammar | JSON Schema | Description | Example |
|-------|------|------------|------|------|
| `>` | `number:>0` | `{ exclusiveMinimum: 0 }` | Greater than (excluding bounds) | positive number |
| `>=` | `number:>=18` | `{ minimum: 18 }` | Greater than or equal to | age limit |
| `<` | `number:<100` | `{ exclusiveMaximum: 100 }` | Less than (excluding bounds) | upper temperature limit |
| `<=` | `number:<=100` | `{ maximum: 100 }` | less than or equal to | Rating cap |
| `=` | `number:=100` | `{ enum: [100] }` | equal | fixed value |

---

## ✨ Features

- ✅Supports 5 comparison operators
- ✅ Supports decimals (such as `number:>0.5`)
- ✅ Support negative numbers (such as `number:>-10`)
- ✅ Supports required tags (such as `number:>=18!`)
- ✅ Available for `number` and `integer` types
- ✅ Fully backward compatible with the original scope syntax

---

## 🚀 Basic usage

### Greater than (>)

**Syntax**: `number:>value`

**JSON Schema**: `{ exclusiveMinimum: value }`

**Note**: The value must be greater than the specified value (excluding the boundary value itself)

```javascript
import { s, validate } from 'schema-dsl/pure';

//Basic usage
const schema = s({ value: 'number:>0' });

validate(schema, { value: 1 });    // ✅ true
validate(schema, { value: 0.1 });  // ✅ true
validate(schema, { value: 0 }); // ❌ false (0 does not satisfy >0)
validate(schema, { value: -1 });   // ❌ false

// Support decimals
const schema2 = s({ value: 'number:>0.5' });
validate(schema2, { value: 0.6 }); // ✅ true
validate(schema2, { value: 0.5 }); // ❌ false (0.5 does not satisfy >0.5)

// Support negative numbers
const schema3 = s({ value: 'number:>-10' });
validate(schema3, { value: -9 });  // ✅ true
validate(schema3, { value: -10 }); // ❌ false

//Required for cooperation
const schema4 = s({ value: 'number:>0!' });
validate(schema4, { value: 1 });   // ✅ true
validate(schema4, {}); // ❌ false (required)
```

---

### Greater than or equal to (>=)

**Syntax**: `number:>=value`

**JSON Schema**: `{ minimum: value }`

**Note**: The value must be greater than or equal to the specified value (including boundary values)

```javascript
//Basic usage
const schema = s({ age: 'number:>=18' });

validate(schema, { age: 18 }); // ✅ true (including 18)
validate(schema, { age: 19 });  // ✅ true
validate(schema, { age: 17 });  // ❌ false

// Practical application: age validation
const schema2 = s({ age: 'number:>=18!' });

validate(schema2, { age: 20 }); // ✅ true
validate(schema2, { age: 17 }); // ❌ false
validate(schema2, {}); // ❌ false (required)
```

---

### Less than (<)

**Syntax**: `number:<value`

**JSON Schema**: `{ exclusiveMaximum: value }`

**Note**: The value must be less than the specified value (excluding boundary values)

```javascript
//Basic usage
const schema = s({ value: 'number:<100' });

validate(schema, { value: 99 });   // ✅ true
validate(schema, { value: 99.9 }); // ✅ true
validate(schema, { value: 100 }); // ❌ false (100 does not satisfy <100)
validate(schema, { value: 101 });  // ❌ false

// Practical application: upper temperature limit
const schema2 = s({ temperature: 'number:<100' });

validate(schema2, { temperature: 99.9 }); // ✅ true
validate(schema2, { temperature: 100 });  // ❌ false
```

---

### Less than or equal to (<=)

**Syntax**: `number:<=value`

**JSON Schema**: `{ maximum: value }`

**Note**: The value must be less than or equal to the specified value (including boundary values)

```javascript
//Basic usage
const schema = s({ score: 'number:<=100' });

validate(schema, { score: 100 }); // ✅ true (including 100)
validate(schema, { score: 99 });  // ✅ true
validate(schema, { score: 101 }); // ❌ false

// Practical application: scoring system
const schema2 = s({ score: 'number:<=100!' });

validate(schema2, { score: 100 }); // ✅ true
validate(schema2, { score: 101 }); // ❌ false
```

---

### equal to (=)

**Syntax**: `number:=value`

**JSON Schema**: `{ enum: [value] }`

**Note**: The value must be equal to the specified value

```javascript
//Basic usage
const schema = s({ level: 'number:=5' });

validate(schema, { level: 5 });  // ✅ true
validate(schema, { level: 4 });  // ❌ false
validate(schema, { level: 6 });  // ❌ false

//Supports exact decimal matching
const schema2 = s({ price: 'number:=99.99' });

validate(schema2, { price: 99.99 }); // ✅ true
validate(schema2, { price: 99.98 }); // ❌ false
validate(schema2, { price: 100 });   // ❌ false
```

---

## 📊 Comparison: comparison operators vs range syntax

| need | scope syntax | comparison operator | recommend |
|------|---------|-----------|------|
| 18 ≤ x ≤ 120 | `number:18-120` | `number:>=18` + `number:<=120` | Scope syntax (more concise) |
| x ≥ 18 | `number:18-` | `number:>=18` | **Comparison operators** (clearer semantics) |
| x ≤ 100 | `number:-100` | `number:<=100` | **Comparison operators** (clearer semantics) |
| x > 0 (excluding 0) | ❌ cannot express | `number:>0` | **Comparison operators** (only way) |
| x < 100 (excluding 100) | ❌ cannot express | `number:<100` | **Comparison operators** (only way) |
| x = 100 | `number:100` (actually ≤100) | `number:=100` | **Comparison operators** (exact match) |

---

## 🎯 Practical application scenarios

### Scenario 1: User Registration - Age Restriction

```javascript
const schema = s({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:>=18!', // Must be over 18 years old
  password: 'string:8-!'
});

// test
validate(schema, {
  username: 'john',
  email: 'john@example.com',
  age: 20,
  password: '12345678'
}); // ✅ Pass

validate(schema, {
  username: 'tom',
  email: 'tom@example.com',
  age: 17, // ❌ Under 18 years old
  password: '12345678'
}); // ❌ failed
```

---

### Scenario 2: E-commerce system - price validation

```javascript
const schema = s({
  productName: 'string:1-100!',
  price: 'number:>0!', // price must be greater than 0
  discount: 'number:0-100' // Discount 0-100
});

// test
validate(schema, {
  productName: 'iPhone 16',
  price: 999.99, // ✅ greater than 0
  discount: 10
}); // ✅ Pass

validate(schema, {
  productName: 'iPad',
  price: 0, // ❌ cannot be 0
  discount: 50
}); // ❌ failed
```

---

### Scenario 3: Examination System - Scoring

```javascript
const schema = s({
  studentId: 'string!',
  score: 'number:>=0!', // score ≥ 0
  bonus: 'number:<=20' // Extra points ≤ 20
});

// test
validate(schema, {
  studentId: 'S001',
  score: 85,
  bonus: 10
}); // ✅ Pass

validate(schema, {
  studentId: 'S002',
  score: -5 // ❌ cannot be negative
}); // ❌ failed
```

---

### Scenario 4: Temperature Monitoring - Range Limitation

```javascript
const schema = s({
  deviceId: 'string!',
  temperature: 'number:>0', // temperature > 0
  humidity: 'number:<=100' // Humidity ≤ 100
});

// test
validate(schema, {
  deviceId: 'TEMP-001',
  temperature: 25.5,
  humidity: 60
}); // ✅ Pass

validate(schema, {
  deviceId: 'TEMP-002',
  temperature: 0, // ❌ cannot be 0
  humidity: 60
}); // ❌ failed
```

---

### Scenario 5: Game System - Level Validation

```javascript
const schema = s({
  playerId: 'string!',
  level: 'number:=5!', // must be level 5
  experience: 'number:>=1000' // experience >= 1000
});

// test
validate(schema, {
  playerId: 'P001',
  level: 5,
  experience: 1500
}); // ✅ Pass

validate(schema, {
  playerId: 'P002',
  level: 4, // ❌ must be level 5
  experience: 1500
}); // ❌ failed
```

---

## ⚙️Technical details

### JSON Schema mapping

```javascript
// DSL → JSON Schema
s({ value: 'number:>0' })
// Generate:
{
  type: 'object',
  properties: {
    value: {
      type: 'number',
      exclusiveMinimum: 0  // JSON Schema draft-07
    }
  }
}

// DSL → JSON Schema
s({ age: 'number:>=18' })
// Generate:
{
  type: 'object',
  properties: {
    age: {
      type: 'number',
      minimum: 18
    }
  }
}
```

---

### integer type support

All comparison operators also apply to `integer` types:

```javascript
const schema = s({
  count: 'integer:>0', // integer and greater than 0
  level: 'integer:>=1', // Integer and greater than or equal to 1
  maxValue: 'integer:<=100' // Integer and less than or equal to 100
});

validate(schema, {
  count: 5,
  level: 1,
  maxValue: 100
}); // ✅ Pass

validate(schema, {
  count: 1.5, // ❌ is not an integer
  level: 1,
  maxValue: 100
}); // ❌ failed
```

---

## 🔄 Backward compatibility

All original syntax remains unchanged, no breaking changes:

```javascript
// ✅ The original syntax continues to be valid
s({ age: 'number:18-120' }) // range
s({ age: 'number:18-' }) // minimum value
s({ score: 'number:-100' }) // Maximum value
s({ count: 'number:100' }) // Maximum value

// ✅ Added new syntax
s({ age: 'number:>=18' }) // Greater than or equal to
s({ value: 'number:>0' }) // Greater than
s({ score: 'number:<=100' }) // Less than or equal to
s({ temp: 'number:<100' }) // less than
s({ level: 'number:=5' }) // equal to
```

---

## ❓ FAQ

### Q1: Why do we need comparison operators? Is the range syntax not enough?

**A**: The range syntax cannot express the requirement of "excluding boundary values":
- `number:>0` means greater than 0 (excluding 0)
- `number:<100` means less than 100 (excluding 100)
- These cannot be expressed using scope syntax

---

### Q2: What is the difference between `number:=100` and `number:100`?

**A**:
- `number:=100` → `{ enum: [100] }`, exactly equal to 100
- `number:100` → `{ maximum: 100 }`, less than or equal to 100

---

### Q3: Can multiple comparison operators be combined?

**A**: The current version does not support direct combination (such as `number:>0<100`). suggestion:
- Use range syntax: `number:0-100` (including bounds)
- Or validate both fields separately

---

### Q4: What values ​​are supported?

**A**:
- ✅ Positive integers: `number:>0`, `number:>=1`
- ✅ Negative integers: `number:>-10`, `number:<-5`
- ✅ Decimal: `number:>0.5`, `number:<=99.99`
- ✅ Zero: `number:>=0`, `number:<=0`

---

## 📚 Related documents

- [DSL syntax quick check](./dsl-syntax.md)
- [Complete example](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/number-operators.ts)
- [Test Case](https://github.com/vextjs/schema-dsl/blob/main/test/unit/number-operators.test.ts)
- [CHANGELOG](https://github.com/vextjs/schema-dsl/blob/main/CHANGELOG.md)

---

## Corresponding sample file

**Example entry**: [number-operators.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/number-operators.ts)
**Description**: Override the success/failure paths of `>=`, `<`, `<=`, `=` and integer comparison operators to facilitate direct observation of boundary behavior.
