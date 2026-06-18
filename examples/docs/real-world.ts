import { s, validate, validateAsync, ObjectDslBuilder, ValidationError, DslBuilder, type DslDefinition, type JSONSchema } from '../../dist/pure.js'

function objectDsl(definition: DslDefinition): ObjectDslBuilder {
  return new ObjectDslBuilder(s(definition) as JSONSchema)
}

// ============================================================
// Real-world scenario: E-commerce platform
//
// Entities:  User · Product · Order · CartItem
// Shows:     nested objects, enums, conditionals, coercion,
//            async custom validators, defaults, and exporters
// ============================================================

// ============================================================
// 1. User schema
// ============================================================

const userSchema = s({
  id:          'uuid!',
  username:    s('string:3-32!').label('Username'),
  email:       s('email!').label('Email'),
  password:    s('string:8-64!').label('Password'),
  role:        s('customer|seller|admin').default('customer'),
  profile: {
    firstName: 'string:1-50',
    lastName:  'string:1-50',
    phone:     'phone:cn',
    avatar:    'url',
    bio:       'string:500',
  },
  address: {
    street:  'string:5-200',
    city:    'string:2-50',
    zip:     'string:3-10',
    country: 'string:2-3',
  },
  isVerified:  s('boolean').default(false),
  createdAt:   'datetime!',
  updatedAt:   'datetime',
})

const validUser = validate(userSchema, {
  id:          '550e8400-e29b-41d4-a716-446655440000',
  username:    'alice_shop',
  email:       'alice@example.com',
  password:    'SecureP4ss!',
  profile:     { firstName: 'Alice', lastName: 'Chen' },
  createdAt:   '2025-01-15T10:00:00Z',
}, { useDefaults: true })

console.log('real-world.user.valid            =', validUser.valid)                         // true
console.log('real-world.user.role.default     =', (validUser.data as any)?.role)           // 'customer'
console.log('real-world.user.verified.default =', (validUser.data as any)?.isVerified)     // false

const invalidUser = validate(userSchema, {
  username: 'x',   // too short
  email:    'bad', // invalid format
  password: '123', // too short
  createdAt: 'not-a-date',
}, { allErrors: true })
console.log('real-world.user.invalid.errors   =', (invalidUser.errors?.length ?? 0) >= 4) // true

// ============================================================
// 2. Product schema with conditional pricing fields
// ============================================================

const productSchema = s({
  id:          'uuid!',
  sku:         s('alphanum:5-20!').label('SKU'),
  name:        s('string:2-200!').label('Product Name'),
  description: 'string:5000',
  category:    'electronics|apparel|home|books|sports|food!',
  price:       'number:0.01-!',
  salePrice:   'number:0.01-',         // optional, must be less than price (business rule)
  currency:    s('USD|EUR|CNY|GBP').default('USD'),
  stock:       'integer:0-!',
  weight:      'number:0-',
  dimensions: {
    width:  'number:0-',
    height: 'number:0-',
    depth:  'number:0-',
    unit:   s('cm|in|mm').default('cm'),
  },
  images:      'array<url>',
  isPublished: s('boolean').default(false),
  tags:        'array<string>',
})

const validProduct = validate(productSchema, {
  id:       '660e8400-e29b-41d4-a716-446655440001',
  sku:      'ELEC12345',
  name:     'Wireless Headphones Pro',
  category: 'electronics',
  price:    149.99,
  stock:    250,
  images:   ['https://cdn.example.com/headphones-1.jpg'],
  tags:     ['wireless', 'audio', 'premium'],
}, { useDefaults: true })

console.log('real-world.product.valid         =', validProduct.valid)                       // true
console.log('real-world.product.currency.def  =', (validProduct.data as any)?.currency)    // 'USD'

// ============================================================
// 3. Cart item schema with product reference
// ============================================================

const cartItemSchema = s({
  productId:  'uuid!',
  variantId:  'uuid',
  quantity:   'integer:1-999!',
  unitPrice:  'number:0.01-!',
  discount:   'number:0-100',
  note:       'string:200',
})

// ============================================================
// 4. Order schema — complex with nested items and shipping
// ============================================================

const orderSchema = s({
  id:          'uuid!',
  userId:      'uuid!',
  status:      s('pending|confirmed|processing|shipped|delivered|cancelled|refunded')
                 .default('pending'),
  items:       'array<object>!',   // CartItem array — validated separately
  shipping: {
    method:    'standard|express|overnight!',
    address:   'string:5-300!',
    city:      'string:2-50!',
    country:   'string:2-3!',
    trackingNo: 'string:5-50',
    estimatedAt: 'datetime',
    deliveredAt: 'datetime',
  },
  payment: {
    method:    'card|paypal|crypto|bank_transfer!',
    status:    s('pending|processing|completed|failed|refunded').default('pending'),
    paidAt:    'datetime',
    refundedAt: 'datetime',
  },
  subtotal:    'number:0-!',
  shippingFee: s('number:0-').default(0),
  discount:    s('number:0-').default(0),
  total:       'number:0.01-!',
  currency:    s('USD|EUR|CNY|GBP').default('USD'),
  notes:       'string:1000',
  createdAt:   'datetime!',
  updatedAt:   'datetime',
})

const validOrder = validate(orderSchema, {
  id:       '770e8400-e29b-41d4-a716-446655440002',
  userId:   '550e8400-e29b-41d4-a716-446655440000',
  items:    [{ productId: '660e8400-e29b-41d4-a716-446655440001', quantity: 2, unitPrice: 149.99 }],
  shipping: { method: 'express', address: '123 Main St', city: 'San Francisco', country: 'US' },
  payment:  { method: 'card' },
  subtotal: 299.98,
  total:    299.98,
  createdAt: '2025-01-15T14:30:00Z',
}, { useDefaults: true })

console.log('real-world.order.valid           =', validOrder.valid)                         // true
console.log('real-world.order.status.default  =', (validOrder.data as any)?.status)        // 'pending'
console.log('real-world.order.fee.default     =', (validOrder.data as any)?.shippingFee)   // 0
console.log('real-world.order.currency.default=', (validOrder.data as any)?.currency)      // 'USD'

// ============================================================
// 5. ObjectDslBuilder — strict schema definition for product creation API
// ============================================================

const productCreateSchema = objectDsl({
  name:     'string:2-200!',
  sku:      'alphanum:5-20!',
  price:    'number:0.01-!',
  category: 'electronics|apparel|home|books!',
  stock:    'integer:0-!',
}).strict()                          // disallow extra properties
  .requireAll()                      // all fields required
  .toSchema()

const createResult = validate(productCreateSchema as any, {
  name: 'Smart Watch X3', sku: 'WTCH001', price: 299, category: 'electronics', stock: 100,
})
console.log('real-world.create.valid          =', createResult.valid)  // true

const createWithExtra = validate(productCreateSchema as any, {
  name: 'Smart Watch X3', sku: 'WTCH001', price: 299, category: 'electronics', stock: 100,
  internalNote: 'should be stripped',  // extra property
})
// strict() means extra properties cause a validation failure (not removed)
console.log('real-world.create.strict.extra   =', createWithExtra.valid)  // false

// ============================================================
// 6. Async validation — check SKU uniqueness before creating product
// ============================================================

const existingSkus = new Set(['ELEC12345', 'WTCH001', 'BOOK999X'])

const productAsyncSchema = s({
  sku:   new DslBuilder('alphanum:5-20!').custom(async (value: unknown) => {
    // Simulate async database lookup
    const taken = existingSkus.has(value as string)
    return !taken || `SKU '${value}' is already in use — choose a different SKU`
  }),
  name:  'string:2-200!',
  price: 'number:0.01-!',
})

// New SKU → passes
const newProduct = await validateAsync(productAsyncSchema, {
  sku: 'NEWPROD1', name: 'New Widget', price: 49.99,
})
console.log('real-world.async.sku.new         =', (newProduct as any).sku)  // 'NEWPROD1'

// Duplicate SKU → throws
try {
  await validateAsync(productAsyncSchema, {
    sku: 'WTCH001', name: 'Clone Watch', price: 99,
  })
} catch (err) {
  if (err instanceof ValidationError) {
    console.log('real-world.async.sku.duplicate   =', err.errors[0]?.message?.includes('already in use'))  // true
  }
}

// ============================================================
// 7. Coercion of query parameters (typical HTTP endpoint input)
// ============================================================

const searchQuerySchema = s({
  page:     s('integer:1-').default(1),
  limit:    s('integer:1-100').default(20),
  minPrice: 'number:0-',
  maxPrice: 'number:0-',
  category: 'electronics|apparel|home|books|sports|food',
  inStock:  'boolean',
})

// Simulated HTTP query string — all values are strings
const queryResult = validate(searchQuerySchema, {
  page:     '2',
  limit:    '50',
  minPrice: '10.00',
  maxPrice: '500.00',
  category: 'electronics',
  inStock:  'true',
}, { smartCoerce: true, useDefaults: true })

console.log('real-world.query.valid           =', queryResult.valid)                          // true
console.log('real-world.query.page.coerced    =', (queryResult.data as any)?.page)            // 2 (number)
console.log('real-world.query.limit.coerced   =', (queryResult.data as any)?.limit)           // 50 (number)
console.log('real-world.query.inStock.coerced =', (queryResult.data as any)?.inStock)         // true (boolean)
