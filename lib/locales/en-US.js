module.exports = {
  required: '{{#label}} is required',
  type: '{{#label}} should be {{#expected}}, got {{#actual}}',
  min: '{{#label}} length must be at least {{#limit}}',
  max: '{{#label}} length must be at most {{#limit}}',
  length: '{{#label}} length must be exactly {{#expected}}',
  pattern: '{{#label}} format is invalid',
  enum: '{{#label}} must be one of: {{#allowed}}',
  custom: '{{#label}} validation failed: {{#message}}',
  circular: 'Circular reference detected at {{#label}}',
  'max-depth': 'Maximum recursion depth ({{#depth}}) exceeded at {{#label}}',
  exception: '{{#label}} validation exception: {{#message}}',

  // Patterns
  'pattern.phone': 'Invalid phone number',
  'pattern.phone.international': 'Invalid international phone number',

  'pattern.idCard': 'Invalid ID card number',

  'pattern.creditCard': 'Invalid credit card number',
  'pattern.creditCard.visa': 'Invalid Visa card number',
  'pattern.creditCard.mastercard': 'Invalid Mastercard number',
  'pattern.creditCard.amex': 'Invalid American Express card number',
  'pattern.creditCard.discover': 'Invalid Discover card number',
  'pattern.creditCard.jcb': 'Invalid JCB card number',
  'pattern.creditCard.unionpay': 'Invalid UnionPay card number',

  'pattern.licensePlate': 'Invalid license plate number',

  'pattern.postalCode': 'Invalid postal code',

  'pattern.passport': 'Invalid passport number',

  // New Types
  'pattern.objectId': 'Invalid ObjectId',
  'pattern.hexColor': 'Invalid Hex Color',
  'pattern.macAddress': 'Invalid MAC Address',
  'pattern.cron': 'Invalid Cron Expression',
  'pattern.slug': 'URL slug can only contain lowercase letters, numbers, and hyphens',

  // Username & Password
  'pattern.username': 'Username must start with a letter and contain only letters, numbers, and underscores',
  'pattern.password.weak': 'Password must be at least 6 characters',
  'pattern.password.medium': 'Password must be at least 8 characters and contain letters and numbers',
  'pattern.password.strong': 'Password must be at least 8 characters and contain uppercase, lowercase letters and numbers',
  'pattern.password.veryStrong': 'Password must be at least 10 characters and contain uppercase, lowercase letters, numbers and special characters',

  // Unknown error fallback
  'UNKNOWN_ERROR': 'Unknown validation error',

  // Custom validation
  'CUSTOM_VALIDATION_FAILED': 'Validation failed',
  'ASYNC_VALIDATION_NOT_SUPPORTED': 'Async validation not supported in synchronous validate()',
  'VALIDATE_MUST_BE_FUNCTION': 'validate must be a function',

  // Formats
  'format.email': '{{#label}} must be a valid email address',
  'format.url': '{{#label}} must be a valid URL',
  'format.uuid': '{{#label}} must be a valid UUID',
  'format.date': '{{#label}} must be a valid date (YYYY-MM-DD)',
  'format.datetime': '{{#label}} must be a valid date-time (ISO 8601)',
  'format.time': '{{#label}} must be a valid time (HH:mm:ss)',
  'format.ipv4': '{{#label}} must be a valid IPv4 address',
  'format.ipv6': '{{#label}} must be a valid IPv6 address'
};
