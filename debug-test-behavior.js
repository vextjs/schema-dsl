const { dsl, validate } = require('./index');

// 测试1：数组items
console.log('=== 测试数组items ===');
const schema1 = dsl({
    items: [{
        id: 'integer!',
        name: 'string!'
    }]
});
console.log('Schema:', JSON.stringify(schema1, null, 2));

const result1 = validate(schema1, {
    items: [
        { id: 1, name: 'Item1' },
        { id: 2, name: 'Item2' }
    ]
});
console.log('Valid data result:', result1.valid, result1.errors);

const result2 = validate(schema1, {
    items: [
        { id: 1 } // 缺少 name
    ]
});
console.log('Missing name result:', result2.valid, result2.errors);

// 测试2：If with undefined else
console.log('\n=== 测试If with undefined else ===');
const schema2 = dsl({
    is_active: 'boolean',
    status: dsl.if('is_active',
        'string:active',
        undefined
    )
});
console.log('Schema:', JSON.stringify(schema2, null, 2));

const result3 = validate(schema2, { is_active: true, status: 'active' });
console.log('is_active=true, status=active:', result3.valid, result3.errors);

const result4 = validate(schema2, { is_active: false });
console.log('is_active=false, no status:', result4.valid, result4.errors);

const result5 = validate(schema2, { is_active: false, status: 'anything' });
console.log('is_active=false, status=anything:', result5.valid, result5.errors);
