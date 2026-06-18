import { s, validate, MarkdownExporter } from '../../dist/pure.js'

// ============================================================
// MarkdownExporter — generate human-readable API docs from schemas
//
// MarkdownExporter.export(schema, options) → Markdown string
// Options:
//   title    — document heading
//   locale   — 'zh-CN' | 'en-US' (controls type labels & table headers)
//   include  — which sections to include (defaults to all)
// ============================================================

// ============================================================
// 1. User registration form — bilingual docs
// ============================================================

const userRegSchema = s({
  username:    s('string:3-32!').label('Username').description('Unique username, letters/digits/underscore only'),
  email:       s('email!').label('Email').description('Login email address'),
  password:    s('string:8-64!').label('Password').description('At least 8 chars, mix of upper/lower/digit'),
  displayName: s('string:1-50').label('Display Name').description('Shown on profile page, optional'),
  age:         s('integer:18-120').label('Age'),
  role:        s('admin|user|guest').label('Role').default('user'),
  acceptTerms: s('boolean!').label('Accept Terms'),
})

const enDoc = MarkdownExporter.export(userRegSchema as any, {
  title:  'User Registration — API Reference',
  locale: 'en-US',
})

// zh-CN locale — column headers will render in Chinese
const zhDoc = MarkdownExporter.export(userRegSchema as any, {
  title:  'User Registration API Reference',
  locale: 'zh-CN',
})

console.log('markdown.en.hasTitle    =', enDoc.includes('User Registration'))           // true
console.log('markdown.en.hasEmail    =', enDoc.toLowerCase().includes('email'))          // true
console.log('markdown.zh.hasTitle    =', zhDoc.includes('User Registration'))            // true (same title, zh-CN locale affects column headers only)
console.log('markdown.zh.hasEmail    =', zhDoc.toLowerCase().includes('email'))          // true

// ============================================================
// 2. Product schema — export to Markdown for Swagger-like docs
// ============================================================

const productSchema = s({
  sku:         s('alphanum:5-20!').label('SKU').description('Unique product SKU'),
  name:        s('string:2-200!').label('Product Name'),
  price:       s('number:0.01-!').label('Price').description('Unit price in CNY'),
  stock:       s('integer:0-!').label('Stock'),
  category:    s('electronics|clothing|books|home').label('Category'),
  description: s('string:10-2000').label('Description').description('Product description (optional)'),
})

const productDoc = MarkdownExporter.export(productSchema as any, {
  title:  'Product Schema Reference',
  locale: 'en-US',
})

console.log('markdown.product.hasSKU   =', productDoc.includes('SKU'))               // true
console.log('markdown.product.hasPrice =', productDoc.includes('Price'))              // true
console.log('markdown.product.length   =', productDoc.length > 200)                   // true

// ============================================================
// 3. Nested object schema (via DslAdapter)
// ============================================================

const addressSchema = s({
  street:  s('string:5-100!').label('Street'),
  city:    s('string:2-50!').label('City'),
  country: s('string:2-3!').label('Country Code'),
  zipCode: s('string:3-10').label('Zip Code'),
})

const addressDoc = MarkdownExporter.export(addressSchema as any, {
  title:  'Address Object',
  locale: 'en-US',
})

console.log('markdown.address.hasStreet  =', addressDoc.includes('Street'))          // true
console.log('markdown.address.hasCountry =', addressDoc.includes('Country Code'))    // true

// ============================================================
// 4. Validate that exports are non-empty valid strings
// ============================================================

const simpleSchema = s({ id: 'uuid!', name: 'string!' })
const out = MarkdownExporter.export(simpleSchema as any, { title: 'Simple', locale: 'en-US' })

console.log('markdown.simple.isString  =', typeof out)              // 'string'
console.log('markdown.simple.notEmpty  =', out.length > 50)         // true
console.log('markdown.simple.hasMarkup =', out.includes('|'))       // true (table syntax)

// Verify with validate() that the source schema itself still works
const testResult = validate(simpleSchema, { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Test' })
console.log('markdown.schema.stillValid =', testResult.valid)        // true