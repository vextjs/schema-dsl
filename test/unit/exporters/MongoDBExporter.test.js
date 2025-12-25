/**
 * MongoDBExporter 测试
 *
 * 测试 MongoDB Schema 导出功能
 */

const { expect } = require('chai');
const MongoDBExporter = require('../../../lib/exporters/MongoDBExporter');

describe('MongoDBExporter', () => {
  let exporter;

  beforeEach(() => {
    exporter = new MongoDBExporter();
  });

  describe('构造函数', () => {
    it('应该创建 MongoDBExporter 实例', () => {
      expect(exporter).to.be.instanceOf(MongoDBExporter);
    });

    it('应该使用默认选项', () => {
      expect(exporter.options.strict).to.be.false;
    });

    it('应该接受自定义选项', () => {
      const customExporter = new MongoDBExporter({ strict: true });
      expect(customExporter.options.strict).to.be.true;
    });
  });

  describe('export()', () => {
    it('应该导出基本 Schema', () => {
      const jsonSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        },
        required: ['name']
      };

      const result = exporter.export(jsonSchema);

      expect(result).to.have.property('$jsonSchema');
      expect(result.$jsonSchema.bsonType).to.equal('object');
      expect(result.$jsonSchema.required).to.deep.equal(['name']);
    });

    it('应该转换类型为 bsonType', () => {
      const jsonSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' },
          score: { type: 'number' },
          active: { type: 'boolean' }
        }
      };

      const result = exporter.export(jsonSchema);
      const props = result.$jsonSchema.properties;

      expect(props.name.bsonType).to.equal('string');
      expect(props.age.bsonType).to.equal('int');
      expect(props.score.bsonType).to.equal('double');
      expect(props.active.bsonType).to.equal('bool');
    });

    it('应该转换字符串约束', () => {
      const jsonSchema = {
        type: 'string',
        minLength: 3,
        maxLength: 32,
        pattern: '^[a-z]+$'
      };

      const result = exporter.export(jsonSchema);

      expect(result.$jsonSchema.minLength).to.equal(3);
      expect(result.$jsonSchema.maxLength).to.equal(32);
      expect(result.$jsonSchema.pattern).to.equal('^[a-z]+$');
    });

    it('应该转换数值约束', () => {
      const jsonSchema = {
        type: 'number',
        minimum: 0,
        maximum: 100
      };

      const result = exporter.export(jsonSchema);

      expect(result.$jsonSchema.minimum).to.equal(0);
      expect(result.$jsonSchema.maximum).to.equal(100);
    });

    it('应该转换数组约束', () => {
      const jsonSchema = {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 10
      };

      const result = exporter.export(jsonSchema);

      expect(result.$jsonSchema.bsonType).to.equal('array');
      expect(result.$jsonSchema.items.bsonType).to.equal('string');
      expect(result.$jsonSchema.minItems).to.equal(1);
      expect(result.$jsonSchema.maxItems).to.equal(10);
    });

    it('应该转换枚举值', () => {
      const jsonSchema = {
        type: 'string',
        enum: ['active', 'inactive', 'pending']
      };

      const result = exporter.export(jsonSchema);

      expect(result.$jsonSchema.enum).to.deep.equal(['active', 'inactive', 'pending']);
    });

    it('应该保留描述信息', () => {
      const jsonSchema = {
        type: 'string',
        description: 'User name'
      };

      const result = exporter.export(jsonSchema);

      expect(result.$jsonSchema.description).to.equal('User name');
    });
  });

  describe('generateCreateCommand()', () => {
    it('应该生成 createCollection 命令', () => {
      const jsonSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        required: ['name']
      };

      const command = exporter.generateCreateCommand('users', jsonSchema);

      expect(command.collectionName).to.equal('users');
      expect(command.options).to.have.property('validator');
      expect(command.options.validationLevel).to.equal('moderate');
      expect(command.options.validationAction).to.equal('error');
    });

    it('应该支持严格模式', () => {
      const strictExporter = new MongoDBExporter({ strict: true });
      const jsonSchema = {
        type: 'object',
        properties: { name: { type: 'string' } }
      };

      const command = strictExporter.generateCreateCommand('users', jsonSchema);

      expect(command.options.validationLevel).to.equal('strict');
    });
  });

  describe('generateCommand()', () => {
    it('应该生成可执行的 MongoDB 命令字符串', () => {
      const jsonSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' }
        }
      };

      const commandStr = exporter.generateCommand('users', jsonSchema);

      expect(commandStr).to.be.a('string');
      expect(commandStr).to.include('db.createCollection');
      expect(commandStr).to.include('"users"');
    });
  });

  describe('静态方法', () => {
    it('MongoDBExporter.export() 应该快速导出', () => {
      const jsonSchema = {
        type: 'object',
        properties: { name: { type: 'string' } }
      };

      const result = MongoDBExporter.export(jsonSchema);

      expect(result).to.have.property('$jsonSchema');
    });
  });

  describe('嵌套对象', () => {
    it('应该正确处理嵌套对象', () => {
      const jsonSchema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              profile: {
                type: 'object',
                properties: {
                  bio: { type: 'string' }
                }
              }
            }
          }
        }
      };

      const result = exporter.export(jsonSchema);

      expect(result.$jsonSchema.properties.user.bsonType).to.equal('object');
      expect(result.$jsonSchema.properties.user.properties.profile.bsonType).to.equal('object');
    });
  });
});

