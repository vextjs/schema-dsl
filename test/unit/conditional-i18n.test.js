/**
 * ConditionalBuilder 多语言支持测试
 *
 * 测试使用多语言配置文件中的 key，而不是硬编码字符串
 */

const { expect } = require('chai');
const { dsl, validate, Locale } = require('../../index');

describe('ConditionalBuilder - 多语言支持', () => {
  // 保存原始语言设置
  let originalLocale;

  before(() => {
    originalLocale = Locale.getLocale();
  });

  after(() => {
    // 恢复原始语言设置
    Locale.setLocale(originalLocale);
  });

  it('应该支持使用多语言 key（中文）', () => {
    Locale.setLocale('zh-CN');

    const schema = dsl({
      age: 'number!',
      status: dsl.if((data) => data.age < 18)
        .message('conditional.underAge')  // ✅ 使用多语言 key
    });

    const result = validate(schema, { age: 16, status: 'active' });
    expect(result.valid).to.be.false;
    expect(result.errors[0].message).to.equal('未成年用户不能注册');  // ✅ 从 zh-CN.js 获取
  });

  it('应该支持使用多语言 key（英文）', () => {
    Locale.setLocale('en-US');

    const schema = dsl({
      age: 'number!',
      status: dsl.if((data) => data.age < 18)
        .message('conditional.underAge')  // ✅ 使用多语言 key
    });

    const result = validate(schema, { age: 16, status: 'active' });
    expect(result.valid).to.be.false;
    expect(result.errors[0].message).to.equal('Minors cannot register');  // ✅ 从 en-US.js 获取
  });

  it('应该支持使用多语言 key（日文）', () => {
    Locale.setLocale('ja-JP');

    const schema = dsl({
      age: 'number!',
      status: dsl.if((data) => data.age < 18)
        .message('conditional.underAge')  // ✅ 使用多语言 key
    });

    const result = validate(schema, { age: 16, status: 'active' });
    expect(result.valid).to.be.false;
    expect(result.errors[0].message).to.equal('未成年者は登録できません');  // ✅ 从 ja-JP.js 获取
  });

  it('应该支持在 validate 时动态指定语言', () => {
    const schema = dsl({
      age: 'number!',
      status: dsl.if((data) => data.age < 18)
        .message('conditional.underAge')  // ✅ 使用多语言 key
    });

    // 验证时指定中文
    const result1 = validate(schema, { age: 16, status: 'active' }, { locale: 'zh-CN' });
    expect(result1.valid).to.be.false;
    expect(result1.errors[0].message).to.equal('未成年用户不能注册');

    // 验证时指定英文
    const result2 = validate(schema, { age: 16, status: 'active' }, { locale: 'en-US' });
    expect(result2.valid).to.be.false;
    expect(result2.errors[0].message).to.equal('Minors cannot register');
  });

  it('应该支持多个条件使用不同的多语言 key', () => {
    Locale.setLocale('zh-CN');

    const schema = dsl({
      age: 'number!',
      status: 'string!',
      check: dsl.if((data) => data.age < 18)
        .message('conditional.underAge')
        .elseIf((data) => data.status === 'blocked')
        .message('conditional.blocked')
    });

    // 未成年
    const result1 = validate(schema, { age: 16, status: 'active', check: '' });
    expect(result1.valid).to.be.false;
    expect(result1.errors[0].message).to.equal('未成年用户不能注册');

    // 被封禁
    const result2 = validate(schema, { age: 20, status: 'blocked', check: '' });
    expect(result2.valid).to.be.false;
    expect(result2.errors[0].message).to.equal('账号已被封禁');
  });

  it('应该支持硬编码字符串（向后兼容）', () => {
    Locale.setLocale('zh-CN');

    const schema = dsl({
      age: 'number!',
      status: dsl.if((data) => data.age < 18)
        .message('这是硬编码的错误消息')  // ✅ 直接使用字符串也应该工作
    });

    const result = validate(schema, { age: 16, status: 'active' });
    expect(result.valid).to.be.false;
    // ✅ 如果不是多语言 key，Locale.getMessage 会返回原字符串
    expect(result.errors[0].message).to.equal('这是硬编码的错误消息');
  });

  it('应该在 then/else 中支持多语言（email 必填）', () => {
    Locale.setLocale('zh-CN');

    const schema = dsl({
      userType: 'string!',
      email: dsl.if((data) => data.userType === 'admin')
        .then('email!')
        .else('email')
    });

    // 管理员没有邮箱 - 应该显示中文错误
    const result = validate(schema, { userType: 'admin', email: '' });
    expect(result.valid).to.be.false;
    // 这里的错误来自 email! 验证，会使用 format.email 的多语言
    expect(result.errors[0].message).to.include('邮箱');
  });
});

