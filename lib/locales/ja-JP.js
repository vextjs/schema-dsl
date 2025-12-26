module.exports = {
  required: '{{#label}}は必須です',
  type: '{{#label}}は {{#expected}} 型である必要がありますが、{{#actual}} でした',
  min: '{{#label}}の長さは少なくとも {{#limit}} である必要があります',
  max: '{{#label}}の長さは最大 {{#limit}} である必要があります',
  length: '{{#label}}の長さは {{#expected}} である必要があります',
  pattern: '{{#label}}の形式が無効です',
  enum: '{{#label}}は次のいずれかである必要があります: {{#allowed}}',
  custom: '{{#label}}の検証に失敗しました: {{#message}}',
  circular: '{{#label}}で循環参照が検出されました',
  'max-depth': '{{#label}}で最大再帰深度 ({{#depth}}) を超えました',
  exception: '{{#label}}検証例外: {{#message}}',

  // Patterns
  'pattern.phone': '無効な電話番号です',
  'pattern.phone.international': '無効な国際電話番号です',

  'pattern.idCard': '無効なIDカード番号です',

  'pattern.creditCard': '無効なクレジットカード番号です',
  'pattern.creditCard.visa': '無効なVisaカード番号です',
  'pattern.creditCard.mastercard': '無効なMastercard番号です',
  'pattern.creditCard.amex': '無効なAmerican Expressカード番号です',
  'pattern.creditCard.discover': '無効なDiscoverカード番号です',
  'pattern.creditCard.jcb': '無効なJCBカード番号です',
  'pattern.creditCard.unionpay': '無効な銀聯カード番号です',

  'pattern.licensePlate': '無効なナンバープレート番号です',

  'pattern.postalCode': '無効な郵便番号です',

  'pattern.passport': '無効なパスポート番号です',

  // New Types
  'pattern.objectId': '無効なObjectIdです',
  'pattern.hexColor': '無効な16進数カラーコードです',
  'pattern.macAddress': '無効なMACアドレスです',
  'pattern.cron': '無効なCron式です',
  'pattern.slug': 'URLスラッグには、小文字、数字、ハイフンのみを含めることができます',

  // Username & Password
  'pattern.username': 'ユーザー名は文字で始まり、文字、数字、アンダースコアのみを含める必要があります',
  'pattern.password.weak': 'パスワードは少なくとも6文字である必要があります',
  'pattern.password.medium': 'パスワードは少なくとも8文字で、文字と数字を含める必要があります',
  'pattern.password.strong': 'パスワードは少なくとも8文字で、大文字、小文字、数字を含める必要があります',
  'pattern.password.veryStrong': 'パスワードは少なくとも10文字で、大文字、小文字、数字、特殊文字を含める必要があります',

  // Formats
  'format.email': '無効なメールアドレスです',
  'format.url': '無効なURLです',
  'format.uuid': '無効なUUIDです',
  'format.date': '無効な日付形式です (YYYY-MM-DD)',
  'format.datetime': '無効な日時形式です (ISO 8601)',
  'format.time': '無効な時間形式です (HH:mm:ss)',
  'format.ipv4': '無効なIPv4アドレスです',
  'format.ipv6': '無効なIPv6アドレスです'
};

