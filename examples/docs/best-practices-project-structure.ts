import { s, validate } from '../../dist/pure.js'

// ============================================================
// Best practices — project structure
//
// Recommended layout:
//   src/
//     schemas/
//       fields.ts        ← shared field builders
//       user.schemas.ts  ← domain-specific schemas
//       order.schemas.ts
//     middleware/
//       validate.ts      ← validation middleware factory
// ============================================================

// ============================================================
// 1. User schemas (register / login / profile / admin)
// ============================================================

const userSchemas = {
  register: s({
    username: s('string:3-32!')
      .pattern(/^[a-zA-Z0-9_]+$/)
      .label('Username')
      .error({ pattern: 'Username may only contain letters, digits and underscores' }),
    email:    s('email!').label('Email'),
    password: s('string:8-64!')
      .pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
      .label('Password')
      .error({ pattern: 'Password must be at least 8 chars and include letters and digits' }),
  }),

  login: s({
    username: 'string!',
    password: 'string!',
  }),

  profile: s({
    displayName: s('string:2-48').label('Display Name'),
    bio:         s('string:0-300').label('Bio'),
    website:     s('url').label('Website'),
  }),

  admin: s({
    username: s('string:3-32!').pattern(/^[a-zA-Z0-9_]+$/),
    email:    s('email!'),
    password: s('string:8-64!').pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/),
    role:     'admin|super-admin',
  }),
}

// ============================================================
// 2. Order schemas
// ============================================================

const orderSchemas = {
  create: s({
    productId: 'string:1-64!',
    quantity:  'integer:1-999!',
    shippingAddress: {
      street:  'string:1-128!',
      city:    'string:1-64!',
      country: 'string:2-2!',
    },
  }),

  update: s({
    orderId: 'string!',
    status:  'pending|confirmed|shipped|delivered|cancelled',
  }),
}

// ============================================================
// 3. Validate each schema
// ============================================================

console.log('project-structure.register.valid   =', validate(userSchemas.register, {
  username: 'structure_user',
  email:    'structure@example.com',
  password: 'Pass2026A',
}).valid)  // true

console.log('project-structure.login.valid      =', validate(userSchemas.login, {
  username: 'structure_user',
  password: 'any-password',
}).valid)  // true

console.log('project-structure.login.missingPw  =', validate(userSchemas.login, {
  username: 'structure_user',
}).valid)  // false

console.log('project-structure.admin.wrongRole  =', validate(userSchemas.admin, {
  username: 'admin_01',
  email:    'admin@example.com',
  password: 'SecurePass1',
  role:     'user',
}).valid)  // false

console.log('project-structure.order.create.valid =', validate(orderSchemas.create, {
  productId: 'PROD-001',
  quantity:  2,
  shippingAddress: { street: '123 Main St', city: 'Springfield', country: 'US' },
}).valid)  // true

console.log('project-structure.order.update.valid =', validate(orderSchemas.update, {
  orderId: 'ORD-999',
  status:  'shipped',
}).valid)  // true