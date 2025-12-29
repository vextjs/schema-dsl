/**
 * SchemaUtils 链式调用单元测试 (v2.1.0 简化版)
 *
 * 测试核心4个方法：partial、omit、pick、extend 的链式调用功能
 */

const { expect } = require('chai');
const { dsl, validate, SchemaUtils } = require('../../index');

describe('SchemaUtils Chaining (v2.1.0 - 核心方法)', function() {
  let baseSchema;

  beforeEach(function() {
    baseSchema = dsl({
      id: 'objectId!',
      name: 'string:1-50!',
      email: 'email!',
      password: 'string:8-32!',
      age: 'integer:0-150',
      createdAt: 'date',
      updatedAt: 'date'
    });
  });


  describe('partial() - 部分验证', function() {
    it('应该移除所有必填限制', function() {
      const partialSchema = SchemaUtils.partial(baseSchema);

      const result = validate(partialSchema, {
        name: 'John'
        // 其他必填字段缺失，但不应报错
      });

      expect(result.valid).to.be.true;
      expect(partialSchema.required).to.be.undefined;
    });

    it('应该只验证指定字段', function() {
      const partialSchema = SchemaUtils.partial(baseSchema, ['name', 'age']);

      expect(Object.keys(partialSchema.properties)).to.have.lengthOf(2);
      expect(partialSchema.properties).to.have.property('name');
      expect(partialSchema.properties).to.have.property('age');
      expect(partialSchema.required).to.be.undefined;
    });

    it('应该验证提供的字段值', function() {
      const partialSchema = SchemaUtils.partial(baseSchema, ['name', 'email']);

      // email 格式错误应该被捕获
      const result = validate(partialSchema, {
        name: 'John',
        email: 'invalid'
      });

      expect(result.valid).to.be.false;
    });
  });

  describe('omit() - 排除字段', function() {
    it('应该排除指定字段', function() {
      const omittedSchema = SchemaUtils.omit(baseSchema, ['password', 'createdAt', 'updatedAt']);

      expect(omittedSchema.properties.password).to.be.undefined;
      expect(omittedSchema.properties.createdAt).to.be.undefined;
      expect(omittedSchema.properties.updatedAt).to.be.undefined;
      expect(omittedSchema.properties.name).to.exist;
      expect(omittedSchema.properties.email).to.exist;
    });

    it('应该从 required 中移除排除的字段', function() {
      const omittedSchema = SchemaUtils.omit(baseSchema, ['password']);

      expect(omittedSchema.required).to.not.include('password');
      expect(omittedSchema.required).to.include('name');
      expect(omittedSchema.required).to.include('email');
    });
  });

  describe('pick() - 保留字段', function() {
    it('应该只保留指定字段', function() {
      const pickedSchema = SchemaUtils.pick(baseSchema, ['name', 'email']);

      expect(Object.keys(pickedSchema.properties)).to.have.lengthOf(2);
      expect(pickedSchema.properties).to.have.property('name');
      expect(pickedSchema.properties).to.have.property('email');
      expect(pickedSchema.properties.password).to.be.undefined;
    });

    it('应该保留字段的必填限制', function() {
      const pickedSchema = SchemaUtils.pick(baseSchema, ['name', 'email']);

      expect(pickedSchema.required).to.include('name');
      expect(pickedSchema.required).to.include('email');
    });
  });

  describe('extend() - 扩展字段', function() {
    it('应该添加新字段', function() {
      const extendedSchema = SchemaUtils.extend(baseSchema, {
        avatar: 'url',
        bio: 'string:0-500'
      });

      expect(extendedSchema.properties.avatar).to.exist;
      expect(extendedSchema.properties.bio).to.exist;
      expect(extendedSchema.properties.name).to.exist;
    });

    it('应该保留原字段', function() {
      const extendedSchema = SchemaUtils.extend(baseSchema, {
        avatar: 'url'
      });

      expect(extendedSchema.properties.name).to.exist;
      expect(extendedSchema.properties.email).to.exist;
      expect(extendedSchema.properties.password).to.exist;
    });
  });


  describe('链式调用', function() {
    it('应该支持 omit + extend', function() {
      const schema = SchemaUtils
        .omit(baseSchema, ['password'])
        .extend({ avatar: 'url' });

      expect(schema.properties.password).to.be.undefined;
      expect(schema.properties.avatar).to.exist;
    });

    it('应该支持 pick + partial', function() {
      const schema = SchemaUtils
        .pick(baseSchema, ['name', 'age'])
        .partial();

      expect(Object.keys(schema.properties)).to.have.lengthOf(2);
      expect(schema.required).to.be.undefined;
    });

    it('应该支持 pick + extend', function() {
      const schema = SchemaUtils
        .pick(baseSchema, ['name', 'email'])
        .extend({ avatar: 'url', bio: 'string:0-500' });

      expect(schema.properties.name).to.exist;
      expect(schema.properties.email).to.exist;
      expect(schema.properties.avatar).to.exist;
      expect(schema.properties.bio).to.exist;
      expect(schema.properties.password).to.be.undefined;
    });

    it('应该支持复杂链式调用', function() {
      const schema = SchemaUtils
        .omit(baseSchema, ['id', 'password', 'createdAt', 'updatedAt'])
        .extend({ avatar: 'url' })
        .pick(['name', 'email', 'avatar'])
        .partial();

      expect(Object.keys(schema.properties)).to.have.lengthOf(3);
      expect(schema.properties.name).to.exist;
      expect(schema.properties.email).to.exist;
      expect(schema.properties.avatar).to.exist;
      expect(schema.required).to.be.undefined;
    });
  });

  describe('CRUD 场景', function() {
    it('POST - 创建用户（排除系统字段）', function() {
      const createSchema = SchemaUtils.omit(baseSchema, ['id', 'createdAt', 'updatedAt']);

      const result = validate(createSchema, {
        name: 'John',
        email: 'john@example.com',
        password: 'password123',
        age: 30
      });

      expect(result.valid).to.be.true;
    });

    it('GET - 查询用户（排除敏感字段）', function() {
      const publicSchema = SchemaUtils.omit(baseSchema, ['password']);

      const result = validate(publicSchema, {
        id: '507f1f77bcf86cd799439011',
        name: 'John',
        email: 'john@example.com',
        age: 30,
        createdAt: '2025-12-29',
        updatedAt: '2025-12-29'
      });

      expect(result.valid).to.be.true;
      expect(result.data.password).to.be.undefined;
    });

    it('PATCH - 更新用户（部分验证）', function() {
      const updateSchema = SchemaUtils
        .pick(baseSchema, ['name', 'age'])
        .partial();

      const result = validate(updateSchema, {
        name: 'Jane'
        // age 缺失也可以，因为是 partial
      });

      expect(result.valid).to.be.true;
    });

    it('PUT - 替换用户（排除系统字段）', function() {
      const replaceSchema = SchemaUtils.omit(baseSchema, ['id', 'createdAt', 'updatedAt']);

      const result = validate(replaceSchema, {
        name: 'John',
        email: 'john@example.com',
        password: 'password123'
        // age 可选，所以可以缺失
      });

      expect(result.valid).to.be.true;
    });
  });

  describe('不可变性', function() {
    it('应该不修改原 schema', function() {
      const originalProps = Object.keys(baseSchema.properties);
      const originalRequired = [...(baseSchema.required || [])];

      SchemaUtils
        .omit(baseSchema, ['password'])
        .extend({ avatar: 'url' });

      expect(Object.keys(baseSchema.properties)).to.deep.equal(originalProps);
      expect(baseSchema.required).to.deep.equal(originalRequired);
    });

    it('每次调用应该返回新对象', function() {
      const schema1 = SchemaUtils.omit(baseSchema, ['password']);
      const schema2 = SchemaUtils.omit(baseSchema, ['password']);

      expect(schema1).to.not.equal(schema2);
      expect(schema1).to.deep.equal(schema2);
    });
  });

  describe('边界情况', function() {
    it('应该处理空字段数组', function() {
      const schema = SchemaUtils.omit(baseSchema, []);
      expect(Object.keys(schema.properties)).to.have.lengthOf(Object.keys(baseSchema.properties).length);
    });

    it('应该处理不存在的字段', function() {
      const schema = SchemaUtils.omit(baseSchema, ['nonExistentField']);
      expect(Object.keys(schema.properties)).to.have.lengthOf(Object.keys(baseSchema.properties).length);
    });

    it('应该处理嵌套对象的 partial', function() {
      const nestedSchema = dsl({
        user: {
          name: 'string!',
          email: 'email!'
        }
      });

      const partialSchema = SchemaUtils.partial(nestedSchema);

      expect(partialSchema.required).to.be.undefined;
    });
  });
});

