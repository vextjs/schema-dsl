/**
 * DslBuilder 测试
 */

const { expect } = require('chai');
const DslBuilder = require('../../../lib/core/DslBuilder');
const { dsl } = require('../../../index');

describe('DslBuilder', () => {
  describe('构造函数', () => {
    it('应该能创建DslBuilder实例', () => {
      const builder = new DslBuilder('string');
      expect(builder).to.be.instanceOf(DslBuilder);
    });

    it('应该解析基本类型', () => {
      const builder = new DslBuilder('string');
      expect(builder._baseSchema.type).to.equal('string');
    });

    it('应该解析必填标记', () => {
      const builder = new DslBuilder('string!');
      expect(builder._required).to.be.true;
    });
  });

  describe('默认验证器', () => {
    describe('username()', () => {
      it('无参数时应自动设置3-32长度', () => {
        const schema = dsl({ username: 'string!'.username() });
        expect(schema.properties.username.minLength).to.equal(3);
        expect(schema.properties.username.maxLength).to.equal(32);
      });

      it('应支持字符串范围参数', () => {
        const schema = dsl({ username: 'string!'.username('5-20') });
        expect(schema.properties.username.minLength).to.equal(5);
        expect(schema.properties.username.maxLength).to.equal(20);
      });

      it('应支持 short 预设', () => {
        const schema = dsl({ username: 'string!'.username('short') });
        expect(schema.properties.username.minLength).to.equal(3);
        expect(schema.properties.username.maxLength).to.equal(16);
      });

      it('应支持 medium 预设', () => {
        const schema = dsl({ username: 'string!'.username('medium') });
        expect(schema.properties.username.minLength).to.equal(3);
        expect(schema.properties.username.maxLength).to.equal(32);
      });

      it('应支持 long 预设', () => {
        const schema = dsl({ username: 'string!'.username('long') });
        expect(schema.properties.username.minLength).to.equal(3);
        expect(schema.properties.username.maxLength).to.equal(64);
      });
    });

    describe('phone()', () => {
      it('应自动设置 cn 手机号长度为11', () => {
        const schema = dsl({ phone: 'string!'.phone('cn') });
        expect(schema.properties.phone.minLength).to.equal(11);
        expect(schema.properties.phone.maxLength).to.equal(11);
      });

      it('应自动纠正 number 类型为 string', () => {
        const schema = dsl({ phone: 'number!'.phone('cn') });
        expect(schema.properties.phone.type).to.equal('string');
      });
    });

    describe('password()', () => {
      it('strong 应设置 8-64 长度', () => {
        const schema = dsl({ password: 'string!'.password('strong') });
        expect(schema.properties.password.minLength).to.equal(8);
        expect(schema.properties.password.maxLength).to.equal(64);
      });

      it('weak 应设置 6-64 长度', () => {
        const schema = dsl({ password: 'string!'.password('weak') });
        expect(schema.properties.password.minLength).to.equal(6);
        expect(schema.properties.password.maxLength).to.equal(64);
      });
    });
  });

  describe('String 扩展方法', () => {
    it('应支持 .pattern()', () => {
      const schema = dsl({ test: 'string!'.pattern(/^test$/) });
      expect(schema.properties.test.pattern).to.exist;
    });

    it('应支持 .label()', () => {
      expect(() => {
        'string!'.label('测试');
      }).to.not.throw();
    });

    it('应支持 .messages()', () => {
      expect(() => {
        'string!'.messages({ 'min': 'test' });
      }).to.not.throw();
    });

    it('应支持 .description()', () => {
      expect(() => {
        'string!'.description('测试描述');
      }).to.not.throw();
    });

    it('应支持 .custom()', () => {
      expect(() => {
        'string!'.custom(() => {});
      }).to.not.throw();
    });

    it('应支持 .default()', () => {
      const schema = dsl({ name: 'string'.default('guest') });
      expect(schema.properties.name.default).to.equal('guest');
    });
  });
});

