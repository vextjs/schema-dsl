module.exports = {
  // Generic
  required: '{{#label}}は必須です',
  type: '{{#label}}は{{#expected}}型である必要がありますが、{{#actual}}が渡されました',
  min: '{{#label}}の長さは{{#limit}}以上である必要があります',
  max: '{{#label}}の長さは{{#limit}}以下である必要があります',
  length: '{{#label}}の長さは正確に{{#expected}}である必要があります',
  pattern: '{{#label}}の形式が無効です',
  enum: '{{#label}}は次のいずれかである必要があります: {{#allowed}}',
  custom: '{{#label}}の検証に失敗しました: {{#message}}',
  circular: '{{#label}}で循環参照が検出されました',
  'max-depth': '{{#label}}で最大再帰深度 ({{#depth}}) を超えました',
  exception: '{{#label}}の検証例外: {{#message}}',

  // Conditional (ConditionalBuilder)
  'conditional.underAge': '未成年者は登録できません',
  'conditional.blocked': 'アカウントがブロックされています',
  'conditional.notAllowed': '登録は許可されていません',

  // Formats
  'format.email': '{{#label}}は有効なメールアドレスである必要があります',
  'format.url': '{{#label}}は有効なURLである必要があります',
  'format.uuid': '{{#label}}は有効なUUIDである必要があります',
  'format.date': '{{#label}}は有効な日付 (YYYY-MM-DD) である必要があります',
  'format.datetime': '{{#label}}は有効な日時 (ISO 8601) である必要があります',
  'format.time': '{{#label}}は有効な時刻 (HH:mm:ss) である必要があります',
  'format.ipv4': '{{#label}}は有効なIPv4アドレスである必要があります',
  'format.ipv6': '{{#label}}は有効なIPv6アドレスである必要があります',
  'format.binary': '{{#label}}は有効なbase64文字列である必要があります',

  // String
  'string.hostname': '{{#label}}は有効なホスト名である必要があります',
  'string.pattern': '{{#label}}の形式が必要なパターンと一致しません',
  'string.enum': '{{#label}}は次のいずれかである必要があります: {{#valids}}',

  // Number
  'number.base': '{{#label}}は数値である必要があります',
  'number.min': '{{#label}}は{{#limit}}以上である必要があります',
  'number.max': '{{#label}}は{{#limit}}以下である必要があります',
  'number.integer': '{{#label}}は整数である必要があります',
  'number.positive': '{{#label}}は正の数である必要があります',
  'number.negative': '{{#label}}は負の数である必要があります',

  // Boolean
  'boolean.base': '{{#label}}はブール値である必要があります',

  // Object
  'object.base': '{{#label}}はオブジェクトである必要があります',
  'object.min': '{{#label}}は少なくとも{{#limit}}個のプロパティを持つ必要があります',
  'object.max': '{{#label}}は最大{{#limit}}個のプロパティを持つことができます',
  'object.unknown': '{{#label}}に未知のプロパティが含まれています: {{#key}}',
  // v1.1.6 - additionalProperties
  'additionalProperties': '{{#label}}に追加のプロパティを含めてはいけません: {{#key}}',

  // Array
  'array.base': '{{#label}}は配列である必要があります',
  'array.min': '{{#label}}は少なくとも{{#limit}}個の要素を持つ必要があります',
  'array.max': '{{#label}}は最大{{#limit}}個の要素を持つことができます',
  'array.length': '{{#label}}は正確に{{#limit}}個の要素を持つ必要があります',
  'array.unique': '{{#label}}に重複する要素を含めることはできません',

  // Date
  'date.base': '{{#label}}は有効な日付である必要があります',
  'date.min': '{{#label}}は{{#limit}}より前であってはなりません',
  'date.max': '{{#label}}は{{#limit}}より後であってはなりません',

  // Any
  'any.required': '{{#label}}は必須です',
  'any.invalid': '{{#label}}に無効な値が含まれています',
  'any.only': '{{#label}}は{{#valids}}と一致する必要があります',
  'any.unknown': 'フィールド{{#key}}は許可されていません',

  // Patterns (Legacy/Specific)
  'pattern.phone': '無効な電話番号',
  'pattern.phone.international': '無効な国際電話番号',
  'pattern.idCard': '無効なIDカード番号',
  'pattern.creditCard': '無効なクレジットカード番号',
  'pattern.creditCard.visa': '無効なVisaカード番号',
  'pattern.creditCard.mastercard': '無効なMastercardカード番号',
  'pattern.creditCard.amex': '無効なAmerican Expressカード番号',
  'pattern.creditCard.discover': '無効なDiscoverカード番号',
  'pattern.creditCard.jcb': '無効なJCBカード番号',
  'pattern.creditCard.unionpay': '無効なUnionPayカード番号',
  'pattern.licensePlate': '無効なナンバープレート',
  'pattern.postalCode': '無効な郵便番号',
  'pattern.passport': '無効なパスポート番号',
  'pattern.objectId': '無効なObjectId',
  'pattern.hexColor': '無効な16進カラー',
  'pattern.macAddress': '無効なMACアドレス',
  'pattern.cron': '無効なCron式',
  'pattern.slug': 'URLスラッグには小文字、数字、ハイフンのみを含めることができます',
  // v1.0.2 新増
  'pattern.domain': '{{#label}}は有効なドメイン名である必要があります',
  'pattern.ip': '{{#label}}は有効なIPアドレスである必要があります',
  'pattern.base64': '{{#label}}は有効なBase64文字列である必要があります',
  'pattern.jwt': '{{#label}}は有効なJWTトークンである必要があります',
  'pattern.json': '{{#label}}は有効なJSON文字列である必要があります',

  // Username & Password
  'pattern.username': 'ユーザー名は文字で始まり、文字、数字、アンダースコアのみを含む必要があります',
  'pattern.password.weak': 'パスワードは少なくとも6文字である必要があります',
  'pattern.password.medium': 'パスワードは少なくとも8文字で、文字と数字を含む必要があります',
  'pattern.password.strong': 'パスワードは少なくとも8文字で、大文字、小文字、数字を含む必要があります',
  'pattern.password.veryStrong': 'パスワードは少なくとも10文字で、大文字、小文字、数字、特殊文字を含む必要があります',

  // oneOf (型の結合) - v1.1.0
  oneOf: '{{#label}}は次のいずれかの型に一致する必要があります',
  'oneOf.invalid': '{{#label}}の値は許可された型のいずれとも一致しません',

  // Unknown error fallback
  'UNKNOWN_ERROR': '不明な検証エラー',

  // Custom validation
  'CUSTOM_VALIDATION_FAILED': '検証に失敗しました',
  'ASYNC_VALIDATION_NOT_SUPPORTED': '同期validate()では非同期検証はサポートされていません',
  'VALIDATE_MUST_BE_FUNCTION': 'validateは関数である必要があります'
};

