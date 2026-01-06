/**
 * 测试当前 number 类型支持的语法
 */
const { dsl, validate } = require('../../index');

console.log('=== 测试当前 number 类型支持的语法 ===\n');

// 1. 测试范围语法 (min-max)
console.log('1. 范围语法 number:0-100');
const result1_valid = validate(dsl({ age: 'number:0-100' }), { age: 50 });
const result1_invalid = validate(dsl({ age: 'number:0-100' }), { age: 150 });
console.log('验证 50:', result1_valid.valid);
console.log('验证 150:', result1_invalid.valid);
console.log('');

// 2. 测试单边范围 (min-)
console.log('2. 单边范围 number:18-');
const result2_valid = validate(dsl({ age: 'number:18-' }), { age: 20 });
const result2_invalid = validate(dsl({ age: 'number:18-' }), { age: 10 });
console.log('验证 20:', result2_valid.valid);
console.log('验证 10:', result2_invalid.valid);
console.log('');

// 3. 测试单边范围 (-max)
console.log('3. 单边范围 number:-100');
const result3_valid = validate(dsl({ score: 'number:-100' }), { score: 50 });
const result3_invalid = validate(dsl({ score: 'number:-100' }), { score: 150 });
console.log('验证 50:', result3_valid.valid);
console.log('验证 150:', result3_invalid.valid);
console.log('');

// 4. 测试单个值 (max)
console.log('4. 单个值 number:100');
const result4_valid = validate(dsl({ count: 'number:100' }), { count: 50 });
const result4_invalid = validate(dsl({ count: 'number:100' }), { count: 150 });
console.log('验证 50:', result4_valid.valid);
console.log('验证 150:', result4_invalid.valid);
console.log('');

// 5. 尝试测试比较运算符 (>)
console.log('5. 尝试比较运算符 number:>0');
try {
  const schema5 = dsl({ value: 'number:>0' });
  const result5_valid = validate(schema5, { value: 5 });
  const result5_invalid = validate(schema5, { value: -5 });
  console.log('验证 5:', result5_valid.valid);
  console.log('验证 -5:', result5_invalid.valid);
  if (!result5_valid.valid || result5_invalid.valid) {
    console.log('⚠️  语法被解析但行为不符合预期');
  }
} catch (err) {
  console.log('❌ 不支持此语法，错误:', err.message);
}
console.log('');

// 6. 尝试测试比较运算符 (<)
console.log('6. 尝试比较运算符 number:<100');
try {
  const schema6 = dsl({ value: 'number:<100' });
  const result6_valid = validate(schema6, { value: 50 });
  const result6_invalid = validate(schema6, { value: 150 });
  console.log('验证 50:', result6_valid.valid);
  console.log('验证 150:', result6_invalid.valid);
  if (!result6_valid.valid || result6_invalid.valid) {
    console.log('⚠️  语法被解析但行为不符合预期');
  }
} catch (err) {
  console.log('❌ 不支持此语法，错误:', err.message);
}
console.log('');

// 7. 尝试测试比较运算符 (>=)
console.log('7. 尝试比较运算符 number:>=18');
try {
  const schema7 = dsl({ age: 'number:>=18' });
  const result7_valid = validate(schema7, { age: 20 });
  const result7_invalid = validate(schema7, { age: 17 });
  console.log('验证 20:', result7_valid.valid);
  console.log('验证 17:', result7_invalid.valid);
  if (!result7_valid.valid || result7_invalid.valid) {
    console.log('⚠️  语法被解析但行为不符合预期');
  }
} catch (err) {
  console.log('❌ 不支持此语法，错误:', err.message);
}
console.log('');

// 8. 尝试测试比较运算符 (=)
console.log('8. 尝试比较运算符 number:=100');
try {
  const schema8 = dsl({ score: 'number:=100' });
  const result8_valid = validate(schema8, { score: 100 });
  const result8_invalid = validate(schema8, { score: 99 });
  console.log('验证 100:', result8_valid.valid);
  console.log('验证 99:', result8_invalid.valid);
  if (!result8_valid.valid || result8_invalid.valid) {
    console.log('⚠️  语法被解析但行为不符合预期');
  }
} catch (err) {
  console.log('❌ 不支持此语法，错误:', err.message);
}
console.log('');

console.log('=== 总结 ===');
console.log('当前支持的语法：');
console.log('  ✅ number:0-100     (范围: 最小-最大)');
console.log('  ✅ number:18-       (最小值:18，无上限)');
console.log('  ✅ number:-100      (最大值:100，无下限)');
console.log('  ✅ number:100       (最大值:100)');
console.log('');
console.log('不支持的语法（需要实现）：');
console.log('  ❌ number:>0        (大于0)');
console.log('  ❌ number:<100      (小于100)');
console.log('  ❌ number:>=18      (大于等于18)');
console.log('  ❌ number:<=100     (小于等于100)');
console.log('  ❌ number:=100      (等于100)');

