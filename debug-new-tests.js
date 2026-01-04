const { dsl, validate } = require('./index');

console.log('\n=== 测试 1: condition 字段缺失 ===');
const schema1 = dsl({
    enabled: 'boolean',
    price: dsl.if('enabled', 'number:100-500', 'number:50-200')
});

console.log('\nSchema:', JSON.stringify(schema1, null, 2));

const data1 = { price: 400 };
console.log('\nData:', data1);
const result1 = validate(schema1, data1);
console.log('Result:', result1);
console.log('Expected: valid=false (400 超出 else 范围 50-200)');
console.log('Actual: valid=' + result1.valid);

console.log('\n\n=== 测试 2: then 和 else 类型不同 ===');
const schema2 = dsl({
    mode: 'string',
    type: 'string',
    is_vip: 'boolean',
    value: dsl.if('is_vip',
        dsl.match('type', {
            'A': dsl('integer:1-100!'),
            'B': dsl('integer:100-200!'),
            '_default': 'integer'
        }),
        dsl.if('mode',
            dsl('string:5-20!'),
            dsl('string:1-10')
        )
    )
});

console.log('\nSchema:', JSON.stringify(schema2, null, 2));

const data2a = { is_vip: false, mode: true, value: 'hello' };
console.log('\nData:', data2a);
const result2a = validate(schema2a, data2a);
console.log('Result:', result2a);
console.log('Expected: valid=false (string 类型不匹配 integer)');
console.log('Actual: valid=' + result2a.valid);

const data2b = { is_vip: false, mode: 'yes', value: 'hello world' };
console.log('\nData:', data2b);
const result2b = validate(schema2, data2b);
console.log('Result:', result2b);
console.log('Expected: valid=true (mode 为 truthy，string 长度在范围内)');
console.log('Actual: valid=' + result2b.valid);
