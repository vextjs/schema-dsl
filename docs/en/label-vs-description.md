# label vs description usage guide

## 📋Quick comparison

| property | use | show location | Example |
|------|------|----------|------|
| **label** | Field name | in error message | "Email address cannot be empty" |
| **description** | Field description | Form prompts/documentation | "For logging in and receiving notifications" |

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
email: 'email!'.label('email address')
// Error message: "Email address cannot be empty" ✅ Friendly
```

**Full example**:

```javascript
const schema = dsl({
  userEmail: 'email!'
    .label('User Email')
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
email: 'email!'
  .label('email address')
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

## 💡 Best Practices

### 1. label is required (user-visible field)

```javascript
const schema = dsl({
  // ✅ Good: all user-visible fields have labels
  username: 'string:3-32!'.label('username'),
  email: 'email!'.label('email address'),
  password: 'string:8-64!'.label('password'),

  // ⚠️ Yes: internal fields do not need labels
  userId: 'uuid!',
  createdAt: 'date!'
});
```

### 2. description is optional (used when description is needed)

```javascript
const schema = dsl({
  // ✅ Complex fields: add description
  apiKey: 'string:32!'
    .label('API key')
    .description('Used to call third-party API, please keep it properly'),

  // ✅ Simple field: no description required
  name: 'string:1-50!'.label('name'),

  // ✅ Fields with special requirements: add description
  password: 'string:8-64!'
    .label('password')
    .description('Must contain uppercase and lowercase letters and numbers')
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
});
```

### 3. Examples of combination use

```javascript
const userSchema = dsl({
  // Complete field definition
  email: 'email!'
    .label('email address') // Displayed in error message
    .description('Used to log in and receive notifications') // Form prompts/documentation
    .messages({
      'required': '{{#label}} cannot be empty',
      'format': 'Please enter a valid {{#label}}'
    }),

  // simple fields
  age: 'number:18-120'.label('age'),

  //Complex fields
  bio: 'string:500'
    .label('personal profile')
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
const schema = dsl({
  email: 'email!'
    .label('email address')
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
const schema = dsl({
  password: 'string:8-64!'
    .label('Login password')
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
name: 'string:1-50!'.label('name')

//Standard configuration (regular fields)
email: 'email!'
  .label('email address')
  .messages({ 'format': 'Please enter a valid {{#label}}' })

// Complete configuration (complex fields)
apiKey: 'string:32!'
  .label('API key')
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
