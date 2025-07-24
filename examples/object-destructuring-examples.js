/**
 * SchemoIO - 对象解构风格示例
 * 
 * 本文件展示了对象解构风格的各种用法，包括：
 * 1. 基本用法
 * 2. 混合风格
 * 3. 空数组处理
 * 4. 复杂嵌套结构
 * 5. 实际应用场景
 */

const { schema, t, c } = require('../lib/modern');

// ===== 1. 基本用法 =====
console.log('\n===== 1. 基本用法 =====');

// 使用对象字面量定义Schema
const userSchemaTemplate = {
    username: "张三",        // 字符串类型
    age: 25,                // 数字类型
    isActive: true,         // 布尔类型
    tags: ["前端", "后端"],   // 字符串数组
    profile: {              // 嵌套对象
        bio: "全栈开发者",
        skills: ["JavaScript", "Node.js"]
    }
};

// 转换为Schema定义
const userSchema = schema(userSchemaTemplate);
console.log(JSON.stringify(userSchema, null, 2));

// ===== 2. 混合风格 =====
console.log('\n===== 2. 混合风格 =====');

// 混合使用对象解构风格和其他风格
const mixedSchemaTemplate = {
    // 使用对象解构风格定义简单字段
    username: "张三",
    age: 25,

    // 使用标签对象风格定义需要复杂约束的字段
    email: t.string.required(5, 100),
    password: t.string.required(8, 32),

    // 使用链式API风格定义数组
    roles: c.array.of(c.string.end()).end()
};

const mixedSchema = schema(mixedSchemaTemplate);
console.log(JSON.stringify(mixedSchema, null, 2));

// ===== 3. 空数组处理 =====
console.log('\n===== 3. 空数组处理 =====');

// 空数组会被推断为包含any类型的数组
const emptyArraySchema = schema({
    emptyTags: []  // 推断为 { type: "array", items: { type: "any" } }
});
console.log("空数组Schema:", JSON.stringify(emptyArraySchema, null, 2));

// 使用其他风格指定空数组的项类型
const typedEmptyArraySchema = schema({
    // 使用标签对象风格指定数组项类型
    stringTags: t.array(t.string()),

    // 使用链式API风格指定数组项类型
    numberTags: c.array.of(c.number.end()).end()
});
console.log("指定类型的空数组Schema:", JSON.stringify(typedEmptyArraySchema, null, 2));

// ===== 4. 复杂嵌套结构 =====
console.log('\n===== 4. 复杂嵌套结构 =====');

// 对象解构风格可以处理任意深度的嵌套结构
const productSchema = schema({
    name: "产品名称",
    price: 99.99,
    inStock: true,
    categories: ["电子产品", "配件"],
    specs: {
        dimensions: {
            width: 10,
            height: 5,
            depth: 2
        },
        weight: 0.5,
        colors: ["黑色", "白色", "金色"]
    },
    reviews: [
        {
            user: "用户1",
            rating: 5,
            comment: "很好用",
            date: "2023-01-01"
        }
    ],
    variants: [
        {
            sku: "SKU001",
            color: "黑色",
            price: 99.99,
            images: ["image1.jpg", "image2.jpg"]
        }
    ]
});
console.log(JSON.stringify(productSchema, null, 2));

// ===== 5. 实际应用场景 =====
console.log('\n===== 5. 实际应用场景 =====');

// 场景1: API响应数据结构定义
const apiResponseSchema = schema({
    code: 200,
    message: "success",
    data: {
        users: [
            {
                id: 1,
                name: "张三",
                email: "zhangsan@example.com"
            }
        ],
        pagination: {
            total: 100,
            page: 1,
            pageSize: 10
        }
    }
});
console.log("API响应Schema:", JSON.stringify(apiResponseSchema, null, 2));

// 场景2: 配置文件结构定义
const configSchema = schema({
    app: {
        name: "MyApp",
        version: "1.0.0",
        debug: true
    },
    server: {
        port: 3000,
        host: "localhost",
        timeout: 5000
    },
    database: {
        type: "mongodb",
        url: "mongodb://localhost:27017",
        name: "mydb",
        options: {
            poolSize: 10,
            useNewUrlParser: true
        }
    },
    logging: {
        level: "info",
        file: "logs/app.log",
        console: true
    }
});
console.log("配置文件Schema:", JSON.stringify(configSchema, null, 2));

// 场景3: 从JSON数据生成Schema
const jsonData = {
    "id": 123,
    "title": "新产品",
    "description": "这是一个新产品",
    "price": 99.99,
    "categories": ["电子", "家电"],
    "metadata": {
        "created": "2023-01-01",
        "updated": "2023-01-02",
        "views": 1000
    }
};

// 从JSON数据生成Schema
const jsonSchema = schema(jsonData);
console.log("从JSON数据生成的Schema:", JSON.stringify(jsonSchema, null, 2));

// ===== 6. 与数据库转换 =====
console.log('\n===== 6. 与数据库转换 =====');

// 导入数据库转换函数
const { toMongoDB, toMySQL, toPostgreSQL } = require('../index');

// 定义一个简单的Schema
const simpleSchema = schema({
    name: "产品名称",
    price: 99.99,
    inStock: true,
    tags: ["标签1", "标签2"]
});

// 转换为MongoDB Schema
const mongoSchema = toMongoDB(simpleSchema);
console.log("MongoDB Schema:", JSON.stringify(mongoSchema, null, 2));

// 转换为MySQL Schema
const mysqlSchema = toMySQL(simpleSchema);
console.log("MySQL Schema:", mysqlSchema);

// 转换为PostgreSQL Schema
const pgSchema = toPostgreSQL(simpleSchema);
console.log("PostgreSQL Schema:", pgSchema);

// ===== 7. 与验证结合 =====
console.log('\n===== 7. 与验证结合 =====');

// 导入验证函数
const { validate } = require('../index');

// 定义一个Schema
const productValidationSchema = schema({
    name: "产品名称",
    price: 99.99,
    inStock: true
});

// 有效数据
const validData = {
    name: "iPhone",
    price: 999.99,
    inStock: true
};

// 无效数据 (price是字符串而不是数字)
const invalidData = {
    name: "iPhone",
    price: "999.99", // 应该是数字
    inStock: true
};

// 验证有效数据
const validResult = validate(productValidationSchema, validData);
console.log("有效数据验证结果:", validResult);

// 验证无效数据
const invalidResult = validate(productValidationSchema, invalidData);
console.log("无效数据验证结果:", invalidResult);

// ===== 8. 增强功能示例 =====
console.log('\n===== 8. 增强功能示例 =====');

// 8.1 特殊值约定
console.log('\n--- 8.1 特殊值约定 ---');

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

console.log("特殊值约定Schema:", JSON.stringify(specialSyntaxSchema, null, 2));

// 8.2 类型推断增强
console.log('\n--- 8.2 类型推断增强 ---');

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

    // 正则表达式支持
    zipCode: /^\d{5}$/,
    phoneNumber: /^\d{3}-\d{3}-\d{4}$/
});

console.log("类型推断增强Schema:", JSON.stringify(typeInferenceSchema, null, 2));

// 8.3 元数据对象
console.log('\n--- 8.3 元数据对象 ---');

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
        $pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
});

console.log("元数据对象Schema:", JSON.stringify(metadataSchema, null, 2));

// 8.4 组合使用
console.log('\n--- 8.4 组合使用 ---');

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

console.log("组合使用Schema:", JSON.stringify(combinedSchema, null, 2));
