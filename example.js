/**
 * schemoio 使用示例
 * 展示多种风格的Schema定义方式
 */

const { DSL, s, $, _, processSchema } = require('./lib/dsl');

// 示例1: 原始DSL风格 (向后兼容)
console.log('\n=== 原始DSL风格 ===');
const userSchema1 = {
    username: DSL('string(3,32)!'),
    age: DSL('number(18,120)'),
    tags: DSL('array<string(1,10)>'),
    profile: {
        bio: DSL('string(0,500)'),
        skills: DSL('array<string>')
    }
};
console.log(JSON.stringify(processSchema(userSchema1), null, 2));

// 示例2: 模板字符串标签函数风格
console.log('\n=== 模板字符串标签函数风格 ===');
const userSchema2 = {
    username: s`string(3,32)!`,
    age: s`number(18,120)`,
    tags: s`array<string(1,10)>`,
    profile: {
        bio: s`string(0,500)`,
        skills: s`array<string>`
    }
};
console.log(JSON.stringify(processSchema(userSchema2), null, 2));

// 示例3: Proxy对象风格
console.log('\n=== Proxy对象风格 ===');
const userSchema3 = {
    username: $.string.min(3).max(32).required,
    age: $.number.min(18).max(120),
    tags: $.array.of($.string.min(1).max(10)),
    profile: {
        bio: $.string.max(500),
        skills: $.array.of($.string)
    }
};
console.log(JSON.stringify(userSchema3, null, 2));

// 示例3.1: Proxy对象简写风格 (注意：这里使用了特殊的语法，需要在dsl.js中实现)
console.log('\n=== Proxy对象简写风格 ===');
const userSchema3_1 = {
    // 注意：这种语法在实际JavaScript中不能直接工作，这里只是概念演示
    // 实际实现需要使用 $.string['3-32'].required 或其他有效语法
    username: $.string['3-32'].required,
    age: $.number['18-120'],
    tags: $.array.of($.string['1-10']),
    profile: {
        bio: $.string['0-500'],
        skills: $.array.of($.string)
    }
};
console.log(JSON.stringify(userSchema3_1, null, 2));

// 示例4: 超简洁符号风格
console.log('\n=== 超简洁符号风格 ===');
const userSchema4 = {
    username: _('s:3-32!'),
    age: _('n:18-120'),
    tags: _('a<s:1-10>'),
    profile: {
        bio: _('s:0-500'),
        skills: _('a<s>')
    }
};
console.log(JSON.stringify(userSchema4, null, 2));

// 示例5: 函数式风格
console.log('\n=== 函数式风格 ===');
const userSchema5 = {
    username: _.string(3, 32, true),
    age: _.number(18, 120),
    tags: _.array(_.string(1, 10)),
    profile: {
        bio: _.string(0, 500),
        skills: _.array(_.string())
    }
};
console.log(JSON.stringify(userSchema5, null, 2));

// 比较不同风格的代码量和可读性
console.log('\n=== 风格比较 ===');
console.log('1. 原始DSL风格: username: DSL(\'string(3,32)!\')');
console.log('2. 模板字符串: username: s`string(3,32)!`');
console.log('3. Proxy对象: username: $.string.min(3).max(32).required');
console.log('4. Proxy简写: username: $.string[\'3-32\'].required');
console.log('5. 超简洁符号: username: _(\'s:3-32!\')');
console.log('6. 函数式: username: _.string(3, 32, true)');