const { dsl, Validator, Locale } = require('../../index');
const { expect } = require('chai');

describe('Label Translation', () => {
  const validator = new Validator();

  before(() => {
    require('../../lib/locales/index');

    // Add labels to locales
    Locale.addLocale('zh-CN', {
      'label.test_field': '测试字段'
    });
    Locale.addLocale('en-US', {
      'label.test_field': 'Test Field'
    });
  });

  it('should translate label in error message', () => {
    const schema = dsl('string!').label('label.test_field').toSchema();

    // zh-CN
    const resCN = validator.validate(schema, null, { locale: 'zh-CN' });
    expect(resCN.valid).to.be.false;
    // "测试字段不能为空"
    expect(resCN.errors[0].message).to.include('测试字段');

    // en-US
    const resEN = validator.validate(schema, null, { locale: 'en-US' });
    expect(resEN.valid).to.be.false;
    // "Test Field is required"
    expect(resEN.errors[0].message).to.include('Test Field');
  });
});

