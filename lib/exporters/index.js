/**
 * Exporters - 导出器统一导出
 * @module lib/exporters
 */

const MongoDBExporter = require('./MongoDBExporter');
const MySQLExporter = require('./MySQLExporter');
const PostgreSQLExporter = require('./PostgreSQLExporter');

module.exports = {
  MongoDBExporter,
  MySQLExporter,
  PostgreSQLExporter,

  // 别名
  MongoDB: MongoDBExporter,
  MySQL: MySQLExporter,
  PostgreSQL: PostgreSQLExporter,
  Postgres: PostgreSQLExporter
};

