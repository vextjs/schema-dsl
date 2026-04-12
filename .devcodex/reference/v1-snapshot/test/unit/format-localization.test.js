const { dsl, Validator } = require('../../index');
const { expect } = require('chai');

describe('Format Localization', () => {
  const validator = new Validator();

  before(() => {
    require('../../lib/locales/index');
  });

  it('should return localized error for email', () => {
    const schema = dsl('email!').toSchema();
    
    const resCN = validator.validate(schema, 'invalid-email', { locale: 'zh-CN' });
    expect(resCN.valid).to.be.false;
    expect(resCN.errors[0].message).to.equal('value必须是有效的邮箱地址');

    const resEN = validator.validate(schema, 'invalid-email', { locale: 'en-US' });
    expect(resEN.valid).to.be.false;
    expect(resEN.errors[0].message).to.equal('value must be a valid email address');
  });

  it('should return localized error for url', () => {
    const schema = dsl('url!').toSchema();
    
    const resCN = validator.validate(schema, 'invalid-url', { locale: 'zh-CN' });
    expect(resCN.valid).to.be.false;
    expect(resCN.errors[0].message).to.equal('value必须是有效的URL地址');
  });

  it('should return localized error for ipv4', () => {
    const schema = dsl('ipv4!').toSchema();
    
    const resCN = validator.validate(schema, '999.999.999.999', { locale: 'zh-CN' });
    expect(resCN.valid).to.be.false;
    expect(resCN.errors[0].message).to.equal('value必须是有效的IPv4地址');
  });
});

