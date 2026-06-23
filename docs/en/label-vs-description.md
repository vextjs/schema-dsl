# label / description / messages / error usage guide

## 📋Quick comparison

| property | use | show location | Example |
|------|------|----------|------|
| `.label(text)` | Display name for the field | Error messages, form labels, exported docs | `email address` |
| `.description(text)` | Help text for the field | Form hints, API docs, exported docs | `Used for login and notifications` |
| `.messages(map)` | Custom validation messages | Returned validation errors | `{ required: '{{#label}} is required' }` |
| `.error(map)` | Alias of `.messages(map)` | Exactly the same as `.messages()` | `{ pattern: 'Invalid format' }` |

Quick memory:

- `.label()` tells error messages what the field is called.
- `.description()` tells pages or docs what the field is for.
- `.messages()` tells the validator what to say for specific failures.
- `.error()` is only a shorter alias of `.messages()`.

---

## 🎯 Detailed instructions

### label

**Function**: Replace field names in error messages

**Usage Scenario**:
- Make error messages friendlier
- Chinese field name
- Simplify technical field names

**Example**:

```javascript
//Do not use label
email: 'email!'
// Error message: "email is required" ❌ Unfriendly

// use label
email: s('email!').label('email address')
// Error message: "Email address cannot be empty" ✅ Friendly
```

**Full example**:

```javascript
const schema = s({
  userEmail: s('email!').label('User Email')
    .messages({
      'required': '{{#label}} cannot be empty', // use label value
      'format': '{{#label}} format is incorrect'
    })
});

// When validation fails:
// Error: "User email cannot be empty"
// Error: "The user email format is incorrect"
```

---

### description

**Function**: Provide detailed description of fields

**Usage Scenario**:
- Form input prompts
- API documentation generation
- Schema document
- Help users understand the purpose of fields

**Example**:

```javascript
email: s('email!').label('email address')
  .description('Used to log in and receive system notifications')
```

**Use in form**:

```html
<div class="form-field">
  <label>Email address</label> <!-- from label -->
  <input type="email" />
  <span class="hint">Used to log in and receive system notifications</span> <!-- from description -->
</div>
```

**In the Export/Document tool**:

```json
{
  "email": {
    "type": "string",
    "format": "email",
    "_label": "email address", // label is saved as _label inside schema-dsl
    "description": "Used to log in and receive system notifications" // from description
  }
}
```

`SchemaUtils.toMarkdown()`, the exporter, or your own form rendering layer will usually map `_label` to the display title.

---

### messages

**Purpose**: Override the message returned when specific validation rules fail.

**Use cases**:
- Required, format, length, range or pattern errors need business wording.
- A message needs to reference `{{#label}}`.
- API errors need a consistent voice.

```javascript
import { s, validate } from 'schema-dsl/pure';

const schema = s({
  email: s('email!')
    .label('email address')
    .messages({
      required: '{{#label}} is required',
      format: 'Please enter a valid {{#label}}'
    })
});

validate(schema, {}).errors[0].message; // email address is required
validate(schema, { email: 'bad' }).errors[0].message; // Please enter a valid email address
```

Common keys:

| key | Meaning | Common trigger |
|-----|---------|----------------|
| `required` | Required field failure | Missing or empty field |
| `format` | JSON Schema format failure | `email`, `url`, `uuid`, etc. |
| `pattern` | Regex failure | `.pattern()` or built-in pattern types |
| `min` / `max` | Numeric range failure | `number:18-120`, `.min()`, `.max()` |
| `string.min` / `string.max` | String length failure | `string:3-32` |
| `array.min` / `array.max` | Array length failure | `array:1-10<string>` |

If you are unsure which key to override, inspect the returned `errors` first.

---

### error

**Purpose**: Exactly the same as `.messages()`. Both write to `_customMessages` internally.

```javascript
const schema = s({
  username: s('string:3-32!')
    .label('username')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .error({
      pattern: '{{#label}} can only contain letters, numbers, and underscores'
    })
});
```

Guidance:

- Use `.messages()` when you want the wording to be explicit.
- Use `.error()` when a field only needs a short inline error override.
- Do not give `.messages()` and `.error()` different meanings on the same field; they are aliases.

---

## 💡 Best Practices

### 1. label is required (user-visible field)

```javascript
const schema = s({
  // ✅ Good: all user-visible fields have labels
  username: s('string:3-32!').label('username'),
  email: s('email!').label('email address'),
  password: s('string:8-64!').label('password'),

  // ⚠️ Yes: internal fields do not need labels
  userId: 'uuid!',
  createdAt: 'date!'
});
```

### 2. description is optional (used when description is needed)

```javascript
const schema = s({
  // ✅ Complex fields: add description
  apiKey: s('string:32!').label('API key')
    .description('Used to call third-party API, please keep it properly'),

  // ✅ Simple field: no description required
  name: s('string:1-50!').label('name'),

  // ✅ Fields with special requirements: add description
  password: s('string:8-64!').label('password')
    .description('Must contain uppercase and lowercase letters and numbers')
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
});
```

### 3. Examples of combination use

```javascript
const userSchema = s({
  // Complete field definition
  email: s('email!').label('email address') // Displayed in error message
    .description('Used to log in and receive notifications') // Form prompts/documentation
    .messages({
      'required': '{{#label}} cannot be empty',
      'format': 'Please enter a valid {{#label}}'
    }),

  // simple fields
  age: s('number:18-120').label('age'),

  //Complex fields
  bio: s('string:500').label('personal profile')
    .description('Introduce yourself, up to 500 words'),

  // Internal fields (no label/description required)
  userId: 'uuid!',
  createdAt: 'date!'
});
```

---

## 📊 Usage scenario comparison

| scene | label | description |
|------|-------|-------------|
| **Error message** | ✅ Required | ❌ Not used |
| **Form Tag** | ✅ Recommended | ⚠️ Optional |
| **Form Tips** | ❌ Not used | ✅ Recommended |
| **API Documentation** | ✅ as title | ✅ As a note |
| **Schema Document** | ✅Field name | ✅ Field description |
| **Internal fields** | ⚠️ Optional | ⚠️ Optional |

---

## 🎨 Actual effect

### Validation error display

```javascript
// Schema definition
const schema = s({
  email: s('email!').label('email address')
    .messages({
      'required': '{{#label}} cannot be empty',
      'format': '{{#label}} format is incorrect'
    })
});

//Verify null value
validator.validate(schema, { email: '' });
// Error: "Email address cannot be empty" ← label used

//Verify error format
validator.validate(schema, { email: 'invalid' });
// Error: "Email address format is incorrect" ← label used
```

### form rendering

```javascript
const schema = s({
  password: s('string:8-64!').label('Login password')
    .description('8-64 bits, including uppercase and lowercase letters and numbers')
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
});

// Render to HTML
<div class="form-field">
  <label>Login password</label> ← label
  <input type="password" />
  <span class="hint">8-64 bits, including uppercase and lowercase letters and numbers</span> ← description
</div>
```

---

## ✅ Summary

### label

- **Required**: User-visible fields are recommended
- **Use**: Make error messages more friendly
- **Location**: Error messages, form labels
- **Format**: Short noun (2-6 words)

### description

- **Required**: Optional, used when instructions are needed
- **Purpose**: Help users understand the purpose of fields
- **Location**: Form prompts, API documentation
- **Format**: Complete sentence or phrase

### Recommended combination

```javascript
// Minimal configuration (simple fields)
name: s('string:1-50!').label('name')

//Standard configuration (regular fields)
email: s('email!').label('email address')
  .messages({ 'format': 'Please enter a valid {{#label}}' })

// Complete configuration (complex fields)
apiKey: s('string:32!').label('API key')
  .description('Used to call third-party API, please keep it properly')
  .pattern(/^[A-Za-z0-9]{32}$/)
  .messages({
    'required': '{{#label}} cannot be empty',
    'pattern': '{{#label}} format is incorrect'
  })
```

---

**Remember**: label is used for error messages and display title sources, description is used for help instructions!

---

## Corresponding sample file

**Example entry**: [label-vs-description.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/label-vs-description.ts)
**Description**: Directly show the actual placement point of `_label` / `description` in the schema, and how the validation error consumes `label`.
