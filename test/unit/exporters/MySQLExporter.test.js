const { expect } = require('chai');
const MySQLExporter = require('../../../lib/exporters/MySQLExporter');
const dsl = require('../../../lib/adapters/DslAdapter');

describe('MySQLExporter', () => {
  let exporter;

  beforeEach(() => {
    exporter = new MySQLExporter();
  });

  describe('构造函数', () => {
    it('应该创建 MySQLExporter 实例', () => {
      expect(exporter).to.be.instanceOf(MySQLExporter);
    });

    it('应该使用默认选项', () => {
      expect(exporter.options.engine).to.equal('InnoDB');
      expect(exporter.options.charset).to.equal('utf8mb4');
    });

    it('应该接受自定义选项', () => {
      const customExporter = new MySQLExporter({
        engine: 'MyISAM',
        charset: 'utf8'
      });
      expect(customExporter.options.engine).to.equal('MyISAM');
      expect(customExporter.options.charset).to.equal('utf8');
    });
  });

  describe('export()', () => {
    it('应该导出基本 Schema', () => {
      const schema = dsl({
        name: 'string!',
        age: 'number'
      });
      const ddl = exporter.export('users', schema);
      
      expect(ddl).to.contain('CREATE TABLE `users`');
      expect(ddl).to.contain('`name` VARCHAR(255) NOT NULL');
      expect(ddl).to.contain('`age` DOUBLE');
      expect(ddl).to.contain('ENGINE=InnoDB');
    });

    it('应该处理主键 (id)', () => {
      const schema = dsl({
        id: 'number!',
        name: 'string'
      });
      const ddl = exporter.export('users', schema);
      
      expect(ddl).to.contain('PRIMARY KEY (`id`)');
    });

    it('应该处理主键 (_id)', () => {
      const schema = dsl({
        _id: 'string!',
        name: 'string'
      });
      const ddl = exporter.export('users', schema);
      
      expect(ddl).to.contain('PRIMARY KEY (`_id`)');
    });

    it('应该转换字符串约束', () => {
      const schema = dsl({
        bio: 'string:1000',
        code: 'string:10'
      });
      const ddl = exporter.export('profiles', schema);
      
      expect(ddl).to.contain('`bio` TEXT'); // > 255 -> TEXT
      expect(ddl).to.contain('`code` VARCHAR(10)');
    });

    it('应该转换数值约束', () => {
      const schema = dsl({
        count: 'integer',
        score: 'number'
      });
      const ddl = exporter.export('stats', schema);
      
      expect(ddl).to.contain('`count` BIGINT');
      expect(ddl).to.contain('`score` DOUBLE');
    });

    it('应该转换布尔值', () => {
      const schema = dsl({
        active: 'boolean!'
      });
      const ddl = exporter.export('flags', schema);
      
      expect(ddl).to.contain('`active` BOOLEAN NOT NULL');
    });

    it('应该转换日期', () => {
      const schema = dsl({
        created_at: 'date!'
      });
      const ddl = exporter.export('logs', schema);
      
      expect(ddl).to.contain('`created_at` DATETIME NOT NULL');
    });

    it('应该转换对象为JSON', () => {
      const schema = dsl({
        meta: 'object'
      });
      const ddl = exporter.export('data', schema);
      
      expect(ddl).to.contain('`meta` JSON');
    });

    it('应该转换数组为JSON', () => {
      const schema = dsl({
        tags: 'array<string>'
      });
      const ddl = exporter.export('posts', schema);
      
      expect(ddl).to.contain('`tags` JSON');
    });

    it('应该处理枚举值', () => {
      const schema = {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'inactive']
          }
        }
      };
      const ddl = exporter.export('users', schema);
      
      expect(ddl).to.contain("`status` ENUM('active', 'inactive')");
    });

    it('应该抛出错误当表名缺失', () => {
      expect(() => exporter.export(null, {})).to.throw('Table name is required');
    });

    it('应该抛出错误当Schema不是对象', () => {
      expect(() => exporter.export('users', { type: 'string' })).to.throw('JSON Schema must be an object type');
    });
  });
});

