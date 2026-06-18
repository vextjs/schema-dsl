import { s, validate, SchemaHelper } from '../../dist/pure.js'

// ============================================================
// SchemaHelper — static helpers for schema analysis
// ============================================================

const userSchema = s({
  id:       'objectId!',
  username: s('string:3-32!').label('Username'),
  email:    s('email!').label('Email'),
  profile: s({
    bio:    'string:500',
    avatar: 'url',
    social: s({
      twitter: 'string',
      github:  'string',
    }),
  }),
  tags: s('array<string>').label('Tags'),
})

// ============================================================
// 1. isValidSchema — structural check
// ============================================================

console.log('schema-helper.isValid.schema   =', SchemaHelper.isValidSchema(userSchema))  // true
console.log('schema-helper.isValid.null     =', SchemaHelper.isValidSchema(null))         // false
console.log('schema-helper.isValid.empty    =', SchemaHelper.isValidSchema({}))           // false
console.log('schema-helper.isValid.typed    =', SchemaHelper.isValidSchema({ type: 'string' }))  // true

// ============================================================
// 2. generateSchemaId — stable content hash
// ============================================================

const id1 = SchemaHelper.generateSchemaId(userSchema)
const id2 = SchemaHelper.generateSchemaId(userSchema)
const otherId = SchemaHelper.generateSchemaId(s({ name: 'string!' }))

console.log('schema-helper.id.stable       =', id1 === id2)       // true (same schema → same id)
console.log('schema-helper.id.unique       =', id1 !== otherId)   // true (different schemas)
console.log('schema-helper.id.format       =', /^schema_[a-z0-9]+$/.test(id1))  // true

// ============================================================
// 3. cloneSchema — deep independent copy
// ============================================================

const cloned = SchemaHelper.cloneSchema(userSchema)

console.log('schema-helper.clone.equal     =', SchemaHelper.compareSchemas(userSchema, cloned))  // true
console.log('schema-helper.clone.identity  =', cloned !== userSchema)                           // true

// ============================================================
// 4. flattenSchema — dot-notation field index
// ============================================================

const flattened = SchemaHelper.flattenSchema(userSchema)

console.log('schema-helper.flat.keys       =', Object.keys(flattened).sort().join(','))
// 'avatar,bio,email,github,id,tags,twitter,username'  (nested profile.* collapsed)

// ============================================================
// 5. getFieldPaths — nested paths with array notation
// ============================================================

const paths = SchemaHelper.getFieldPaths(userSchema)

console.log('schema-helper.paths.hasNested =', paths.some(p => p.includes('.')))  // true
console.log('schema-helper.paths.has tags  =', paths.includes('tags'))             // true

// ============================================================
// 6. extractRequiredFields — all required (including nested)
// ============================================================

const required = SchemaHelper.extractRequiredFields(userSchema)

console.log('schema-helper.required.hasId  =', required.includes('id'))       // true
console.log('schema-helper.required.has email =', required.includes('email')) // true
console.log('schema-helper.required.noBio  =', !required.includes('bio'))     // true (optional)

// ============================================================
// 7. summarizeSchema — quick metadata snapshot
// ============================================================

const summary = SchemaHelper.summarizeSchema(userSchema)

console.log('schema-helper.summary.fields  =', summary.fieldCount)        // >= 5
console.log('schema-helper.summary.nested  =', summary.hasNested)         // true
console.log('schema-helper.summary.complex =', summary.complexity > 0)    // true

// ============================================================
// 8. simplifySchema — strip empty bookkeeping noise
// ============================================================

const noisy = { type: 'object' as const, $schema: 'draft-07', properties: {}, required: [] }
const clean = SchemaHelper.simplifySchema(noisy)

console.log('schema-helper.simplify.$schema  =', !('$schema' in clean))     // true
console.log('schema-helper.simplify.props    =', !('properties' in clean))  // true
console.log('schema-helper.simplify.required =', !('required' in clean))    // true

// ============================================================
// 9. isValidPropertyName — property name guard
// ============================================================

console.log('schema-helper.name.valid       =', SchemaHelper.isValidPropertyName('userId'))      // true
console.log('schema-helper.name.underscore  =', SchemaHelper.isValidPropertyName('_private'))    // true
console.log('schema-helper.name.invalid     =', SchemaHelper.isValidPropertyName('123bad'))      // false
console.log('schema-helper.name.space       =', SchemaHelper.isValidPropertyName('has space'))   // false

// ============================================================
// 10. Validate with a schema built from library fields
// ============================================================

const result = validate(userSchema, {
  id:       '507f1f77bcf86cd799439011',
  username: 'alice_01',
  email:    'alice@example.com',
  profile:  { bio: 'Hi!', social: {} },
})

console.log('schema-helper.validate.valid   =', result.valid)   // true