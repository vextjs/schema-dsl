module.exports = {
  // Generic
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

  // Conditional (ConditionalBuilder)
  'conditional.underAge': 'Minors cannot register',
  'conditional.blocked': 'Account has been blocked',
  'conditional.notAllowed': 'Registration not allowed',

  // I18nError - General errors (v1.1.1)
  'error.notFound': '{{#resource}} not found',
  'error.forbidden': 'Access to {{#resource}} is forbidden',
  'error.unauthorized': 'Unauthorized, please log in',
  'error.invalid': 'Invalid {{#field}}',
  'error.duplicate': '{{#resource}} already exists',
  'error.conflict': 'Operation conflict: {{#reason}}',

  // I18nError - Account related (v1.1.1)
  'account.notFound': 'Account not found',
  'account.inactive': 'Account is inactive',
  'account.banned': 'Account has been banned',
  'account.insufficientBalance': 'Insufficient balance, current: {{#balance}}, required: {{#required}}',
  'account.insufficientCredits': 'Insufficient credits, current: {{#credits}}, required: {{#required}}',

  // I18nError - User related (v1.1.1)
  'user.notFound': 'User not found',
  'user.notVerified': 'User is not verified',
  'user.noPermission': 'No admin permission',

  // I18nError - Order related (v1.1.1)
  'order.notPaid': 'Order not paid',
  'order.paymentMissing': 'Payment information missing',
  'order.addressMissing': 'Shipping address missing',

  // Formats
  'format.email': '{{#label}} must be a valid email address',
  'format.url': '{{#label}} must be a valid URL',
  'format.uuid': '{{#label}} must be a valid UUID',
  'format.date': '{{#label}} must be a valid date (YYYY-MM-DD)',
  'format.datetime': '{{#label}} must be a valid date-time (ISO 8601)',
  'format.time': '{{#label}} must be a valid time (HH:mm:ss)',
  'format.ipv4': '{{#label}} must be a valid IPv4 address',
  'format.ipv6': '{{#label}} must be a valid IPv6 address',
  'format.binary': '{{#label}} must be a valid base64 string',

  // String
  'string.hostname': '{{#label}} must be a valid hostname',
  'string.pattern': '{{#label}} format does not match required pattern',
  'string.enum': '{{#label}} must be one of: {{#valids}}',
  // v1.0.2
  'string.length': '{{#label}} length must be exactly {{#limit}} characters',
  'string.alphanum': '{{#label}} must only contain alphanumeric characters',
  'string.trim': '{{#label}} must not have leading or trailing whitespace',
  'string.lowercase': '{{#label}} must be lowercase',
  'string.uppercase': '{{#label}} must be uppercase',

  // Number
  'number.base': '{{#label}} must be a number',
  'number.min': '{{#label}} must be greater than or equal to {{#limit}}',
  'number.max': '{{#label}} must be less than or equal to {{#limit}}',
  'number.integer': '{{#label}} must be an integer',
  'number.positive': '{{#label}} must be a positive number',
  'number.negative': '{{#label}} must be a negative number',
  // v1.0.2
  'number.precision': '{{#label}} must have at most {{#limit}} decimal places',
  'number.port': '{{#label}} must be a valid port number (1-65535)',

  // Boolean
  'boolean.base': '{{#label}} must be a boolean',

  // Object
  'object.base': '{{#label}} must be an object',
  'object.min': '{{#label}} must have at least {{#limit}} properties',
  'object.max': '{{#label}} must have at most {{#limit}} properties',
  'object.unknown': '{{#label}} contains unknown property: {{#key}}',
  // v1.0.2
  'object.missing': '{{#label}} is missing required properties',
  'object.schema': '{{#label}} contains additional properties',

  // Array
  'array.base': '{{#label}} must be an array',
  'array.min': '{{#label}} must have at least {{#limit}} items',
  'array.max': '{{#label}} must have at most {{#limit}} items',
  'array.length': '{{#label}} must have exactly {{#limit}} items',
  'array.unique': '{{#label}} must not contain duplicate items',
  // v1.0.2
  'array.sparse': '{{#label}} must not be a sparse array',
  'array.includesRequired': '{{#label}} must include required items',

  // Date
  'date.base': '{{#label}} must be a valid date',
  'date.min': '{{#label}} must be no earlier than {{#limit}}',
  'date.max': '{{#label}} must be no later than {{#limit}}',
  // v1.0.2
  'date.format': '{{#label}} date format is invalid',
  'date.greater': '{{#label}} must be after {{#limit}}',
  'date.less': '{{#label}} must be before {{#limit}}',

  // Any
  'any.required': '{{#label}} is required',
  'any.invalid': '{{#label}} contains an invalid value',
  'any.only': '{{#label}} must match {{#valids}}',
  'any.unknown': 'Field {{#key}} is not allowed',

  // Patterns (Legacy/Specific)
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
  'pattern.objectId': 'Invalid ObjectId',
  'pattern.hexColor': 'Invalid Hex Color',
  'pattern.macAddress': 'Invalid MAC Address',
  'pattern.cron': 'Invalid Cron Expression',
  'pattern.slug': 'URL slug can only contain lowercase letters, numbers, and hyphens',
  // v1.0.2 新增
  'pattern.domain': '{{#label}} must be a valid domain name',
  'pattern.ip': '{{#label}} must be a valid IP address',
  'pattern.base64': '{{#label}} must be a valid Base64 string',
  'pattern.jwt': '{{#label}} must be a valid JWT token',
  'pattern.json': '{{#label}} must be a valid JSON string',

  // Username & Password
  'pattern.username': 'Username must start with a letter and contain only letters, numbers, and underscores',
  'pattern.password.weak': 'Password must be at least 6 characters',
  'pattern.password.medium': 'Password must be at least 8 characters and contain letters and numbers',
  'pattern.password.strong': 'Password must be at least 8 characters and contain uppercase, lowercase letters and numbers',
  'pattern.password.veryStrong': 'Password must be at least 10 characters and contain uppercase, lowercase letters, numbers and special characters',

  // Union Type
  'pattern.emailOrPhone': 'Must be an email or phone number',
  'pattern.usernameOrEmail': 'Must be a username or email',
  'pattern.httpOrHttps': 'Must be a URL starting with http or https',

  // oneOf (cross-type union) - v1.1.0
  oneOf: '{{#label}} must match one of the following types',
  'oneOf.invalid': '{{#label}} value does not match any allowed type',

  // Unknown error fallback
  'UNKNOWN_ERROR': 'Unknown validation error',

  // Custom validation
  'CUSTOM_VALIDATION_FAILED': 'Validation failed',
  'ASYNC_VALIDATION_NOT_SUPPORTED': 'Async validation not supported in synchronous validate()',
  'VALIDATE_MUST_BE_FUNCTION': 'validate must be a function'
};
