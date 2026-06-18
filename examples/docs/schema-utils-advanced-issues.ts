import { DslBuilder, s, SchemaUtils } from '../../dist/pure.js'

// ============================================================
// SchemaUtils advanced issues — internal schema format deep-dive
// ============================================================

// ============================================================
// 1. toSchema() keeps internal metadata (_label, _customMessages)
//    toJsonSchema() strips all private fields for external output
// ============================================================

const emailBuilder = s('email!').label('Email Address').error({ required: 'Email is required' })

const rawSchema   = (emailBuilder as any).toSchema()  as Record<string, unknown>
const cleanSchema = emailBuilder.toJsonSchema()         as Record<string, unknown>

console.log('advanced.rawHasLabel       =', '_label' in rawSchema)            // true
console.log('advanced.rawHasMessages    =', '_customMessages' in rawSchema)   // true
console.log('advanced.cleanNoLabel      =', !('_label' in cleanSchema))       // true
console.log('advanced.cleanNoMessages   =', !('_customMessages' in cleanSchema))  // true

// ============================================================
// 2. Exporter expects toJsonSchema() — not raw internal schema
// ============================================================

const withMetadata = (s('string:3-32!').label('Username') as any).toSchema()
const cleanJson    = s('string:3-32!').label('Username').toJsonSchema()

// Internal _label is harmless for validate() but should be stripped before export
console.log('advanced.raw._label        =', withMetadata._label)    // 'Username'
console.log('advanced.clean._label      =', cleanJson._label)       // undefined

// ============================================================
// 3. required vs _required — how SchemaUtils detects required fields
// ============================================================

const userSchema = s({
  name:     s('string!').label('Name'),
  email:    s('email!'),
  optional: 'string',
})

// omit() preserves required status for remaining fields
const partial  = SchemaUtils.omit(userSchema, ['optional'])
const allOptional = SchemaUtils.partial(userSchema)

console.log('advanced.partial.required  =', partial.required?.sort().join(','))       // 'email,name'
console.log('advanced.partial.noOpt     =', !partial.required?.includes('optional'))  // true
console.log('advanced.allOpt.required   =', allOptional.required)                     // undefined / []

// ============================================================
// 4. clone() — deep independent copy (mutations don't cross-contaminate)
// ============================================================

const original = s({ id: 'uuid!', name: 'string!' })
const cloned   = SchemaUtils.clone(original)

// Modify the clone's required array
if (cloned.required) { cloned.required.push('__extra__') }

console.log('advanced.clone.isNew       =', cloned !== original)                          // true
console.log('advanced.clone.noLeak      =', !original.required?.includes('__extra__'))    // true

// ============================================================
// 5. validateNestingDepth() — counts object property depth
// ============================================================

const shallowSchema = s({
  name:  'string!',
  email: 'email!',
})

const deepSchema = s({
  a: s({
    b: s({
      c: { d: 'string!' },
    }),
  }),
})

const shallowResult = DslBuilder.validateNestingDepth(shallowSchema, 5)
const deepResult    = DslBuilder.validateNestingDepth(deepSchema, 2)

console.log('advanced.shallow.depth     =', shallowResult.depth)    // 1
console.log('advanced.shallow.valid     =', shallowResult.valid)    // true
console.log('advanced.deep.depth        =', deepResult.depth)       // 4
console.log('advanced.deep.valid        =', deepResult.valid)       // false (exceeds limit 2)