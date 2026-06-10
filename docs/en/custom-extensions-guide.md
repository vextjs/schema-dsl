# Custom extension guide

> **Version**: 2.0.7
> **Updated date**: 2026-06-10
> **Purpose**: Explain the runtime extension method recommended by the current version, and how to continue to extend it in depth when maintaining the source code of schema-dsl itself.

---

## 📑 Table of Contents

- [Quick Start](#quick-start)
- [Add custom AJV keyword](#add-custom-ajv-keyword)
- [Register custom DSL type](#register-a-custom-dsl-type)
- [Packaging predefined mode](#packaging-predefined-mode)
- [Multi-language support](#multi-language-support)
- [Complete example](#complete-example)

---

## quick start

schema-dsl adopts modular design, you can easily extend:

1. **`Validator.addKeyword()`** - Runtime registration of custom AJV keywords
2. **`TypeRegistry.register()` / `DslBuilder.registerType()`** - Register a custom DSL type
3. **`PluginManager` + `schema-dsl/plugins/*`** - Combination plug-in, hook and official plug-in entrance
4. **`Locale.addLocale()` / `dsl.config({ i18n })`** - Extended multi-language messages

## Recommended path for current version

> ⚠️ If you use `schema-dsl` as a dependency, give priority to extending it through the public runtime API instead of directly modifying `src/*`.
> Only when you maintain `schema-dsl`'s own source code, you need to continue reading the "Modify Internal Module" class example below.

- Custom keywords: priority is given to `new Validator().addKeyword(name, definition)`
- Custom type: priority is given to `TypeRegistry.register()` or `DslBuilder.registerType()`
- Official plug-in: give priority to `PluginManager` with `schema-dsl/plugins/custom-format`, `schema-dsl/plugins/custom-validator`, `schema-dsl/plugins/custom-type-example`
- Custom language: priority is given to `Locale.addLocale()` or `dsl.config({ i18n: { locales } })`

---

## Add custom AJV keyword

### Step 1: Register keywords via public API

```javascript
const { Validator } = require('schema-dsl');

const validator = new Validator();

validator.addKeyword('isPositive', {
  type: 'number',
  validate: (_schema, data) => data > 0
});

const result = validator.validate({ type: 'number', isPositive: true }, 42);
```

### Step 2: When reuse is needed, package it into a plug-in

```javascript
const plugin = {
  name: 'my-validator-plugin',
  install(core) {
    const validator = new core.Validator();
    validator.addKeyword('isPositive', {
      type: 'number',
      validate: (_schema, data) => data > 0
    });
  }
};
```

---

## Register a custom DSL type

### Recommended writing method at runtime

```javascript
const { DslBuilder, dsl } = require('schema-dsl');

DslBuilder.registerType('invoice-id', {
  type: 'string',
  pattern: '^INV-\\d{4}$'
});

const schema = dsl({ id: 'invoice-id!' });
```

### Lower level entrance

```javascript
const { TypeRegistry } = require('schema-dsl');

TypeRegistry.register('evenNumber', {
  baseSchema: { type: 'number', multipleOf: 2 }
});
```

> If you want to extend `schema-dsl`'s own source code, you need to continue to modify `DslBuilder`'s internal methods or parser/compiler logic.

---

<a id="packaging-predefined-mode"></a>

## Encapsulate predefined patterns

The current version recommends using "custom type + existing constraints" or "plug-in" to encapsulate the predefined pattern, instead of directly requiring the business side to modify `src/config/patterns/*` in the package.

```typescript
import { DslBuilder } from 'schema-dsl';

DslBuilder.registerType('wechat-id', {
  type: 'string',
  pattern: '^[a-zA-Z]([a-zA-Z0-9_-]{5,19})$'
});
```

---

## Multi-language support

### Add new language

1. **Append language at runtime**

```typescript
import { Locale } from 'schema-dsl';

Locale.addLocale('fr-FR', {
  required: '{{#label}} est obligatoire',
  type: '{{#label}} doit etre de type {{#expected}}'
});
```

2. **Or centrally inject through configuration object**

```javascript
dsl.config({
  i18n: {
    locales: {
      'fr-FR': {
        required: '{{#label}} est obligatoire'
      }
    }
  }
});
```

3. **Use new language**

```javascript
validate(schema, data, { locale: 'fr-FR' });
```

### Custom error message

```javascript
//Global configuration
dsl.config({
  i18n: {
    'zh-CN': {
      'custom.emailTaken': 'This email address has been registered',
      'custom.invalidFormat': 'Incorrect format'
    }
  }
});

// use
const schema = dsl({ email: 'email!' });
schema.properties.email._customMessages = {
  'format': 'custom.emailTaken'
};
```

---

## Complete example

### Example 1: Bank card number validator

```javascript
// 1. Add AJV keyword
static registerBankCard Validator(ajv) {
  ajv.addKeyword({
    keyword: 'bankCard',
    type: 'string',
    schemaType: 'boolean',
    validate: function validate(schema, cardNumber) {
      if (!schema) return true;

      // Luhn algorithm validation
      let sum = 0;
      let isEven = false;

      for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber[i], 10);

        if (isEven) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }

        sum += digit;
        isEven = !isEven;
      }

      if (sum % 10 !== 0) {
        validate.errors = [{
          keyword: 'bankCard',
          message: 'pattern.bankCard',
          params: {}
        }];
        return false;
      }

      return true;
    },
    errors: true
  });
}

// 2. Add DslBuilder method
bankCard() {
  if (this._baseSchema.type !== 'string') {
    throw new Error('bankCard() only applies to string type');
  }
  this._baseSchema.bankCard = true;
  return this;
}

// 3. Add multiple languages
'pattern.bankCard': '{{#label}} must be a valid bank card number'

// 4. Use
const schema = dsl({ cardNumber: dsl('string!').bankCard() });
validate(schema, { cardNumber: '6222026006956145' });
```

### Example 2: IP segment validator

```javascript
// 1. Add AJV keyword
static registerIPRange(ajv) {
  ajv.addKeyword({
    keyword: 'ipRange',
    type: 'string',
    schemaType: 'array', // [min, max]
    validate: function validate(range, ip) {
      const ipToNumber = (ip) => {
        return ip.split('.').reduce((acc, octet) => {
          return (acc << 8) + parseInt(octet, 10);
        }, 0);
      };

      const ipNum = ipToNumber(ip);
      const [minIP, maxIP] = range;
      const minNum = ipToNumber(minIP);
      const maxNum = ipToNumber(maxIP);

      if (ipNum < minNum || ipNum > maxNum) {
        validate.errors = [{
          keyword: 'ipRange',
          message: 'ip.range',
          params: { min: minIP, max: maxIP }
        }];
        return false;
      }

      return true;
    },
    errors: true
  });
}

// 2. Use
const schema = {
  type: 'string',
  format: 'ipv4',
  ipRange: ['192.168.1.1', '192.168.1.255']
};
```

---

## best practices

### 1. Naming convention

- **Keyword**: small hump, such as `phoneLocation`
- **Method name**: small camel case, such as `.phoneLocation()`
- **Message key**: dot separated, such as `phone.location.mismatch`

### 2. Error message

- Use placeholders: `{{#label}}`, `{{#limit}}`, `{{#expected}}`
- Provide detailed error information
- Support multiple languages

### 3. Performance optimization

- Precompiled regular expressions
- Avoid complex loops
- Use pure functions

### 4. Test coverage

```javascript
describe('Custom Validator - bankCard', function() {
  it('A valid bank card number should be validated', function() {
    const schema = dsl({ card: dsl('string!').bankCard() });
    expect(validate(schema, { card: '6222026006956145' }).valid).to.be.true;
  });

  it('Invalid bank card numbers should be rejected', function() {
    const schema = dsl({ card: dsl('string!').bankCard() });
    expect(validate(schema, { card: '1234567890123456' }).valid).to.be.false;
  });
});
```

---

## References

- [AJV custom keyword document](https://ajv.js.org/guide/user-keywords.html)
- [JSON Schema specification](https://json-schema.org/)
- [schema-dsl API documentation](./api-reference.md)
- [Validation Guide](./validation-guide.md)

---

**Need help? ** Visit [GitHub Issues](https://github.com/vextjs/schema-dsl/issues)

---

## Corresponding sample file

**Example entry**: [custom-extensions-guide.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/custom-extensions-guide.ts)
**Description**: Mainly focuses on the runtime public API, covering four expansion paths `Validator.addKeyword()`, `DslBuilder.registerType()`, `Locale.addLocale()` and the official plug-in entrance.
