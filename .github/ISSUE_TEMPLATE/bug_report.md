---
name: Bug Report
about: Report a problem to help us improve
title: "[BUG] "
labels: "bug"
assignees: ""
---

## Bug Description

Describe the problem clearly and concisely.

## Steps to Reproduce

1. Run ...
2. Call ...
3. See error ...

## Expected Behavior

Describe what you expected to happen.

## Actual Behavior

Describe what actually happened.

## Code Example

```javascript
const { dsl, validate } = require("schema-dsl");

const schema = dsl({
  // your schema definition
});

const result = validate(schema, {
  // your test data
});
```

## Environment

- **schema-dsl version**: e.g. v2.0.0
- **Node.js version**: e.g. v18.0.0
- **OS**: e.g. Windows 11 / macOS 14 / Ubuntu 22.04
- **Package manager**: npm / yarn / pnpm

## Additional Information

Add any other information that may help explain the problem (screenshots, error logs, etc.).

## Checklist

- [ ] I have searched existing Issues and found no duplicate
- [ ] I have read the [documentation](https://github.com/vextjs/schema-dsl#readme)
- [ ] I have provided complete steps to reproduce
- [ ] I have provided environment information
