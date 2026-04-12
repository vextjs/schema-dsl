const { expect } = require('chai');
const { dsl, validate, DslBuilder, PluginManager } = require('../../index');

describe('插件自定义类型集成测试', () => {
  let pluginManager;

  beforeEach(() => {
    pluginManager = new PluginManager();
    DslBuilder.clearCustomTypes();
  });

  describe('custom-format 插件集成', () => {
    it('应该正确加载 custom-format 插件', () => {
      const customFormatPlugin = require('../../plugins/custom-format');

      // 注册并安装插件
      pluginManager.register(customFormatPlugin);
      pluginManager.install(require('../../index'));

      // 验证类型已注册
      expect(DslBuilder.hasType('phone-cn')).to.be.true;
      expect(DslBuilder.hasType('qq')).to.be.true;
      expect(DslBuilder.hasType('wechat')).to.be.true;
    });

    it('应该能在DSL中直接使用插件类型', () => {
      const customFormatPlugin = require('../../plugins/custom-format');
      pluginManager.register(customFormatPlugin);
      pluginManager.install(require('../../index'));

      // 直接使用插件注册的类型
      const schema = dsl({
        phone: 'phone-cn!',
        qq: 'qq',
        wechat: 'wechat'
      });

      // 有效数据
      const r1 = validate(schema, {
        phone: '13800138000',
        qq: '10000',
        wechat: 'user_123'
      });
      expect(r1.valid).to.be.true;

      // 无效手机号
      const r2 = validate(schema, {
        phone: '12345678901',
        qq: '10000',
        wechat: 'user_123'
      });
      expect(r2.valid).to.be.false;
    });

    it('应该能在 types: 中使用插件类型', () => {
      const customFormatPlugin = require('../../plugins/custom-format');
      pluginManager.register(customFormatPlugin);
      pluginManager.install(require('../../index'));

      // 在types:中使用插件类型
      const schema = dsl({
        contact: 'types:email|phone-cn|qq'
      });

      // 邮箱
      expect(validate(schema, { contact: 'user@example.com' }).valid).to.be.true;

      // 手机号
      expect(validate(schema, { contact: '13800138000' }).valid).to.be.true;

      // QQ号
      expect(validate(schema, { contact: '10000' }).valid).to.be.true;

      // 无效
      expect(validate(schema, { contact: 'invalid' }).valid).to.be.false;
    });

    it('应该支持银行卡号的Luhn算法验证', () => {
      const customFormatPlugin = require('../../plugins/custom-format');
      pluginManager.register(customFormatPlugin);
      pluginManager.install(require('../../index'));

      const schema = dsl({
        cardNumber: 'bank-card!'
      });

      // 有效的银行卡号（通过Luhn算法）
      const r1 = validate(schema, { cardNumber: '6217002870003614131' });
      expect(r1.valid).to.be.true;

      // 无效的银行卡号
      const r2 = validate(schema, { cardNumber: '1234567890123456' });
      expect(r2.valid).to.be.false;
    });
  });

  describe('custom-type-example 插件集成', () => {
    it('应该正确加载 custom-type-example 插件', () => {
      const customTypePlugin = require('../../plugins/custom-type-example');

      pluginManager.register(customTypePlugin);
      pluginManager.install(require('../../index'));

      // 验证类型已注册
      expect(DslBuilder.hasType('order-id')).to.be.true;
      expect(DslBuilder.hasType('sku')).to.be.true;
      expect(DslBuilder.hasType('price')).to.be.true;
      expect(DslBuilder.hasType('rating')).to.be.true;
    });

    it('应该能使用订单号和SKU类型', () => {
      const customTypePlugin = require('../../plugins/custom-type-example');
      pluginManager.register(customTypePlugin);
      pluginManager.install(require('../../index'));

      const schema = dsl({
        orderId: 'order-id!',
        sku: 'sku!'
      });

      // 有效数据
      const r1 = validate(schema, {
        orderId: 'ORD202401010001',
        sku: 'SKU-ABC123'
      });
      expect(r1.valid).to.be.true;

      // 无效订单号（格式不对）
      const r2 = validate(schema, {
        orderId: 'ORD123',
        sku: 'SKU-ABC123'
      });
      expect(r2.valid).to.be.false;
    });

    it('应该能在 types: 中使用业务自定义类型', () => {
      const customTypePlugin = require('../../plugins/custom-type-example');
      pluginManager.register(customTypePlugin);
      pluginManager.install(require('../../index'));

      const schema = dsl({
        identifier: 'types:order-id|sku'
      });

      // 订单号
      expect(validate(schema, { identifier: 'ORD202401010001' }).valid).to.be.true;

      // SKU
      expect(validate(schema, { identifier: 'SKU-ABC123' }).valid).to.be.true;

      // 无效
      expect(validate(schema, { identifier: 'invalid' }).valid).to.be.false;
    });

    it('应该支持动态Schema生成', () => {
      const customTypePlugin = require('../../plugins/custom-type-example');
      pluginManager.register(customTypePlugin);
      pluginManager.install(require('../../index'));

      const schema = dsl({
        age: 'dynamic-age'
      });

      // 有效年龄
      expect(validate(schema, { age: 30 }).valid).to.be.true;

      // 负数应该失败
      expect(validate(schema, { age: -1 }).valid).to.be.false;
    });
  });

  describe('多插件协作', () => {
    it('应该支持同时加载多个插件', () => {
      const customFormatPlugin = require('../../plugins/custom-format');
      const customTypePlugin = require('../../plugins/custom-type-example');

      pluginManager.register(customFormatPlugin);
      pluginManager.register(customTypePlugin);
      pluginManager.install(require('../../index'));

      // 两个插件的类型都应该可用
      expect(DslBuilder.hasType('phone-cn')).to.be.true;
      expect(DslBuilder.hasType('order-id')).to.be.true;
    });

    it('应该能在 types: 中混合使用多个插件的类型', () => {
      const customFormatPlugin = require('../../plugins/custom-format');
      const customTypePlugin = require('../../plugins/custom-type-example');

      pluginManager.register(customFormatPlugin);
      pluginManager.register(customTypePlugin);
      pluginManager.install(require('../../index'));

      const schema = dsl({
        contact: 'types:email|phone-cn|qq',
        identifier: 'types:order-id|sku|uuid'
      });

      const data = {
        contact: '13800138000',
        identifier: 'ORD202401010001'
      };

      const result = validate(schema, data);
      expect(result.valid).to.be.true;
    });
  });

  describe('插件卸载', () => {
    it('卸载插件后类型应该仍然可用（已注册到DslBuilder）', () => {
      const customFormatPlugin = require('../../plugins/custom-format');

      pluginManager.register(customFormatPlugin);
      pluginManager.install(require('../../index'));

      expect(DslBuilder.hasType('phone-cn')).to.be.true;

      // 卸载插件
      pluginManager.uninstall(require('../../index'), 'custom-format');

      // 类型仍然可用（因为已注册到DslBuilder静态Map）
      expect(DslBuilder.hasType('phone-cn')).to.be.true;

      // 但如果手动清除，则不可用
      DslBuilder.clearCustomTypes();
      expect(DslBuilder.hasType('phone-cn')).to.be.false;
    });
  });

  describe('错误处理', () => {
    it('应该在DslBuilder不可用时抛出错误', () => {
      // 模拟旧版本（没有registerType）
      const oldRegisterType = DslBuilder.registerType;
      delete DslBuilder.registerType;

      const badPlugin = {
        name: 'bad-plugin',
        version: '1.0.0',
        install(schemaDsl) {
          const { DslBuilder } = schemaDsl;
          DslBuilder.registerType('test', { type: 'string' });
        }
      };

      pluginManager.register(badPlugin);

      expect(() => {
        pluginManager.install(require('../../index'));
      }).to.throw();

      // 恢复
      DslBuilder.registerType = oldRegisterType;
    });

    it('应该正确处理重复注册相同类型', () => {
      DslBuilder.registerType('test-type', { type: 'string' });

      // 重复注册会覆盖
      DslBuilder.registerType('test-type', { type: 'number' });

      const schema = dsl({ value: 'test-type' });
      const compiled = schema.toSchema ? schema.toSchema() : schema;

      // 应该是最后注册的类型
      expect(compiled.properties.value.type).to.equal('number');
    });
  });

  describe('实际应用场景', () => {
    it('场景1：用户注册表单（邮箱或手机号）', () => {
      const customFormatPlugin = require('../../plugins/custom-format');
      pluginManager.register(customFormatPlugin);
      pluginManager.install(require('../../index'));

      const registerSchema = dsl({
        username: 'string:3-20!',
        password: 'string:6-20!',
        contact: 'types:email|phone-cn!'  // 邮箱或手机号
      });

      // 使用邮箱注册
      const r1 = validate(registerSchema, {
        username: 'john_doe',
        password: '123456',
        contact: 'john@example.com'
      });
      expect(r1.valid).to.be.true;

      // 使用手机号注册
      const r2 = validate(registerSchema, {
        username: 'jane_doe',
        password: 'abcdef',
        contact: '13800138000'
      });
      expect(r2.valid).to.be.true;
    });

    it('场景2：订单系统（订单号或SKU查询）', () => {
      const customTypePlugin = require('../../plugins/custom-type-example');
      pluginManager.register(customTypePlugin);
      pluginManager.install(require('../../index'));

      const querySchema = dsl({
        identifier: 'types:order-id|sku!',
        status: 'string'
      });

      // 通过订单号查询
      expect(validate(querySchema, {
        identifier: 'ORD202401010001',
        status: 'pending'
      }).valid).to.be.true;

      // 通过SKU查询
      expect(validate(querySchema, {
        identifier: 'SKU-ABC123',
        status: 'shipped'
      }).valid).to.be.true;
    });

    it('场景3：灵活的价格输入（数字或字符串）', () => {
      const schema = dsl({
        price: 'types:number:0-|string:1-20'
      });

      // 数字价格
      expect(validate(schema, { price: 99.99 }).valid).to.be.true;

      // 字符串价格（如"面议"）
      expect(validate(schema, { price: '面议' }).valid).to.be.true;

      // 负数应该失败
      expect(validate(schema, { price: -1 }).valid).to.be.false;
    });
  });
});

