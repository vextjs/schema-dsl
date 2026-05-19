import { dsl, validate } from '../../dist/index.js'

// ============================================================
// Design philosophy — DSL-as-config (schema-as-data)
//
// Core idea: validation rules are plain data (strings, objects)
// that can be:
//   • Serialized to JSON and stored in a DB or config file
//   • Hydrated at runtime from an API response
//   • Transported across network boundaries
//   • Versioned and audited like any other configuration
// ============================================================

// ============================================================
// 1. Schema driven by runtime rule objects
// ============================================================

const rules = {
  username: { min: 3,  max: 32 },
  age:      { min: 18, max: 120 },
  password: { min: 8,  max: 128 },
}

const schemaConfig = {
  username: `string:${rules.username.min}-${rules.username.max}!`,
  age:      `number:${rules.age.min}-${rules.age.max}`,
  email:    'email!',
  password: `string:${rules.password.min}-${rules.password.max}!`,
}

const schema = dsl(schemaConfig)

console.log('design-philosophy.runtimeRules.valid   =', validate(schema, {
  username: 'runtime_user',
  age:      28,
  email:    'runtime@example.com',
  password: 'Secure123',
}).valid)  // true

// ============================================================
// 2. Serialize → store → hydrate → use
// ============================================================

const serialized = JSON.stringify(schemaConfig)
const hydrated   = JSON.parse(serialized)
const hydratedSchema = dsl(hydrated)

console.log('design-philosophy.serialized.string    =',
  serialized.includes('string:3-32!'))  // true

console.log('design-philosophy.hydrated.valid       =', validate(hydratedSchema, {
  username: 'hydrated_user',
  age:      35,
  email:    'hydrated@example.com',
  password: 'SafePass1',
}).valid)  // true

// ============================================================
// 3. Multi-tenant schema configuration
// ============================================================

type TenantConfig = {
  passwordMinLength: number
  passwordMaxLength: number
  allowedRoles:      string[]
}

function buildTenantSchema(config: TenantConfig) {
  return dsl({
    username: 'string:3-32!',
    email:    'email!',
    password: `string:${config.passwordMinLength}-${config.passwordMaxLength}!`,
    role:     config.allowedRoles.join('|'),
  })
}

const enterpriseSchema = buildTenantSchema({
  passwordMinLength: 12,
  passwordMaxLength: 256,
  allowedRoles:      ['admin', 'user', 'auditor'],
})

const consumerSchema = buildTenantSchema({
  passwordMinLength: 8,
  passwordMaxLength: 64,
  allowedRoles:      ['user', 'guest'],
})

console.log('design-philosophy.enterprise.valid     =', validate(enterpriseSchema, {
  username: 'corp_admin',
  email:    'corp@enterprise.com',
  password: 'LongSecureP@ss1',
  role:     'auditor',
}).valid)  // true

console.log('design-philosophy.consumer.valid       =', validate(consumerSchema, {
  username: 'consumer_01',
  email:    'consumer@example.com',
  password: 'Pass1234',
  role:     'user',
}).valid)  // true

console.log('design-philosophy.consumer.noAdmin     =', validate(consumerSchema, {
  username: 'consumer_02',
  email:    'consumer2@example.com',
  password: 'Pass1234',
  role:     'admin',   // not allowed in consumer tier
}).valid)  // false