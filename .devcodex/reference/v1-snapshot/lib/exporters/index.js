/**
 * Exporters - 导出器统一导出
 * @module lib/exporters
 */

const MongoDBExporter = require('./MongoDBExporter');
const MySQLExporter = require('./MySQLExporter');
const PostgreSQLExporter = require('./PostgreSQLExporter');
const MarkdownExporter = require('./MarkdownExporter');

module.exports = {
  MongoDBExporter,
  MySQLExporter,
  PostgreSQLExporter,
  MarkdownExporter,

  // 别名
  MongoDB: MongoDBExporter,
  MySQL: MySQLExporter,
  PostgreSQL: PostgreSQLExporter,
  Postgres: PostgreSQLExporter,
  Markdown: MarkdownExporter
};

