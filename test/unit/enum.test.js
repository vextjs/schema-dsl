/**
 * 枚举功能测试
 *
 * 测试枚举的各种语法和类型支持
 */

const assert = require('assert');
const { dsl, validate } = require('../../index');

describe('Enum - 枚举功能', function() {

  describe('基础枚举语法', function() {

    it('应该支持简写形式 value1|value2（字符串枚举）', function() {
      const schema = dsl({ status: 'active|inactive|pending' });

      // 有效值
      let result = validate(schema, { status: 'active' });
      assert.strictEqual(result.valid, true);

      result = validate(schema, { status: 'inactive' });
      assert.strictEqual(result.valid, true);

      // 无效值
      result = validate(schema, { status: 'unknown' });
      assert.strictEqual(result.valid, false);
    });

    it('应该支持 enum:value1|value2 格式（字符串枚举）', function() {
      const schema = dsl({ status: 'enum:active|inactive|pending' });

      result = validate(schema, { status: 'active' });
      assert.strictEqual(result.valid, true);

      result = validate(schema, { status: 'unknown' });
      assert.strictEqual(result.valid, false);
    });

    it('应该支持枚举必填标记', function() {
      const schema = dsl({ status: 'active|inactive!' });

      // 缺失字段
      let result = validate(schema, {});
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e =>
        e.message.includes('必填') ||
        e.message.includes('required') ||
        e.keyword === 'required'
      ));

      // 有效值
      result = validate(schema, { status: 'active' });
      assert.strictEqual(result.valid, true);
    });

  });

  describe('布尔值枚举', function() {

    it('应该自动识别布尔值枚举', function() {
      const schema = dsl({ isActive: 'true|false' });

      // 有效值
      let result = validate(schema, { isActive: true });
      assert.strictEqual(result.valid, true);

      result = validate(schema, { isActive: false });
      assert.strictEqual(result.valid, true);

      // 无效值（字符串）
      result = validate(schema, { isActive: 'true' });
      assert.strictEqual(result.valid, false);
    });

    it('应该支持 enum:boolean:true|false 格式', function() {
      const schema = dsl({ isActive: 'enum:boolean:true|false' });

      let result = validate(schema, { isActive: true });
      assert.strictEqual(result.valid, true);

      result = validate(schema, { isActive: false });
      assert.strictEqual(result.valid, true);

      result = validate(schema, { isActive: 'true' });
      assert.strictEqual(result.valid, false);
    });

    it('应该支持布尔值枚举必填', function() {
      const schema = dsl({ isActive: 'true|false!' });

      let result = validate(schema, {});
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e =>
        e.message.includes('必填') ||
        e.message.includes('required') ||
        e.keyword === 'required'
      ));

      result = validate(schema, { isActive: true });
      assert.strictEqual(result.valid, true);
    });

  });

  describe('数字枚举', function() {

    it('应该自动识别数字枚举', function() {
      const schema = dsl({ priority: '1|2|3' });

      // 有效值
      let result = validate(schema, { priority: 1 });
      assert.strictEqual(result.valid, true);

      result = validate(schema, { priority: 2 });
      assert.strictEqual(result.valid, true);

      // 无效值（字符串）
      result = validate(schema, { priority: '1' });
      assert.strictEqual(result.valid, false);

      // 无效值（超出范围）
      result = validate(schema, { priority: 4 });
      assert.strictEqual(result.valid, false);
    });

    it('应该支持 enum:number:1|2|3 格式', function() {
      const schema = dsl({ priority: 'enum:number:1|2|3' });

      let result = validate(schema, { priority: 1 });
      assert.strictEqual(result.valid, true);

      result = validate(schema, { priority: 4 });
      assert.strictEqual(result.valid, false);
    });

    it('应该支持 enum:integer:1|2|3 格式', function() {
      const schema = dsl({ level: 'enum:integer:1|2|3' });

      let result = validate(schema, { level: 1 });
      assert.strictEqual(result.valid, true);

      // 浮点数应该失败
      result = validate(schema, { level: 1.5 });
      assert.strictEqual(result.valid, false);
    });

    it('应该支持数字枚举必填', function() {
      const schema = dsl({ priority: '1|2|3!' });

      let result = validate(schema, {});
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e =>
        e.message.includes('必填') ||
        e.message.includes('required') ||
        e.keyword === 'required'
      ));

      result = validate(schema, { priority: 1 });
      assert.strictEqual(result.valid, true);
    });

    it('应该支持小数枚举', function() {
      const schema = dsl({ rating: '1.0|1.5|2.0|2.5' });

      let result = validate(schema, { rating: 1.5 });
      assert.strictEqual(result.valid, true);

      result = validate(schema, { rating: 3.0 });
      assert.strictEqual(result.valid, false);
    });

  });

  describe('错误处理', function() {

    it('应该在布尔值枚举包含无效值时抛出错误', function() {
      assert.throws(() => {
        dsl({ flag: 'enum:boolean:true|false|maybe' });
      }, /Invalid boolean enum value/);
    });

    it('应该在数字枚举包含无效值时抛出错误', function() {
      assert.throws(() => {
        dsl({ value: 'enum:number:1|2|abc' });
      }, /Invalid number enum value/);
    });

  });

  describe('与其他功能配合', function() {

    it('应该支持链式方法', function() {
      const schema = dsl({
        status: dsl('active|inactive').label('状态')
      });

      let result = validate(schema, { status: 'active' });
      assert.strictEqual(result.valid, true);

      result = validate(schema, { status: 'unknown' });
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors[0].message.includes('状态'));
    });

    it('应该支持自定义错误消息', function() {
      const schema = dsl({
        status: dsl('active|inactive').messages({
          'string.enum': '状态必须是 active 或 inactive'
        })
      });

      let result = validate(schema, { status: 'unknown' });
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors[0].message.includes('active 或 inactive'));
    });

    it('应该在对象中正确使用枚举', function() {
      const schema = dsl({
        user: {
          name: 'string:2-32!',
          role: 'admin|user|guest!',
          status: 'active|inactive'.default('active'),
          level: '1|2|3'
        }
      });

      let result = validate(schema, {
        user: {
          name: 'John',
          role: 'admin',
          level: 2
        }
      });
      assert.strictEqual(result.valid, true);
    });

    it('应该在数组中正确使用枚举', function() {
      const schema = dsl({
        tags: 'array<enum:public|private|draft>'
      });

      let result = validate(schema, {
        tags: ['public', 'private']
      });
      assert.strictEqual(result.valid, true);

      result = validate(schema, {
        tags: ['public', 'unknown']
      });
      assert.strictEqual(result.valid, false);
    });

  });

  describe('兼容性测试', function() {

    it('应该不影响带冒号的其他类型', function() {
      const schema = dsl({
        username: 'string:3-32',
        age: 'number:18-120',
        phone: 'phone:cn'
      });

      let result = validate(schema, {
        username: 'john',
        age: 25,
        phone: '13800138000'
      });
      assert.strictEqual(result.valid, true);
    });

  });

});

