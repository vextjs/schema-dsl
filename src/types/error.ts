/**
 * 错误消息模板（自定义验证错误文案）
 */
export interface ErrorMessages {
  // 长度/范围（v1.0.3+ 推荐 min/max 代替 minLength/maximum 等）
  min?: string
  max?: string
  minLength?: string
  maxLength?: string
  minimum?: string
  maximum?: string
  minItems?: string
  maxItems?: string
  // 类型
  type?: string
  string?: string
  number?: string
  integer?: string
  boolean?: string
  array?: string
  object?: string
  // 格式
  email?: string
  url?: string
  date?: string
  dateTime?: string
  uuid?: string
  ipv4?: string
  ipv6?: string
  // 其他
  pattern?: string
  format?: string
  required?: string
  enum?: string
  uniqueItems?: string
  // 自定义关键字
  exactLength?: string
  phone?: string
  idCard?: string
  creditCard?: string
  // 允许扩展
  [key: string]: string | undefined
}

/**
 * 错误码常量类型（ErrorCodes 对象的形状）
 */
export interface ErrorCodeMap {
  // 验证错误
  VALIDATION_ERROR: 'VALIDATION_ERROR'
  INVALID_SCHEMA: 'INVALID_SCHEMA'
  // 配置错误
  INVALID_CONFIG: 'INVALID_CONFIG'
  INVALID_LOCALE: 'INVALID_LOCALE'
  // 插件错误
  PLUGIN_INSTALL_ERROR: 'PLUGIN_INSTALL_ERROR'
  PLUGIN_NOT_FOUND: 'PLUGIN_NOT_FOUND'
  // 扩展
  [key: string]: string
}
