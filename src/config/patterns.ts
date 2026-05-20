/**
 * Built-in regex validation patterns (migrated from v1 lib/config/patterns/ to a single TypeScript file)
 */

export interface PatternConfig {
  pattern: RegExp
  min?: number
  max?: number
  key: string
}

const phone: Record<string, PatternConfig> = {
  cn: { pattern: /^1[3-9]\d{9}$/, min: 11, max: 11, key: 'pattern.phone.cn' },
  us: { pattern: /^\d{10}$/, min: 10, max: 10, key: 'pattern.phone.us' },
  uk: { pattern: /^(\+44\s?)?0?\d{10}$/, min: 10, max: 15, key: 'pattern.phone.uk' },
  hk: { pattern: /^[5-9]\d{7}$/, min: 8, max: 8, key: 'pattern.phone.hk' },
  tw: { pattern: /^09\d{8}$/, min: 10, max: 10, key: 'pattern.phone.tw' },
  international: { pattern: /^\+[1-9]\d{1,14}$/, min: 8, max: 15, key: 'pattern.phone.international' },
}

const idCard: Record<string, PatternConfig> = {
  cn: {
    pattern: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
    min: 18, max: 18, key: 'pattern.idCard.cn',
  },
}

const creditCard: Record<string, PatternConfig> = {
  visa:       { pattern: /^4[0-9]{12}(?:[0-9]{3})?$/, key: 'pattern.creditCard.visa' },
  mastercard: { pattern: /^5[1-5][0-9]{14}$/, key: 'pattern.creditCard.mastercard' },
  amex:       { pattern: /^3[47][0-9]{13}$/, key: 'pattern.creditCard.amex' },
  discover:   { pattern: /^6(?:011|5[0-9]{2})[0-9]{12}$/, key: 'pattern.creditCard.discover' },
  jcb:        { pattern: /^(?:2131|1800|35\d{3})\d{11}$/, key: 'pattern.creditCard.jcb' },
  unionpay:   { pattern: /^62[0-9]{14,17}$/, key: 'pattern.creditCard.unionpay' },
}

const licensePlate: Record<string, PatternConfig> = {
  cn: {
    pattern: /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳]$/,
    key: 'pattern.licensePlate.cn',
  },
}

const postalCode: Record<string, PatternConfig> = {
  cn: { pattern: /^[1-9]\d{5}$/, key: 'pattern.postalCode.cn' },
  us: { pattern: /^\d{5}(-\d{4})?$/, key: 'pattern.postalCode.us' },
}

const passport: Record<string, PatternConfig> = {
  cn: {
    pattern: /(^[EeKkGgDdHhMQqSs][0-9]{8}$)|(^(([Ee][a-fA-F])|([DdSPp][Ee])|([Kk][Jj])|([Mm][Aa])|(1[45]))[0-9]{7}$)/,
    key: 'pattern.passport.cn',
  },
}

const common: Record<string, PatternConfig> = {
  domain: {
    pattern: /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i,
    key: 'pattern.domain', min: 3, max: 253,
  },
  ip: {
    // Composite IPv4 + IPv6 pattern (same as v1)
    pattern:
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
    key: 'pattern.ip',
  },
  base64: {
    pattern: /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
    key: 'pattern.base64',
  },
  jwt: {
    pattern: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/,
    key: 'pattern.jwt',
  },
}

export const PATTERNS = { phone, idCard, creditCard, licensePlate, postalCode, passport, common }
