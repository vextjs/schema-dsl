/**
 * Schema工具类 v2.0.1
 *
 * 提供Schema复用、合并、性能监控等功能
 */

class SchemaUtils {
  // ========== Schema复用 ==========

  /**
   * 创建可复用的Schema片段
   * @param {Function} factory - Schema工厂函数
   * @returns {Function} 返回工厂函数
   *
   * @example
   * const emailField = SchemaUtils.reusable(() =>
   *   'email!'.pattern(/custom/).label('邮箱')
   * );
   *
   * const schema1 = dsl({ email: emailField() });
   * const schema2 = dsl({ contactEmail: emailField() });
   */
  static reusable(factory) {
    return factory;
  }

  /**
   * 创建Schema片段库
   * @param {Object} fragments - Schema片段对象
   * @returns {Object} 片段库
   *
   * @example
   * const fields = SchemaUtils.createLibrary({
   *   email: () => 'email!'.label('邮箱'),
   *   phone: () => 'string:11!'.phoneNumber('cn').label('手机号'),
   *   username: () => 'string:3-32!'.username().label('用户名')
   * });
   *
   * const schema = dsl({
   *   email: fields.email(),
   *   phone: fields.phone()
   * });
   */
  static createLibrary(fragments) {
    return fragments;
  }

  // ========== Schema复用和扩展 ==========

  /**
   * 扩展Schema（类似继承）
   * @param {Object} baseSchema - 基础Schema
   * @param {Object} extensions - 扩展定义
   * @returns {Object} 扩展后的Schema（支持链式调用）
   *
   * @example
   * const baseUser = dsl({ name: 'string!', email: 'email!' });
   * const admin = SchemaUtils.extend(baseUser, {
   *   role: 'admin|superadmin',
   *   permissions: 'array<string>'
   * });
   */
  static extend(baseSchema, extensions) {
    const dsl = require('../adapters/DslAdapter');
    const extensionSchema = typeof extensions === 'function'
      ? extensions
      : dsl(extensions);

    // 合并 properties
    const result = {
      type: 'object',
      properties: {},
      required: []
    };

    // 复制基础 schema
    if (baseSchema.properties) {
      Object.assign(result.properties, baseSchema.properties);
    }
    if (baseSchema.required) {
      result.required = [...baseSchema.required];
    }

    // 添加扩展
    if (extensionSchema.properties) {
      Object.assign(result.properties, extensionSchema.properties);
    }
    if (extensionSchema.required) {
      result.required = [...new Set([...result.required, ...extensionSchema.required])];
    }

    return this._makeChainable(result);
  }

  /**
   * 挑选Schema的部分字段
   * @param {Object} schema - 原始Schema
   * @param {string[]} fields - 要挑选的字段
   * @returns {Object} 新Schema
   *
   * @example
   * const fullUser = dsl({ name: 'string!', email: 'email!', age: 'number' });
   * const publicUser = SchemaUtils.pick(fullUser, ['name', 'email']);
   */
  static pick(schema, fields) {
    const result = {
      type: 'object',
      properties: {},
      required: []
    };

    fields.forEach(field => {
      if (schema.properties && schema.properties[field]) {
        result.properties[field] = schema.properties[field];
        if (schema.required && schema.required.includes(field)) {
          result.required.push(field);
        }
      }
    });

    return this._makeChainable(result);
  }

  /**
   * 排除Schema的部分字段
   * @param {Object} schema - 原始Schema
   * @param {string[]} fields - 要排除的字段
   * @returns {Object} 新Schema（支持链式调用）
   */
  static omit(schema, fields) {
    const result = this._clone(schema);

    fields.forEach(field => {
      if (result.properties) {
        delete result.properties[field];
      }
      if (result.required) {
        result.required = result.required.filter(f => f !== field);
      }
    });

    // 清理空数组
    if (result.required && result.required.length === 0) {
      delete result.required;
    }

    return this._makeChainable(result);
  }

  // ========== v2.1.0 新增：Schema转换方法（支持链式调用） ==========

  /**
   * 部分验证：移除必填限制
   *
   * @param {Object} schema - 原始Schema
   * @param {string[]} fields - 要验证的字段（可选，默认全部）
   * @returns {Object} 新Schema（支持链式调用）
   *
   * @example
   * // 所有字段变为可选
   * const partialSchema = SchemaUtils.partial(userSchema);
   *
   * @example
   * // 只验证指定字段
   * const updateSchema = SchemaUtils.partial(userSchema, ['name', 'age']);
   *
   * @example
   * // 链式调用
   * const patchSchema = SchemaUtils
   *   .pick(userSchema, ['name', 'age'])
   *   .partial();
   */
  static partial(schema, fields = null) {
    let result;

    if (fields) {
      // 只保留指定字段 (pick 已经返回 chainable 对象)
      result = this.pick(schema, fields);
      // 提取原始 schema
      if (result._isChainable) {
        result = this._extractSchema(result);
      }
    } else {
      result = this._clone(schema);
    }

    // 移除所有 required
    delete result.required;

    // 递归处理嵌套对象
    if (result.properties) {
      Object.keys(result.properties).forEach(key => {
        const prop = result.properties[key];
        if (prop && prop.type === 'object' && prop.required) {
          delete prop.required;
        }
      });
    }

    return this._makeChainable(result);
  }

  // ========== 性能监控 ==========

  /**
   * 创建带性能监控的Validator
   * @param {Validator} validator - Validator实例
   * @returns {Validator} 增强的Validator
   *
   * @example
   * const validator = SchemaUtils.withPerformance(new Validator());
   * const result = validator.validate(schema, data);
   * console.log(result.performance);
   */
  static withPerformance(validator) {
    const originalValidate = validator.validate.bind(validator);

    validator.validate = function(schema, data) {
      const startTime = Date.now();
      const result = originalValidate(schema, data);
      const endTime = Date.now();

      result.performance = {
        duration: endTime - startTime,
        timestamp: new Date().toISOString()
      };

      return result;
    };

    return validator;
  }

  /**
   * 批量验证优化
   * @param {Object} schema - Schema对象
   * @param {Array} dataArray - 数据数组
   * @param {Validator} validator - Validator实例
   * @returns {Array} 验证结果数组
   *
   * @example
   * const results = SchemaUtils.validateBatch(schema, users, validator);
   */
  static validateBatch(schema, dataArray, validator) {
    const startTime = Date.now();

    // 复用编译后的Schema
    const compiledValidate = validator.getAjv().compile(schema);

    const results = dataArray.map((data, index) => {
      const valid = compiledValidate(data);
      return {
        index,
        valid,
        errors: valid ? null : compiledValidate.errors,
        data: valid ? data : null
      };
    });

    const endTime = Date.now();

    return {
      results,
      summary: {
        total: dataArray.length,
        valid: results.filter(r => r.valid).length,
        invalid: results.filter(r => !r.valid).length,
        duration: endTime - startTime,
        averageTime: (endTime - startTime) / dataArray.length
      }
    };
  }

  // ========== Schema导出 ==========

  /**
   * 导出Schema为Markdown文档
   * @param {Object} schema - Schema对象
   * @param {Object} options - 选项
   * @returns {string} Markdown文档
   *
   * @example
   * const markdown = SchemaUtils.toMarkdown(schema, { title: 'User Schema' });
   */
  static toMarkdown(schema, options = {}) {
    const { title = 'Schema文档', locale = 'zh-CN' } = options;

    let md = `# ${title}\n\n`;

    if (schema.properties) {
      md += '## 字段列表\n\n';
      md += '| 字段 | 类型 | 必填 | 说明 |\n';
      md += '|------|------|------|------|\n';

      Object.keys(schema.properties).forEach(key => {
        const prop = schema.properties[key];
        const required = schema.required?.includes(key) ? '✅' : '❌';
        const type = prop.type || 'any';
        const label = prop._label || key;
        const desc = prop._description || '-';

        md += `| ${key} | ${type} | ${required} | ${label} |\n`;

        if (desc !== '-') {
          md += `| | | | *${desc}* |\n`;
        }

        // 约束信息
        const constraints = [];
        if (prop.minLength) constraints.push(`最小长度: ${prop.minLength}`);
        if (prop.maxLength) constraints.push(`最大长度: ${prop.maxLength}`);
        if (prop.minimum) constraints.push(`最小值: ${prop.minimum}`);
        if (prop.maximum) constraints.push(`最大值: ${prop.maximum}`);
        if (prop.pattern) constraints.push(`格式: \`${prop.pattern}\``);
        if (prop.enum) constraints.push(`可选值: ${prop.enum.join(', ')}`);

        if (constraints.length > 0) {
          md += `| | | | ${constraints.join('; ')} |\n`;
        }
      });
    }

    return md;
  }

  /**
   * 导出Schema为HTML文档
   * @param {Object} schema - Schema对象
   * @param {Object} options - 选项
   * @returns {string} HTML文档
   */
  static toHTML(schema, options = {}) {
    const { title = 'Schema文档' } = options;
    const markdown = this.toMarkdown(schema, options);

    // 简单的Markdown到HTML转换
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #f5f5f5; font-weight: bold; }
    code { background-color: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
`;

    html += markdown
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/\`([^`]+)\`/g, '<code>$1</code>');

    html += '\n</body>\n</html>';

    return html;
  }

  /**
   * 克隆Schema
   * @param {Object} schema - 原始Schema
   * @returns {Object} 克隆的Schema
   */
  static clone(schema) {
    return JSON.parse(JSON.stringify(schema));
  }

  /**
   * 深拷贝Schema
   * @private
   * @param {Object} schema - 原始Schema
   * @returns {Object} 拷贝后的Schema
   */
  static _clone(schema) {
    // 如果是 chainable 对象，先提取原始 schema
    if (schema && schema._isChainable) {
      schema = this._extractSchema(schema);
    }
    return JSON.parse(JSON.stringify(schema));
  }

  /**
   * 使 schema 支持链式调用
   * @private
   * @param {Object} schema - Schema对象
   * @returns {Object} 支持链式调用的 Schema
   */
  static _makeChainable(schema) {
    // 如果已经是 chainable，直接返回
    if (schema && schema._isChainable) {
      return schema;
    }

    // 复制 schema 的所有属性
    const chainable = Object.assign({}, schema);

    // 标记为 chainable
    Object.defineProperty(chainable, '_isChainable', {
      value: true,
      enumerable: false,
      configurable: false
    });

    // 添加链式方法（只保留核心4个方法）
    const methods = ['partial', 'omit', 'pick', 'extend'];
    const self = this;  // 保存 this 引用
    methods.forEach(method => {
      Object.defineProperty(chainable, method, {
        value: (...args) => {
          // 提取原始 schema（去掉链式方法）
          const rawSchema = self._extractSchema(chainable);
          // 调用 SchemaUtils 的静态方法
          return SchemaUtils[method](rawSchema, ...args);
        },
        enumerable: false,
        configurable: false
      });
    });

    return chainable;
  }

  /**
   * 从 chainable 对象中提取原始 schema
   * @private
   * @param {Object} chainable - Chainable对象
   * @returns {Object} 原始 Schema
   */
  static _extractSchema(chainable) {
    const schema = {};
    for (const key in chainable) {
      if (chainable.hasOwnProperty(key) && key !== '_isChainable') {
        schema[key] = chainable[key];
      }
    }
    return schema;
  }
}

module.exports = SchemaUtils;

