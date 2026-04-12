/**
 * SchemaUtils 链式调用单元测试 (v2.1.0 简化版)
 *
 * 测试核心4个方法：partial、omit、pick、extend 的链式调用功能
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { dsl, validate } from '../../src/index.js';
import { SchemaUtils } from '../../src/utils/SchemaUtils.js';

describe('SchemaUtils Chaining (v2.1.0 - 核心方法)', () => {
  let baseSchema: any;

  beforeEach(() => {
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


  describe('partial() - 部分验证', () => {
    it('应该移除所有必填限制', () => {
      const partialSchema = SchemaUtils.partial(baseSchema);

      const result = validate(partialSchema, {
        name: 'John'
        // 其他必填字段缺失，但不应报错
      });

      expect(result.valid).toBe(true);
      expect(partialSchema.required).toBeUndefined();
    });

    it('应该只验证指定字段', () => {
      const partialSchema = SchemaUtils.partial(baseSchema, ['name', 'age']);

      expect(Object.keys(partialSchema.properties)).toHaveLength(2);
      expect(partialSchema.properties).toHaveProperty('name');
      expect(partialSchema.properties).toHaveProperty('age');
      expect(partialSchema.required).toBeUndefined();
    });

    it('应该验证提供的字段值', () => {
      const partialSchema = SchemaUtils.partial(baseSchema, ['name', 'email']);

      // email 格式错误应该被捕获
      const result = validate(partialSchema, {
        name: 'John',
        email: 'invalid'
      });

      expect(result.valid).toBe(false);
    });
  });

  describe('omit() - 排除字段', () => {
    it('应该排除指定字段', () => {
      const omittedSchema = SchemaUtils.omit(baseSchema, ['password', 'createdAt', 'updatedAt']);

      expect(omittedSchema.properties.password).toBeUndefined();
      expect(omittedSchema.properties.createdAt).toBeUndefined();
      expect(omittedSchema.properties.updatedAt).toBeUndefined();
      expect(omittedSchema.properties.name).toBeDefined();
      expect(omittedSchema.properties.email).toBeDefined();
    });

    it('应该从 required 中移除排除的字段', () => {
      const omittedSchema = SchemaUtils.omit(baseSchema, ['password']);

      expect(omittedSchema.required).not.toContain('password');
      expect(omittedSchema.required).toContain('name');
      expect(omittedSchema.required).toContain('email');
    });
  });

  describe('pick() - 保留字段', () => {
    it('应该只保留指定字段', () => {
      const pickedSchema = SchemaUtils.pick(baseSchema, ['name', 'email']);

      expect(Object.keys(pickedSchema.properties)).toHaveLength(2);
      expect(pickedSchema.properties).toHaveProperty('name');
      expect(pickedSchema.properties).toHaveProperty('email');
      expect(pickedSchema.properties.password).toBeUndefined();
    });

    it('应该保留字段的必填限制', () => {
      const pickedSchema = SchemaUtils.pick(baseSchema, ['name', 'email']);

      expect(pickedSchema.required).toContain('name');
      expect(pickedSchema.required).toContain('email');
    });
  });

  describe('extend() - 扩展字段', () => {
    it('应该添加新字段', () => {
      const extendedSchema = SchemaUtils.extend(baseSchema, {
        avatar: 'url',
        bio: 'string:0-500'
      });

      expect(extendedSchema.properties.avatar).toBeDefined();
      expect(extendedSchema.properties.bio).toBeDefined();
      expect(extendedSchema.properties.name).toBeDefined();
    });

    it('应该保留原字段', () => {
      const extendedSchema = SchemaUtils.extend(baseSchema, {
        avatar: 'url'
      });

      expect(extendedSchema.properties.name).toBeDefined();
      expect(extendedSchema.properties.email).toBeDefined();
      expect(extendedSchema.properties.password).toBeDefined();
    });
  });


  describe('链式调用', () => {
    it('应该支持 omit + extend', () => {
      const schema = SchemaUtils
        .omit(baseSchema, ['password'])
        .extend({ avatar: 'url' });

      expect(schema.properties.password).toBeUndefined();
      expect(schema.properties.avatar).toBeDefined();
    });

    it('应该支持 pick + partial', () => {
      const schema = SchemaUtils
        .pick(baseSchema, ['name', 'age'])
        .partial();

      expect(Object.keys(schema.properties)).toHaveLength(2);
      expect(schema.required).toBeUndefined();
    });

    it('应该支持 pick + extend', () => {
      const schema = SchemaUtils
        .pick(baseSchema, ['name', 'email'])
        .extend({ avatar: 'url', bio: 'string:0-500' });

      expect(schema.properties.name).toBeDefined();
      expect(schema.properties.email).toBeDefined();
      expect(schema.properties.avatar).toBeDefined();
      expect(schema.properties.bio).toBeDefined();
      expect(schema.properties.password).toBeUndefined();
    });

    it('应该支持复杂链式调用', () => {
      const schema = SchemaUtils
        .omit(baseSchema, ['id', 'password', 'createdAt', 'updatedAt'])
        .extend({ avatar: 'url' })
        .pick(['name', 'email', 'avatar'])
        .partial();

      expect(Object.keys(schema.properties)).toHaveLength(3);
      expect(schema.properties.name).toBeDefined();
      expect(schema.properties.email).toBeDefined();
      expect(schema.properties.avatar).toBeDefined();
      expect(schema.required).toBeUndefined();
    });
  });

  describe('CRUD 场景', () => {
    it('POST - 创建用户（排除系统字段）', () => {
      const createSchema = SchemaUtils.omit(baseSchema, ['id', 'createdAt', 'updatedAt']);

      const result = validate(createSchema, {
        name: 'John',
        email: 'john@example.com',
        password: 'password123',
        age: 30
      });

      expect(result.valid).toBe(true);
    });

    it('GET - 查询用户（排除敏感字段）', () => {
      const publicSchema = SchemaUtils.omit(baseSchema, ['password']);

      const result = validate(publicSchema, {
        id: '507f1f77bcf86cd799439011',
        name: 'John',
        email: 'john@example.com',
        age: 30,
        createdAt: '2025-12-29',
        updatedAt: '2025-12-29'
      });

      expect(result.valid).toBe(true);
      expect(result.data.password).toBeUndefined();
    });

    it('PATCH - 更新用户（部分验证）', () => {
      const updateSchema = SchemaUtils
        .pick(baseSchema, ['name', 'age'])
        .partial();

      const result = validate(updateSchema, {
        name: 'Jane'
        // age 缺失也可以，因为是 partial
      });

      expect(result.valid).toBe(true);
    });

    it('PUT - 替换用户（排除系统字段）', () => {
      const replaceSchema = SchemaUtils.omit(baseSchema, ['id', 'createdAt', 'updatedAt']);

      const result = validate(replaceSchema, {
        name: 'John',
        email: 'john@example.com',
        password: 'password123'
        // age 可选，所以可以缺失
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('不可变性', () => {
    it('应该不修改原 schema', () => {
      const originalProps = Object.keys(baseSchema.properties);
      const originalRequired = [...(baseSchema.required || [])];

      SchemaUtils
        .omit(baseSchema, ['password'])
        .extend({ avatar: 'url' });

      expect(Object.keys(baseSchema.properties)).toEqual(originalProps);
      expect(baseSchema.required).toEqual(originalRequired);
    });

    it('每次调用应该返回新对象', () => {
      const schema1 = SchemaUtils.omit(baseSchema, ['password']);
      const schema2 = SchemaUtils.omit(baseSchema, ['password']);

      expect(schema1).not.toBe(schema2);
      expect(schema1).toEqual(schema2);
    });
  });

  describe('边界情况', () => {
    it('应该处理空字段数组', () => {
      const schema = SchemaUtils.omit(baseSchema, []);
      expect(Object.keys(schema.properties)).toHaveLength(Object.keys(baseSchema.properties).length);
    });

    it('应该处理不存在的字段', () => {
      const schema = SchemaUtils.omit(baseSchema, ['nonExistentField']);
      expect(Object.keys(schema.properties)).toHaveLength(Object.keys(baseSchema.properties).length);
    });

    it('应该处理嵌套对象的 partial', () => {
      const nestedSchema = dsl({
        user: {
          name: 'string!',
          email: 'email!'
        }
      });

      const partialSchema = SchemaUtils.partial(nestedSchema);

      expect(partialSchema.required).toBeUndefined();
    });
  });
});
