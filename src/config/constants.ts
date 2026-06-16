/**
 * Global constants.
 * Fixes:
 *   CF-01 IPv4 regex too permissive → replaced with RFC-compliant standard regex
 *   CF-02 IPv6 regex did not support compressed notation → replaced with full RFC 5952 compatible regex
 */

// ========== Validation config ==========
export const VALIDATION = {
  MAX_RECURSION_DEPTH: 100,
  MAX_ARRAY_SIZE: 100_000,
  MAX_STRING_LENGTH: 1_000_000,
  MAX_OBJECT_KEYS: 10_000,
  DEFAULT_TIMEOUT: 5_000,
  REGEX_TIMEOUT: 100,
  CUSTOM_VALIDATOR_TIMEOUT: 1_000,
} as const

// ========== Cache config ==========
export const CACHE = {
  ENABLED: true,
  SCHEMA_CACHE: {
    MAX_SIZE: 5_000,
    TTL: 0,           // no expiration; LRU owns compiled schema lifecycle
    STRATEGY: 'LRU',
  },
  STATS_ENABLED: true,
} as const

// ========== Format validation regex ==========

/**
 * CF-01 fix: RFC-compliant IPv4 regex.
 * Each octet 0-255, four groups, full-string match.
 * Rejects invalid addresses such as 999.999.999.999.
 */
const IPV4_OCTET = '(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)'
export const PATTERN_IPV4 = new RegExp(`^(?:${IPV4_OCTET}\\.){3}${IPV4_OCTET}$`)

/**
 * CF-02 fix: Full IPv6 regex (RFC 5952 compatible).
 * Covers:
 *   - Fully-expanded: 8 groups of hex
 *   - :: compressed: prefix / suffix / standalone :: variants
 * No nested quantifiers (avoids ReDoS).
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
  `::`,                                           // standalone :: (all-zeros)
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

// ========== Plugin config ==========
export const PLUGINS = {
  MAX_PLUGINS: 50,
  NAMING_CONVENTION: /^schema-dsl-plugin-/,
} as const
