import type { LocaleMessages } from './types.js'

const frFR: LocaleMessages = {
  // Generic
  required: '{{#label}} est requis',
  type: "{{#label}} doit être de type {{#expected}}, mais {{#actual}} a été reçu",
  min: "La longueur de {{#label}} doit être d'au moins {{#limit}}",
  max: "La longueur de {{#label}} doit être d'au plus {{#limit}}",
  length: 'La longueur de {{#label}} doit être exactement {{#expected}}',
  pattern: "Le format de {{#label}} n'est pas valide",
  enum: '{{#label}} doit être l\'un de : {{#allowed}}',
  custom: 'Validation échouée pour {{#label}} : {{#message}}',
  circular: 'Référence circulaire détectée dans {{#label}}',
  'max-depth': 'Profondeur maximale de récursion ({{#depth}}) dépassée dans {{#label}}',
  exception: 'Exception de validation dans {{#label}} : {{#message}}',

  // Conditional (v2 补完)
  'conditional.underAge': 'Les mineurs ne peuvent pas s\'inscrire',
  'conditional.blocked': 'Le compte a été bloqué',
  'conditional.notAllowed': 'L\'inscription n\'est pas autorisée',

  // I18nError — generic (v2 补完)
  'error.notFound': '{{#resource}} introuvable',
  'error.forbidden': 'Accès à {{#resource}} interdit',
  'error.unauthorized': 'Non autorisé, veuillez vous connecter',
  'error.invalid': '{{#field}} n\'est pas valide',
  'error.duplicate': '{{#resource}} existe déjà',
  'error.conflict': 'Conflit d\'opération : {{#reason}}',

  // Account (v2 补完)
  'account.notFound': { code: 'ACCOUNT_NOT_FOUND', message: 'Compte introuvable' },
  'account.inactive': 'Le compte est inactif',
  'account.banned': 'Le compte a été banni',
  'account.insufficientBalance': {
    code: 'INSUFFICIENT_BALANCE',
    message: 'Solde insuffisant, actuel : {{#balance}}, requis : {{#required}}',
  },
  'account.insufficientCredits': 'Crédits insuffisants, actuels : {{#credits}}, requis : {{#required}}',

  // User (v2 补完)
  'user.notFound': 'Utilisateur introuvable',
  'user.notVerified': "L'utilisateur n'est pas vérifié",
  'user.noPermission': 'Pas de permission d\'administrateur',

  // Order (v2 补完)
  'order.notPaid': { code: 'ORDER_NOT_PAID', message: 'Commande non payée' },
  'order.paymentMissing': 'Informations de paiement manquantes',
  'order.addressMissing': 'Adresse de livraison manquante',

  // Format
  'format.email': '{{#label}} doit être une adresse e-mail valide',
  'format.url': '{{#label}} doit être une URL valide',
  'format.uuid': '{{#label}} doit être un UUID valide',
  'format.date': '{{#label}} doit être une date valide (YYYY-MM-DD)',
  'format.datetime': '{{#label}} doit être une date et heure valide (ISO 8601)',
  'format.time': '{{#label}} doit être une heure valide (HH:mm:ss)',
  'format.ipv4': '{{#label}} doit être une adresse IPv4 valide',
  'format.ipv6': '{{#label}} doit être une adresse IPv6 valide',
  'format.binary': '{{#label}} doit être une chaîne base64 valide',

  // String
  'string.hostname': "{{#label}} doit être un nom d'hôte valide",
  'string.pattern': 'Le format de {{#label}} ne correspond pas au modèle requis',
  'string.enum': '{{#label}} doit être l\'un de : {{#valids}}',
  'string.length': 'La longueur de {{#label}} doit être exactement {{#limit}} caractères',
  'string.alphanum': '{{#label}} ne doit contenir que des caractères alphanumériques',
  'string.trim': '{{#label}} ne doit pas avoir d\'espaces en début ou en fin',
  'string.lowercase': '{{#label}} doit être en minuscules',
  'string.uppercase': '{{#label}} doit être en majuscules',

  // Number
  'number.base': '{{#label}} doit être un nombre',
  'number.min': '{{#label}} doit être supérieur ou égal à {{#limit}}',
  'number.max': '{{#label}} doit être inférieur ou égal à {{#limit}}',
  'number.integer': '{{#label}} doit être un nombre entier',
  'number.positive': '{{#label}} doit être un nombre positif',
  'number.negative': '{{#label}} doit être un nombre négatif',
  'number.precision': '{{#label}} doit avoir au plus {{#limit}} décimales',
  'number.port': '{{#label}} doit être un numéro de port valide (1-65535)',

  // Boolean
  'boolean.base': '{{#label}} doit être un booléen',

  // Object
  'object.base': '{{#label}} doit être un objet',
  'object.min': '{{#label}} doit avoir au moins {{#limit}} propriétés',
  'object.max': '{{#label}} doit avoir au plus {{#limit}} propriétés',
  'object.unknown': '{{#label}} contient une propriété inconnue : {{#key}}',
  'object.missing': '{{#label}} est manquant les propriétés requises',
  'object.schema': '{{#label}} contient des propriétés supplémentaires',
  'additionalProperties': '{{#label}} NE doit PAS avoir de propriétés supplémentaires : {{#key}}',

  // Array
  'array.base': '{{#label}} doit être un tableau',
  'array.min': '{{#label}} doit avoir au moins {{#limit}} éléments',
  'array.max': '{{#label}} doit avoir au plus {{#limit}} éléments',
  'array.length': '{{#label}} doit avoir exactement {{#limit}} éléments',
  'array.unique': '{{#label}} ne doit pas contenir d\'éléments en double',
  'array.sparse': '{{#label}} ne doit pas être un tableau clairsemé',
  'array.includesRequired': '{{#label}} doit inclure les éléments requis',

  // Date
  'date.base': '{{#label}} doit être une date valide',
  'date.min': '{{#label}} ne doit pas être antérieur à {{#limit}}',
  'date.max': '{{#label}} ne doit pas être postérieur à {{#limit}}',
  'date.format': "Le format de date de {{#label}} n'est pas valide",
  'date.greater': '{{#label}} doit être après {{#limit}}',
  'date.less': '{{#label}} doit être avant {{#limit}}',

  // Any
  'any.required': '{{#label}} est requis',
  'any.invalid': '{{#label}} contient une valeur non valide',
  'any.only': '{{#label}} doit correspondre à {{#valids}}',
  'any.unknown': 'Le champ {{#key}} n\'est pas autorisé',

  // Patterns
  'pattern.phone': 'Numéro de téléphone non valide',
  'pattern.phone.international': 'Numéro de téléphone international non valide',
  'pattern.idCard': "Numéro de carte d'identité non valide",
  'pattern.creditCard': 'Numéro de carte de crédit non valide',
  'pattern.creditCard.visa': 'Numéro de carte Visa non valide',
  'pattern.creditCard.mastercard': 'Numéro Mastercard non valide',
  'pattern.creditCard.amex': 'Numéro de carte American Express non valide',
  'pattern.creditCard.discover': 'Numéro de carte Discover non valide',
  'pattern.creditCard.jcb': 'Numéro de carte JCB non valide',
  'pattern.creditCard.unionpay': 'Numéro de carte UnionPay non valide',
  "pattern.licensePlate": "Numéro de plaque d'immatriculation non valide",
  'pattern.postalCode': 'Code postal non valide',
  'pattern.passport': 'Numéro de passeport non valide',
  'pattern.objectId': 'ObjectId non valide',
  'pattern.hexColor': 'Couleur hexadécimale non valide',
  'pattern.macAddress': 'Adresse MAC non valide',
  'pattern.cron': 'Expression Cron non valide',
  "pattern.slug": "Le slug d'URL ne peut contenir que des lettres minuscules, des chiffres et des tirets",
  'pattern.domain': '{{#label}} doit être un nom de domaine valide',
  'pattern.ip': '{{#label}} doit être une adresse IP valide',
  'pattern.base64': '{{#label}} doit être une chaîne Base64 valide',
  'pattern.jwt': '{{#label}} doit être un token JWT valide',
  'pattern.json': '{{#label}} doit être une chaîne JSON valide',
  "pattern.username": "Le nom d'utilisateur doit commencer par une lettre et contenir uniquement des lettres, des chiffres et des tirets bas",
  'pattern.password.weak': 'Le mot de passe doit contenir au moins 6 caractères',
  'pattern.password.medium': 'Le mot de passe doit contenir au moins 8 caractères et inclure des lettres et des chiffres',
  'pattern.password.strong': 'Le mot de passe doit contenir au moins 8 caractères et inclure des lettres majuscules, minuscules et des chiffres',
  'pattern.password.veryStrong': 'Le mot de passe doit contenir au moins 10 caractères et inclure des lettres majuscules, minuscules, des chiffres et des caractères spéciaux',
  'pattern.emailOrPhone': 'Doit être un e-mail ou un numéro de téléphone',
  'pattern.usernameOrEmail': "Doit être un nom d'utilisateur ou un e-mail",
  'pattern.httpOrHttps': 'Doit être une URL commençant par http ou https',

  // oneOf
  oneOf: "{{#label}} doit correspondre à l'un des types suivants",
  'oneOf.invalid': '{{#label}} ne correspond à aucun type autorisé',

  // Error fallback
  UNKNOWN_ERROR: 'Erreur de validation inconnue',
  CUSTOM_VALIDATION_FAILED: 'Validation échouée',
  ASYNC_VALIDATION_NOT_SUPPORTED: 'La validation asynchrone n\'est pas prise en charge dans validate() synchrone',
  VALIDATE_MUST_BE_FUNCTION: 'validate doit être une fonction',
}

export default frFR
