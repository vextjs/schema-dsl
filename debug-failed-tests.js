const { dsl, validate } = require('./index');

console.log('\n=== 测试 1: 空字段名 ===');
const schema1 = dsl({
    type: 'string',
    value: dsl.match('', { 'a': 'string', '_default': 'integer' })
});
console.log('Schema:', JSON.stringify(schema1, null, 2));
const result1 = validate(schema1, { type: 'a', '': 'a', value: 100 });
console.log('Result:', result1);
console.log('Expected: valid=true, Actual:', result1.valid);

console.log('\n\n=== 测试 2: 对象作为type值 ===');
const schema2 = dsl({
    type: 'string',
    metadata: 'object',
    value: dsl.match('type', {
        'complex': 'string:10-50',
        '_default': 'string'
    })
});
const result2 = validate(schema2, { type: { nested: 'obj' }, value: 'test' });
console.log('Result:', result2);
console.log('Expected: valid=true (type为对象，metadata验证失败), Actual:', result2.valid);

console.log('\n\n=== 测试 3: custom验证器在Match中 ===');
const schema3 = dsl({
    type: 'string',
    value: dsl.match('type', {
        'email': dsl('string!')
            .custom((value) => {
                if (!value.includes('@')) {
                    return { valid: false, message: '必须包含@符号' };
                }
                return { valid: true };
            }),
        '_default': 'string'
    })
});
const result3 = validate(schema3, { type: 'email', value: 'invalid-email' });
console.log('Result:', result3);
console.log('Expected: valid=false, Actual:', result3.valid);

console.log('\n\n=== 测试 4: 嵌套config.engine ===');
const schema4 = dsl({
    type: 'string',
    config: dsl.match('type', {
        'database': dsl.match('config.engine', {
            'mysql': {
                host: 'string!',
                port: 'integer:1-65535!',
                database: 'string!'
            },
            '_default': {
                connection_string: 'string!'
            }
        }),
        '_default': 'object'
    })
});
console.log('Schema:', JSON.stringify(schema4, null, 2));
const result4 = validate(schema4, {
    type: 'database',
    config: {
        engine: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'test_db'
    }
});
console.log('Result:', result4);
console.log('Expected: valid=true, Actual:', result4.valid);
