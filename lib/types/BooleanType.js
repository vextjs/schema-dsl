// lib/types/BooleanType.js

const BaseType = require('./BaseType');

/**
 * 布尔类型
 *
 * @class BooleanType
 * @extends BaseType
 */
class BooleanType extends BaseType {
  constructor(options = {}) {
    super(options);
    this.typeName = 'boolean';
  }

  /**
   * 类型检查
   * @protected
   */
  _checkType(value) {
    if (typeof value !== 'boolean') {
      return {
        isValid: false,
        errors: [{
          type: 'type',
          message: `Expected boolean, got ${typeof value}`
        }]
      };
    }
    return { isValid: true, errors: [] };
  }
}

module.exports = BooleanType;

