const { expect } = require('chai');
const PostgreSQLExporter = require('../../../lib/exporters/PostgreSQLExporter');
const dsl = require('../../../lib/adapters/DslAdapter');

describe('PostgreSQLExporter', () => {
  let exporter;

  beforeEach(() => {
    exporter = new PostgreSQLExporter();
  });

  describe('构造函数', () => {
    it('应该创建 PostgreSQLExporter 实例', () => {
      expect(exporter).to.be.instanceOf(PostgreSQLExporter);
    });

    it('应该使用默认选项', () => {
      expect(exporter.options.schema).to.equal('public');
    });

    it('应该接受自定义选项', () => {
      const customExporter = new PostgreSQLExporter({
        schema: 'app'
      });
      expect(customExporter.options.schema).to.equal('app');
    });
  });

  describe('export()', () => {
    it('应该导出基本 Schema', () => {
      const schema = dsl({
        name: 'string!',
        age: 'number'
      });
      const ddl = exporter.export('users', schema);

      expect(ddl).to.contain('CREATE TABLE public.users');
      expect(ddl).to.contain('name VARCHAR(255) NOT NULL');
      expect(ddl).to.contain('age DOUBLE PRECISION');
    });

    it('应该处理主键 (id)', () => {
      const schema = dsl({
        id: 'number!',
        name: 'string'
      });
      const ddl = exporter.export('users', schema);

      expect(ddl).to.contain('PRIMARY KEY (id)');
    });

    it('应该转换字符串约束', () => {
      const schema = dsl({
        bio: 'string:-1000',   // 修复：最大1000字符
        code: 'string:-10'     // 修复：最大10字符
      });
      const ddl = exporter.export('profiles', schema);

      expect(ddl).to.contain('bio TEXT'); // > 255 -> TEXT
      expect(ddl).to.contain('code VARCHAR(10)');
    });

    it('应该转换数值约束', () => {
      const schema = dsl({
        count: 'integer',
        score: 'number'
      });
      const ddl = exporter.export('stats', schema);

      expect(ddl).to.contain('count BIGINT');
      expect(ddl).to.contain('score DOUBLE PRECISION');
    });

    it('应该转换布尔值', () => {
      const schema = dsl({
        active: 'boolean!'
      });
      const ddl = exporter.export('flags', schema);

      expect(ddl).to.contain('active BOOLEAN NOT NULL');
    });

    it('应该转换日期', () => {
      const schema = dsl({
        created_at: 'date!'
      });
      const ddl = exporter.export('logs', schema);

      expect(ddl).to.contain('created_at DATE NOT NULL');
    });

    it('应该转换对象为JSONB', () => {
      const schema = dsl({
        meta: 'object'
      });
      const ddl = exporter.export('data', schema);

      expect(ddl).to.contain('meta JSONB');
    });

    it('应该转换数组为JSONB', () => {
      const schema = dsl({
        tags: 'array<string>'
      });
      const ddl = exporter.export('posts', schema);

      expect(ddl).to.contain('tags JSONB');
    });

    it('应该添加表注释', () => {
      const schema = dsl({
        name: 'string'
      });
      schema.description = 'User table';
      const ddl = exporter.export('users', schema);

      expect(ddl).to.contain("COMMENT ON TABLE public.users IS 'User table'");
    });

    it('应该添加列注释', () => {
      const schema = dsl({
        name: 'string'
      });
      schema.properties.name.description = 'User name';
      const ddl = exporter.export('users', schema);

      expect(ddl).to.contain("COMMENT ON COLUMN public.users.name IS 'User name'");
    });

    it('应该抛出错误当表名缺失', () => {
      expect(() => exporter.export(null, {})).to.throw('Table name is required');
    });

    it('应该抛出错误当Schema不是对象', () => {
      expect(() => exporter.export('users', { type: 'string' })).to.throw('JSON Schema must be an object type');
    });
  });
});

