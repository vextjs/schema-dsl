/**
 * Validator 完整测试（补充）
 */

const { expect } = require('chai');
const { dsl, validate } = require('../../../index');

describe('Validator - 完整验证测试', () => {

  describe('边界条件验证', () => {
    it('应正确验证字符串最小长度边界', () => {
      const schema = dsl({ username: 'string:3-32' });

      expect(validate(schema, { username: 'ab' }).valid).to.be.false;
      expect(validate(schema, { username: 'abc' }).valid).to.be.true;
    });

    it('应正确验证字符串最大长度边界', () => {
      const schema = dsl({ username: 'string:3-32' });

      const str32 = 'a'.repeat(32);
      const str33 = 'a'.repeat(33);

      expect(validate(schema, { username: str32 }).valid).to.be.true;
      expect(validate(schema, { username: str33 }).valid).to.be.false;
    });

    it('应正确验证数字最小值边界', () => {
      const schema = dsl({ age: 'number:18-120' });

      expect(validate(schema, { age: 17 }).valid).to.be.false;
      expect(validate(schema, { age: 18 }).valid).to.be.true;
    });

    it('应正确验证数字最大值边界', () => {
      const schema = dsl({ age: 'number:18-120' });

      expect(validate(schema, { age: 120 }).valid).to.be.true;
      expect(validate(schema, { age: 121 }).valid).to.be.false;
    });
  });

  describe('类型验证', () => {
    it('应检测字符串类型错误', () => {
      const schema = dsl({ name: 'string!' });

      expect(validate(schema, { name: 123 }).valid).to.be.false;
      expect(validate(schema, { name: true }).valid).to.be.false;
      expect(validate(schema, { name: [] }).valid).to.be.false;
      expect(validate(schema, { name: {} }).valid).to.be.false;
    });

    it('应检测数字类型错误', () => {
      const schema = dsl({ age: 'number!' });

      expect(validate(schema, { age: 'abc' }).valid).to.be.false;
      expect(validate(schema, { age: true }).valid).to.be.false;
      expect(validate(schema, { age: [] }).valid).to.be.false;
    });

    it('应检测布尔类型错误', () => {
      const schema = dsl({ active: 'boolean!' });

      expect(validate(schema, { active: 'true' }).valid).to.be.false;
      expect(validate(schema, { active: 1 }).valid).to.be.false;
      expect(validate(schema, { active: [] }).valid).to.be.false;
    });

    it('应检测整数类型', () => {
      const schema = dsl({ count: 'integer!' });

      expect(validate(schema, { count: 10 }).valid).to.be.true;
      expect(validate(schema, { count: 10.5 }).valid).to.be.false;
    });
  });

  describe('格式验证', () => {
    it('应验证email格式', () => {
      const schema = dsl({ email: 'email!' });

      expect(validate(schema, { email: 'test@example.com' }).valid).to.be.true;
      expect(validate(schema, { email: 'user+tag@domain.co.uk' }).valid).to.be.true;

      expect(validate(schema, { email: 'invalid' }).valid).to.be.false;
      expect(validate(schema, { email: '@example.com' }).valid).to.be.false;
      expect(validate(schema, { email: 'test@' }).valid).to.be.false;
    });

    it('应验证url格式', () => {
      const schema = dsl({ website: 'url!' });

      expect(validate(schema, { website: 'https://example.com' }).valid).to.be.true;
      expect(validate(schema, { website: 'http://example.com/path?query=1' }).valid).to.be.true;

      expect(validate(schema, { website: 'not-a-url' }).valid).to.be.false;
    });

    it('应验证uuid格式', () => {
      const schema = dsl({ id: 'uuid!' });

      expect(validate(schema, { id: '550e8400-e29b-41d4-a716-446655440000' }).valid).to.be.true;
      expect(validate(schema, { id: 'invalid-uuid' }).valid).to.be.false;
    });
  });

  describe('枚举验证', () => {
    it('应验证简单枚举', () => {
      const schema = dsl({ status: 'active|inactive|pending!' });

      expect(validate(schema, { status: 'active' }).valid).to.be.true;
      expect(validate(schema, { status: 'inactive' }).valid).to.be.true;
      expect(validate(schema, { status: 'pending' }).valid).to.be.true;
      expect(validate(schema, { status: 'unknown' }).valid).to.be.false;
    });

    it('应验证数字枚举', () => {
      const schema = dsl({ priority: '1|2|3|4|5!' });

      expect(validate(schema, { priority: 1 }).valid).to.be.true;
      expect(validate(schema, { priority: 5 }).valid).to.be.true;
      expect(validate(schema, { priority: 6 }).valid).to.be.false;
      expect(validate(schema, { priority: '1' }).valid).to.be.false; // 字符串应该失败
    });
  });

  describe('必填字段验证', () => {
    it('应检测单个缺失的必填字段', () => {
      const schema = dsl({
        username: 'string!',
        email: 'email'
      });

      const result = validate(schema, { email: 'test@example.com' });
      expect(result.valid).to.be.false;
    });

    it('应检测多个缺失的必填字段', () => {
      const schema = dsl({
        username: 'string!',
        email: 'email!',
        age: 'number'
      });

      const result = validate(schema, { age: 25 });
      expect(result.valid).to.be.false;
      expect(result.errors.length).to.be.at.least(2);
    });

    it('可选字段不应要求存在', () => {
      const schema = dsl({
        username: 'string!',
        nickname: 'string'
      });

      const result = validate(schema, { username: 'john' });
      expect(result.valid).to.be.true;
    });
  });

  describe('嵌套对象验证', () => {
    it('应验证嵌套对象结构', () => {
      const schema = dsl({
        user: {
          name: 'string!',
          email: 'email!'
        }
      });

      expect(validate(schema, {
        user: {
          name: 'John',
          email: 'john@example.com'
        }
      }).valid).to.be.true;
    });

    it('应检测嵌套对象的缺失字段', () => {
      const schema = dsl({
        user: {
          name: 'string!',
          email: 'email!'
        }
      });

      expect(validate(schema, {
        user: {
          name: 'John'
        }
      }).valid).to.be.false;
    });

    it('应验证深层嵌套', () => {
      const schema = dsl({
        user: {
          profile: {
            social: {
              twitter: 'url!'
            }
          }
        }
      });

      expect(validate(schema, {
        user: {
          profile: {
            social: {
              twitter: 'https://twitter.com/user'
            }
          }
        }
      }).valid).to.be.true;
    });
  });

  describe('数组验证', () => {
    it('应验证数组类型', () => {
      const schema = dsl({
        tags: 'array<string>'
      });

      expect(validate(schema, { tags: ['a', 'b', 'c'] }).valid).to.be.true;
      expect(validate(schema, { tags: 'not-array' }).valid).to.be.false;
    });

    it('应验证数组元素类型', () => {
      const schema = dsl({
        scores: 'array<number>'
      });

      expect(validate(schema, { scores: [1, 2, 3] }).valid).to.be.true;
      expect(validate(schema, { scores: [1, 'two', 3] }).valid).to.be.false;
    });

    it('应验证数组元素约束', () => {
      const schema = dsl({
        tags: 'array<string:1-20>'
      });

      expect(validate(schema, { tags: ['tag', 'another'] }).valid).to.be.true;
      expect(validate(schema, { tags: ['', 'tag'] }).valid).to.be.false;
      expect(validate(schema, { tags: ['a'.repeat(21)] }).valid).to.be.false;
    });
  });

  describe('组合验证', () => {
    it('应验证复杂表单', () => {
      const schema = dsl({
        username: 'string:3-32!',
        email: 'email!',
        age: 'number:18-120',
        gender: 'male|female|other',
        website: 'url',
        bio: 'string:500',
        tags: 'array<string:1-20>'
      });

      const validData = {
        username: 'john_doe',
        email: 'john@example.com',
        age: 25,
        gender: 'male',
        website: 'https://example.com',
        bio: 'Hello world',
        tags: ['javascript', 'nodejs']
      };

      expect(validate(schema, validData).valid).to.be.true;
    });

    it('应检测复杂表单的多个错误', () => {
      const schema = dsl({
        username: 'string:3-32!',
        email: 'email!',
        age: 'number:18-120!'
      });

      const invalidData = {
        username: 'ab',        // 太短
        email: 'invalid',      // 格式错误
        age: 150               // 超出范围
      };

      const result = validate(schema, invalidData);
      expect(result.valid).to.be.false;
      expect(result.errors.length).to.be.at.least(3);
    });
  });

  describe('默认验证器验证', () => {
    it('应验证username格式', () => {
      const schema = dsl({
        username: 'string!'.username()
      });

      expect(validate(schema, { username: 'john_doe' }).valid).to.be.true;
      expect(validate(schema, { username: 'ab' }).valid).to.be.false;
      expect(validate(schema, { username: 'a'.repeat(33) }).valid).to.be.false;
    });

    it('应验证phone格式', () => {
      const schema = dsl({
        phone: 'string!'.phone('cn')
      });

      expect(validate(schema, { phone: '13800138000' }).valid).to.be.true;
      expect(validate(schema, { phone: '1380013800' }).valid).to.be.false;
      expect(validate(schema, { phone: '138001380000' }).valid).to.be.false;
    });

    it('应验证password强度', () => {
      const schema = dsl({
        password: 'string!'.password('strong')
      });

      expect(validate(schema, { password: 'Abc123456' }).valid).to.be.true;
      expect(validate(schema, { password: 'abc123' }).valid).to.be.false;
      expect(validate(schema, { password: 'abc' }).valid).to.be.false;
    });
  });

  describe('特殊情况', () => {
    it('应处理空对象', () => {
      const schema = dsl({
        name: 'string'
      });

      expect(validate(schema, {}).valid).to.be.true;
    });

    it('应处理null和undefined', () => {
      const schema = dsl({
        name: 'string'
      });

      expect(validate(schema, { name: null }).valid).to.be.false;
      expect(validate(schema, { name: undefined }).valid).to.be.true; // 可选字段允许undefined
    });

    it('应处理额外字段', () => {
      const schema = dsl({
        name: 'string!'
      });

      const result = validate(schema, {
        name: 'John',
        extra: 'field'
      });

      expect(result.valid).to.be.true;
    });
  });
});

