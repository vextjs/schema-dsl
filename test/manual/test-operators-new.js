const { dsl, validate } = require('../../index');

console.log('=== 测试新实现的比较运算符 ===\n');

// 测试 >
console.log('1. 测试 number:>0');
const schema1 = dsl({ value: 'number:>0' });
console.log('Schema:', JSON.stringify(schema1, null, 2));
const r1_1 = validate(schema1, { value: 1 });
const r1_2 = validate(schema1, { value: 0 });
const r1_3 = validate(schema1, { value: -1 });
console.log('验证 1:', r1_1.valid, r1_1.errors || '');
console.log('验证 0:', r1_2.valid, r1_2.errors ?'(应该失败，0不满足>0)' : '');
console.log('验证 -1:', r1_3.valid, r1_3.errors ? '(应该失败)' : '');
console.log('');

// 测试 >=
console.log('2. 测试 number:>=18');
const schema2 = dsl({ age: 'number:>=18' });
console.log('Schema:', JSON.stringify(schema2, null, 2));
const r2_1 = validate(schema2, { age: 18 });
const r2_2 = validate(schema2, { age: 17 });
console.log('验证 18:', r2_1.valid);
console.log('验证 17:', r2_2.valid, r2_2.errors ? '(应该失败)' : '');
console.log('');

// 测试 <
console.log('3. 测试 number:<100');
const schema3 = dsl({ value: 'number:<100' });
console.log('Schema:', JSON.stringify(schema3, null, 2));
const r3_1 = validate(schema3, { value: 99 });
const r3_2 = validate(schema3, { value: 100 });
console.log('验证 99:', r3_1.valid);
console.log('验证 100:', r3_2.valid, r3_2.errors ? '(应该失败，100不满足<100)' : '');
console.log('');

// 测试 <=
console.log('4. 测试 number:<=100');
const schema4 = dsl({ score: 'number:<=100' });
console.log('Schema:', JSON.stringify(schema4, null, 2));
const r4_1 = validate(schema4, { score: 100 });
const r4_2 = validate(schema4, { score: 101 });
console.log('验证 100:', r4_1.valid);
console.log('验证 101:', r4_2.valid, r4_2.errors ? '(应该失败)' : '');
console.log('');

// 测试 =
console.log('5. 测试 number:=100');
const schema5 = dsl({ score: 'number:=100' });
console.log('Schema:', JSON.stringify(schema5, null, 2));
const r5_1 = validate(schema5, { score: 100 });
const r5_2 = validate(schema5, { score: 99 });
console.log('验证 100:', r5_1.valid);
console.log('验证 99:', r5_2.valid, r5_2.errors ? '(应该失败)' : '');
console.log('');

// 测试小数
console.log('6. 测试小数 number:>0.5');
const schema6 = dsl({ value: 'number:>0.5' });
console.log('Schema:', JSON.stringify(schema6, null, 2));
const r6_1 = validate(schema6, { value: 0.6 });
const r6_2 = validate(schema6, { value: 0.5 });
console.log('验证 0.6:', r6_1.valid);
console.log('验证 0.5:', r6_2.valid, r6_2.errors ? '(应该失败，0.5不满足>0.5)' : '');

