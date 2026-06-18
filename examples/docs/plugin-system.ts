import * as schemaDsl from '../../dist/pure.js'
import { DslBuilder, ObjectDslBuilder, PluginManager, s, validate, type DslDefinition, type JSONSchema } from '../../dist/pure.js'
import customFormatPlugin from '../../dist/plugins/custom-format.js'

function objectDsl(definition: DslDefinition): ObjectDslBuilder {
  return new ObjectDslBuilder(s(definition) as JSONSchema)
}

// ============================================================
// 1. PluginManager — lifecycle: register, install, has, runHook, uninstall
// ============================================================

const pluginManager = new PluginManager()

// Track lifecycle calls for demonstration
const callLog: string[] = []

const lifecyclePlugin = {
  name: 'lifecycle-demo',
  options: { version: '1.0.0' },

  install(_core: unknown, options: Record<string, unknown>, context: { plugins: Map<string, unknown> }) {
    callLog.push(`install:v${String(options.version)}`)
    callLog.push(`peers:${context.plugins.size}`)
  },

  uninstall(_core: unknown) {
    callLog.push('uninstall')
  },

  hooks: {
    // Called before every validate() when the plugin is installed
    onBeforeValidate(schema: unknown, data: unknown): string {
      return `schema:${typeof schema}|data:${typeof data}`
    },

    // Called after every validate()
    onAfterValidate(_schema: unknown, _data: unknown, result: unknown): string {
      return `valid:${(result as { valid?: boolean })?.valid}`
    },
  },
}

// Register plugin definition (does not install yet)
pluginManager.register(lifecyclePlugin)
console.log('plugin-system.registered.has =', pluginManager.has('lifecycle-demo'))  // true

// Install the plugin — calls plugin.install()
pluginManager.install(schemaDsl, 'lifecycle-demo', { version: '2.5.0' })
console.log('plugin-system.lifecycle.install.log =', callLog[0])  // 'install:v2.5.0'

// Run a hook — broadcasts to all installed plugins
const hookResults = await pluginManager.runHook(
  'onBeforeValidate',
  { type: 'string' },
  'hello'
)
console.log('plugin-system.lifecycle.hook.result =', hookResults[0])  // 'schema:object|data:string'

// Uninstall — calls plugin.uninstall()
pluginManager.uninstall('lifecycle-demo', schemaDsl)
console.log('plugin-system.lifecycle.uninstall.log =', callLog[callLog.length - 1])  // 'uninstall'

// ============================================================
// 2. DslBuilder.registerType — custom type registration at the builder level
// ============================================================

DslBuilder.clearCustomTypes()

// Register a 'sku' type: uppercase alphanumeric with a dash separator
DslBuilder.registerType('sku', {
  type: 'string',
  pattern: '^[A-Z]{2,4}-[0-9]{4,8}$',
  description: 'Stock-keeping unit — e.g. PROD-001234',
} as any)

// Register a 'score' type: integer 0–100
DslBuilder.registerType('score', {
  type: 'integer',
  minimum: 0,
  maximum: 100,
} as any)

console.log('plugin-system.registerType.hasSku   =', DslBuilder.hasType('sku'))    // true
console.log('plugin-system.registerType.hasScore =', DslBuilder.hasType('score'))  // true

const productSchema = s({ sku: 'sku!', qualityScore: 'score', name: 'string:2-100!' })

console.log('plugin-system.custom.type.valid   =',
  validate(productSchema, { sku: 'PROD-001234', qualityScore: 85, name: 'Widget Pro' }).valid) // true
console.log('plugin-system.custom.type.invalid.sku =',
  validate(productSchema, { sku: 'bad_sku', qualityScore: 85, name: 'Widget' }).valid)         // false
console.log('plugin-system.custom.type.invalid.score =',
  validate(productSchema, { sku: 'PROD-001234', qualityScore: 150, name: 'Widget' }).valid)    // false

// List all registered custom types
const customTypes = DslBuilder.getCustomTypes()
console.log('plugin-system.registerType.list =', customTypes.slice().sort().join(','))  // 'score,sku'

// ============================================================
// 3. custom-format plugin — adds phone-cn, email-cn, etc.
// ============================================================

const pm2 = new PluginManager()
pm2.register(customFormatPlugin)
pm2.install(schemaDsl, 'custom-format')

console.log('plugin-system.customFormat.installed =', pm2.has('custom-format'))  // true
console.log('plugin-system.customFormat.hasSku   =', DslBuilder.hasType('phone-cn'))  // true — registered by plugin

const phoneSchema = s({ phone: 'phone-cn!' })
console.log('plugin-system.customFormat.phone.valid   =',
  validate(phoneSchema, { phone: '13800138000' }).valid)   // true
console.log('plugin-system.customFormat.phone.invalid =',
  validate(phoneSchema, { phone: '99999999999' }).valid)   // false

// ============================================================
// 4. Authoring a plugin — complete plugin pattern
// ============================================================

// A plugin that registers a 'latitude' and 'longitude' custom type
const geoTypesPlugin = {
  name: 'geo-types',
  options: {},

  install(core: typeof schemaDsl): void {
    // Register geo types through the documented public extension API
    core.DslBuilder.registerType('latitude', {
      type: 'number',
      minimum: -90,
      maximum: 90,
    })
    core.DslBuilder.registerType('longitude', {
      type: 'number',
      minimum: -180,
      maximum: 180,
    })
  },

  uninstall(core: typeof schemaDsl): void {
    // Clean up registered types
    core.TypeRegistry.unregister('latitude')
    core.TypeRegistry.unregister('longitude')
  },
}

const pm3 = new PluginManager()
pm3.register(geoTypesPlugin)
pm3.install(schemaDsl, 'geo-types')

const locationSchema = s({ lat: 'latitude!', lng: 'longitude!', label: 'string:1-100' })

console.log('plugin-system.geo.valid =',
  validate(locationSchema, { lat: 37.7749, lng: -122.4194, label: 'San Francisco' }).valid)  // true
console.log('plugin-system.geo.invalid.lat =',
  validate(locationSchema, { lat: 95, lng: 0 }).valid)    // false — lat > 90
console.log('plugin-system.geo.invalid.lng =',
  validate(locationSchema, { lat: 0, lng: 200 }).valid)   // false — lng > 180

pm3.uninstall('geo-types', schemaDsl)

// ============================================================
// 5. validateNestingDepth — guard against deeply nested object schemas
// ============================================================

// Build a schema with 5 levels of object nesting
const deepObjSchema = objectDsl({
  a: {
    b: {
      c: {
        d: {
          e: 'string',
        },
      },
    },
  },
}).toSchema()

// depth 4 — exceeds limit of 3
const depthResult = DslBuilder.validateNestingDepth(deepObjSchema as any, 3)
console.log('plugin-system.nestingDepth.tooDeep =', !depthResult.valid)   // true

// depth 2 — within limit
const shallowObjSchema = objectDsl({ a: s({ b: 'string' }) }).toSchema()
const shallowResult = DslBuilder.validateNestingDepth(shallowObjSchema as any, 4)
console.log('plugin-system.nestingDepth.allowed =', shallowResult.valid)  // true

DslBuilder.clearCustomTypes()
