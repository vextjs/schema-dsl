const { expect } = require('chai');
const { dsl, validate } = require('../../../index');
const patterns = require('../../../lib/config/patterns');

describe('DslBuilder New Features', () => {

  describe('Phone Configuration', () => {
    it('should use default phone patterns', () => {
      // Use object schema for object validation
      const schema = dsl({ phone: 'phone:cn!' });
      const valid = validate(schema, { phone: '13800138000' });
      const invalid = validate(schema, { phone: '123' });

      if (!valid.valid) console.log('Phone valid failed:', JSON.stringify(valid.errors, null, 2));
      expect(valid.valid).to.be.true;
      expect(invalid.valid).to.be.false;
    });

    it('should support custom phone configuration via dsl.config (legacy)', () => {
      const originalPattern = patterns.phone.cn;

      dsl.config({
        phone: {
          cn: { pattern: /^1\d{10}$/, min: 11, max: 11, msg: 'Custom Msg' }
        }
      });

      const schema = dsl({ phone: 'phone:cn!' });
      const result = validate(schema, { phone: '123' });

      expect(result.valid).to.be.false;

      dsl.config({ phone: { cn: originalPattern } });
    });

    it('should support custom patterns via dsl.config (new)', () => {
      const originalPattern = patterns.phone.cn;

      dsl.config({
        patterns: {
          phone: {
            cn: { pattern: /^1\d{10}$/, min: 11, max: 11, msg: 'Custom Msg New' }
          }
        }
      });

      const schema = dsl({ phone: 'phone:cn!' });
      const result = validate(schema, { phone: '123' });

      expect(result.valid).to.be.false;

      dsl.config({ patterns: { phone: { cn: originalPattern } } });
    });
  });

  describe('ID Card & Credit Card', () => {
    it('should validate idCard', () => {
      // Use string schema for string validation
      const schema = dsl('idCard:cn!');
      const valid = validate(schema, '110101199003071234');

      if (!valid.valid) console.log('IDCard failed:', JSON.stringify(valid.errors, null, 2));
      expect(valid.valid).to.be.true;
      expect(validate(schema, '123').valid).to.be.false;
    });

    it('should validate creditCard', () => {
      const schema = dsl('creditCard:visa!');
      const valid = validate(schema, '4000123456789012');

      if (!valid.valid) console.log('CreditCard failed:', JSON.stringify(valid.errors, null, 2));
      expect(valid.valid).to.be.true;
      expect(validate(schema, '5100123456789012').valid).to.be.false;
    });

    it('should support string extension for creditCard', () => {
      const schema = 'creditCard:visa!'.toSchema();
      expect(validate(schema, '4000123456789012').valid).to.be.true;
    });
  });

  describe('Additional Number/Code Types', () => {
    it('should validate licensePlate', () => {
      const schema = dsl('licensePlate:cn!');
      expect(validate(schema, '京A88888').valid).to.be.true;
      expect(validate(schema, 'ABC').valid).to.be.false;
    });

    it('should validate postalCode', () => {
      const schema = dsl('postalCode:cn!');
      expect(validate(schema, '100000').valid).to.be.true;
      expect(validate(schema, '123').valid).to.be.false;
    });

    it('should validate passport', () => {
      const schema = dsl('passport:cn!');
      expect(validate(schema, 'E12345678').valid).to.be.true;
      expect(validate(schema, '123').valid).to.be.false;
    });
  });

  describe('New Types', () => {
    it('should validate objectId', () => {
      const schema = dsl('objectId!');
      const valid = validate(schema, '507f1f77bcf86cd799439011');
      if (!valid.valid) console.log('ObjectId failed:', JSON.stringify(valid.errors, null, 2));
      expect(valid.valid).to.be.true;
      expect(validate(schema, 'invalid-id').valid).to.be.false;
    });

    it('should validate hexColor', () => {
      const schema = dsl('hexColor!');
      expect(validate(schema, '#fff').valid).to.be.true;
      expect(validate(schema, '#FFFFFF').valid).to.be.true;
      expect(validate(schema, 'red').valid).to.be.false;
      expect(validate(schema, '#12345').valid).to.be.false;
    });

    it('should validate macAddress', () => {
      const schema = dsl('macAddress!');
      expect(validate(schema, '00:0a:95:9d:68:16').valid).to.be.true;
      expect(validate(schema, '00-0a-95-9d-68-16').valid).to.be.true;
      expect(validate(schema, 'invalid-mac').valid).to.be.false;
    });

    it('should validate cron', () => {
      const schema = dsl('cron!');
      expect(validate(schema, '* * * * *').valid).to.be.true;
      expect(validate(schema, '*/5 * * * *').valid).to.be.true;
    });
  });
});
