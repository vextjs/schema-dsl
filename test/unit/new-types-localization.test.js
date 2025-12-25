const { dsl, Validator, Locale } = require('../../index');
const { expect } = require('chai');

describe('New Types Localization', () => {
  const validator = new Validator();

  before(() => {
    // Ensure locales are loaded
    require('../../lib/locales/index');
  });

  it('should return localized error for objectId', () => {
    const schema = dsl('objectId!').toSchema();
    
    // zh-CN
    const resCN = validator.validate(schema, 'invalid-id', { locale: 'zh-CN' });
    expect(resCN.valid).to.be.false;
    expect(resCN.errors[0].message).to.equal('无效的 ObjectId');

    // en-US
    const resEN = validator.validate(schema, 'invalid-id', { locale: 'en-US' });
    expect(resEN.valid).to.be.false;
    expect(resEN.errors[0].message).to.equal('Invalid ObjectId');
  });

  it('should return localized error for hexColor', () => {
    const schema = dsl('hexColor!').toSchema();
    
    // zh-CN
    const resCN = validator.validate(schema, 'invalid-color', { locale: 'zh-CN' });
    expect(resCN.valid).to.be.false;
    expect(resCN.errors[0].message).to.equal('无效的十六进制颜色值');

    // en-US
    const resEN = validator.validate(schema, 'invalid-color', { locale: 'en-US' });
    expect(resEN.valid).to.be.false;
    expect(resEN.errors[0].message).to.equal('Invalid Hex Color');
  });

  it('should return localized error for macAddress', () => {
    const schema = dsl('macAddress!').toSchema();
    
    // zh-CN
    const resCN = validator.validate(schema, 'invalid-mac', { locale: 'zh-CN' });
    expect(resCN.valid).to.be.false;
    expect(resCN.errors[0].message).to.equal('无效的 MAC 地址');

    // en-US
    const resEN = validator.validate(schema, 'invalid-mac', { locale: 'en-US' });
    expect(resEN.valid).to.be.false;
    expect(resEN.errors[0].message).to.equal('Invalid MAC Address');
  });

  it('should return localized error for cron', () => {
    const schema = dsl('cron!').toSchema();

    // zh-CN
    const resCN = validator.validate(schema, 'invalid-cron', { locale: 'zh-CN' });
    expect(resCN.valid).to.be.false;
    expect(resCN.errors[0].message).to.equal('无效的 Cron 表达式');

    // en-US
    const resEN = validator.validate(schema, 'invalid-cron', { locale: 'en-US' });
    expect(resEN.valid).to.be.false;
    expect(resEN.errors[0].message).to.equal('Invalid Cron Expression');
  });

  it('should return localized error for slug', () => {
    const schema = dsl('string!').slug().toSchema();
    
    // zh-CN
    const resCN = validator.validate(schema, 'Invalid Slug', { locale: 'zh-CN' });
    expect(resCN.valid).to.be.false;
    expect(resCN.errors[0].message).to.equal('URL别名只能包含小写字母、数字和连字符');

    // en-US
    const resEN = validator.validate(schema, 'Invalid Slug', { locale: 'en-US' });
    expect(resEN.valid).to.be.false;
    expect(resEN.errors[0].message).to.equal('URL slug can only contain lowercase letters, numbers, and hyphens');
  });

  it('should return localized error for username', () => {
    const schema = dsl('string!').username().toSchema();
    
    // zh-CN
    const resCN = validator.validate(schema, 'Invalid Username!', { locale: 'zh-CN' });
    expect(resCN.valid).to.be.false;
    expect(resCN.errors[0].message).to.equal('用户名必须以字母开头，只能包含字母、数字和下划线');

    // en-US
    const resEN = validator.validate(schema, 'Invalid Username!', { locale: 'en-US' });
    expect(resEN.valid).to.be.false;
    expect(resEN.errors[0].message).to.equal('Username must start with a letter and contain only letters, numbers, and underscores');
  });

  it('should return localized error for password', () => {
    const schema = dsl('string!').password('medium').toSchema();
    
    // zh-CN
    // Use a password that meets length requirement but fails pattern (no numbers)
    const resCN = validator.validate(schema, 'abcdefgh', { locale: 'zh-CN' });
    expect(resCN.valid).to.be.false;
    expect(resCN.errors[0].message).to.equal('密码至少8位，需包含字母和数字');

    // en-US
    const resEN = validator.validate(schema, 'abcdefgh', { locale: 'en-US' });
    expect(resEN.valid).to.be.false;
    expect(resEN.errors[0].message).to.equal('Password must be at least 8 characters and contain letters and numbers');
  });
});

