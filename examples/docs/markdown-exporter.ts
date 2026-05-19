import { dsl, validate, MarkdownExporter } from '../../dist/index.js'

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

const userRegSchema = dsl({
  username:    dsl('string:3-32!').label('Username').description('Unique username, letters/digits/underscore only'),
  email:       dsl('email!').label('Email').description('Login email address'),
  password:    dsl('string:8-64!').label('Password').description('At least 8 chars, mix of upper/lower/digit'),
  displayName: dsl('string:1-50').label('Display Name').description('Shown on profile page, optional'),
  age:         dsl('integer:18-120').label('Age'),
  role:        dsl('admin|user|guest').label('Role').default('user'),
  acceptTerms: dsl('boolean!').label('Accept Terms'),
})

const enDoc = MarkdownExporter.export(userRegSchema as any, {
  title:  'User Registration — API Reference',
  locale: 'en-US',
})

const zhDoc = MarkdownExporter.export(userRegSchema as any, {
  title:  '用户注册接口文档',
  locale: 'zh-CN',
})

console.log('markdown.en.hasTitle    =', enDoc.includes('User Registration'))           // true
console.log('markdown.en.hasEmail    =', enDoc.toLowerCase().includes('email'))          // true
console.log('markdown.zh.hasTitle    =', zhDoc.includes('用户注册接口文档'))              // true
console.log('markdown.zh.hasRequired =', zhDoc.includes('是'))                           // true (required column)

// ============================================================
// 2. Product schema — export to Markdown for Swagger-like docs
// ============================================================

const productSchema = dsl({
  sku:         dsl('alphanum:5-20!').label('SKU').description('Unique product SKU'),
  name:        dsl('string:2-200!').label('Product Name'),
  price:       dsl('number:0.01-!').label('Price').description('Unit price in CNY'),
  stock:       dsl('integer:0-!').label('Stock'),
  category:    dsl('electronics|clothing|books|home').label('Category'),
  description: dsl('string:10-2000').label('Description').description('Product description (optional)'),
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

const addressSchema = dsl({
  street:  dsl('string:5-100!').label('Street'),
  city:    dsl('string:2-50!').label('City'),
  country: dsl('string:2-3!').label('Country Code'),
  zipCode: dsl('string:3-10').label('Zip Code'),
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

const simpleSchema = dsl({ id: 'uuid!', name: 'string!' })
const out = MarkdownExporter.export(simpleSchema as any, { title: 'Simple', locale: 'en-US' })

console.log('markdown.simple.isString  =', typeof out)              // 'string'
console.log('markdown.simple.notEmpty  =', out.length > 50)         // true
console.log('markdown.simple.hasMarkup =', out.includes('|'))       // true (table syntax)

// Verify with validate() that the source schema itself still works
const testResult = validate(simpleSchema, { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Test' })
console.log('markdown.schema.stillValid =', testResult.valid)        // true