// lib/config/constants.js

/**
 * SchemaIO 配置常量
 * 所有魔法数字和配置项的统一定义
 */

module.exports = {
  // ========== 验证配置 ==========
  VALIDATION: {
    // 递归深度限制（防止栈溢出）
    MAX_RECURSION_DEPTH: 100,

    // 数组大小限制（防止性能问题）
    MAX_ARRAY_SIZE: 100000,

    // 字符串长度限制（防止内存溢出）
    MAX_STRING_LENGTH: 1000000,

    // 对象属性数量限制
    MAX_OBJECT_KEYS: 10000,

    // 验证超时时间（ms）
    DEFAULT_TIMEOUT: 5000,

    // 正则表达式超时（ms，防止ReDoS）
    REGEX_TIMEOUT: 100,

    // 自定义验证函数超时（ms）
    CUSTOM_VALIDATOR_TIMEOUT: 1000,

    // 默认选项
    DEFAULT_OPTIONS: {
      abortEarly: false,        // 是否在第一个错误时停止
      stripUnknown: false,      // 是否移除未知字段
      convert: false,           // 是否自动类型转换
      presence: 'optional',     // 默认字段是可选的
      allowUnknown: false,      // 是否允许未定义的字段
      skipFunctions: true       // 是否跳过函数类型
    }
  },

  // ========== 缓存配置 ==========
  CACHE: {
    // 缓存开关
    ENABLED: true,

    // Schema编译缓存
    SCHEMA_CACHE: {
      MAX_SIZE: 5000,           // 最大缓存条目（优化：1000 → 5000，适配大型项目）
      TTL: 3600000,             // 1小时（ms）
      STRATEGY: 'LRU'           // LRU淘汰策略
    },

    // 验证结果缓存（可选）
    VALIDATION_CACHE: {
      ENABLED: false,           // 默认关闭（数据可变）
      MAX_SIZE: 500,
      TTL: 60000                // 1分钟（ms）
    },

    // 正则表达式缓存
    REGEX_CACHE: {
      MAX_SIZE: 500,            // 优化：200 → 500，适配大型项目
      TTL: 7200000              // 2小时（ms）
    },

    // 统计信息收集
    STATS_ENABLED: true
  },

  // ========== 错误消息 ==========
  ERRORS: {
    // 系统错误
    CIRCULAR_REFERENCE: 'Circular reference detected at {path}',
    MAX_DEPTH_EXCEEDED: 'Maximum recursion depth ({depth}) exceeded at {path}',
    MAX_ARRAY_SIZE_EXCEEDED: 'Array size ({size}) exceeds maximum ({max}) at {path}',
    MAX_STRING_LENGTH_EXCEEDED: 'String length ({length}) exceeds maximum ({max}) at {path}',
    REGEX_TIMEOUT: 'Regular expression timeout at {path}',
    VALIDATION_TIMEOUT: 'Validation timeout at {path}',

    // 类型错误
    TYPE_MISMATCH: 'Expected {expected}, got {actual} at {path}',
    INVALID_TYPE: 'Invalid type: {type}',

    // 验证错误
    REQUIRED_FIELD: '{path} is required',
    INVALID_FORMAT: '{path} format is invalid',
    OUT_OF_RANGE: '{path} is out of range',
    PATTERN_MISMATCH: '{path} does not match pattern',

    // Schema错误
    INVALID_SCHEMA: 'Invalid schema definition: {reason}',
    SCHEMA_COMPILATION_FAILED: 'Schema compilation failed: {reason}',
    UNKNOWN_TYPE: 'Unknown type: {type}',

    // 插件错误
    PLUGIN_LOAD_FAILED: 'Plugin load failed: {name}',
    PLUGIN_INIT_FAILED: 'Plugin initialization failed: {name}'
  },

  // ========== 类型映射 ==========
  TYPE_MAPPINGS: {
    // JavaScript 类型到内部类型
    JS_TO_INTERNAL: {
      'string': 'string',
      'number': 'number',
      'boolean': 'boolean',
      'object': 'object',
      'function': 'function',
      'undefined': 'undefined',
      'symbol': 'symbol',
      'bigint': 'bigint'
    },

    // JSON Schema 类型到内部类型
    JSON_SCHEMA_TO_INTERNAL: {
      'string': 'string',
      'number': 'number',
      'integer': 'number',
      'boolean': 'boolean',
      'object': 'object',
      'array': 'array',
      'null': 'null'
    },

    // MongoDB 类型映射
    MONGODB: {
      'string': 'String',
      'number': 'Number',
      'boolean': 'Boolean',
      'date': 'Date',
      'object': 'Schema',
      'array': 'Array',
      'objectId': 'ObjectId',
      'buffer': 'Buffer',
      'decimal': 'Decimal128',
      'mixed': 'Mixed'
    },

    // MySQL 类型映射
    MYSQL: {
      'string': 'VARCHAR',
      'number': 'INT',
      'boolean': 'BOOLEAN',
      'date': 'DATETIME',
      'object': 'JSON',
      'array': 'JSON',
      'text': 'TEXT',
      'decimal': 'DECIMAL',
      'bigint': 'BIGINT'
    },

    // PostgreSQL 类型映射
    POSTGRESQL: {
      'string': 'VARCHAR',
      'number': 'INTEGER',
      'boolean': 'BOOLEAN',
      'date': 'TIMESTAMP',
      'object': 'JSONB',
      'array': 'ARRAY',
      'text': 'TEXT',
      'decimal': 'NUMERIC',
      'bigint': 'BIGINT',
      'uuid': 'UUID'
    }
  },

  // ========== 格式验证器 ==========
  FORMATS: {
    // 内置格式
    BUILT_IN: [
      'email',
      'url',
      'uri',
      'uuid',
      'ipv4',
      'ipv6',
      'hostname',
      'date',
      'date-time',
      'time',
      'regex',
      'json'
    ],

    // 正则表达式模式
    PATTERNS: {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      ipv4: /^(\d{1,3}\.){3}\d{1,3}$/,
      ipv6: /^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/i,
      hostname: /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i,
      dateTime: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
      date: /^\d{4}-\d{2}-\d{2}$/,
      time: /^\d{2}:\d{2}:\d{2}$/
    }
  },

  // ========== 性能配置 ==========
  PERFORMANCE: {
    // 并行验证配置
    PARALLEL: {
      ENABLED: true,
      MAX_CONCURRENT: 10,        // 最大并发数
      BATCH_SIZE: 100            // 批处理大小
    },

    // 懒加载配置
    LAZY_LOAD: {
      ENABLED: true,
      MODULES: [
        'ajv',                   // JSON Schema验证器
        'exporters'              // 导出器模块
      ]
    },

    // 性能监控
    MONITORING: {
      ENABLED: false,            // 默认关闭（生产环境可开启）
      SAMPLE_RATE: 0.1           // 采样率10%
    }
  },

  // ========== API配置 ==========
  API: {
    // 支持的API风格
    STYLES: [
      'joi',                     // Joi风格链式调用
      'dsl',                     // DSL风格
      'json-schema',             // JSON Schema标准
      'functional'               // 函数式风格
    ],

    // 默认API风格
    DEFAULT_STYLE: 'joi',

    // API版本
    VERSION: '1.0.3'
  },

  // ========== 插件配置 ==========
  PLUGINS: {
    // 插件目录
    DIRECTORY: 'plugins',

    // 自动加载
    AUTO_LOAD: false,

    // 插件命名约定
    NAMING_CONVENTION: /^schema-dsl-plugin-/,

    // 最大插件数量
    MAX_PLUGINS: 50
  },

  // ========== 调试配置 ==========
  DEBUG: {
    // 调试模式
    ENABLED: process.env.NODE_ENV !== 'production',

    // 日志级别
    LOG_LEVEL: process.env.DEBUG_LEVEL || 'info',

    // 详细错误信息
    VERBOSE_ERRORS: process.env.NODE_ENV !== 'production',

    // 性能跟踪
    TRACE_PERFORMANCE: false
  },

  // ========== 版本信息 ==========
  VERSION: {
    MAJOR: 2,
    MINOR: 0,
    PATCH: 0,
    FULL: '2.0.0',

    // 最低支持的Node.js版本
    MIN_NODE_VERSION: '14.0.0',

    // JSON Schema支持版本
    JSON_SCHEMA_VERSION: 'draft-07'
  }
};

