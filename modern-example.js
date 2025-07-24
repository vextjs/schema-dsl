/**
 * schemoio 现代风格使用示例
 * 展示更符合现代JavaScript风格的Schema定义方式
 */

const { t, f, pipe, schema, c } = require('./lib/modern');

// 示例1: 标签对象风格
console.log('\n=== 标签对象风格 ===');
const userSchema1 = {
    username: t.string.required(3, 32),
    age: t.number(18, 120),
    tags: t.array(t.string(1, 10)),
    profile: {
        bio: t.string(0, 500),
        skills: t.array(t.string())
    }
};
console.log(JSON.stringify(userSchema1, null, 2));

// 示例2: 函数式管道风格
console.log('\n=== 函数式管道风格 ===');
const userSchema2 = {
    username: pipe(f.string(), f.min(3), f.max(32), f.required)({}),
    age: pipe(f.number(), f.min(18), f.max(120))({}),
    tags: pipe(f.array(), f.of(pipe(f.string(), f.min(1), f.max(10))({}))({})),
    profile: {
        bio: pipe(f.string(), f.max(500))({}),
        skills: pipe(f.array(), f.of(f.string())({}))({})
    }
};
console.log(JSON.stringify(userSchema2, null, 2));

// 示例3: 对象解构风格
console.log('\n=== 对象解构风格 ===');
// 这种风格通过对象字面量直接推断类型
const userSchemaTemplate = {
    username: "用户名", // 字符串类型
    age: 25,           // 数字类型
    isActive: true,    // 布尔类型
    tags: ["标签"],     // 字符串数组
    profile: {         // 嵌套对象
        bio: "简介",
        skills: ["技能"]
    }
};
const userSchema3 = schema(userSchemaTemplate);
console.log(JSON.stringify(userSchema3, null, 2));

// 示例4: 改进的链式API风格
console.log('\n=== 改进的链式API风格 ===');
const userSchema4 = {
    username: c.string.range(3, 32).required(),
    age: c.number.range(18, 120).end(),
    tags: c.array.of(c.string.range(1, 10).end()).end(),
    profile: c.object.props({
        bio: c.string.max(500).end(),
        skills: c.array.of(c.string.end()).end()
    }).end()
};
console.log(JSON.stringify(userSchema4, null, 2));

// 比较不同风格的代码量和可读性
console.log('\n=== 现代风格比较 ===');
console.log('1. 标签对象风格: username: t.string.required(3, 32)');
console.log('2. 函数式管道风格: username: pipe(f.string(), f.min(3), f.max(32), f.required)({})');
console.log('3. 对象解构风格: 从 username: "用户名" 推断为 { type: "string" }');
console.log('4. 改进链式API: username: c.string.range(3, 32).required()');

// 与传统风格比较
console.log('\n=== 与传统风格比较 ===');
console.log('传统DSL风格: username: DSL(\'string(3,32)!\')');
console.log('现代标签风格: username: t.string.required(3, 32)');