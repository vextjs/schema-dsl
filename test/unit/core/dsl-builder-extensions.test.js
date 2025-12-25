const { expect } = require('chai');
const { dsl } = require('../../../index');
const DslBuilder = require('../../../lib/core/DslBuilder');
const SchemaUtils = require('../../../lib/utils/SchemaUtils');

describe('DslBuilder Extensions & Fixes', () => {

  describe('Shortcut Methods', () => {
    it('should support phoneNumber() alias', () => {
      const schema = dsl('string').phoneNumber('cn');
      expect(schema._baseSchema.pattern).to.exist;
      expect(schema._baseSchema.minLength).to.equal(11);
    });

    it('should support idCard() for cn', () => {
      const schema = dsl('string').idCard('cn');
      expect(schema._baseSchema.pattern).to.exist;
      expect(schema._baseSchema.minLength).to.equal(18);
      expect(schema._label).to.equal('身份证');
    });

    it('should throw error for unsupported idCard country', () => {
      expect(() => dsl('string').idCard('us')).to.throw('Unsupported country');
    });

    it('should support slug()', () => {
      const schema = dsl('string').slug();
      expect(schema._baseSchema.pattern).to.exist;
      expect(schema._label).to.equal('URL别名');
    });
  });

  describe('Nesting Depth Check', () => {
    it('should correctly calculate nesting depth (ignoring leaf nodes)', () => {
      const deepSchema = dsl({
        level1: {
          level2: {
            level3: {
              value: 'string'
            }
          }
        }
      });

      // level1(1) -> level2(2) -> level3(3) -> value(leaf)
      // Depth should be 3
      const result = DslBuilder.validateNestingDepth(deepSchema, 2);

      expect(result.depth).to.equal(3);
      expect(result.valid).to.be.false;
      expect(result.path).to.include('level1.level2.level3');
    });

    it('should pass when depth is within limit', () => {
      const schema = dsl({
        level1: {
          value: 'string'
        }
      });

      // level1(1) -> value(leaf)
      // Depth should be 1
      const result = DslBuilder.validateNestingDepth(schema, 2);

      expect(result.depth).to.equal(1);
      expect(result.valid).to.be.true;
    });
  });

  describe('Schema Reuse', () => {
    it('should support createLibrary and reusable', () => {
      const fields = SchemaUtils.createLibrary({
        email: () => dsl('email!').label('邮箱'),
        phone: () => dsl('string:11!').phoneNumber('cn').label('手机号')
      });

      const schema = dsl({
        contactEmail: fields.email(),
        contactPhone: fields.phone()
      });

      expect(schema.properties.contactEmail.format).to.equal('email');
      expect(schema.properties.contactPhone.minLength).to.equal(11);
    });
  });

});

