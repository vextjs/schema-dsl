/**
 * Number Comparison Operators Tests (v1.1.2)
 *
 * 测试 number 和 integer 类型的比较运算符：>, >=, <, <=, =
 */

const { expect } = require('chai');
const { dsl, validate } = require('../../index');

describe('Number Comparison Operators (v1.1.2)', () => {

  describe('大于运算符 (>)', () => {
    it('应该正确验证 number:>0', () => {
      const schema = dsl({ value: 'number:>0' });

      // 边界测试
      expect(validate(schema, { value: 1 }).valid).to.be.true;
      expect(validate(schema, { value: 0.1 }).valid).to.be.true;
      expect(validate(schema, { value: 0 }).valid).to.be.false;
      expect(validate(schema, { value: -1 }).valid).to.be.false;
    });

    it('应该支持小数 number:>0.5', () => {
      const schema = dsl({ value: 'number:>0.5' });

      expect(validate(schema, { value: 0.6 }).valid).to.be.true;
      expect(validate(schema, { value: 1 }).valid).to.be.true;
      expect(validate(schema, { value: 0.5 }).valid).to.be.false;
      expect(validate(schema, { value: 0.4 }).valid).to.be.false;
    });

    it('应该支持负数边界 number:>-10', () => {
      const schema = dsl({ value: 'number:>-10' });

      expect(validate(schema, { value: -9 }).valid).to.be.true;
      expect(validate(schema, { value: 0 }).valid).to.be.true;
      expect(validate(schema, { value: -10 }).valid).to.be.false;
      expect(validate(schema, { value: -11 }).valid).to.be.false;
    });

    it('应该支持必填标记 number:>0!', () => {
      const schema = dsl({ value: 'number:>0!' });

      expect(validate(schema, { value: 1 }).valid).to.be.true;
      expect(validate(schema, {}).valid).to.be.false; // 必填
      expect(validate(schema, { value: 0 }).valid).to.be.false; // 不满足>0
    });

    it('应该支持 integer 类型', () => {
      const schema = dsl({ count: 'integer:>0' });

      expect(validate(schema, { count: 1 }).valid).to.be.true;
      expect(validate(schema, { count: 0 }).valid).to.be.false;
    });
  });

  describe('大于等于运算符 (>=)', () => {
    it('应该正确验证 number:>=18', () => {
      const schema = dsl({ age: 'number:>=18' });

      expect(validate(schema, { age: 18 }).valid).to.be.true;
      expect(validate(schema, { age: 19 }).valid).to.be.true;
      expect(validate(schema, { age: 17 }).valid).to.be.false;
      expect(validate(schema, { age: 17.9 }).valid).to.be.false;
    });

    it('应该支持小数 number:>=18.5', () => {
      const schema = dsl({ value: 'number:>=18.5' });

      expect(validate(schema, { value: 18.5 }).valid).to.be.true;
      expect(validate(schema, { value: 18.6 }).valid).to.be.true;
      expect(validate(schema, { value: 18.4 }).valid).to.be.false;
    });

    it('应该支持零边界 number:>=0', () => {
      const schema = dsl({ value: 'number:>=0' });

      expect(validate(schema, { value: 0 }).valid).to.be.true;
      expect(validate(schema, { value: 0.1 }).valid).to.be.true;
      expect(validate(schema, { value: -0.1 }).valid).to.be.false;
    });
  });

  describe('小于运算符 (<)', () => {
    it('应该正确验证 number:<100', () => {
      const schema = dsl({ value: 'number:<100' });

      expect(validate(schema, { value: 99 }).valid).to.be.true;
      expect(validate(schema, { value: 99.9 }).valid).to.be.true;
      expect(validate(schema, { value: 100 }).valid).to.be.false;
      expect(validate(schema, { value: 101 }).valid).to.be.false;
    });

    it('应该支持小数 number:<99.99', () => {
      const schema = dsl({ price: 'number:<99.99' });

      expect(validate(schema, { price: 99.98 }).valid).to.be.true;
      expect(validate(schema, { price: 99.99 }).valid).to.be.false;
      expect(validate(schema, { price: 100 }).valid).to.be.false;
    });

    it('应该支持负数边界 number:<0', () => {
      const schema = dsl({ value: 'number:<0' });

      expect(validate(schema, { value: -1 }).valid).to.be.true;
      expect(validate(schema, { value: -0.1 }).valid).to.be.true;
      expect(validate(schema, { value: 0 }).valid).to.be.false;
      expect(validate(schema, { value: 1 }).valid).to.be.false;
    });
  });

  describe('小于等于运算符 (<=)', () => {
    it('应该正确验证 number:<=100', () => {
      const schema = dsl({ score: 'number:<=100' });

      expect(validate(schema, { score: 100 }).valid).to.be.true;
      expect(validate(schema, { score: 99 }).valid).to.be.true;
      expect(validate(schema, { score: 101 }).valid).to.be.false;
    });

    it('应该支持小数 number:<=100.5', () => {
      const schema = dsl({ value: 'number:<=100.5' });

      expect(validate(schema, { value: 100.5 }).valid).to.be.true;
      expect(validate(schema, { value: 100.4 }).valid).to.be.true;
      expect(validate(schema, { value: 100.6 }).valid).to.be.false;
    });
  });

  describe('等于运算符 (=)', () => {
    it('应该正确验证 number:=100', () => {
      const schema = dsl({ score: 'number:=100' });

      expect(validate(schema, { score: 100 }).valid).to.be.true;
      expect(validate(schema, { score: 99 }).valid).to.be.false;
      expect(validate(schema, { score: 101 }).valid).to.be.false;
    });

    it('应该支持小数精确匹配 number:=99.99', () => {
      const schema = dsl({ price: 'number:=99.99' });

      expect(validate(schema, { price: 99.99 }).valid).to.be.true;
      expect(validate(schema, { price: 99.98 }).valid).to.be.false;
      expect(validate(schema, { price: 100 }).valid).to.be.false;
    });

    it('应该支持零值 number:=0', () => {
      const schema = dsl({ value: 'number:=0' });

      expect(validate(schema, { value: 0 }).valid).to.be.true;
      expect(validate(schema, { value: 0.1 }).valid).to.be.false;
      expect(validate(schema, { value: -0.1 }).valid).to.be.false;
    });
  });

  describe('向后兼容性', () => {
    it('应该保持原有范围语法不变 number:18-120', () => {
      const schema = dsl({ age: 'number:18-120' });

      expect(validate(schema, { age: 18 }).valid).to.be.true;
      expect(validate(schema, { age: 50 }).valid).to.be.true;
      expect(validate(schema, { age: 120 }).valid).to.be.true;
      expect(validate(schema, { age: 17 }).valid).to.be.false;
      expect(validate(schema, { age: 121 }).valid).to.be.false;
    });

    it('应该保持单边范围语法不变 number:18-', () => {
      const schema = dsl({ age: 'number:18-' });

      expect(validate(schema, { age: 18 }).valid).to.be.true;
      expect(validate(schema, { age: 100 }).valid).to.be.true;
      expect(validate(schema, { age: 17 }).valid).to.be.false;
    });

    it('应该保持单边范围语法不变 number:-100', () => {
      const schema = dsl({ score: 'number:-100' });

      expect(validate(schema, { score: 0 }).valid).to.be.true;
      expect(validate(schema, { score: 100 }).valid).to.be.true;
      expect(validate(schema, { score: 101 }).valid).to.be.false;
    });

    it('应该保持单个值语法不变 number:100', () => {
      const schema = dsl({ count: 'number:100' });

      expect(validate(schema, { count: 50 }).valid).to.be.true;
      expect(validate(schema, { count: 100 }).valid).to.be.true;
      expect(validate(schema, { count: 101 }).valid).to.be.false;
    });
  });

  describe('实际应用场景', () => {
    it('场景1：年龄验证（必须大于等于18岁）', () => {
      const schema = dsl({ age: 'number:>=18!' });

      expect(validate(schema, { age: 18 }).valid).to.be.true;
      expect(validate(schema, { age: 20 }).valid).to.be.true;
      expect(validate(schema, { age: 17 }).valid).to.be.false;
      expect(validate(schema, {}).valid).to.be.false;
    });

    it('场景2：价格验证（大于0）', () => {
      const schema = dsl({ price: 'number:>0!' });

      expect(validate(schema, { price: 0.01 }).valid).to.be.true;
      expect(validate(schema, { price: 99.99 }).valid).to.be.true;
      expect(validate(schema, { price: 0 }).valid).to.be.false;
      expect(validate(schema, { price: -1 }).valid).to.be.false;
    });

    it('场景3：等级验证（必须等于特定值）', () => {
      const schema = dsl({ level: 'number:=5!' });

      expect(validate(schema, { level: 5 }).valid).to.be.true;
      expect(validate(schema, { level: 4 }).valid).to.be.false;
      expect(validate(schema, { level: 6 }).valid).to.be.false;
    });

    it('场景4：温度上限（小于100度）', () => {
      const schema = dsl({ temperature: 'number:<100' });

      expect(validate(schema, { temperature: 50 }).valid).to.be.true;
      expect(validate(schema, { temperature: 99.9 }).valid).to.be.true;
      expect(validate(schema, { temperature: 100 }).valid).to.be.false;
    });

    it('场景5：最低分数（大于等于0）', () => {
      const schema = dsl({ score: 'number:>=0' });

      expect(validate(schema, { score: 0 }).valid).to.be.true;
      expect(validate(schema, { score: 50 }).valid).to.be.true;
      expect(validate(schema, { score: -1 }).valid).to.be.false;
    });
  });

  describe('边界情况', () => {
    it('应该正确处理浮点数精度', () => {
      const schema = dsl({ value: 'number:>0.1' });

      expect(validate(schema, { value: 0.2 }).valid).to.be.true;
      expect(validate(schema, { value: 0.1 }).valid).to.be.false;
    });

    it('应该正确处理负数范围', () => {
      const schema = dsl({ value: 'number:>-100' });

      expect(validate(schema, { value: -99 }).valid).to.be.true;
      expect(validate(schema, { value: 0 }).valid).to.be.true;
      expect(validate(schema, { value: -100 }).valid).to.be.false;
    });

    it('应该正确处理大数值', () => {
      const schema = dsl({ value: 'number:>1000000' });

      expect(validate(schema, { value: 1000001 }).valid).to.be.true;
      expect(validate(schema, { value: 1000000 }).valid).to.be.false;
    });
  });
});

