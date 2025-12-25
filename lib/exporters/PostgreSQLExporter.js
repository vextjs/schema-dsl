/**
 * PostgreSQL DDL导出器
 *
 * 将JSON Schema转换为PostgreSQL CREATE TABLE语句
 *
 * @module lib/exporters/PostgreSQLExporter
 * @version 1.0.0
 */

const TypeConverter = require('../utils/TypeConverter');

/**
 * PostgreSQL导出器类
 * @class PostgreSQLExporter
 */
class PostgreSQLExporter {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {string} options.schema - PostgreSQL schema名称（默认public）
   */
  constructor(options = {}) {
    this.options = {
      schema: options.schema || 'public',
      ...options
    };
  }

  /**
   * 导出为PostgreSQL CREATE TABLE语句
   * @param {string} tableName - 表名
   * @param {Object} jsonSchema - JSON Schema对象
   * @returns {string} PostgreSQL DDL语句
   */
  export(tableName, jsonSchema) {
    if (!tableName || typeof tableName !== 'string') {
      throw new Error('Table name is required');
    }
    if (!jsonSchema || jsonSchema.type !== 'object') {
      throw new Error('JSON Schema must be an object type');
    }

    const fullTableName = `${this.options.schema}.${tableName}`;
    const columns = this._convertProperties(jsonSchema);
    const primaryKey = this._detectPrimaryKey(jsonSchema);

    let ddl = `CREATE TABLE ${fullTableName} (\n`;

    // 添加列定义
    const columnDefs = columns.map(col => `  ${col}`).join(',\n');
    ddl += columnDefs;

    // 添加主键
    if (primaryKey) {
      ddl += `,\n  PRIMARY KEY (${primaryKey})`;
    }

    ddl += `\n);`;

    // 添加表注释
    if (jsonSchema.description) {
      ddl += `\n\nCOMMENT ON TABLE ${fullTableName} IS '${this._escapeString(jsonSchema.description)}';`;
    }

    // 添加列注释
    const commentDdls = this._generateColumnComments(fullTableName, jsonSchema);
    if (commentDdls.length > 0) {
      ddl += '\n\n' + commentDdls.join('\n');
    }

    return ddl;
  }

  /**
   * 转换properties为列定义
   * @private
   * @param {Object} schema - JSON Schema对象
   * @returns {Array<string>} 列定义数组
   */
  _convertProperties(schema) {
    if (!schema.properties) {
      return [];
    }

    const columns = [];
    const required = schema.required || [];

    for (const [name, propSchema] of Object.entries(schema.properties)) {
      const columnDef = this._convertColumn(name, propSchema, required.includes(name));
      columns.push(columnDef);
    }

    return columns;
  }

  /**
   * 转换单个列
   * @private
   * @param {string} name - 列名
   * @param {Object} schema - 属性Schema
   * @param {boolean} isRequired - 是否必填
   * @returns {string} 列定义字符串
   */
  _convertColumn(name, schema, isRequired) {
    const constraints = TypeConverter.extractConstraints(schema);
    const pgType = TypeConverter.toPostgreSQLType(schema.type, constraints);

    let def = `${name} ${pgType}`;

    // NULL约束
    if (isRequired) {
      def += ' NOT NULL';
    }

    // 默认值
    if (schema.default !== undefined) {
      const defaultValue = this._formatDefaultValue(schema.default, schema.type);
      def += ` DEFAULT ${defaultValue}`;
    }

    // UNIQUE约束
    if (schema.format === 'email' || schema.format === 'uuid') {
      // email和uuid通常是唯一的
      // def += ' UNIQUE'; // 可选
    }

    // CHECK约束
    const checkConstraints = this._generateCheckConstraints(name, schema);
    if (checkConstraints.length > 0) {
      def += ' ' + checkConstraints.join(' ');
    }

    return def;
  }

  /**
   * 生成CHECK约束
   * @private
   * @param {string} columnName - 列名
   * @param {Object} schema - 属性Schema
   * @returns {Array<string>} CHECK约束数组
   */
  _generateCheckConstraints(columnName, schema) {
    const checks = [];

    // 字符串长度
    if (schema.minLength !== undefined || schema.maxLength !== undefined) {
      if (schema.minLength !== undefined && schema.maxLength !== undefined) {
        checks.push(`CHECK (LENGTH(${columnName}) BETWEEN ${schema.minLength} AND ${schema.maxLength})`);
      } else if (schema.minLength !== undefined) {
        checks.push(`CHECK (LENGTH(${columnName}) >= ${schema.minLength})`);
      } else {
        checks.push(`CHECK (LENGTH(${columnName}) <= ${schema.maxLength})`);
      }
    }

    // 数值范围
    if (schema.minimum !== undefined || schema.maximum !== undefined) {
      if (schema.minimum !== undefined && schema.maximum !== undefined) {
        checks.push(`CHECK (${columnName} BETWEEN ${schema.minimum} AND ${schema.maximum})`);
      } else if (schema.minimum !== undefined) {
        checks.push(`CHECK (${columnName} >= ${schema.minimum})`);
      } else {
        checks.push(`CHECK (${columnName} <= ${schema.maximum})`);
      }
    }

    // 枚举
    if (schema.enum) {
      const values = schema.enum.map(v => `'${this._escapeString(v)}'`).join(', ');
      checks.push(`CHECK (${columnName} IN (${values}))`);
    }

    return checks;
  }

  /**
   * 格式化默认值
   * @private
   * @param {*} value - 默认值
   * @param {string} type - 类型
   * @returns {string} 格式化后的默认值
   */
  _formatDefaultValue(value, type) {
    if (value === null) {
      return 'NULL';
    }

    if (type === 'string') {
      return `'${this._escapeString(value)}'`;
    }

    if (type === 'boolean') {
      return value ? 'TRUE' : 'FALSE';
    }

    if (type === 'object' || type === 'array') {
      return `'${JSON.stringify(value)}'::JSONB`;
    }

    return value.toString();
  }

  /**
   * 转义字符串
   * @private
   * @param {string} str - 字符串
   * @returns {string} 转义后的字符串
   */
  _escapeString(str) {
    return str.replace(/'/g, "''");
  }

  /**
   * 检测主键
   * @private
   * @param {Object} schema - JSON Schema对象
   * @returns {string|null} 主键列名
   */
  _detectPrimaryKey(schema) {
    if (!schema.properties) {
      return null;
    }

    // 查找名为id或_id的字段
    if (schema.properties.id) {
      return 'id';
    }
    if (schema.properties._id) {
      return '_id';
    }

    return null;
  }

  /**
   * 生成列注释
   * @private
   * @param {string} tableName - 表名
   * @param {Object} schema - JSON Schema对象
   * @returns {Array<string>} COMMENT语句数组
   */
  _generateColumnComments(tableName, schema) {
    if (!schema.properties) {
      return [];
    }

    const comments = [];

    for (const [name, propSchema] of Object.entries(schema.properties)) {
      if (propSchema.description) {
        comments.push(`COMMENT ON COLUMN ${tableName}.${name} IS '${this._escapeString(propSchema.description)}';`);
      }
    }

    return comments;
  }

  /**
   * 生成索引DDL
   * @param {string} tableName - 表名
   * @param {string} columnName - 列名
   * @param {Object} options - 索引选项
   * @returns {string} CREATE INDEX语句
   */
  generateIndex(tableName, columnName, options = {}) {
    const fullTableName = `${this.options.schema}.${tableName}`;
    const indexName = options.name || `idx_${tableName}_${columnName}`;
    const unique = options.unique ? 'UNIQUE ' : '';
    const method = options.method || 'btree'; // btree, hash, gin, gist

    return `CREATE ${unique}INDEX ${indexName} ON ${fullTableName} USING ${method} (${columnName});`;
  }

  /**
   * 静态方法：快速导出
   * @static
   * @param {string} tableName - 表名
   * @param {Object} jsonSchema - JSON Schema对象
   * @returns {string} PostgreSQL DDL语句
   */
  static export(tableName, jsonSchema) {
    const exporter = new PostgreSQLExporter();
    return exporter.export(tableName, jsonSchema);
  }
}

module.exports = PostgreSQLExporter;

