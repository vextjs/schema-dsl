module.exports = {
  required: '{{#label}} es obligatorio',
  type: '{{#label}} debe ser de tipo {{#expected}}, pero se obtuvo {{#actual}}',
  min: 'La longitud de {{#label}} debe ser al menos {{#min}}',
  max: 'La longitud de {{#label}} debe ser como máximo {{#max}}',
  length: 'La longitud de {{#label}} debe ser exactamente {{#expected}}',
  pattern: 'El formato de {{#label}} no es válido',
  enum: '{{#label}} debe ser uno de: {{#allowed}}',
  custom: 'Validación fallida para {{#label}}: {{#message}}',
  circular: 'Referencia circular detectada en {{#label}}',
  'max-depth': 'Profundidad máxima de recursión ({{#depth}}) excedida en {{#label}}',
  exception: 'Excepción de validación en {{#label}}: {{#message}}',

  // Patterns
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

  // New Types
  'pattern.objectId': 'ObjectId no válido',
  'pattern.hexColor': 'Color hexadecimal no válido',
  'pattern.macAddress': 'Dirección MAC no válida',
  'pattern.cron': 'Expresión Cron no válida',
  'pattern.slug': 'El slug de URL solo puede contener letras minúsculas, números y guiones',

  // Username & Password
  'pattern.username': 'El nombre de usuario debe comenzar con una letra y contener solo letras, números y guiones bajos',
  'pattern.password.weak': 'La contraseña debe tener al menos 6 caracteres',
  'pattern.password.medium': 'La contraseña debe tener al menos 8 caracteres y contener letras y números',
  'pattern.password.strong': 'La contraseña debe tener al menos 8 caracteres y contener letras mayúsculas, minúsculas y números',
  'pattern.password.veryStrong': 'La contraseña debe tener al menos 10 caracteres y contener letras mayúsculas, minúsculas, números y caracteres especiales',

  // Formats
  'format.email': 'Dirección de correo electrónico no válida',
  'format.url': 'URL no válida',
  'format.uuid': 'UUID no válido',
  'format.date': 'Formato de fecha no válido (YYYY-MM-DD)',
  'format.datetime': 'Formato de fecha y hora no válido (ISO 8601)',
  'format.time': 'Formato de hora no válido (HH:mm:ss)',
  'format.ipv4': 'Dirección IPv4 no válida',
  'format.ipv6': 'Dirección IPv6 no válida'
};

