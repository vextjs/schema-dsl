module.exports = {
  // Generic
  required: '{{#label}}不能为空',
  type: '{{#label}}应该是 {{#expected}} 类型',
  min: '{{#label}}长度不能少于{{#limit}}个字符',
  max: '{{#label}}长度不能超过{{#limit}}个字符',
  length: '{{#label}}长度必须是{{#limit}}个字符',
  pattern: '{{#label}}格式不正确',
  enum: '{{#label}}必须是以下值之一: {{#allowed}}',
  custom: '{{#label}}验证失败: {{#message}}',
  circular: '{{#label}}检测到循环引用',
  'max-depth': '超过最大递归深度 ({{#depth}}) at {{#label}}',
  exception: '{{#label}}验证异常: {{#message}}',

  // Formats
  'format.email': '{{#label}}必须是有效的邮箱地址',
  'format.url': '{{#label}}必须是有效的URL地址',
  'format.uuid': '{{#label}}必须是有效的UUID',
  'format.date': '{{#label}}必须是有效的日期格式 (YYYY-MM-DD)',
  'format.datetime': '{{#label}}必须是有效的日期时间格式 (ISO 8601)',
  'format.time': '{{#label}}必须是有效的时间格式 (HH:mm:ss)',
  'format.ipv4': '{{#label}}必须是有效的IPv4地址',
  'format.ipv6': '{{#label}}必须是有效的IPv6地址',
  'format.binary': '{{#label}}必须是有效的Base64编码',

  // String
  'string.hostname': '{{#label}}必须是有效的主机名',
  'string.pattern': '{{#label}}格式不符合要求',
  'string.enum': '{{#label}}必须是以下值之一: {{#valids}}',
  // v1.0.2新增
  'string.length': '{{#label}}长度必须是{{#limit}}个字符',
  'string.alphanum': '{{#label}}只能包含字母和数字',
  'string.trim': '{{#label}}不能包含前后空格',
  'string.lowercase': '{{#label}}必须是小写',
  'string.uppercase': '{{#label}}必须是大写',

  // Number
  'number.base': '{{#label}}必须是数字类型',
  'number.min': '{{#label}}不能小于{{#limit}}',
  'number.max': '{{#label}}不能大于{{#limit}}',
  'number.integer': '{{#label}}必须是整数',
  'number.positive': '{{#label}}必须是正数',
  'number.negative': '{{#label}}必须是负数',
  // v1.0.2新增
  'number.precision': '{{#label}}小数位数不能超过{{#limit}}位',
  'number.port': '{{#label}}必须是有效的端口号(1-65535)',

  // Boolean
  'boolean.base': '{{#label}}必须是布尔类型',

  // Object
  'object.base': '{{#label}}必须是对象类型',
  'object.min': '{{#label}}至少需要{{#limit}}个属性',
  'object.max': '{{#label}}最多只能有{{#limit}}个属性',
  'object.unknown': '{{#label}}包含未知属性: {{#key}}',
  // v1.0.2新增
  'object.missing': '{{#label}}缺少必需属性',
  'object.schema': '{{#label}}包含额外属性',

  // Array
  'array.base': '{{#label}}必须是数组类型',
  'array.min': '{{#label}}至少需要{{#limit}}个元素',
  'array.max': '{{#label}}最多只能有{{#limit}}个元素',
  'array.length': '{{#label}}必须有{{#limit}}个元素',
  'array.unique': '{{#label}}不能包含重复元素',
  // v1.0.2新增
  'array.sparse': '{{#label}}不能是稀疏数组',
  'array.includesRequired': '{{#label}}必须包含指定元素',

  // Date
  'date.base': '{{#label}}必须是有效的日期',
  'date.min': '{{#label}}不能早于{{#limit}}',
  'date.max': '{{#label}}不能晚于{{#limit}}',
  // v1.0.2新增
  'date.format': '{{#label}}日期格式不正确',
  'date.greater': '{{#label}}必须晚于{{#limit}}',
  'date.less': '{{#label}}必须早于{{#limit}}',

  // Any
  'any.required': '{{#label}}是必填项',
  'any.invalid': '{{#label}}包含无效值',
  'any.only': '{{#label}}必须匹配{{#valids}}',
  'any.unknown': '不允许字段{{#key}}',

  // Patterns (Legacy/Specific)
  'pattern.phone': '请输入有效的手机号',
  'pattern.phone.international': '请输入有效的国际手机号',
  'pattern.idCard': '请输入有效的身份证号码',
  'pattern.creditCard': '无效的信用卡号',
  'pattern.creditCard.visa': '无效的Visa卡号',
  'pattern.creditCard.mastercard': '无效的万事达卡号',
  'pattern.creditCard.amex': '无效的美国运通卡号',
  'pattern.creditCard.discover': '无效的Discover卡号',
  'pattern.creditCard.jcb': '无效的JCB卡号',
  'pattern.creditCard.unionpay': '无效的银联卡号',
  'pattern.licensePlate': '请输入有效的车牌号',
  'pattern.postalCode': '请输入有效的邮政编码',
  'pattern.passport': '请输入有效的护照号码',
  'pattern.objectId': '无效的 ObjectId',
  'pattern.hexColor': '无效的十六进制颜色值',
  'pattern.macAddress': '无效的 MAC 地址',
  'pattern.cron': '无效的 Cron 表达式',
  'pattern.slug': 'URL别名只能包含小写字母、数字和连字符',
  // v1.0.2新增
  'pattern.domain': '{{#label}}必须是有效的域名',
  'pattern.ip': '{{#label}}必须是有效的IP地址',
  'pattern.base64': '{{#label}}必须是有效的Base64编码',
  'pattern.jwt': '{{#label}}必须是有效的JWT令牌',
  'pattern.json': '{{#label}}必须是有效的JSON字符串',

  // Username & Password
  'pattern.username': '用户名必须以字母开头，只能包含字母、数字和下划线',
  'pattern.password.weak': '密码至少6位',
  'pattern.password.medium': '密码至少8位，需包含字母和数字',
  'pattern.password.strong': '密码至少8位，需包含大小写字母和数字',
  'pattern.password.veryStrong': '密码至少10位，需包含大小写字母、数字和特殊字符',

  // Unknown error fallback
  'UNKNOWN_ERROR': '未知的验证错误',

  // Custom validation
  'CUSTOM_VALIDATION_FAILED': '自定义验证失败',
  'ASYNC_VALIDATION_NOT_SUPPORTED': '同步验证不支持异步操作',
  'VALIDATE_MUST_BE_FUNCTION': 'validate 必须是一个函数'
};
