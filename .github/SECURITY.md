# Security Policy

## Supported Versions

We currently provide security updates for the following versions:

| Version | Supported |
| ------- | --------- |
| 2.0.x   | ✅        |
| < 2.0   | ❌        |

## Reporting a Vulnerability

We take the security of schema-dsl seriously. If you discover a security vulnerability,
please **do not** disclose it publicly. Instead, report it through the following channel:

### Preferred Channel

Send an email to **rockyshi1993@gmail.com**

Email subject: `[SECURITY] schema-dsl - <brief description>`

### Information to Include

1. **Vulnerability description**: Clear description of the security issue
2. **Affected versions**: Which versions are impacted
3. **Steps to reproduce**: Detailed reproduction steps
4. **PoC code**: Proof-of-concept if available
5. **Potential impact**: Possible consequences
6. **Suggested fix**: If you have a proposed fix

### Response Timeline

| Stage | Timeframe |
| ----- | --------- |
| Initial acknowledgement | 1-2 business days |
| Vulnerability assessment | 3-5 business days |
| Fix release | 7-30 days (depends on severity) |

### Severity Classification

We follow CVSS 3.1 scoring:

- **Critical** (9.0-10.0): Immediate fix, target < 7 days
- **High** (7.0-8.9): Priority fix, target < 14 days
- **Medium** (4.0-6.9): Planned fix, target < 30 days
- **Low** (0.1-3.9): Routine fix, target < 90 days

## Security Best Practices

### 1. Validate All External Input

Always validate untrusted input before processing:

```javascript
const schema = dsl({
  username: "string:3-32!",
  email: "email!",
  age: "number:0-150"
});

const result = validate(schema, userInput);
if (!result.valid) {
  throw new Error("Validation failed: " + result.errors[0].message);
}
```

### 2. Avoid Dynamic Schema Construction

Do not build schemas from untrusted user input:

```javascript
// Bad: schema type from user input
// const schema = dsl({ field: userInput.type });

// Good: use a predefined map
const allowedSchemas = { user: userSchema, post: postSchema };
const schema = allowedSchemas[req.body.schemaType];
```

### 3. Limit Array and String Sizes

Use bounded types to prevent resource exhaustion:

```javascript
const schema = dsl({
  tags: "array:1-100<string:1-50>",
  description: "string:0-2000"
});
```

### 4. Keep Dependencies Updated

```bash
npm update schema-dsl
npm audit
```

### 5. Custom Validator Security

When writing async custom validators, always apply timeouts:

```javascript
const schema = dsl({
  email: "email!",
}).custom("email", async (value) => {
  const exists = await checkEmail(value, { timeout: 5000 });
  if (exists) return "Email already taken";
});
```

### 6. ReDoS Protection

Use anchored, non-backtracking regex patterns:

```javascript
const schema = dsl({ username: "string" }).pattern(/^[a-zA-Z0-9_]{3,32}$/);
```

## Known Vulnerabilities

No known security vulnerabilities at this time.

Historical advisories: <https://github.com/vextjs/schema-dsl/security/advisories>

## Acknowledgements

We thank all researchers who responsibly disclose security issues.
Valid vulnerability reports will be credited in release notes (unless anonymity is requested).

---

**Last updated**: 2025-12-29
**Contact**: rockyshi1993@gmail.com
