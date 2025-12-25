/**
 * 扩展自定义类型示例
 *
 * 演示如何在项目中扩展 SchemaIO 的功能：
 * 1. 扩展 DSL 方法 (DslBuilder.prototype)
 * 2. 添加自定义格式 (Validator.addFormat)
 * 3. 添加自定义关键字 (Validator.addKeyword)
 */

const { dsl, Validator, DslBuilder } = require('../index');

// ========== 1. 扩展 DSL 方法 ==========

// 扩展 .zipCode() 方法
DslBuilder.prototype.zipCode = function(country = 'cn') {
  const patterns = {
    cn: /^[1-9]\d{5}$/,
    us: /^\d{5}(-\d{4})?$/
  };

  const pattern = patterns[country];
  if (!pattern) throw new Error(`Unsupported country: ${country}`);

  return this.pattern(pattern)
    .messages({ 'pattern': `无效的邮政编码 (${country})` });
};

// 扩展 .isEven() 方法 (自定义验证逻辑)
DslBuilder.prototype.isEven = function() {
  return this.custom(value => {
    if (typeof value === 'number' && value % 2 !== 0) {
      return '必须是偶数';
    }
  });
};

// ========== 2. 添加自定义格式 (Validator) ==========

const validator = new Validator();

// 添加 'ipv4-cidr' 格式
validator.ajv.addFormat('ipv4-cidr', {
  type: 'string',
  validate: (ip) => {
    const parts = ip.split('/');
    if (parts.length !== 2) return false;
    const [addr, mask] = parts;
    // 简单验证 (实际应使用更严谨的正则)
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(addr) &&
           Number(mask) >= 0 && Number(mask) <= 32;
  }
});

// ========== 3. 使用扩展功能 ==========

const schema = dsl({
  // 使用扩展的 DSL 方法 (注意：自定义方法需要用 dsl() 包裹，或者手动扩展 String.prototype)
  zip: dsl('string!').zipCode('cn'),
  count: dsl('integer!').isEven(),

  // 使用自定义格式 (通过 string 类型 + format)
  network: 'string'.format('ipv4-cidr')
});

// ========== 4. 测试验证 ==========

const data = {
  zip: '123',       // 无效
  count: 3,         // 无效 (奇数)
  network: 'invalid' // 无效
};

const result = validator.validate(schema, data);

console.log('验证结果:', result.valid);
if (!result.valid) {
  result.errors.forEach(e => console.log(`- ${e.path}: ${e.message}`));
}

// 输出预期:
// - zip: 无效的邮政编码 (cn)
// - count: 必须是偶数
// - network: must match format "ipv4-cidr"

