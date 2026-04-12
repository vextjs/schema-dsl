/**
 * MySQL DDL导出器
 *
 * 将JSON Schema转换为MySQL CREATE TABLE语句
 *
 * @module lib/exporters/MySQLExporter
 * @version 1.0.0
 */

const TypeConverter = require('../utils/TypeConverter');
const SchemaHelper = require('../utils/SchemaHelper');

/**
 * MySQL导出器类
 * @class MySQLExporter
 */
class MySQLExporter {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {string} options.engine - 存储引擎（默认InnoDB）
   * @param {string} options.charset - 字符集（默认utf8mb4）
   * @param {string} options.collate - 排序规则（默认utf8mb4_unicode_ci）
   */
  constructor(options = {}) {
    this.options = {
      engine: options.engine || 'InnoDB',
      charset: options.charset || 'utf8mb4',
      collate: options.collate || 'utf8mb4_unicode_ci',
      ...options
    };
  }

  /**
   * 导出为MySQL CREATE TABLE语句
   * @param {string} tableName - 表名
   * @param {Object} jsonSchema - JSON Schema对象
   * @returns {string} MySQL DDL语句
   */
  export(tableName, jsonSchema) {
    if (!tableName || typeof tableName !== 'string') {
      throw new Error('Table name is required');
    }
    if (!jsonSchema || jsonSchema.type !== 'object') {
      throw new Error('JSON Schema must be an object type');
    }

    const columns = this._convertProperties(jsonSchema);
    const primaryKey = this._detectPrimaryKey(jsonSchema);

    let ddl = `CREATE TABLE \`${tableName}\` (\n`;

    // 添加列定义
    const columnDefs = columns.map(col => `  ${col}`).join(',\n');
    ddl += columnDefs;

    // 添加主键
    if (primaryKey) {
      ddl += `,\n  PRIMARY KEY (\`${primaryKey}\`)`;
    }

    ddl += `\n)`;

    // 添加表选项
    ddl += ` ENGINE=${this.options.engine}`;
    ddl += ` DEFAULT CHARSET=${this.options.charset}`;
    ddl += ` COLLATE=${this.options.collate};`;

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
    const mysqlType = TypeConverter.toMySQLType(schema.type, constraints);

    let def = `\`${name}\` ${mysqlType}`;

    // NULL约束
    if (isRequired) {
      def += ' NOT NULL';
    } else {
      def += ' NULL';
    }

    // 默认值
    if (schema.default !== undefined) {
      const defaultValue = this._formatDefaultValue(schema.default, schema.type);
      def += ` DEFAULT ${defaultValue}`;
    }

    // 注释
    if (schema.description) {
      def += ` COMMENT '${this._escapeString(schema.description)}'`;
    }

    return def;
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
      return value ? '1' : '0';
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
   * 生成索引DDL
   * @param {string} tableName - 表名
   * @param {string} columnName - 列名
   * @param {Object} options - 索引选项
   * @returns {string} CREATE INDEX语句
   */
  generateIndex(tableName, columnName, options = {}) {
    const indexName = options.name || `idx_${tableName}_${columnName}`;
    const unique = options.unique ? 'UNIQUE ' : '';

    return `CREATE ${unique}INDEX \`${indexName}\` ON \`${tableName}\` (\`${columnName}\`);`;
  }

  /**
   * 静态方法：快速导出
   * @static
   * @param {string} tableName - 表名
   * @param {Object} jsonSchema - JSON Schema对象
   * @returns {string} MySQL DDL语句
   */
  static export(tableName, jsonSchema) {
    const exporter = new MySQLExporter();
    return exporter.export(tableName, jsonSchema);
  }
}

module.exports = MySQLExporter;

