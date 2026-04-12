/**
 * ConditionalBuilder 非对象类型支持测试
 *
 * 测试直接验证字符串、数组、布尔值等非对象类型
 */

const { expect } = require('chai');
const { dsl, validate } = require('../../index');

describe('ConditionalBuilder - 非对象类型支持', () => {
  describe('顶层条件（直接验证值）', () => {
    it('应该支持直接验证字符串', () => {
      // 场景：根据字符串长度应用不同的验证规则
      const schema = dsl.if((data) => typeof data === 'string' && data.length > 10)
        .then('string:1-20')
        .else('string:1-10');

      // 长字符串
      const result1 = validate(schema, 'hello world!');
      expect(result1.valid).to.be.true;

      // 短字符串
      const result2 = validate(schema, 'hello');
      expect(result2.valid).to.be.true;

      // 超长字符串（>20）
      const result3 = validate(schema, 'this is a very long string that exceeds limit');
      expect(result3.valid).to.be.false;
    });

    it('应该支持直接验证数组', () => {
      // 场景：根据数组长度应用不同规则
      const schema = dsl.if((data) => Array.isArray(data) && data.length > 5)
        .message('数组最多5个元素');

      const result1 = validate(schema, [1, 2, 3]);
      expect(result1.valid).to.be.true;

      const result2 = validate(schema, [1, 2, 3, 4, 5, 6]);
      expect(result2.valid).to.be.false;
      expect(result2.errors[0].message).to.equal('数组最多5个元素');
    });

    it('应该支持直接验证数字', () => {
      // 场景：根据数值范围应用不同规则
      const schema = dsl.if((data) => typeof data === 'number' && data < 0)
        .message('不允许负数');

      const result1 = validate(schema, 10);
      expect(result1.valid).to.be.true;

      const result2 = validate(schema, -5);
      expect(result2.valid).to.be.false;
      expect(result2.errors[0].message).to.equal('不允许负数');
    });

    it('应该支持直接验证布尔值', () => {
      // 场景：根据布尔值应用不同规则
      const schema = dsl.if((data) => data === false)
        .message('必须为 true');

      const result1 = validate(schema, true);
      expect(result1.valid).to.be.true;

      const result2 = validate(schema, false);
      expect(result2.valid).to.be.false;
      expect(result2.errors[0].message).to.equal('必须为 true');
    });
  });

  describe('实际应用场景', () => {
    it('应该支持字符串类型判断（邮箱或手机号）', () => {
      // 场景：输入可以是邮箱或手机号，自动判断类型
      const schema = dsl.if((data) => typeof data === 'string' && data.includes('@'))
        .then('email!')
        .else('string:11!');

      // 邮箱
      const result1 = validate(schema, 'test@example.com');
      expect(result1.valid).to.be.true;

      // 手机号
      const result2 = validate(schema, '13800138000');
      expect(result2.valid).to.be.true;

      // 无效邮箱
      const result3 = validate(schema, 'invalid-email');
      expect(result3.valid).to.be.false;
    });

    it('应该支持数组元素类型判断', () => {
      // 场景：数组元素全是数字时要求范围，否则只要求类型
      const schema = dsl.if((data) => Array.isArray(data) && data.every(item => typeof item === 'number'))
        .then('array<number:0-100>')
        .else('array<any>');

      // 全是数字
      const result1 = validate(schema, [10, 20, 30]);
      expect(result1.valid).to.be.true;

      // 混合类型
      const result2 = validate(schema, [1, 'two', 3]);
      expect(result2.valid).to.be.true;

      // 数字超范围
      const result3 = validate(schema, [10, 200, 30]);
      expect(result3.valid).to.be.false;
    });

    it('应该支持复杂条件组合（字符串长度 + 内容判断）', () => {
      // 场景：短字符串只要求长度，长字符串要求邮箱格式
      const schema = dsl.if((data) => typeof data === 'string' && data.length > 20)
        .and((data) => data.includes('@'))
        .then('email!')
        .else('string:1-50');

      // 短字符串
      const result1 = validate(schema, 'hello');
      expect(result1.valid).to.be.true;

      // 长字符串 + 有@符号
      const result2 = validate(schema, 'this-is-a-long-email@example.com');
      expect(result2.valid).to.be.true;

      // 长字符串 + 无@符号
      const result3 = validate(schema, 'this is a very long string without at symbol');
      expect(result3.valid).to.be.true; // else 分支，只要求长度
    });

    it('应该支持嵌套数组的条件判断', () => {
      // 场景：二维数组，根据第一层长度判断内层规则
      const schema = dsl.if((data) => Array.isArray(data) && data.length > 3)
        .message('外层数组最多3个元素');

      const result1 = validate(schema, [[1, 2], [3, 4]]);
      expect(result1.valid).to.be.true;

      const result2 = validate(schema, [[1], [2], [3], [4]]);
      expect(result2.valid).to.be.false;
      expect(result2.errors[0].message).to.equal('外层数组最多3个元素');
    });
  });

  describe('边界情况', () => {
    it('应该正确处理 null 值', () => {
      const schema = dsl.if((data) => data === null)
        .message('不允许为 null');

      const result1 = validate(schema, 'test');
      expect(result1.valid).to.be.true;

      const result2 = validate(schema, null);
      expect(result2.valid).to.be.false;
      expect(result2.errors[0].message).to.equal('不允许为 null');
    });

    it('应该正确处理 undefined 值', () => {
      const schema = dsl.if((data) => data === undefined)
        .message('不允许为 undefined');

      const result1 = validate(schema, 'test');
      expect(result1.valid).to.be.true;

      const result2 = validate(schema, undefined);
      expect(result2.valid).to.be.false;
      expect(result2.errors[0].message).to.equal('不允许为 undefined');
    });

    it('应该正确处理空字符串', () => {
      const schema = dsl.if((data) => data === '')
        .message('不允许为空字符串');

      const result1 = validate(schema, 'test');
      expect(result1.valid).to.be.true;

      const result2 = validate(schema, '');
      expect(result2.valid).to.be.false;
      expect(result2.errors[0].message).to.equal('不允许为空字符串');
    });
  });
});

