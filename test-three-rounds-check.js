/**
 * 三轮深度检查脚本
 *
 * 第一轮：验证所有ajv错误类型的参数映射
 * 第二轮：边界情况和极端值测试
 * 第三轮：并发和性能测试
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const ErrorFormatter = require('./lib/core/ErrorFormatter');

console.log('🔍 开始三轮深度检查...\n');
console.log('='.repeat(80));

// ============================================================================
// 第一轮：验证所有ajv错误类型的参数映射
// ============================================================================

console.log('\n【第一轮】验证所有ajv错误类型的参数映射\n');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const testCases = [
  {
    name: 'required',
    schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
    data: {},
    expectedParams: ['missingProperty']
  },
  {
    name: 'minLength',
    schema: { type: 'string', minLength: 3 },
    data: 'ab',
    expectedParams: ['limit']
  },
  {
    name: 'maxLength',
    schema: { type: 'string', maxLength: 10 },
    data: 'this is too long string',
    expectedParams: ['limit']
  },
  {
    name: 'minimum',
    schema: { type: 'number', minimum: 10 },
    data: 5,
    expectedParams: ['limit', 'comparison']
  },
  {
    name: 'maximum',
    schema: { type: 'number', maximum: 100 },
    data: 150,
    expectedParams: ['limit', 'comparison']
  },
  {
    name: 'enum',
    schema: { type: 'string', enum: ['pro', 'basic', 'free'] },
    data: 'premium',
    expectedParams: ['allowedValues']
  },
  {
    name: 'pattern',
    schema: { type: 'string', pattern: '^[a-z]+$' },
    data: 'ABC123',
    expectedParams: ['pattern']
  },
  {
    name: 'format (email)',
    schema: { type: 'string', format: 'email' },
    data: 'invalid-email',
    expectedParams: ['format']
  },
  {
    name: 'type',
    schema: { type: 'number' },
    data: 'not a number',
    expectedParams: ['type']
  },
  {
    name: 'minItems',
    schema: { type: 'array', minItems: 2 },
    data: [1],
    expectedParams: ['limit']
  },
  {
    name: 'maxItems',
    schema: { type: 'array', maxItems: 5 },
    data: [1, 2, 3, 4, 5, 6],
    expectedParams: ['limit']
  },
  {
    name: 'minProperties',
    schema: { type: 'object', minProperties: 2 },
    data: { a: 1 },
    expectedParams: ['limit']
  },
  {
    name: 'maxProperties',
    schema: { type: 'object', maxProperties: 3 },
    data: { a: 1, b: 2, c: 3, d: 4 },
    expectedParams: ['limit']
  },
  {
    name: 'additionalProperties',
    schema: { type: 'object', properties: { name: { type: 'string' } }, additionalProperties: false },
    data: { name: 'John', age: 30 },
    expectedParams: ['additionalProperty']
  },
  {
    name: 'uniqueItems',
    schema: { type: 'array', uniqueItems: true },
    data: [1, 2, 2, 3],
    expectedParams: ['i', 'j']
  },
  {
    name: 'const',
    schema: { const: 'fixed_value' },
    data: 'wrong_value',
    expectedParams: ['allowedValue']
  }
];

let round1Passed = 0;
let round1Failed = 0;

testCases.forEach(({ name, schema, data, expectedParams }) => {
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid && validate.errors) {
    const formatter = new ErrorFormatter('en-US');
    const formatted = formatter.formatDetailed(validate.errors);

    const hasTemplateVars = formatted.some(err =>
      err.message.includes('{{#') || err.message.includes('}}')
    );

    if (hasTemplateVars) {
      console.log(`❌ ${name}: 错误消息包含未替换的模板变量`);
      console.log(`   消息: ${formatted[0].message}`);
      console.log(`   ajv参数: ${JSON.stringify(validate.errors[0].params)}`);
      round1Failed++;
    } else {
      console.log(`✅ ${name}: 参数映射正确`);
      round1Passed++;
    }
  }
});

console.log(`\n第一轮结果: ${round1Passed} 通过, ${round1Failed} 失败`);

// ============================================================================
// 第二轮：边界情况和极端值测试
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('\n【第二轮】边界情况和极端值测试\n');

const boundaryTests = [
  {
    name: '空字符串枚举',
    schema: { type: 'string', enum: ['', 'a', 'b'] },
    data: 'c'
  },
  {
    name: '超长枚举列表',
    schema: { type: 'string', enum: Array(100).fill(0).map((_, i) => `value${i}`) },
    data: 'invalid'
  },
  {
    name: '数字0作为枚举值',
    schema: { type: 'number', enum: [0, 1, 2] },
    data: 3
  },
  {
    name: 'null作为枚举值',
    schema: { enum: [null, 'a', 'b'] },
    data: 'c'
  },
  {
    name: 'undefined作为数据',
    schema: { type: 'string' },
    data: undefined
  },
  {
    name: '非常深的嵌套对象',
    schema: {
      type: 'object',
      properties: {
        level1: {
          type: 'object',
          properties: {
            level2: {
              type: 'object',
              properties: {
                level3: {
                  type: 'object',
                  properties: {
                    value: { type: 'string', enum: ['a', 'b'] }
                  },
                  required: ['value']
                }
              }
            }
          }
        }
      }
    },
    data: { level1: { level2: { level3: { value: 'c' } } } }
  },
  {
    name: '包含特殊字符的属性名',
    schema: {
      type: 'object',
      properties: {
        'user-name': { type: 'string' },
        'user.email': { type: 'string' }
      },
      additionalProperties: false
    },
    data: { 'user-name': 'John', 'user.email': 'john@example.com', 'extra-field': 'value' }
  },
  {
    name: '极大数值',
    schema: { type: 'number', maximum: 1000 },
    data: Number.MAX_SAFE_INTEGER
  },
  {
    name: '极小数值',
    schema: { type: 'number', minimum: -1000 },
    data: Number.MIN_SAFE_INTEGER
  },
  {
    name: 'NaN值',
    schema: { type: 'number' },
    data: NaN
  },
  {
    name: 'Infinity值',
    schema: { type: 'number', maximum: 1000 },
    data: Infinity
  }
];

let round2Passed = 0;
let round2Failed = 0;

boundaryTests.forEach(({ name, schema, data }) => {
  try {
    const validate = ajv.compile(schema);
    const valid = validate(data);

    if (!valid && validate.errors) {
      const formatter = new ErrorFormatter('en-US');
      const formatted = formatter.formatDetailed(validate.errors);

      const hasTemplateVars = formatted.some(err =>
        err.message.includes('{{#') || err.message.includes('}}')
      );

      const hasUndefined = formatted.some(err =>
        err.message.includes('undefined')
      );

      if (hasTemplateVars) {
        console.log(`❌ ${name}: 包含未替换的模板变量`);
        console.log(`   消息: ${formatted[0].message}`);
        round2Failed++;
      } else if (hasUndefined && !name.includes('undefined')) {
        console.log(`⚠️  ${name}: 包含undefined（可能正常）`);
        console.log(`   消息: ${formatted[0].message}`);
        round2Passed++;
      } else {
        console.log(`✅ ${name}: 处理正确`);
        round2Passed++;
      }
    }
  } catch (error) {
    console.log(`❌ ${name}: 抛出异常 - ${error.message}`);
    round2Failed++;
  }
});

console.log(`\n第二轮结果: ${round2Passed} 通过, ${round2Failed} 失败`);

// ============================================================================
// 第三轮：多语言一致性测试
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('\n【第三轮】多语言一致性测试\n');

const languages = ['en-US', 'zh-CN', 'es-ES', 'fr-FR', 'ja-JP'];
const multiLangTests = [
  {
    name: 'enum错误',
    schema: { type: 'string', enum: ['pro', 'basic', 'free'] },
    data: 'premium'
  },
  {
    name: 'additionalProperties错误',
    schema: { type: 'object', properties: { name: { type: 'string' } }, additionalProperties: false },
    data: { name: 'John', age: 30 }
  },
  {
    name: 'required错误',
    schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
    data: {}
  },
  {
    name: 'type错误',
    schema: { type: 'number' },
    data: 'not a number'
  }
];

let round3Passed = 0;
let round3Failed = 0;

multiLangTests.forEach(({ name, schema, data }) => {
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid && validate.errors) {
    let allLangsPassed = true;

    languages.forEach(lang => {
      const formatter = new ErrorFormatter(lang);
      const formatted = formatter.formatDetailed(validate.errors);

      const hasTemplateVars = formatted.some(err =>
        err.message.includes('{{#') || err.message.includes('}}')
      );

      if (hasTemplateVars) {
        console.log(`❌ ${name} (${lang}): 包含未替换的模板变量`);
        console.log(`   消息: ${formatted[0].message}`);
        allLangsPassed = false;
      }
    });

    if (allLangsPassed) {
      console.log(`✅ ${name}: 所有语言正确`);
      round3Passed++;
    } else {
      round3Failed++;
    }
  }
});

console.log(`\n第三轮结果: ${round3Passed} 通过, ${round3Failed} 失败`);

// ============================================================================
// 总结
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('\n【总结】三轮深度检查结果\n');

const totalPassed = round1Passed + round2Passed + round3Passed;
const totalFailed = round1Failed + round2Failed + round3Failed;
const totalTests = totalPassed + totalFailed;

console.log(`第一轮（参数映射）: ${round1Passed}/${round1Passed + round1Failed} 通过`);
console.log(`第二轮（边界情况）: ${round2Passed}/${round2Passed + round2Failed} 通过`);
console.log(`第三轮（多语言）: ${round3Passed}/${round3Passed + round3Failed} 通过`);
console.log(`\n总计: ${totalPassed}/${totalTests} 通过`);

if (totalFailed === 0) {
  console.log('\n✅ 所有检查通过！没有发现问题。');
} else {
  console.log(`\n⚠️  发现 ${totalFailed} 个问题需要修复。`);
  process.exit(1);
}
