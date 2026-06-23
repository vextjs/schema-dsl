import { registerExtensions, resetRuntimeState, validate } from '../../dist/pure.js'
import { createRuntime } from '../../dist/runtime.js'

// ============================================================
// Custom extensions — one definition, three entries
// ============================================================

resetRuntimeState()

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
      },
    },
    schema({ scope }) {
      return {
        type: 'string',
        pattern: scope === 'corp' ? '^corp_[a-z0-9]+$' : '^tenant_[a-z0-9]+$',
      }
    },
  },
] as const)

const schema = s({
  compact: 'tenant-id:corp!',                         // pure DSL, shortest form
  named: s('tenant-id:corp!').label('Tenant'),        // DSL seed + builder methods
  typed: s.tenantId('corp').label('Tenant').require(), // factory + builder
})

console.log('custom-extensions.schema.properties =',
  Object.keys(schema.properties ?? {}).join(','))

console.log('custom-extensions.global.valid =',
  validate(schema, {
    compact: 'corp_demo',
    named: 'corp_owner',
    typed: 'corp_admin',
  }).valid)
console.log('custom-extensions.global.invalid =',
  validate(schema, {
    compact: 'bad',
    named: 'tenant_owner',
    typed: 'tenant_admin',
  }).valid)

// Parameterized examples should keep the current DSL grammar. For example,
// age-range:18-65! reuses the existing range syntax; age-range:18,65! is
// intentionally not supported because commas belong to enum-style lists.
//
// Dynamic DSL values are still just normal strings after JavaScript
// interpolation. Use `tenant-id:${scope}!`, not `tenant-id:${params}!`
// when params is an object. For fully typed parameters, prefer the
// generated factory form such as s.tenantId(scope).require().
//
// const schema = s({
//   compact: 'age-range:18-65!',
//   named: s('age-range:18-65!').label('Age'),
//   typed: s.ageRange(18, 65).label('Age').require(),
// })

const runtime = createRuntime()
const runtimeS = runtime.registerExtensions([
  {
    literal: 'runtime-tenant-id',
    factoryName: 'runtimeTenantId',
    segmentMode: 'params',
    params: {
      scope: {
        kind: 'enum',
        values: ['tenant', 'corp'],
        default: 'tenant',
      },
    },
    schema({ scope }) {
      return {
        type: 'string',
        pattern: scope === 'corp' ? '^rt_corp_[a-z0-9]+$' : '^rt_tenant_[a-z0-9]+$',
      }
    },
  },
] as const)

const runtimeSchema = runtime.s({
  tenant: 'runtime-tenant-id:corp!',
  owner: runtimeS.runtimeTenantId('corp').require(),
})

console.log('custom-extensions.runtime.valid =',
  runtime.validate(runtimeSchema, { tenant: 'rt_corp_demo', owner: 'rt_corp_owner' }).valid)

runtime.dispose()
resetRuntimeState()
