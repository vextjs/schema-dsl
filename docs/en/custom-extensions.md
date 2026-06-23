# Custom DSL Types

Custom DSL types turn project-specific business types into DSL types. For example, after registering a tenant ID type as `tenant-id`, application schemas can write:

```ts
const schema = s({
  compact: 'tenant-id:corp!',
  named: s('tenant-id:corp!').label('Tenant'),
  typed: s.tenantId('corp').label('Tenant').require()
});
```

This page answers three questions:

1. How do you define a business type once?
2. Which of the three entries should you use?
3. How do parameters, required markers, enums, and constraints stay separate?

| Entry | When to use it | TypeScript experience |
|-------|----------------|-----------------------|
| `'tenant-id:corp!'` | Short DSL-only configuration | Compact, but raw strings cannot show chain-method hints. |
| `s('tenant-id:corp!').label(...)` | DSL syntax plus builder methods | Full builder hints after `s(...)`. |
| `s.tenantId('corp').label(...).require()` | Maximum discovery and typed parameters | Factory name and arguments are discoverable. |

These entries must produce equivalent schema output. Do not define the same business type three times.

## Dynamic Values

Dynamic values can still be used in pure DSL, but remember what happens: JavaScript first creates a normal string, and schema-dsl parses that final string.

```ts
const scope = currentUser.companyId ? 'corp' : 'tenant';

const schema = s({
  tenant: `tenant-id:${scope}!`
});
```

If `scope` is `'corp'`, schema-dsl receives `tenant-id:corp!`; if it is `'tenant'`, schema-dsl receives `tenant-id:tenant!`.

| Form | Recommended? | Why |
|------|--------------|-----|
| `` `tenant-id:${scope}!` `` | Yes | `scope` is one short string, and the final DSL stays readable. |
| `` `tenant-id:${params.scope}!` `` | Yes | Only one short field is interpolated, so the final string is still like `tenant-id:corp!`. |
| `` `tenant-id:${params}!` `` | No | If `params` is an object, JavaScript produces `tenant-id:[object Object]!`, which is hard to debug. |
| `s.tenantId(scope).require()` | Best for parameterized types | TypeScript can hint legal `scope` values and refactors are safer. |

If the variable is named `params` but it is itself a string such as `'corp'`, then `` `tenant-id:${params}!` `` also works. What the docs should avoid is interpolating a whole config object.

Docs may show examples such as `` `tenant-id:${scope}!` ``, but should not recommend interpolating an entire object into `${...}`. If the value comes from user input, whitelist it before building the DSL string.

## Define A Business Type First

You can think of an extension definition as “the rule that translates a business type into JSON Schema.” This example turns `tenant-id` into a string schema, and uses the `corp` / `tenant` parameter to choose the expected prefix.

```ts
import { registerExtensions } from 'schema-dsl/pure';

export const s = registerExtensions([
  {
    literal: 'tenant-id',
    factoryName: 'tenantId',
    segmentMode: 'params',
    params: {
      scope: {
        kind: 'enum',
        values: ['tenant', 'corp'],
        default: 'tenant',
        description: 'Identifier namespace'
      }
    },
    schema({ scope }) {
      return {
        type: 'string',
        pattern: scope === 'corp'
          ? '^corp_[a-z0-9]+$'
          : '^tenant_[a-z0-9]+$'
      };
    }
  }
] as const);
```

On first read, focus on these five fields:

| Field | Think of it as | What it does in this example |
|-------|----------------|------------------------------|
| `literal` | The name written in DSL strings | Lets `'tenant-id!'` and `'tenant-id:corp!'` find this extension. |
| `factoryName` | The method name under `s.xxx()` | Creates `s.tenantId()`, so editors can suggest this business type. |
| `params` | Rules for values after the colon | Turns the `corp` in `tenant-id:corp!` into `{ scope: 'corp' }`. |
| `schema` | The final validation rule | Produces `{ type: 'string', pattern: ... }`. |
| `segmentMode` | How to read the colon segment | Uses `params`, meaning the colon segment is an argument, not a range or comparison operator. |

A TypeScript signature alone, such as `tenantId(scope: 'tenant' | 'corp')`, is not enough because TypeScript only helps while editing and is erased at runtime. The runtime still needs `params` to parse DSL strings, validate invalid values, apply defaults, and generate docs.

### Extension Definition Fields

When you need the full contract, use this table:

| Field | Required | Type | What it controls | When to set it |
|-------|:--------:|------|------------------|----------------|
| `literal` | Yes for three-entry business types | `string` | The DSL type name, such as `'tenant-id!'` or `'tenant-id:corp!'`. Pure DSL strings and `s('...')` use it to find the extension. | Set it when the extension must be usable from DSL strings. Prefer short kebab-case names such as `tenant-id` or `money`. |
| `factoryName` | No | `string` | The namespace factory name, such as `s.tenantId()`. It may be inferred from `literal`; setting it explicitly avoids ambiguity. | Set it when you want the discoverable `s.xxx()` entry. The name must be a valid JavaScript identifier. |
| `segmentMode` | No | `'none' \| 'params' \| 'constraint'` | How the colon segment is interpreted. In `tenant-id:corp!`, `corp` is a parameter. In `positive-money:>=0!`, `>=0` is a constraint. | Set it whenever the extension accepts colon segments. Parameterized extensions usually use `params`; constraint-style numeric extensions use `constraint`. |
| `params` | No | Parameter declaration object | Declares DSL arguments, factory arguments, defaults, legal values, diagnostics, and generated parameter docs. | Set it for parameterized extensions. Omit it for static extensions. |
| `schema` | Yes when DSL strings should resolve the type | `JSONSchema` or parameter function | Produces the final JSON Schema. Static extensions can pass an object; parameterized extensions receive normalized parameters. | Required for normal custom business types. Low-level factory-only dynamic extensions are advanced usage and should document their own runtime behavior. |

### Naming Rules

| Name | Prefer | Avoid |
|------|--------|-------|
| `literal` | `tenant-id`, `money`, `corp-code` | `string`, `number`, `constructor`, names with spaces, or names that need complex escaping |
| `factoryName` | `tenantId`, `money`, `corpCode` | `min`, `label`, `default`, `registerExtension`, or any existing builder/namespace method |

If `literal` conflicts with a built-in type, or `factoryName` conflicts with a built-in factory, builder method, or existing extension, registration should fail with a clear error. Silent overrides make the same DSL mean different things in different modules.

## Parameter Configuration

Parameters are short values after the colon. They should stay small and serializable so they fit naturally in DSL strings:

```ts
const schema = s({
  tenant: 'tenant-id!',
  corpTenant: 'tenant-id:corp!',
  corpOwner: s('tenant-id:corp!').label('Owner'),
  corpAdmin: s.tenantId('corp').label('Admin').require()
});
```

Here `corp` comes from `params.scope`. It is not a field enum value and not a generic string constraint.

Do not force objects, functions, regular expressions, or multi-field options into DSL strings. Use `s.xxx(...)` factory parameters instead. This example shows the full parameter flow: both `prefix` and `length` are consumed by the final regular expression.

```ts
import { registerExtensions } from 'schema-dsl/pure';

// Extension definition: prefix and length are used to build the schema.
const s = registerExtensions([
  {
    literal: 'prefixed-code',
    factoryName: 'prefixedCode',
    segmentMode: 'params',
    params: {
      prefix: {
        kind: 'string',
        default: 'USR',
        description: 'Code prefix'
      },
      length: {
        kind: 'number',
        default: 8,
        factoryOnly: true,
        description: 'Random code length'
      }
    },
    schema({ prefix = 'USR', length = 8 }) {
      return {
        type: 'string',
        pattern: `^${prefix}_[A-Z0-9]{${length}}$`
      };
    }
  }
] as const);

const schema = s({
  compact: 'prefixed-code:INV!',                         // prefix = 'INV', length uses the default 8
  precise: s.prefixedCode({ prefix: 'INV', length: 8 }).require() // factory can pass the full config
});
```

The result is easy to trace:

| Form | Parameters passed into the extension | Final rule |
|------|--------------------------------------|------------|
| `'prefixed-code:INV!'` | `{ prefix: 'INV', length: 8 }`, with `length` from the default | The string must match `^INV_[A-Z0-9]{8}$` |
| `s.prefixedCode({ prefix: 'INV', length: 8 })` | `{ prefix: 'INV', length: 8 }` | The string must match `^INV_[A-Z0-9]{8}$` |

This way, users can see where each parameter is used instead of guessing what an option such as `length` changes.

### `params` Fields

Each key in `params` is a parameter name; each value is its declaration. The same declaration parses `'tenant-id:corp!'` and constrains `s.tenantId('corp')`.

Separate two kinds of names first. Otherwise it is easy to mistake `scope`, `min`, `max`, and `length` for schema-dsl built-ins:

| Kind | Examples | Defined by | Used in |
|------|----------|------------|---------|
| Parameter names | `scope`, `min`, `max`, `prefix`, `length` | The extension author | Passed into generator functions such as `schema({ scope })` or `schema({ min, max })`, where they shape the final JSON Schema. |
| Declaration fields | `kind`, `values`, `default`, `required`, `description`, `factoryOnly` | schema-dsl | Tell schema-dsl how to parse DSL text, validate parameters, type factories, and report errors. |

For example, these are all parameter names. Their meaning comes from how the extension author uses them in `schema(...)`:

```ts
params: {
  scope: {
    kind: 'enum',
    values: ['tenant', 'corp'],
    default: 'tenant',
    description: 'Tenant ID namespace'
  },
  length: {
    kind: 'number',
    default: 8,
    factoryOnly: true,
    description: 'Random suffix length; only passed through s.xxx(...)'
  }
}
```

`scope`, `min`, `max`, and `length` have no built-in magic by themselves. The actual behavior comes from `schema(...)`:

```ts
schema({ min, max }) {
  return {
    type: 'number',
    minimum: min,
    maximum: max
  };
}
```

```ts
params: {
  scope: {
    kind: 'enum',
    values: ['tenant', 'corp'],
    default: 'tenant',
    required: false,
    description: 'Identifier namespace'
  }
}
```

| Field | Required | Meaning | Example |
|-------|:--------:|---------|---------|
| `kind` | Yes | Parameter type. It controls how DSL text becomes a runtime value and how factory arguments are typed. | `'string'`, `'number'`, `'boolean'`, `'enum'` |
| `values` | Yes for `kind: 'enum'` | Allowed values for enum parameters. Invalid values should fail. | `['tenant', 'corp']` |
| `default` | No | Value used when the argument is omitted. Defaults must pass the same parameter validation. | `default: 'tenant'` |
| `required` | No | Whether the argument must be provided explicitly. Use `true` when no default is valid for the business rule. | `required: true` |
| `description` | No | Human-readable text for docs, editor hints, and diagnostics. | `'Identifier namespace'` |
| `factoryOnly` | No | Allows the argument only through `s.xxx(...)`, not through DSL strings. | `factoryOnly: true` |

### Parameter Kinds

| `kind` | DSL example | Factory example | Conversion rule |
|--------|-------------|-----------------|-----------------|
| `string` | `code-prefix:INV!` | `s.codePrefix('INV')` | Keep the text as a string. Empty strings should usually fail unless explicitly allowed. |
| `number` | `retry-count:3!` | `s.retryCount(3)` | Convert to a finite number. Reject `NaN`, `Infinity`, empty strings, and non-numeric text. |
| `boolean` | `flag:true!` | `s.flag(true)` | Accept only `true` / `false` or an explicitly documented boolean spelling. Prefer factories for complex switches. |
| `enum` | `tenant-id:corp!` | `s.tenantId('corp')` | Must be one of `values`; useful for scope, region, mode, and other short arguments. |

Do not force complex values into DSL strings:

| Value | Prefer | Avoid |
|-------|--------|-------|
| Regular expression | `s.customPattern(/^[a-z0-9]+$/)` | `'custom-pattern:/^[a-z0-9]+$/!'` |
| Function | `s.customValidator(fn)` | `'custom-validator:(value)=>true!'` |
| Object | `s.prefixedCode({ prefix: 'INV', length: 8 })` | `'prefixed-code:{"prefix":"INV"}!'` |

### How DSL Parameters Map

It is easier to read a DSL string as three parts:

```txt
tenant-id : corp !
type name   argument  required marker
```

The parser should read it in this order:

1. Read the trailing `!` / `?` first. They mean required or optional; they are not parameters.
2. Resolve the type name, such as `tenant-id`, and use it to find the extension.
3. If `segmentMode: 'params'`, parse the colon segment using the `params` declaration.
4. Parameter mode reads one short value. Ranges and comparisons use the existing constraint syntax instead of comma-splitting multiple parameters.
5. Missing parameters use `default`; if no default exists and `required: true`, throw.
6. Extra parameters, invalid enum values, invalid numbers, and unparseable booleans should produce readable errors.

Examples:

| DSL | Parsed result |
|-----|---------------|
| `tenant-id!` | `{ scope: 'tenant' }`, required field |
| `tenant-id:corp!` | `{ scope: 'corp' }`, required field |
| `tenant-id:bad!` | Error: `scope` is not one of `['tenant', 'corp']` |
| `age-range:18-65!` | This is a range constraint; it outputs `minimum: 18, maximum: 65` and does not use multi-parameter `params` |

### How To Write Ranges

Do not write ranges as comma-separated parameters. schema-dsl already has range syntax, and users already read `number:18-65` as minimum `18`, maximum `65`. Custom types should reuse that rule.

Start with what users write:

```ts
const schema = s({
  age: 'age-range:18-65!'
});
```

For users, this simply means: minimum age `18`, maximum age `65`.

The extension author declares this as a constraint-style extension:

```ts
const s = registerExtensions([
  {
    literal: 'age-range',
    factoryName: 'ageRange',
    segmentMode: 'constraint',
    schema: { type: 'number' },
    factory(min: number, max: number) {
      return `age-range:${min}-${max}`;
    }
  }
] as const);
```

That configuration means the `18-65` segment is handled by the existing range parser, not by a custom multi-parameter parser.

```ts
const schema = s({
  compact: 'age-range:18-65!',
  named: s('age-range:18-65!').label('Age'),
  typed: s.ageRange(18, 65).label('Age').require()
});
```

`age-range:18,65!` is not supported today. In schema-dsl, commas mainly belong to `enum:` lists, such as `enum:number:1,2,3!`; they should not become a generic multi-parameter separator.

If a custom type really needs multiple unrelated arguments, prefer `s.xxx({ ... })` or `s.xxx(a, b)` instead of forcing them into one compact DSL string.

## DSL Syntax That Is Easy To Mix Up

Custom DSL types must not change existing DSL meaning. Use this table to separate similar-looking syntax:

| Syntax | Meaning |
|--------|---------|
| `tenant-id!` | Required custom field. |
| `tenant-id?` | Optional custom field. |
| `field!: tenant-id?` | The object key is required; key-level required wins. |
| `positive-money:>=0!` | Constraint segment, not an extension parameter. |
| `tenant-id:corp!` | Parameter segment when `segmentMode: 'params'`. |
| `active|inactive!` | Field enum values. |
| `tenant-id:corp!` with `scope` enum | Parameter enum value. |

### Required, Optional, and Key-Level Required

`!` / `?` are field required markers, not extension parameters:

```ts
const schema = s({
  optionalA: 'tenant-id',
  optionalB: 'tenant-id?',
  requiredA: 'tenant-id!',
  'requiredB!': 'tenant-id?'
});
```

| Form | Required result | Notes |
|------|-----------------|-------|
| `tenant-id` | Not required | Optional by default. |
| `tenant-id?` | Not required | Explicitly optional. |
| `tenant-id!` | Required | Value-level required marker. |
| `'field!': 'tenant-id?'` | Required | Key-level required wins over value-level optional. |
| `s.tenantId().require()` | Required | Builder form, equivalent to `!`. |

### Field Enums vs Parameter Enums

Keep these two enum concepts separate:

```ts
const schema = s({
  status: 'active|inactive!',
  level: 'enum:number:1,2,3!',
  tenant: 'tenant-id:corp!',
  tenantLimited: s('tenant-id:corp!').enum('corp_admin', 'corp_owner')
});
```

| Form | Kind | Meaning |
|------|------|---------|
| `active|inactive!` | Field enum | The field value must be `active` or `inactive`. |
| `enum:number:1,2,3!` | Typed field enum | The field value must be number `1`, `2`, or `3`. |
| `tenant-id:corp!` | Parameter enum | `corp` selects how the extension generates schema; it does not mean the field value must equal `corp`. |
| `.enum('corp_admin', 'corp_owner')` | Field enum refinement | Adds allowed field values on top of the extension schema. |

Each extension declares how colon segments are interpreted:

| `segmentMode` | Example | Meaning |
|---------------|---------|---------|
| `none` | `tenant-id!` | Reject colon segments. |
| `params` | `tenant-id:corp!` | Map segments to declared parameters. |
| `constraint` | `positive-money:>=0!` | Parse segments as field constraints. |

### Three Concrete `segmentMode` Examples

`segmentMode` answers one question: when users write a colon segment, which rule reads the text after the colon?

#### `segmentMode: 'none'`

Use this for static business types with no parameters. Users may write the type name and required/optional markers, but no colon segment.

```ts
const s = registerExtensions([
  {
    literal: 'snowflake-id',
    factoryName: 'snowflakeId',
    segmentMode: 'none',
    schema: {
      type: 'string',
      pattern: '^[0-9]{18,20}$'
    }
  }
] as const);

const schema = s({
  id: 'snowflake-id!'
});
```

| User writes | Result |
|-------------|--------|
| `snowflake-id!` | Valid, required snowflake ID field. |
| `snowflake-id:corp!` | Error, because this extension declared that it does not accept colon segments. |

#### `segmentMode: 'params'`

Use this for types where the colon segment is a business argument, such as `tenant-id:corp!`.

```ts
const s = registerExtensions([
  {
    literal: 'tenant-id',
    factoryName: 'tenantId',
    segmentMode: 'params',
    params: {
      scope: {
        kind: 'enum',
        values: ['tenant', 'corp'],
        default: 'tenant',
        description: 'Tenant ID namespace'
      }
    },
    schema({ scope }) {
      return {
        type: 'string',
        pattern: scope === 'corp' ? '^corp_[a-z0-9]+$' : '^tenant_[a-z0-9]+$'
      };
    }
  }
] as const);
```

| User writes | Parameters passed into `schema(...)` | Final meaning |
|-------------|--------------------------------------|---------------|
| `tenant-id!` | `{ scope: 'tenant' }` | Uses the default tenant namespace. |
| `tenant-id:corp!` | `{ scope: 'corp' }` | Uses the company namespace. |
| `` `tenant-id:${scope}!` `` | Depends on the final string produced from `scope` | Dynamically selects the namespace, but TypeScript does not check inside the string. |
| `tenant-id:bad!` | Does not call `schema(...)` | Error, because `bad` is not in `values`. |

#### `segmentMode: 'constraint'`

Use this when the colon segment is a comparison, range, or equality constraint. Users can reuse the core numeric constraint syntax instead of learning a second parameter syntax.

```ts
const s = registerExtensions([
  {
    literal: 'positive-money',
    factoryName: 'positiveMoney',
    segmentMode: 'constraint',
    schema: {
      type: 'number',
      minimum: 0
    }
  }
] as const);

const schema = s({
  price: 'positive-money:<=999!'
});
```

| User writes | Final meaning |
|-------------|---------------|
| `positive-money!` | Required number with minimum `0`. |
| `positive-money:<=999!` | Adds a maximum value of `999` on top of the extension schema. |
| `positive-money:0-999!` | Adds a `0` to `999` range on top of the extension schema. |
| `positive-money:corp!` | Error, because `corp` is not a numeric constraint. |

### When To Set `segmentMode`

| Scenario | Recommended value | Why |
|----------|-------------------|-----|
| Static type with no colon segment | `none` | Prevents accidental `tenant-id:any!` from being ignored. |
| Parameterized type | `params` | Makes `tenant-id:corp!`, `s('tenant-id:corp!')`, and `s.tenantId('corp')` share one parameter model. |
| Numeric or string constraint-style extension | `constraint` | Lets `positive-money:>=0!` reuse core comparison and range parsing. |

Avoid mixing parameters and numeric constraints in one compact string. Prefer builder methods when both are needed:

```ts
const schema = s({
  price: s('money:usd!').min(0),
  total: s.money('usd').min(0).require()
});
```

If a user writes `money:usd>=0!`, the implementation should produce a clear diagnostic such as: "`money` uses parameter mode; do not mix numeric constraints into the same colon segment. Use `s('money:usd!').min(0)`." Do not silently treat `usd>=0` as a parameter and do not fall back to an unknown type.

### Numeric Operators Are Core Constraints

These forms are not extension parameters:

| DSL | JSON Schema meaning |
|-----|---------------------|
| `number:>=0` | `minimum: 0` |
| `number:>0` | `exclusiveMinimum: 0` |
| `number:<=120` | `maximum: 120` |
| `number:<120` | `exclusiveMaximum: 120` |
| `number:=18` | `enum: [18]` |
| `number:0-100` | `minimum: 0, maximum: 100` |

Custom types should consume these constraints only when they declare `segmentMode: 'constraint'`. Extensions with `segmentMode: 'params'` should parse the colon segment as parameters instead.

## Release Status And Skippable Details

When defining ordinary business types, users only need the fields above: `literal`, `factoryName`, `params`, `schema`, and the three entries.

This page describes the public usage contract for the extension system. Use the API exported by your installed package version; when reading these examples inside the repository, build locally before running them.

If you see direct String chaining, compile-time transforms, or special parser hooks in source code or older docs, treat them as compatibility or advanced capabilities, not the main entry for ordinary business types.

### What Is Not A Custom Extension Entry

Custom business types do not need custom base-builder chain methods:

```ts
s('string!').tenantId();  // not part of the custom DSL type model
'string!'.tenantId();     // not part of the custom DSL type model
```

Existing direct String chaining and transform support remain separate compatibility and authoring tools. They should not be used to expose ordinary business types such as `tenant-id`.

## Choosing TypeScript Hints

The three entries have different completion behavior by design:

| Form | What TypeScript can hint | What it cannot hint | Recommended use |
|------|--------------------------|---------------------|-----------------|
| `'tenant-id:corp!'` | Only normal string editing | TypeScript does not parse the DSL string and cannot suggest `.label()` | Short configuration with no chain refinements. |
| `s('tenant-id:corp!')` | Full builder methods such as `.label()`, `.default()`, `.pattern()`, `.require()` | The `corp` argument inside the string is usually not statically checked | Keep DSL syntax, then add builder refinements. |
| `s.tenantId('corp')` | Factory name, arguments, and returned builder methods | More verbose than pure DSL | Custom types, parameterized types, and refactor-friendly code. |

In real projects, keep the extension registration in one local module:

```ts
// schema-dsl.ts
import { registerExtensions } from 'schema-dsl/pure';

export const s = registerExtensions([
  {
    literal: 'tenant-id',
    factoryName: 'tenantId',
    segmentMode: 'params',
    params: {
      scope: {
        kind: 'enum',
        values: ['tenant', 'corp'],
        default: 'tenant'
      }
    },
    schema({ scope }) {
      return { type: 'string', pattern: `^${scope}_[a-z0-9]+$` };
    }
  }
] as const);
```

Application code imports the configured `s`:

```ts
import { s } from './schema-dsl';

const schema = s({
  compact: 'tenant-id:corp!',
  readable: s('tenant-id:corp!').label('Tenant'),
  typed: s.tenantId('corp').label('Tenant').require()
});
```

Low-level `s.registerExtension(...)` and `runtime.registerExtension(...)` are still useful for dynamic runtime registration, but TypeScript cannot learn a new static `s.tenantId()` method from one runtime call. Use the typed batch registration API, or project-specific module augmentation, when you need complete hints.

## Runtime Scope

Frameworks, plugin hosts, tenants, workers, and isolated tests should register the same extension definition on a runtime instance:

```ts
import { createRuntime } from 'schema-dsl/runtime';

const runtime = createRuntime();

const runtimeS = runtime.registerExtensions([
  {
    literal: 'tenant-id',
    factoryName: 'tenantId',
    segmentMode: 'params',
    params: {
      scope: { kind: 'enum', values: ['tenant', 'corp'], default: 'tenant' }
    },
    schema({ scope }) {
      return { type: 'string', pattern: scope === 'corp' ? '^corp_' : '^tenant_' };
    }
  }
] as const);

const schema = runtime.s({
  tenant: 'tenant-id:corp!',
  owner: runtimeS.tenantId('corp').require()
});
```

`runtimeS` is the typed namespace returned by registration. The runtime instance is updated too, but the returned value is what carries static factory hints in TypeScript.

Runtime scope has a few important rules:

| Goal | Recommended approach | Why |
|------|----------------------|-----|
| Application-wide extensions | Create and export a configured `s` during app startup | Business modules import one stable entry. |
| Side-effect-free framework integration | Use `schema-dsl/pure` or `schema-dsl/runtime` | Avoid root-entry String extension installation. |
| Tenant / plugin / test isolation | Create one runtime per tenant, plugin, or test | Extension registries, locale state, and validator caches do not bleed across scopes. |
| Test cleanup | Call `runtime.dispose()` or the current reset/cleanup API | Prevent the next test from inheriting extensions. |

Do not require users to call `uninstallStringExtensions()` before they can use `s('xxx')`. If the goal is no global side effects, choose `schema-dsl/pure` or a runtime instance from the start.

## Corresponding sample file

**Example entry**: [custom-extensions.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/custom-extensions.ts)
**Note**: The sample uses the declarative parameter API. When running examples inside this repository, build locally first so `dist/` matches the source.
