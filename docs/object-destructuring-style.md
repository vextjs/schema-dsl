# 对象解构风格详细说明

## 基本概念

对象解构风格是SchemoIO库中最接近原生JavaScript的Schema定义方式。它通过直接从对象字面量推断类型，几乎没有学习成本，使得Schema定义变得非常直观和简洁。

这种风格的核心思想是：**"用示例数据定义数据结构"**。您只需要提供一个包含示例值的对象，SchemoIO会自动根据这些值的类型推断出相应的Schema定义。

## 工作原理

对象解构风格通过`schema`函数实现，它接受一个对象字面量作为模板，然后根据值的类型推断出相应的Schema定义：

1. 对于**字符串**值，推断为`string`类型
2. 对于**数字**值，推断为`number`类型
3. 对于**布尔**值，推断为`boolean`类型
4. 对于**数组**值，推断为`array`类型，并使用数组的第一个元素作为数组项的类型
5. 对于**嵌套对象**，递归处理其属性，推断为`object`类型

## 基本用法

```javascript
const { schema } = require('schemoio/modern');

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
```

生成的Schema定义如下：

```javascript
{
  "username": { "type": "string" },
  "age": { "type": "number" },
  "isActive": { "type": "boolean" },
  "tags": { "type": "array", "items": { "type": "string" } },
  "profile": {
    "type": "object",
    "properties": {
      "bio": { "type": "string" },
      "skills": { "type": "array", "items": { "type": "string" } }
    }
  }
}
```

## 高级用法

### 混合使用其他风格

对象解构风格可以与其他风格混合使用，以便在需要更复杂约束的地方使用其他风格：

```javascript
const { schema, t } = require('schemoio/modern');

const mixedSchemaTemplate = {
    // 使用对象解构风格
    username: "张三",
    age: 25,

    // 使用标签对象风格定义更复杂的约束
    email: t.string.required(5, 100)
};

const mixedSchema = schema(mixedSchemaTemplate);
```

### 空数组处理

当定义一个空数组时，SchemoIO会将其推断为包含`any`类型的数组：

```javascript
const emptyArraySchema = schema({
    tags: []  // 推断为 { type: "array", items: { type: "any" } }
});
```

如果需要指定空数组的项类型，可以使用其他风格：

```javascript
const { schema, t } = require('schemoio/modern');

const arraySchema = schema({
    // 使用标签对象风格指定数组项类型
    tags: t.array(t.string())
});
```

### 复杂嵌套结构

对象解构风格可以处理任意深度的嵌套结构：

```javascript
const complexSchema = schema({
    user: {
        personal: {
            name: {
                first: "张",
                last: "三"
            },
            contact: {
                email: "zhangsan@example.com",
                phones: ["13800138000", "13900139000"]
            }
        },
        preferences: {
            theme: "dark",
            notifications: {
                email: true,
                sms: false
            }
        }
    }
});
```

## 使用场景

对象解构风格特别适合以下场景：

1. **快速原型开发**：当您需要快速定义数据结构而不关心复杂的验证规则时
2. **简单数据结构**：当您的数据结构相对简单，不需要复杂的约束条件时
3. **文档生成**：当您需要从示例数据生成文档或API规范时
4. **从现有数据推断Schema**：当您已经有示例数据，想要从中生成Schema定义时
5. **与非技术人员协作**：当您需要与不熟悉编程的人员协作定义数据结构时

## 优缺点

### 优点

1. **极低的学习成本**：几乎不需要学习任何新语法，使用原生JavaScript对象即可
2. **直观易读**：通过示例值直接展示数据结构，非常直观
3. **代码简洁**：不需要额外的API调用或特殊语法，代码量最少
4. **适合快速原型**：可以快速定义数据结构，加速开发过程
5. **易于理解**：即使对不熟悉编程的人也容易理解

### 缺点

基本的对象解构风格有以下限制（但大部分已通过增强功能解决，见下文"增强功能"部分）：

1. **表达能力有限**：基本形式无法直接定义复杂的约束条件（如最小/最大长度、必填等）
2. **类型推断有限**：基本形式只能推断基本类型，无法推断更复杂的类型（如Email、URL等）
3. **缺乏验证规则**：基本形式无法定义自定义验证规则
4. **不支持默认值**：基本形式无法指定字段的默认值
5. **不支持条件验证**：无法定义基于其他字段的条件验证规则

## 与其他风格的比较

| 特性 | 对象解构风格 | 标签对象风格 | 函数式管道风格 | 链式API风格 |
|------|------------|------------|--------------|-----------|
| 学习成本 | 极低 | 低 | 中 | 低 |
| 代码简洁度 | 极高 | 高 | 中 | 高 |
| 表达能力 | 低 | 高 | 高 | 高 |
| 类型安全 | 低 | 中 | 高 | 中 |
| 可读性 | 高 | 高 | 中 | 高 |
| 适合场景 | 快速原型 | 一般用途 | 复杂验证 | 一般用途 |

## 最佳实践

1. **混合使用不同风格**：在简单字段使用对象解构风格，在需要复杂约束的字段使用其他风格
2. **用于初始原型**：在项目初期使用对象解构风格快速定义数据结构，后期再根据需要添加更复杂的约束
3. **用于文档生成**：使用对象解构风格生成示例数据和文档
4. **与TypeScript结合**：结合TypeScript的类型定义，获得更好的类型安全性

## 示例代码

以下是一些对象解构风格的示例代码：

### 基本示例

```javascript
const { schema } = require('schemoio/modern');

const userSchema = schema({
    username: "用户名",
    age: 25,
    isActive: true
});
```

### 混合风格示例

```javascript
const { schema, t } = require('schemoio/modern');

const userSchema = schema({
    // 简单字段使用对象解构风格
    username: "用户名",
    age: 25,

    // 需要复杂约束的字段使用标签对象风格
    email: t.string.required(5, 100),
    password: t.string.required(8, 32)
});
```

### 复杂嵌套示例

```javascript
const { schema } = require('schemoio/modern');

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
    ]
});
```

## 增强功能

为了解决基本对象解构风格的限制，SchemoIO提供了一系列增强功能，使其在保持简洁性的同时，具备更强的表达能力。

### 特殊值约定

通过特定的值格式，可以直接在对象字面量中表示额外的约束：

#### 1. 必填字段（前缀!）

```javascript
const userSchema = schema({
    username: "!用户名"  // 前缀!表示必填字段
});
// 生成: { username: { type: "string", required: true } }
```

#### 2. 长度约束（格式：字符串(min-max)）

```javascript
const userSchema = schema({
    password: "密码(8-32)"  // 括号内表示长度范围
});
// 生成: { password: { type: "string", min: 8, max: 32 } }
```

#### 3. 数字范围约束（[min, max]数组）

```javascript
const userSchema = schema({
    age: [18, 120]  // 数组表示范围[最小值, 最大值]
});
// 生成: { age: { type: "number", min: 18, max: 120 } }
```

#### 4. 枚举值（字符串数组）

```javascript
const userSchema = schema({
    status: ["active", "inactive", "pending"]  // 数组表示枚举值
});
// 生成: { status: { type: "string", enum: ["active", "inactive", "pending"] } }
```

### 类型推断增强

增强的类型推断能力，可以自动识别更多的类型：

#### 1. 自动推断Email、URL、日期等格式

```javascript
const userSchema = schema({
    email: "user@example.com",        // 自动推断为Email格式
    website: "https://example.com",   // 自动推断为URL格式
    birthDate: "2000-01-01"           // 自动推断为日期格式
});
// 生成: 
// { 
//   email: { type: "string", format: "email" },
//   website: { type: "string", format: "url" },
//   birthDate: { type: "date" }
// }
```

#### 2. 类型前缀（如email:、url:、date:）

```javascript
const userSchema = schema({
    email: "email:contact@example.com",    // 显式指定Email类型
    website: "url:https://api.example.com" // 显式指定URL类型
});
```

#### 3. 正则表达式支持

```javascript
const userSchema = schema({
    zipCode: /^\d{5}$/,                  // 正则表达式模式
    phoneNumber: /^\d{3}-\d{3}-\d{4}$/   // 正则表达式模式
});
// 生成:
// {
//   zipCode: { type: "string", pattern: /^\d{5}$/ },
//   phoneNumber: { type: "string", pattern: /^\d{3}-\d{3}-\d{4}$/ }
// }
```

### 元数据对象

通过特定的属性名，可以在对象中定义更复杂的约束：

```javascript
const userSchema = schema({
    // 使用元数据对象表示约束
    username: {
        $example: "用户名",  // 示例值
        $required: true,    // 必填
        $min: 3,            // 最小长度
        $max: 32            // 最大长度
    },

    // 使用元数据对象表示数字范围
    age: {
        $example: 25,       // 示例值
        $min: 18,           // 最小值
        $max: 120           // 最大值
    },

    // 使用元数据对象表示默认值
    status: {
        $example: "active",
        $default: "pending"
    }
});
```

### 组合使用

这些增强功能可以组合使用，创建更复杂的Schema定义：

```javascript
const userSchema = schema({
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
```

## 结论

对象解构风格是SchemoIO库中最简洁、最接近原生JavaScript的Schema定义方式。它特别适合快速原型开发和简单数据结构的定义。通过增强功能，它不仅保持了简洁性，还具备了更强的表达能力，可以定义复杂的约束条件。

对于追求代码简洁性和开发速度的项目，对象解构风格是一个极佳的选择。
