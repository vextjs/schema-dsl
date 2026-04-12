/**
 * Express 集成测试 (v2.1.0)
 *
 * 测试 validateAsync 和 ValidationError 在 Express 中的集成
 */

const { expect } = require('chai');
const express = require('express');
const request = require('supertest');
const { dsl, validateAsync, ValidationError, SchemaUtils } = require('../../index');

describe('Express Integration (v2.1.0)', function() {
  let app;

  // 定义完整用户 Schema
  const fullUserSchema = dsl({
    id: 'objectId!',
    name: 'string:1-50!',
    email: 'email!',
    password: 'string:8-32!',
    age: 'integer:0-150',
    role: 'admin|user|guest',
    createdAt: 'date',
    updatedAt: 'date'
  });

  beforeEach(function() {
    app = express();
    app.use(express.json());

    // 全局错误处理
    app.use((error, req, res, next) => {
      if (error instanceof ValidationError) {
        return res.status(error.statusCode).json(error.toJSON());
      }

      res.status(500).json({ error: 'Internal Server Error' });
    });
  });

  describe('POST /users - 创建用户', function() {
    beforeEach(function() {
      const createSchema = SchemaUtils
        .omit(fullUserSchema, ['id', 'createdAt', 'updatedAt'])
        .strict();

      app.post('/users', async (req, res, next) => {
        try {
          const data = await validateAsync(createSchema, req.body);
          res.status(201).json({
            message: 'User created',
            user: {
              ...data,
              id: '507f1f77bcf86cd799439011',
              createdAt: new Date().toISOString()
            }
          });
        } catch (error) {
          next(error);
        }
      });
    });

    it('应该成功创建用户', async function() {
      const response = await request(app)
        .post('/users')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          age: 30,
          role: 'user'
        });

      expect(response.status).to.equal(201);
      expect(response.body.message).to.equal('User created');
      expect(response.body.user).to.have.property('id');
      expect(response.body.user.name).to.equal('John Doe');
    });

    it('应该拒绝缺少必填字段', async function() {
      const response = await request(app)
        .post('/users')
        .send({
          name: 'John Doe'
          // 缺少 email 和 password
        });

      expect(response.status).to.equal(400);
      expect(response.body.error).to.equal('ValidationError');
      expect(response.body.details).to.be.an('array');
    });

    it('应该拒绝额外字段（strict 模式）', async function() {
      const response = await request(app)
        .post('/users')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          extraField: 'not allowed'
        });

      expect(response.status).to.equal(400);
      expect(response.body.error).to.equal('ValidationError');
    });

    it('应该拒绝无效的邮箱格式', async function() {
      const response = await request(app)
        .post('/users')
        .send({
          name: 'John Doe',
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).to.equal(400);
      expect(response.body.error).to.equal('ValidationError');
    });
  });

  describe('GET /users/:id - 查询用户', function() {
    beforeEach(function() {
      const publicSchema = SchemaUtils
        .omit(fullUserSchema, ['password'])
        .clean();

      app.get('/users/:id', async (req, res) => {
        // 模拟从数据库查询
        const user = {
          id: req.params.id,
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',  // 敏感字段
          age: 30,
          role: 'user',
          extraField: 'should be removed',  // 额外字段
          createdAt: '2025-12-29'
        };

        const { validate } = require('../../index');
        const result = validate(publicSchema, user);

        res.json(result.data);
      });
    });

    it('应该返回公开信息（移除敏感字段）', async function() {
      const response = await request(app)
        .get('/users/507f1f77bcf86cd799439011');

      expect(response.status).to.equal(200);
      expect(response.body).to.not.have.property('password');
      expect(response.body).to.not.have.property('extraField');
      expect(response.body).to.have.property('name');
      expect(response.body).to.have.property('email');
    });
  });

  describe('PATCH /users/:id - 更新用户', function() {
    beforeEach(function() {
      const updateSchema = SchemaUtils
        .pick(fullUserSchema, ['name', 'age', 'role'])
        .partial()
        .loose();

      app.patch('/users/:id', async (req, res, next) => {
        try {
          const data = await validateAsync(updateSchema, req.body);
          res.json({
            message: 'User updated',
            updates: data
          });
        } catch (error) {
          next(error);
        }
      });
    });

    it('应该允许部分更新', async function() {
      const response = await request(app)
        .patch('/users/507f1f77bcf86cd799439011')
        .send({
          name: 'Jane Doe'
          // 只更新 name，其他字段可选
        });

      expect(response.status).to.equal(200);
      expect(response.body.message).to.equal('User updated');
      expect(response.body.updates.name).to.equal('Jane Doe');
    });

    it('应该允许额外字段（loose 模式）', async function() {
      const response = await request(app)
        .patch('/users/507f1f77bcf86cd799439011')
        .send({
          name: 'Jane Doe',
          extraField: 'allowed'
        });

      expect(response.status).to.equal(200);
      expect(response.body.updates.extraField).to.equal('allowed');
    });

    it('应该验证字段值', async function() {
      const response = await request(app)
        .patch('/users/507f1f77bcf86cd799439011')
        .send({
          age: 200  // 超出范围
        });

      expect(response.status).to.equal(400);
      expect(response.body.error).to.equal('ValidationError');
    });
  });

  describe('PUT /users/:id - 替换用户', function() {
    beforeEach(function() {
      const replaceSchema = SchemaUtils
        .omit(fullUserSchema, ['id', 'createdAt', 'updatedAt'])
        .strict();

      app.put('/users/:id', async (req, res, next) => {
        try {
          const data = await validateAsync(replaceSchema, req.body);
          res.json({
            message: 'User replaced',
            user: {
              ...data,
              id: req.params.id,
              updatedAt: new Date().toISOString()
            }
          });
        } catch (error) {
          next(error);
        }
      });
    });

    it('应该要求所有必填字段', async function() {
      const response = await request(app)
        .put('/users/507f1f77bcf86cd799439011')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123'
          // 其他非必填字段可选
        });

      expect(response.status).to.equal(200);
    });

    it('应该拒绝缺少必填字段', async function() {
      const response = await request(app)
        .put('/users/507f1f77bcf86cd799439011')
        .send({
          name: 'John Doe'
          // 缺少 email 和 password
        });

      expect(response.status).to.equal(400);
    });
  });

  describe('错误处理', function() {
    beforeEach(function() {
      const schema = dsl({
        name: 'string:3-32!',
        email: 'email!',
        age: 'integer:18-120!'
      });

      app.post('/validate', async (req, res, next) => {
        try {
          const data = await validateAsync(schema, req.body);
          res.json({ valid: true, data });
        } catch (error) {
          next(error);
        }
      });
    });

    it('应该返回详细的错误信息', async function() {
      const response = await request(app)
        .post('/validate')
        .send({
          name: 'ab',        // 太短
          email: 'invalid',  // 格式错误
          age: 15            // 太小
        });

      expect(response.status).to.equal(400);
      expect(response.body.error).to.equal('ValidationError');
      expect(response.body.details).to.be.an('array');
      expect(response.body.details.length).to.be.greaterThan(0);

      const fields = response.body.details.map(d => d.field);
      expect(fields).to.include('name');
      expect(fields).to.include('email');
      expect(fields).to.include('age');
    });

    it('应该包含 statusCode', async function() {
      const response = await request(app)
        .post('/validate')
        .send({});

      expect(response.status).to.equal(400);
      expect(response.body.statusCode).to.equal(400);
    });
  });

  describe('嵌套对象验证', function() {
    beforeEach(function() {
      const schema = dsl({
        user: {
          name: 'string!',
          email: 'email!',
          address: {
            city: 'string!',
            country: 'string!'
          }
        }
      });

      app.post('/nested', async (req, res, next) => {
        try {
          const data = await validateAsync(schema, req.body);
          res.json({ valid: true, data });
        } catch (error) {
          next(error);
        }
      });
    });

    it('应该验证嵌套对象', async function() {
      const response = await request(app)
        .post('/nested')
        .send({
          user: {
            name: 'John',
            email: 'john@example.com',
            address: {
              city: 'Beijing',
              country: 'China'
            }
          }
        });

      expect(response.status).to.equal(200);
      expect(response.body.valid).to.be.true;
    });

    it('应该捕获嵌套字段错误', async function() {
      const response = await request(app)
        .post('/nested')
        .send({
          user: {
            name: 'John',
            email: 'invalid',
            address: {
              city: 'Beijing'
              // 缺少 country
            }
          }
        });

      expect(response.status).to.equal(400);
      expect(response.body.error).to.equal('ValidationError');
    });
  });

  describe('自定义错误处理', function() {
    beforeEach(function() {
      const schema = dsl({ name: 'string!' });

      app.post('/custom-error', async (req, res, next) => {
        try {
          await validateAsync(schema, req.body);
          res.json({ success: true });
        } catch (error) {
          if (error instanceof ValidationError) {
            // 自定义错误格式
            return res.status(422).json({
              code: 'VALIDATION_FAILED',
              message: '数据验证失败',
              fields: error.getFieldErrors()
            });
          }
          next(error);
        }
      });
    });

    it('应该支持自定义错误格式', async function() {
      const response = await request(app)
        .post('/custom-error')
        .send({});

      expect(response.status).to.equal(422);
      expect(response.body.code).to.equal('VALIDATION_FAILED');
      expect(response.body.message).to.equal('数据验证失败');
      expect(response.body.fields).to.have.property('name');
    });
  });

  describe('批量操作', function() {
    beforeEach(function() {
      const userSchema = SchemaUtils
        .omit(fullUserSchema, ['id', 'createdAt', 'updatedAt'])
        .strict();

      app.post('/users/batch', async (req, res, next) => {
        try {
          const users = req.body.users;
          const validUsers = [];

          for (const user of users) {
            const validUser = await validateAsync(userSchema, user);
            validUsers.push(validUser);
          }

          res.status(201).json({
            message: 'Users created',
            count: validUsers.length
          });
        } catch (error) {
          next(error);
        }
      });
    });

    it('应该批量创建用户', async function() {
      const response = await request(app)
        .post('/users/batch')
        .send({
          users: [
            {
              name: 'John',
              email: 'john@example.com',
              password: 'password123'
            },
            {
              name: 'Jane',
              email: 'jane@example.com',
              password: 'password456'
            }
          ]
        });

      expect(response.status).to.equal(201);
      expect(response.body.count).to.equal(2);
    });

    it('应该在第一个错误时停止', async function() {
      const response = await request(app)
        .post('/users/batch')
        .send({
          users: [
            {
              name: 'John',
              email: 'john@example.com',
              password: 'password123'
            },
            {
              name: 'Jane'
              // 缺少必填字段
            }
          ]
        });

      expect(response.status).to.equal(400);
      expect(response.body.error).to.equal('ValidationError');
    });
  });
});

