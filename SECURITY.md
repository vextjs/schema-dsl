# Security Policy

## Reporting a Vulnerability

If you find a security issue in `schema-dsl`, please report it privately through the repository security channel or by contacting the maintainer listed in `package.json`.

## Supported Versions

The current TypeScript rewrite targets the latest published package line and maintains v1 public API compatibility where possible.

## Dependency Checks

Before release, run:

```powershell
npm run test:all:with-audit
npm pack --dry-run
npm run examples:typecheck
npm run examples:build
```

