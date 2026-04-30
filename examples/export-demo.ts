import { dsl, MarkdownExporter, MySQLExporter, MongoDBExporter, PostgreSQLExporter } from '../dist/index.js';

const schema = dsl({
  id: 'string:24!',
  name: 'string:1-100!',
  price: 'number:0-'
});

console.log(MarkdownExporter.export(schema, { title: 'Product' }));
console.log(MySQLExporter.export('products', schema));
console.log(MongoDBExporter.export(schema));
console.log(PostgreSQLExporter.export('products', schema));

