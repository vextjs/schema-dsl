module.exports = {
  required: '{{#label}} est requis',
  type: '{{#label}} doit être de type {{#expected}}, mais a obtenu {{#actual}}',
  min: 'La longueur de {{#label}} doit être d\'au moins {{#limit}}',
  max: 'La longueur de {{#label}} doit être au maximum de {{#limit}}',
  length: 'La longueur de {{#label}} doit être exactement {{#expected}}',
  pattern: 'Le format de {{#label}} est invalide',
  enum: '{{#label}} doit être l\'un des suivants: {{#allowed}}',
  custom: 'Échec de la validation pour {{#label}}: {{#message}}',
  circular: 'Référence circulaire détectée dans {{#label}}',
  'max-depth': 'Profondeur de récursion maximale ({{#depth}}) dépassée dans {{#label}}',
  exception: 'Exception de validation dans {{#label}}: {{#message}}',

  // Patterns
  'pattern.phone': 'Numéro de téléphone invalide',
  'pattern.phone.international': 'Numéro de téléphone international invalide',

  'pattern.idCard': 'Numéro de carte d\'identité invalide',

  'pattern.creditCard': 'Numéro de carte de crédit invalide',
  'pattern.creditCard.visa': 'Numéro de carte Visa invalide',
  'pattern.creditCard.mastercard': 'Numéro Mastercard invalide',
  'pattern.creditCard.amex': 'Numéro de carte American Express invalide',
  'pattern.creditCard.discover': 'Numéro de carte Discover invalide',
  'pattern.creditCard.jcb': 'Numéro de carte JCB invalide',
  'pattern.creditCard.unionpay': 'Numéro de carte UnionPay invalide',

  'pattern.licensePlate': 'Numéro de plaque d\'immatriculation invalide',

  'pattern.postalCode': 'Code postal invalide',

  'pattern.passport': 'Numéro de passeport invalide',

  // New Types
  'pattern.objectId': 'ObjectId invalide',
  'pattern.hexColor': 'Couleur hexadécimale invalide',
  'pattern.macAddress': 'Adresse MAC invalide',
  'pattern.cron': 'Expression Cron invalide',
  'pattern.slug': 'Le slug d\'URL ne peut contenir que des lettres minuscules, des chiffres et des traits d\'union',

  // Username & Password
  'pattern.username': 'Le nom d\'utilisateur doit commencer par une lettre et ne contenir que des lettres, des chiffres et des traits de soulignement',
  'pattern.password.weak': 'Le mot de passe doit contenir au moins 6 caractères',
  'pattern.password.medium': 'Le mot de passe doit contenir au moins 8 caractères et contenir des lettres et des chiffres',
  'pattern.password.strong': 'Le mot de passe doit contenir au moins 8 caractères et contenir des lettres majuscules, minuscules et des chiffres',
  'pattern.password.veryStrong': 'Le mot de passe doit contenir au moins 10 caractères et contenir des lettres majuscules, minuscules, des chiffres et des caractères spéciaux',

  // Formats
  'format.email': 'Adresse e-mail invalide',
  'format.url': 'URL invalide',
  'format.uuid': 'UUID invalide',
  'format.date': 'Format de date invalide (YYYY-MM-DD)',
  'format.datetime': 'Format de date et heure invalide (ISO 8601)',
  'format.time': 'Format de l\'heure invalide (HH:mm:ss)',
  'format.ipv4': 'Adresse IPv4 invalide',
  'format.ipv6': 'Adresse IPv6 invalide'
};

