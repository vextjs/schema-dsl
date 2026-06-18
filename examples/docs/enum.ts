import { s, validate } from '../../dist/pure.js'

// ============================================================
// 1. String enum — pipe-separated values (most common form)
// ============================================================

const statusSchema = s({ status: 'active|inactive|pending|suspended!' })

console.log('enum.string.valid   =', validate(statusSchema, { status: 'active' }).valid)    // true
console.log('enum.string.invalid =', validate(statusSchema, { status: 'deleted' }).valid)   // false
console.log('enum.string.missing =', validate(statusSchema, {}).valid)                       // false — required

// Optional enum: no '!' → field may be absent
const optionalStatus = s({ status: 'active|inactive' })
console.log('enum.string.optional.absent =', validate(optionalStatus, {}).valid)             // true
console.log('enum.string.optional.null =',   validate(optionalStatus, { status: null }).valid) // false

// ============================================================
// 2. Numeric enum — enum:number:v1|v2|...
// ============================================================

const prioritySchema = s({ priority: 'enum:number:1|2|3|4|5!' })

console.log('enum.number.valid   =', validate(prioritySchema, { priority: 3 }).valid)      // true
console.log('enum.number.invalid =', validate(prioritySchema, { priority: 6 }).valid)      // false
// Top-level validate() smart-coerces numeric enum strings by default
console.log('enum.number.string  =', validate(prioritySchema, { priority: '3' }).valid)   // true
// Disable coercion when exact input types are required
console.log('enum.number.strict  =',
  validate(prioritySchema, { priority: '3' }, { coerce: false }).valid)                   // false

// ============================================================
// 3. Boolean enum — enum:boolean:true|false
// ============================================================

const flagSchema = s({ featureEnabled: 'enum:boolean:true|false' })

console.log('enum.boolean.true  =', validate(flagSchema, { featureEnabled: true }).valid)  // true
console.log('enum.boolean.false =', validate(flagSchema, { featureEnabled: false }).valid) // true
console.log('enum.boolean.str   =', validate(flagSchema, { featureEnabled: 'yes' }).valid) // false

// ============================================================
// 4. Enum with custom error message via .error()
// ============================================================

const roleSchema = s({
  role: s('admin|user|guest!').label('Role').error({ enum: 'Role must be admin, user, or guest' }),
})

const roleResult = validate(roleSchema, { role: 'superuser' })
console.log('enum.custom.error.valid =',   roleResult.valid)                                  // false
console.log('enum.custom.error.message =', roleResult.errors?.[0]?.message)                  // custom message

// ============================================================
// 5. Array of enum — array<enum:...>
// ============================================================

const tagsSchema = s({
  tags: 'array<enum:tech|design|business|lifestyle>!',
})

console.log('enum.array.valid   =',
  validate(tagsSchema, { tags: ['tech', 'design'] }).valid)               // true
console.log('enum.array.invalid =',
  validate(tagsSchema, { tags: ['tech', 'unknown'] }).valid)              // false — unknown not in enum
console.log('enum.array.empty   =',
  validate(tagsSchema, { tags: [] }).valid)                               // true — empty array is valid

// ============================================================
// 6. Enum with default value — useDefaults option
// ============================================================

const defaultStatusSchema = s({
  status: s('active|inactive|pending').label('Status').default('pending'),
})

const withDefault = validate(defaultStatusSchema, {}, { useDefaults: true })
console.log('enum.default.applied =', (withDefault.data as any)?.status) // 'pending'

// ============================================================
// 7. Full form: combined schema with multiple enum fields
// ============================================================

const articleSchema = s({
  title:       'string:5-200!',
  status:      'draft|review|published|archived!',
  priority:    'enum:number:1|2|3',
  category:    'tech|design|ops|marketing',
  tags:        'array<enum:news|tutorial|opinion|case-study>',
  visibility:  s('public|private|unlisted').default('public'),
})

const article = validate(articleSchema, {
  title:      'Getting Started with Schema-DSL',
  status:     'published',
  priority:   2,
  category:   'tech',
  tags:       ['tutorial', 'news'],
}, { useDefaults: true })

console.log('enum.full.valid         =', article.valid)
console.log('enum.full.visibility    =', (article.data as any)?.visibility)  // 'public' (default)

const badArticle = validate(articleSchema, {
  title:    'My Post',
  status:   'hidden',           // not in enum
  priority: 10,                 // not in [1,2,3]
  tags:     ['spam'],           // not in enum
})
console.log('enum.full.invalid.valid  =', badArticle.valid)                  // false
console.log('enum.full.invalid.errors =', badArticle.errors?.length)         // 3
