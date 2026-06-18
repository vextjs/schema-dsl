# Custom chain methods

> **Last updated**: 2026-06-18

Use this page when you want to add a method to an existing builder:

```ts
s('string!').tenantId().label('Tenant')
```

This is different from a custom DSL type and different from an `s.xxx()` factory.

| Extension kind | Example | What it means |
|----------------|---------|---------------|
| Custom DSL type | `'tenant-id!'` | A DSL literal parsed into a schema. |
| Custom factory | `s.tenantId()` | A namespace method that creates a builder. |
| Custom chain method | `s('string!').tenantId()` | A method added to an existing builder. |

## Add the runtime builder method

`registerExtension()` can register a DSL literal and a namespace factory, but it does not automatically add a method to `DslBuilder.prototype`. Provide the runtime method in your extension setup:

```ts
import { DslBuilder, type IDslBuilder } from 'schema-dsl/pure';

export function installTenantIdChainMethod() {
  const proto = DslBuilder.prototype as unknown as {
    tenantId?: (this: IDslBuilder) => IDslBuilder;
  };

  proto.tenantId ??= function tenantId(this: IDslBuilder) {
    return this.pattern(/^tenant_[a-z0-9]+$/);
  };
}
```

The method should be idempotent so hot reload, repeated test setup, or plugin reinstall does not keep replacing it.

## Add TypeScript builder hints

```ts
import type { IDslBuilder } from 'schema-dsl/pure';

declare module 'schema-dsl/pure' {
  interface IDslBuilder {
    tenantId(): this;
  }
}
```

Now `s('string!').tenantId()` has builder method hints.

## Add direct String-chain hints

Only add this when your project explicitly uses direct String-chain source code:

```ts
import 'schema-dsl/string-types';
import type { IDslBuilder } from 'schema-dsl/pure';

declare module 'schema-dsl/string-types' {
  interface SchemaDslStringExtensions {
    tenantId(): IDslBuilder;
  }
}
```

Direct String-chain code still needs one of these runtime paths:

- compile-time transform with `schema-dsl/transform` or `schema-dsl/esbuild`;
- explicit String extension installation through `schema-dsl/register-string`;
- the compatibility/root entry when you intentionally accept the v1 String extension behavior.

## Configure transform for custom methods

When transforming direct String-chain source, add the method name:

```ts
import { transformSchemaDsl } from 'schema-dsl/transform';

const result = transformSchemaDsl(
  'export const tenant = "string!".tenantId().label("Tenant")',
  {
    filename: 'schema.ts',
    additionalMethods: ['tenantId']
  }
);
```

When the chain starts from a custom DSL literal, also allow that literal:

```ts
transformSchemaDsl(
  'export const tenant = "tenant-id!".tenantId()',
  {
    filename: 'schema.ts',
    additionalMethods: ['tenantId'],
    additionalTypes: ['tenant-id']
  }
);
```

## Recommended package shape

For reusable extensions, keep runtime implementation and type declarations together:

```text
src/schema-dsl/
  chain-methods.ts
  chain-methods.d.ts
  transform.ts
```

The implementation installs the builder method. The declaration file augments `schema-dsl/pure` and, only when needed, `schema-dsl/string-types`. The transform config exports `additionalMethods` and `additionalTypes` for your build tool.

---

## Corresponding sample file

**Example entry**: [custom-chain-methods.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/custom-chain-methods.ts)
**Note**: Installs a custom builder method, validates the builder path, and verifies transform configuration for direct String-chain source.
