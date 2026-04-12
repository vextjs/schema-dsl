/**
 * 全局常量
 * 修复：
 *   CF-01 IPv4 正则过于宽松 → 替换为 RFC 合规标准正则
 *   CF-02 IPv6 正则不支持压缩格式 → 替换为完整 RFC 5952 兼容正则
 */

// ========== 验证配置 ==========
export const VALIDATION = {
  MAX_RECURSION_DEPTH: 100,
  MAX_ARRAY_SIZE: 100_000,
  MAX_STRING_LENGTH: 1_000_000,
  MAX_OBJECT_KEYS: 10_000,
  DEFAULT_TIMEOUT: 5_000,
  REGEX_TIMEOUT: 100,
  CUSTOM_VALIDATOR_TIMEOUT: 1_000,
} as const

// ========== 缓存配置 ==========
export const CACHE = {
  ENABLED: true,
  SCHEMA_CACHE: {
    MAX_SIZE: 5_000,
    TTL: 3_600_000,   // 1 小时
    STRATEGY: 'LRU',
  },
  STATS_ENABLED: true,
} as const

// ========== 格式验证正则 ==========

/**
 * CF-01 修复：IPv4 标准正则
 * 每段 0-255，四组，完整匹配
 * 拒绝 999.999.999.999 等非法地址
 */
const IPV4_OCTET = '(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)'
export const PATTERN_IPV4 = new RegExp(`^(?:${IPV4_OCTET}\\.){3}${IPV4_OCTET}$`)

/**
 * CF-02 修复：IPv6 完整正则（RFC 5952 兼容）
 * 覆盖：
 *   - 全展开：8 组 16 进制
 *   - :: 压缩：前缀/后缀/纯 :: 等变体
 * 禁止嵌套量词（避免 ReDoS）
 */
const HEX4 = '[0-9a-fA-F]{1,4}'
const IPV6_FULL = `(?:${HEX4}:){7}${HEX4}`
const IPV6_COMPRESS = [
  `(?:${HEX4}:){1,7}:`,                         // n:...:
  `(?:${HEX4}:){1,6}:${HEX4}`,                  // n:...:n
  `(?:${HEX4}:){1,5}(?::${HEX4}){1,2}`,
  `(?:${HEX4}:){1,4}(?::${HEX4}){1,3}`,
  `(?:${HEX4}:){1,3}(?::${HEX4}){1,4}`,
  `(?:${HEX4}:){1,2}(?::${HEX4}){1,5}`,
  `${HEX4}:(?::${HEX4}){1,6}`,
  `:(?::${HEX4}){1,7}`,                          // ::n...
  `::`,                                           // 纯 ::（全零）
].join('|')
export const PATTERN_IPV6 = new RegExp(`^(?:${IPV6_FULL}|${IPV6_COMPRESS})$`)

export const FORMATS = {
  BUILT_IN: [
    'email', 'url', 'uri', 'uuid', 'ipv4', 'ipv6',
    'hostname', 'date', 'date-time', 'time', 'regex', 'json',
  ] as const,
  PATTERNS: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    ipv4: PATTERN_IPV4,
    ipv6: PATTERN_IPV6,
    hostname: /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i,
    dateTime: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/,
    date: /^\d{4}-\d{2}-\d{2}$/,
    time: /^\d{2}:\d{2}:\d{2}$/,
  },
} as const

// ========== 插件配置 ==========
export const PLUGINS = {
  MAX_PLUGINS: 50,
  NAMING_CONVENTION: /^schema-dsl-plugin-/,
} as const
