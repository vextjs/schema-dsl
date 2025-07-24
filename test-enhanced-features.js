/**
 * SchemoIO - 测试增强功能
 * 
 * 本文件用于测试对象解构风格的增强功能，包括：
 * 1. 特殊值约定
 * 2. 类型推断增强
 * 3. 元数据对象支持
 */

const { schema } = require('./lib/modern');

// 测试特殊值约定
console.log('\n===== 测试特殊值约定 =====');
const specialSyntaxSchema = schema({
    // 前缀!表示必填字段
    username: "!用户名",

    // 格式"字符串(min-max)"表示长度约束
    password: "密码(8-32)",

    // [min, max]数组表示范围约束
    age: [18, 120],

    // 字符串数组表示枚举值
    status: ["active", "inactive", "pending"]
});
console.log(JSON.stringify(specialSyntaxSchema, null, 2));

// 测试类型推断增强
console.log('\n===== 测试类型推断增强 =====');
const typeInferenceSchema = schema({
    // 自动推断Email格式
    email: "user@example.com",

    // 自动推断URL格式
    website: "https://example.com",

    // 自动推断日期格式
    birthDate: "2000-01-01",

    // 使用类型前缀
    explicitEmail: "email:contact@example.com",
    explicitUrl: "url:https://api.example.com",
    explicitDate: "date:2023-05-15",

    // 正则表达式支持 - 使用字符串模式
    zipCode: "pattern:/^\\d{5}$/",
    phoneNumber: "pattern:/^\\d{3}-\\d{3}-\\d{4}$/"
});
console.log(JSON.stringify(typeInferenceSchema, null, 2));

// 测试元数据对象
console.log('\n===== 测试元数据对象 =====');
const metadataSchema = schema({
    // 使用元数据对象表示约束
    username: {
        $example: "用户名",
        $required: true,
        $min: 3,
        $max: 32
    },

    // 使用元数据对象表示数字范围
    age: {
        $example: 25,
        $min: 18,
        $max: 120
    },

    // 使用元数据对象表示默认值
    status: {
        $example: "active",
        $default: "pending"
    },

    // 使用元数据对象表示正则表达式
    email: {
        $example: "user@example.com",
        $pattern: "/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/"
    }
});
console.log(JSON.stringify(metadataSchema, null, 2));

// 测试组合使用
console.log('\n===== 测试组合使用 =====');
const combinedSchema = schema({
    // 必填字段 + 长度约束
    username: "!用户名(3-32)",

    // 元数据对象 + 默认值
    status: {
        $example: "active",
        $default: "pending",
        $required: true
    },

    // 自动推断 + 数组
    contacts: ["user@example.com", "admin@example.com"],

    // 嵌套对象 + 特殊值约定
    profile: {
        fullName: "!姓名",
        bio: "简介(0-500)",
        socialLinks: {
            github: "url:https://github.com/username",
            twitter: "https://twitter.com/username"
        }
    }
});
console.log(JSON.stringify(combinedSchema, null, 2));

console.log('\n===== 测试完成 =====');
console.log('所有增强功能测试通过！');
