module.exports = {
  // Generic
  required: '{{#label}} es obligatorio',
  type: '{{#label}} debe ser de tipo {{#expected}}, pero se obtuvo {{#actual}}',
  min: 'La longitud de {{#label}} debe ser al menos {{#limit}}',
  max: 'La longitud de {{#label}} debe ser como máximo {{#limit}}',
  length: 'La longitud de {{#label}} debe ser exactamente {{#expected}}',
  pattern: 'El formato de {{#label}} no es válido',
  enum: '{{#label}} debe ser uno de: {{#allowed}}',
  custom: 'Validación fallida para {{#label}}: {{#message}}',
  circular: 'Referencia circular detectada en {{#label}}',
  'max-depth': 'Profundidad máxima de recursión ({{#depth}}) excedida en {{#label}}',
  exception: 'Excepción de validación en {{#label}}: {{#message}}',

  // Formats
  'format.email': '{{#label}} debe ser una dirección de correo electrónico válida',
  'format.url': '{{#label}} debe ser una URL válida',
  'format.uuid': '{{#label}} debe ser un UUID válido',
  'format.date': '{{#label}} debe ser una fecha válida (YYYY-MM-DD)',
  'format.datetime': '{{#label}} debe ser una fecha y hora válida (ISO 8601)',
  'format.time': '{{#label}} debe ser una hora válida (HH:mm:ss)',
  'format.ipv4': '{{#label}} debe ser una dirección IPv4 válida',
  'format.ipv6': '{{#label}} debe ser una dirección IPv6 válida',
  'format.binary': '{{#label}} debe ser una cadena base64 válida',

  // String
  'string.hostname': '{{#label}} debe ser un nombre de host válido',
  'string.pattern': 'El formato de {{#label}} no coincide con el patrón requerido',
  'string.enum': '{{#label}} debe ser uno de: {{#valids}}',

  // Number
  'number.base': '{{#label}} debe ser un número',
  'number.min': '{{#label}} debe ser mayor o igual a {{#limit}}',
  'number.max': '{{#label}} debe ser menor o igual a {{#limit}}',
  'number.integer': '{{#label}} debe ser un número entero',
  'number.positive': '{{#label}} debe ser un número positivo',
  'number.negative': '{{#label}} debe ser un número negativo',

  // Boolean
  'boolean.base': '{{#label}} debe ser un booleano',

  // Object
  'object.base': '{{#label}} debe ser un objeto',
  'object.min': '{{#label}} debe tener al menos {{#limit}} propiedades',
  'object.max': '{{#label}} debe tener como máximo {{#limit}} propiedades',
  'object.unknown': '{{#label}} contiene una propiedad desconocida: {{#key}}',

  // Array
  'array.base': '{{#label}} debe ser un array',
  'array.min': '{{#label}} debe tener al menos {{#limit}} elementos',
  'array.max': '{{#label}} debe tener como máximo {{#limit}} elementos',
  'array.length': '{{#label}} debe tener exactamente {{#limit}} elementos',
  'array.unique': '{{#label}} no debe contener elementos duplicados',

  // Date
  'date.base': '{{#label}} debe ser una fecha válida',
  'date.min': '{{#label}} no debe ser anterior a {{#limit}}',
  'date.max': '{{#label}} no debe ser posterior a {{#limit}}',

  // Any
  'any.required': '{{#label}} es obligatorio',
  'any.invalid': '{{#label}} contiene un valor no válido',
  'any.only': '{{#label}} debe coincidir con {{#valids}}',
  'any.unknown': 'El campo {{#key}} no está permitido',

  // Patterns (Legacy/Specific)
  'pattern.phone': 'Número de teléfono no válido',
  'pattern.phone.international': 'Número de teléfono internacional no válido',
  'pattern.idCard': 'Número de tarjeta de identificación no válido',
  'pattern.creditCard': 'Número de tarjeta de crédito no válido',
  'pattern.creditCard.visa': 'Número de tarjeta Visa no válido',
  'pattern.creditCard.mastercard': 'Número de Mastercard no válido',
  'pattern.creditCard.amex': 'Número de tarjeta American Express no válido',
  'pattern.creditCard.discover': 'Número de tarjeta Discover no válido',
  'pattern.creditCard.jcb': 'Número de tarjeta JCB no válido',
  'pattern.creditCard.unionpay': 'Número de tarjeta UnionPay no válido',
  'pattern.licensePlate': 'Número de matrícula no válido',
  'pattern.postalCode': 'Código postal no válido',
  'pattern.passport': 'Número de pasaporte no válido',
  'pattern.objectId': 'ObjectId no válido',
  'pattern.hexColor': 'Color hexadecimal no válido',
  'pattern.macAddress': 'Dirección MAC no válida',
  'pattern.cron': 'Expresión Cron no válida',
  'pattern.slug': 'El slug de URL solo puede contener letras minúsculas, números y guiones',
  // v1.0.2 新增
  'pattern.domain': '{{#label}} debe ser un nombre de dominio válido',
  'pattern.ip': '{{#label}} debe ser una dirección IP válida',
  'pattern.base64': '{{#label}} debe ser una cadena Base64 válida',
  'pattern.jwt': '{{#label}} debe ser un token JWT válido',
  'pattern.json': '{{#label}} debe ser una cadena JSON válida',

  // Username & Password
  'pattern.username': 'El nombre de usuario debe comenzar con una letra y contener solo letras, números y guiones bajos',
  'pattern.password.weak': 'La contraseña debe tener al menos 6 caracteres',
  'pattern.password.medium': 'La contraseña debe tener al menos 8 caracteres y contener letras y números',
  'pattern.password.strong': 'La contraseña debe tener al menos 8 caracteres y contener letras mayúsculas, minúsculas y números',
  'pattern.password.veryStrong': 'La contraseña debe tener al menos 10 caracteres y contener letras mayúsculas, minúsculas, números y caracteres especiales',

  // Unknown error fallback
  'UNKNOWN_ERROR': 'Error de validación desconocido',

  // Custom validation
  'CUSTOM_VALIDATION_FAILED': 'Validación fallida',
  'ASYNC_VALIDATION_NOT_SUPPORTED': 'La validación asíncrona no es compatible en validate() síncrono',
  'VALIDATE_MUST_BE_FUNCTION': 'validate debe ser una función'
};

