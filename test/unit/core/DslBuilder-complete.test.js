/**
 * 完整的 DslBuilder 测试（补充缺失的测试）
 */

const { expect } = require('chai');
const { dsl, validate } = require('../../../index');

describe('DslBuilder - 完整测试', () => {

  describe('基本类型解析', () => {
    it('应该正确解析所有基本类型', () => {
      const schema = dsl({
        str: 'string',
        num: 'number',
        int: 'integer',
        bool: 'boolean',
        email: 'email',
        url: 'url',
        uuid: 'uuid',
        date: 'date'
      });

      expect(schema.properties.str.type).to.equal('string');
      expect(schema.properties.num.type).to.equal('number');
      expect(schema.properties.int.type).to.equal('integer');
      expect(schema.properties.bool.type).to.equal('boolean');
      expect(schema.properties.email.format).to.equal('email');
      expect(schema.properties.url.format).to.equal('uri');
      expect(schema.properties.uuid.format).to.equal('uuid');
      expect(schema.properties.date.format).to.equal('date');
    });
  });

  describe('约束条件完整测试', () => {
    it('应该支持 string:max 简写语法', () => {
      const schema = dsl({ bio: 'string:500' });
      expect(schema.properties.bio.maxLength).to.equal(500);
    });

    it('应该支持 string:-max 明确语法', () => {
      const schema = dsl({ bio: 'string:-500' });
      expect(schema.properties.bio.maxLength).to.equal(500);
    });

    it('应该支持 string:min-max 范围语法', () => {
      const schema = dsl({ username: 'string:3-32' });
      expect(schema.properties.username.minLength).to.equal(3);
      expect(schema.properties.username.maxLength).to.equal(32);
    });

    it('应该支持 string:min- 只限最小语法', () => {
      const schema = dsl({ content: 'string:10-' });
      expect(schema.properties.content.minLength).to.equal(10);
      expect(schema.properties.content.maxLength).to.be.undefined;
    });

    it('应该支持 number:min-max 数字范围', () => {
      const schema = dsl({ age: 'number:18-120' });
      expect(schema.properties.age.minimum).to.equal(18);
      expect(schema.properties.age.maximum).to.equal(120);
    });

    it('应该支持 number:max 数字最大值', () => {
      const schema = dsl({ score: 'number:100' });
      expect(schema.properties.score.maximum).to.equal(100);
    });

    it('应该支持 number:min- 数字最小值', () => {
      const schema = dsl({ price: 'number:0-' });
      expect(schema.properties.price.minimum).to.equal(0);
      expect(schema.properties.price.maximum).to.be.undefined;
    });
  });

  describe('必填标记测试', () => {
    it('应该识别 ! 必填标记', () => {
      const schema = dsl({ username: 'string!' });
      expect(schema.required).to.include('username');
    });

    it('应该支持多个必填字段', () => {
      const schema = dsl({
        username: 'string!',
        email: 'email!',
        age: 'number'
      });
      expect(schema.required).to.include('username');
      expect(schema.required).to.include('email');
      expect(schema.required).to.not.include('age');
    });

    it('应该支持约束+必填组合', () => {
      const schema = dsl({ username: 'string:3-32!' });
      expect(schema.required).to.include('username');
      expect(schema.properties.username.minLength).to.equal(3);
      expect(schema.properties.username.maxLength).to.equal(32);
    });
  });

  describe('枚举值测试', () => {
    it('应该解析简单枚举', () => {
      const schema = dsl({ status: 'active|inactive|pending' });
      expect(schema.properties.status.enum).to.deep.equal(['active', 'inactive', 'pending']);
    });

    it('应该支持带空格的枚举', () => {
      const schema = dsl({ role: ' admin | user | guest ' });
      expect(schema.properties.role.enum).to.deep.equal(['admin', 'user', 'guest']);
    });

    it('应该支持数字枚举', () => {
      const schema = dsl({ priority: '1|2|3|4|5' });
      expect(schema.properties.priority.enum).to.deep.equal(['1', '2', '3', '4', '5']);
    });

    it('应该支持必填枚举', () => {
      const schema = dsl({ status: 'active|inactive!' });
      expect(schema.required).to.include('status');
      expect(schema.properties.status.enum).to.deep.equal(['active', 'inactive']);
    });
  });

  describe('username() 完整测试', () => {
    it('默认应为 medium (3-32)', () => {
      const schema = dsl({ u: 'string!'.username() });
      expect(schema.properties.u.minLength).to.equal(3);
      expect(schema.properties.u.maxLength).to.equal(32);
    });

    it('应支持自定义范围字符串', () => {
      const tests = [
        { input: '5-20', min: 5, max: 20 },
        { input: '1-10', min: 1, max: 10 },
        { input: '8-16', min: 8, max: 16 }
      ];

      tests.forEach(test => {
        const schema = dsl({ u: `string!`.username(test.input) });
        expect(schema.properties.u.minLength).to.equal(test.min);
        expect(schema.properties.u.maxLength).to.equal(test.max);
      });
    });

    it('应支持所有预设选项', () => {
      const presets = {
        'short': { min: 3, max: 16 },
        'medium': { min: 3, max: 32 },
        'long': { min: 3, max: 64 }
      };

      Object.entries(presets).forEach(([preset, expected]) => {
        const schema = dsl({ u: 'string!'.username(preset) });
        expect(schema.properties.u.minLength).to.equal(expected.min);
        expect(schema.properties.u.maxLength).to.equal(expected.max);
      });
    });

    it('应该添加正则验证', () => {
      const schema = dsl({ u: 'string!'.username() });
      expect(schema.properties.u.pattern).to.exist;
    });
  });

  describe('phone() 完整测试', () => {
    it('应支持所有国家代码', () => {
      const countries = {
        'cn': { min: 11, max: 11 },
        'us': { min: 10, max: 10 },
        'uk': { min: 10, max: 15 },
        'hk': { min: 8, max: 8 },
        'tw': { min: 10, max: 10 },
        'international': { min: 8, max: 15 }
      };

      Object.entries(countries).forEach(([country, expected]) => {
        const schema = dsl({ p: `string!`.phone(country) });
        expect(schema.properties.p.minLength).to.equal(expected.min);
        expect(schema.properties.p.maxLength).to.equal(expected.max);
      });
    });

    it('应自动纠正 number 为 string', () => {
      const schema = dsl({ p: 'number!'.phone('cn') });
      expect(schema.properties.p.type).to.equal('string');
      expect(schema.properties.p.minimum).to.be.undefined;
      expect(schema.properties.p.maximum).to.be.undefined;
    });

    it('应自动纠正 integer 为 string', () => {
      const schema = dsl({ p: 'integer!'.phone('cn') });
      expect(schema.properties.p.type).to.equal('string');
    });

    it('应该添加正则验证', () => {
      const schema = dsl({ p: 'string!'.phone('cn') });
      expect(schema.properties.p.pattern).to.exist;
    });
  });

  describe('password() 完整测试', () => {
    it('应支持所有强度级别', () => {
      const strengths = {
        'weak': { min: 6, max: 64 },
        'medium': { min: 8, max: 64 },
        'strong': { min: 8, max: 64 },
        'veryStrong': { min: 10, max: 64 }
      };

      Object.entries(strengths).forEach(([strength, expected]) => {
        const schema = dsl({ p: 'string!'.password(strength) });
        expect(schema.properties.p.minLength).to.equal(expected.min);
        expect(schema.properties.p.maxLength).to.equal(expected.max);
      });
    });

    it('应该添加对应强度的正则验证', () => {
      const schema = dsl({ p: 'string!'.password('strong') });
      expect(schema.properties.p.pattern).to.exist;
    });

    it('默认应为 medium', () => {
      const schema = dsl({ p: 'string!'.password() });
      expect(schema.properties.p.minLength).to.equal(8);
    });
  });

  describe('嵌套对象测试', () => {
    it('应支持单层嵌套', () => {
      const schema = dsl({
        user: {
          name: 'string!',
          email: 'email!'
        }
      });

      expect(schema.properties.user.type).to.equal('object');
      expect(schema.properties.user.properties.name).to.exist;
      expect(schema.properties.user.properties.email).to.exist;
    });

    it('应支持多层嵌套', () => {
      const schema = dsl({
        user: {
          profile: {
            social: {
              twitter: 'url'
            }
          }
        }
      });

      expect(schema.properties.user.properties.profile.properties.social.properties.twitter).to.exist;
    });

    it('嵌套对象应继承必填标记', () => {
      const schema = dsl({
        user: {
          name: 'string!',
          email: 'email!'
        }
      });

      expect(schema.properties.user.required).to.include('name');
      expect(schema.properties.user.required).to.include('email');
    });
  });

  describe('数组类型测试', () => {
    it('应支持 array<type> 语法', () => {
      const schema = dsl({
        tags: 'array<string>',
        scores: 'array<number>'
      });

      expect(schema.properties.tags.type).to.equal('array');
      expect(schema.properties.tags.items.type).to.equal('string');
      expect(schema.properties.scores.items.type).to.equal('number');
    });

    it('应支持数组元素约束', () => {
      const schema = dsl({
        tags: 'array<string:1-20>'
      });

      expect(schema.properties.tags.items.minLength).to.equal(1);
      expect(schema.properties.tags.items.maxLength).to.equal(20);
    });
  });

  describe('验证功能测试', () => {
    it('应正确验证有效数据', () => {
      const schema = dsl({
        username: 'string:3-32!',
        email: 'email!',
        age: 'number:18-120'
      });

      const result = validate(schema, {
        username: 'john_doe',
        email: 'john@example.com',
        age: 25
      });

      expect(result.valid).to.be.true;
      expect(result.errors).to.be.empty;
    });

    it('应检测缺失的必填字段', () => {
      const schema = dsl({
        username: 'string!',
        email: 'email!'
      });

      const result = validate(schema, {
        username: 'john'
      });

      expect(result.valid).to.be.false;
      expect(result.errors.length).to.be.greaterThan(0);
    });

    it('应检测长度约束违规', () => {
      const schema = dsl({
        username: 'string:5-20!'
      });

      const result = validate(schema, {
        username: 'ab' // 太短
      });

      expect(result.valid).to.be.false;
    });

    it('应检测类型错误', () => {
      const schema = dsl({
        age: 'number!'
      });

      const result = validate(schema, {
        age: 'not a number'
      });

      expect(result.valid).to.be.false;
    });

    it('应检测格式错误', () => {
      const schema = dsl({
        email: 'email!'
      });

      const result = validate(schema, {
        email: 'invalid-email'
      });

      expect(result.valid).to.be.false;
    });
  });

  describe('完整示例测试', () => {
    it('README 快速开始示例应能运行', () => {
      const schema = dsl({
        username: 'string:3-32!',
        email: 'email!',
        age: 'number:18-120'
      });

      const result = validate(schema, {
        username: 'john_doe',
        email: 'john@example.com',
        age: 25
      });

      expect(result.valid).to.be.true;
    });

    it('README 默认验证器示例应能运行', () => {
      const schema = dsl({
        username: 'string!'.username('5-20'),
        phone: 'string!'.phone('cn'),
        password: 'string!'.password('strong'),
        email: 'email!'
      });

      const result = validate(schema, {
        username: 'john_doe',
        phone: '13800138000',
        password: 'Abc123456',
        email: 'john@example.com'
      });

      expect(result.valid).to.be.true;
    });
  });
});

