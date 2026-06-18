# FAQ troubleshooting guide

> **Purpose**: Quickly solve common problems in the use of schema-dsl
> **Update**: 2026-06-10

---


## Validation issues

### Question 1: Validation always fails, but I don’t know why

**symptom**:
```javascript
const result = validate(schema, data);
console.log(result.valid); // false
console.log(result.errors); // Can't understand the error message
```

**Troubleshooting steps**:

1. **Check errors array**
```javascript
console.log(JSON.stringify(result.errors, null, 2));
// View the complete error object
```

2. **Enable detailed error messages**
```javascript
const validator = new Validator({ verbose: true });
const result = validator.validate(schema, data);
```

3. **Use Schema Summary Tool**
```javascript
import { SchemaHelper } from 'schema-dsl/pure';
console.log(SchemaHelper.summarizeSchema(schema));
```

4. **Check if the field name is correct**
```javascript
// ❌ Error: path separated by.
{ 'user.name': 'string!' }

// ✅ Correct: use nested objects
{
  user: {
    name: 'string!'
  }
}
```

---

### Issue 2: Custom validator not working

**symptom**:
```javascript
email: s('email!').custom(async (value) => {
  //The code here is not executed
})
```

**Possible causes and solutions**:

#### Reason 1: Asynchronous validators cannot be executed with synchronous validate()

```javascript
// ❌ Error: using asynchronous validator in validate()
const result = validate(schema, data); // Synchronous mode

// ✅ Correct: Use validateAsync() to execute Promise-returning custom validator
await validateAsync(schema, data);

// ✅ Correct: use synchronous validator
email: s('email!').custom((value) => {
  // synchronization code
  if (checkSync(value)) return 'The mailbox has been occupied';
})

// ✅ Or: put the asynchronous check outside the schema-dsl
const result = validate(schema, data);
if (result.valid) {
  await checkEmailUniqueness(data.email);
}
```

#### Reason 2: custom() return value does not meet expectations

```javascript
// ✅ OK: return boolean
.custom((value) => {
  return value.includes('@'); // true passes, false uses default error message
})

// ✅ More recommended: return a readable error message on failure
.custom((value) => {
  if (!value.includes('@')) {
    return 'Must contain @ symbol'; // Return message on failure
  }
  // No need to return on success
})
```

---

### Issue 3: Nested object validation fails

**symptom**:
```javascript
const schema = s({
  user: {
    name: 'string!',
    email: 'email!'
  }
});

// Authentication failed: user field is not required
```

**Solution**:
```javascript
// ✅ Option 1: Mark the object itself as required
const schema = s({
  'user!': { // Note the!
    name: 'string!',
    email: 'email!'
  }
});

// ✅ Solution 2: Make sure there is a user object in the data
const data = {
  user: {
    name: 'John',
    email: 'john@example.com'
  }
};
```

---

### Issue 4: Array validation does not meet expectations

**symptom**:
```javascript
tags: 'array!1-10<string>'
// Passed in an empty array but passed
```

**Check syntax**:
```javascript
// ❌ Incorrect syntax
'array!1-10<string>' //! Wrong position

// ✅ Correct syntax (two ways)
'array:1-10<string>!' // Method 1:! at the end
'array!1-10<string>' // Method 2: It will be automatically converted to array:1-10!

// It is recommended to use method 1, which is more clear.
```

---

## Performance issues

### Problem 5: Validation speed is slow

**Symptoms**: Poor performance when validating large amounts of data

**Checklist**:

#### 1. Check whether cache is used
```javascript
// ❌ Cache is not used
app.post('/api/user', (req, res) => {
  const schema = s({ username: 'string!' }); // Create every time
  validate(schema, req.body);
});

// ✅ Use cache
const userSchema = s({ username: 'string!' }); // Create once
app.post('/api/user', (req, res) => {
  validate(userSchema, req.body); //reuse
});
```

#### 2. Use compile() to precompile
```javascript
const validator = new Validator();
const validateFn = validator.compile(schema); // Pre-compilation

//reuse
app.post('/api/user', (req, res) => {
  const result = validateFn(req.body);
});
```

#### 3. Avoid overly complex regular expressions
```javascript
// ❌ Complex regular expressions (may cause ReDoS)
.pattern(/^(a+)+$/)

// ✅ Simple and efficient regular rules
.pattern(/^[a-zA-Z0-9_]+$/)
```

#### 4. Batch validation optimization
```javascript
// ❌ Loop validation
records.forEach(record => {
  validate(schema, record);
});

// ✅ Batch validation
validator.validateBatch(schema, records);
```

---

### Problem 6: Memory usage is too high

**Cause**: Cache not cleared

**Solution**:
```javascript
const validator = new Validator({ cache: true });

// Clean the cache regularly
setInterval(() => {
  validator.clearCache();
}, 3600000); // Clean up every hour

// Or clean it manually at the appropriate time
app.post('/admin/clear-cache', (req, res) => {
  validator.clearCache();
  res.json({ message: 'Cache cleared' });
});
```

---

## multilingual issues

### Issue 7: Error message not translated

**Symptoms**: English error message is displayed, expecting Chinese to be displayed

**Troubleshooting steps**:

#### 1. Check whether the language pack is loaded
```javascript
import { Locale } from 'schema-dsl/pure';
console.log(Object.keys(Locale.locales));
// Should contain: ['zh-CN', 'en-US', 'ja-JP',...]
```

#### 2. Check whether the locale is passed in the validation call
```javascript
// ❌ The constructor will not set the language for this validation
const validator = new Validator();

// ✅ Specify the language one by one when validating
const result = validator.validate(schema, data, {
  locale: 'zh-CN'
});
```

#### 3. Dynamically switch languages
```javascript
const result = validator.validate(schema, data, {
  locale: 'zh-CN' // dynamically specified
});
```

---

### Issue 8: Custom error message not taking effect

**Symptom**: messages() is set but not displayed

**Check for error keywords**:
```javascript
// ❌ Error: Wrong keyword used
username: s('string:3-32!').messages({
  'length': 'Incorrect length' // Wrong keyword
})

// ✅ Correct: Use the correct keywords
username: s('string:3-32!').messages({
  'min': 'At least 3 characters',
  'max': 'Maximum 32 characters',
  'required': 'Username cannot be empty'
})
```

**Commonly used error keywords**:
- `required` - ​​required fields are empty
- `min` / `max` - length constraint (recommended)
- `minLength` / `maxLength` - length constraints (compatible)
- `pattern` - ​​Regular validation failed
- `format` - ​​Format validation failed (email, url, etc.)
- `enum` - ​​enum value mismatch

---

## Exporter issues

### Problem 9: The exported DDL cannot be executed

**Symptoms**: MySQL/PostgreSQL DDL statement execution error

**FAQ**:

#### 1. The field name contains reserved keywords
```javascript
// ❌ Problem: SQL reserved words are used
const schema = s({
  order: 'string!', // 'order' is a SQL reserved word
  group: 'string' // 'group' is a SQL reserved word
});

// ✅ Solution: Use backticks to wrap or rename
const schema = s({
  order_id: 'string!',
  group_name: 'string'
});
```

#### 2. The data type is not supported
```javascript
// Some JSON Schema types have no direct correspondence in the database

// Check export results
const exporter = new MySQLExporter();
const ddl = exporter.export('users', schema);
console.log(ddl); // Check the generated SQL
```

---

### Question 10: MongoDB validation rules do not take effect

**Symptoms**: Collection created successfully, but data is not validated

**Check Steps**:

#### 1. Confirm that validator is used
```javascript
const command = exporter.generateCreateCommand('users', schema);
console.log(command);
// Should contain validator field
```

#### 2. Check validationLevel
```javascript
db.createCollection('users', {
  validator: { $jsonSchema: mongoSchema },
  validationLevel: 'strict', // must be set
  validationAction: 'error' // An error message will be reported if validation fails.
});
```

---

## String expansion problem

### Question 11: String extension method is undefined

**symptom**:
```javascript
s('string!').pattern(/test/);
// TypeError: "string!".pattern is not a function
```

**Cause**: The root entry will install the String extension by default; if an error is still reported, it is usually because `uninstallStringExtensions()` has been called before, or an old build/exception entry that does not include the root side effect has been imported.

**Solution**:
```javascript
// Re-enable direct string chaining:
import { installStringExtensions } from 'schema-dsl/pure';
installStringExtensions();

// Or use s() wrapper (non-intrusive)
const schema = s({
  username: s('string!').pattern(/test/)
});
```

---

### Question 12: When importing, it prompts that the String.prototype method already exists

**symptom**:
```text
[schema-dsl] Cannot install String extension "label": String.prototype.label already exists and is not owned by schema-dsl
```

**Reason**: To be compatible with v1.1.x, schema-dsl will install the String extension in the root entry by default. In order to avoid overwriting existing methods of the same name in the host environment, the installer will detect methods such as `String.prototype.label` / `pattern` during the import phase; if these methods are not extensions installed by schema-dsl itself, a conflict error will be thrown.

**Solution**:
```javascript
// Remove or rename the external extension of the same name before importing schema-dsl.
delete String.prototype.label;

import { s } from 'schema-dsl/pure';
```

If conflicting methods come from other libraries, give priority to preventing both libraries from extending `String.prototype` methods with the same name at the same time in the application initialization sequence or dependency configuration.

---

## Debugging Tips

### Tip 1: View the generated JSON Schema

```javascript
const schema = s({
  username: 'string:3-32!',
  email: 'email!'
});

console.log(JSON.stringify(schema, null, 2));
// View the actual generated JSON Schema structure
```

### Tip 2: Use the Schema summary tool

```javascript
import { SchemaHelper } from 'schema-dsl/pure';

// View Schema structure summary
const summary = SchemaHelper.summarizeSchema(schema);
console.log(summary);
// Output field list, required quantity, complexity, etc.
```

### Tip 3: Enable verbose logging

```javascript
// Enable verbose logging in development environment
process.env.SCHEMAIO_DEBUG = 'true';

const validator = new Validator({
  verbose: true,
  allErrors: true // Return all errors, not just the first one
});
```

### Tip 4: Unit test validation

```javascript
//Write tests for your Schema
describe('User Schema', () => {
  it('should validate correct data', () => {
    const result = validate(userSchema, {
      username: 'john_doe',
      email: 'john@example.com'
    });
    expect(result.valid).to.be.true;
  });

  it('should reject invalid email', () => {
    const result = validate(userSchema, {
      username: 'john_doe',
      email: 'invalid'
    });
    expect(result.valid).to.be.false;
    expect(result.errors[0].path).to.equal('email');
  });
});
```

---

## Get help

If the above method does not solve your problem:

1. **View Documentation**: [Full Documentation Index](doc-index.md)
2. **View example**: [troubleshooting.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/troubleshooting.ts)
3. **GitHub Issues**: [Submit an issue](https://github.com/vextjs/schema-dsl/issues)
4. **FAQ**: [FAQ.md](faq.md)

---

## Corresponding sample file

**Example entry**: [troubleshooting.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/troubleshooting.ts)
**Description**: Demonstrates how to use `validate()` and `compile()` to reproduce errors, view paths/keywords/messages, and quickly locate the cause of failure.

---

## contribute

Found a new FAQ? Feel free to submit PRs to supplement this document!
