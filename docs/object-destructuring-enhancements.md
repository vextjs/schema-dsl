# 对象解构风格功能增强建议

对象解构风格是SchemoIO库中最简洁、最接近原生JavaScript的Schema定义方式。虽然它已经能够满足基本需求，但还有一些可能的改进点，可以进一步增强其功能和灵活性。

## 当前限制

目前的对象解构风格实现有以下限制：

1. **无法定义复杂约束**：无法直接指定最小/最大长度、必填等约束
2. **类型推断有限**：只能推断基本类型，无法推断更复杂的类型（如Email、URL等）
3. **不支持默认值**：无法指定字段的默认值
4. **不支持条件验证**：无法定义基于其他字段的条件验证规则
5. **空数组处理**：空数组被推断为包含`any`类型的数组，无法直接指定空数组的项类型

## 建议的增强功能

### 1. 特殊值约定

可以引入特殊值约定，通过特定的值格式来表示额外的约束：

```javascript
const schema = require('schemoio/modern').schema;

const userSchema = schema({
    // 使用特殊格式的字符串表示必填字段
    username: "!用户名",  // 前缀!表示必填
    
    // 使用特殊格式的字符串表示长度约束
    password: "密码(8-32)",  // 括号内表示长度范围
    
    // 使用特殊格式的数字表示范围约束
    age: [18, 120],  // 数组表示范围[最小值, 最大值]
    
    // 使用特殊格式的字符串表示类型
    email: "email:example@example.com",  // 前缀email:表示Email类型
    url: "url:https://example.com",      // 前缀url:表示URL类型
    
    // 使用特殊格式的数组表示枚举
    status: ["active", "inactive", "pending"]  // 数组表示枚举值
});
```

### 2. 元数据对象

可以引入元数据对象，通过特定的属性名来表示额外的约束：

```javascript
const schema = require('schemoio/modern').schema;

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
    
    // 使用元数据对象表示数组
    tags: {
        $example: ["标签1", "标签2"],  // 示例值
        $minItems: 1,                // 最小项数
        $maxItems: 10                // 最大项数
    }
});
```

### 3. 注释约定

可以引入注释约定，通过特定的注释格式来表示额外的约束：

```javascript
const schema = require('schemoio/modern').schema;

// 使用JSDoc风格的注释
const userSchema = schema({
    /**
     * @type {string}
     * @required
     * @min 3
     * @max 32
     */
    username: "用户名",
    
    /**
     * @type {number}
     * @min 18
     * @max 120
     */
    age: 25,
    
    /**
     * @type {array}
     * @items string
     * @minItems 1
     * @maxItems 10
     */
    tags: ["标签"]
});
```

### 4. 混合模式增强

可以增强当前的混合模式，使其更加灵活：

```javascript
const { schema, t } = require('schemoio/modern');

const userSchema = schema({
    // 简单字段使用对象解构风格
    username: "用户名",
    
    // 复杂字段使用其他风格，但保留示例值
    email: {
        $example: "example@example.com",
        $schema: t.string.required(5, 100)
    },
    
    // 数组使用混合风格
    tags: {
        $example: ["标签1", "标签2"],
        $schema: t.array(t.string.required(1, 20))
    }
});
```

### 5. 类型推断增强

可以增强类型推断能力，支持更多的类型：

```javascript
const schema = require('schemoio/modern').schema;

const userSchema = schema({
    // 自动推断为Email类型
    email: "user@example.com",
    
    // 自动推断为URL类型
    website: "https://example.com",
    
    // 自动推断为日期类型
    birthDate: "1990-01-01",
    
    // 自动推断为正则表达式类型
    pattern: /^[a-z]+$/
});
```

### 6. 默认值支持

可以添加对默认值的支持：

```javascript
const schema = require('schemoio/modern').schema;

const userSchema = schema({
    // 使用特殊格式表示默认值
    status: {
        $example: "active",
        $default: "pending"
    },
    
    // 使用特殊格式表示默认值
    createdAt: {
        $example: "2023-01-01",
        $default: "now()"  // 特殊值表示当前时间
    }
});
```

### 7. 条件验证支持

可以添加对条件验证的支持：

```javascript
const schema = require('schemoio/modern').schema;

const paymentSchema = schema({
    // 基本字段
    type: "credit_card",  // 支付类型
    
    // 条件字段
    creditCardNumber: {
        $example: "1234567890123456",
        $when: {
            field: "type",
            is: "credit_card",
            then: { $required: true, $pattern: /^\d{16}$/ }
        }
    },
    
    bankAccount: {
        $example: "1234567890",
        $when: {
            field: "type",
            is: "bank_transfer",
            then: { $required: true, $pattern: /^\d{10,12}$/ }
        }
    }
});
```

## 实现建议

以上增强功能可以分阶段实现：

### 第一阶段：基本增强

1. **特殊值约定**：实现最基本的特殊值约定，如前缀`!`表示必填
2. **类型推断增强**：增强对常见格式的推断，如Email、URL、日期等
3. **空数组处理改进**：允许通过特殊语法指定空数组的项类型

### 第二阶段：高级增强

1. **元数据对象**：实现元数据对象支持，允许通过特定属性名指定约束
2. **混合模式增强**：改进混合模式，使其更加灵活
3. **默认值支持**：添加对默认值的支持

### 第三阶段：完整增强

1. **注释约定**：实现注释约定支持
2. **条件验证支持**：添加对条件验证的支持
3. **高级类型推断**：实现更复杂的类型推断

## 结论

对象解构风格是SchemoIO库中最简洁、最接近原生JavaScript的Schema定义方式。通过以上建议的增强功能，可以进一步提高其表达能力和灵活性，使其在保持简洁性的同时，能够满足更复杂的需求。

这些增强功能应该保持可选性，不影响现有的简洁用法，用户可以根据需要选择使用或不使用这些高级功能。