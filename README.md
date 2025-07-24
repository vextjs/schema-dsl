# SchemoIO

SchemoIO是一个轻量级的Node.js库，用于在应用层定义统一的数据模式(Schema)，并生成与MongoDB、MySQL、PostgreSQL等数据库兼容的Schema。它支持灵活的转换和扩展，简化跨数据库开发。

## 特点

- **多种风格的Schema定义**：支持多种简洁优雅的DSL风格，包括现代JavaScript风格
- **跨数据库兼容**：将应用层Schema转换为各种数据库格式
- **灵活的验证规则**：支持类型、范围、必填等多种验证规则
- **嵌套对象和数组**：支持复杂的数据结构定义
- **轻量级设计**：核心功能简洁高效

## 安装

```bash
npm install schemoio
```

## 使用方式

SchemoIO提供多种风格的Schema定义方式，您可以选择最适合自己的风格：

### 传统风格

#### 1. 原始DSL风格

最基本的DSL风格，使用字符串表达式定义Schema：

```javascript
const { DSL, processSchema } = require('schemoio');

const userSchema = {
    username: DSL('string(3,32)!'),
    age: DSL('number(18,120)'),
    tags: DSL('array<string(1,10)>'),
    profile: {
        bio: DSL('string(0,500)'),
        skills: DSL('array<string>')
    }
};

// 处理Schema
const processedSchema = processSchema(userSchema);
```

#### 2. 模板字符串标签函数风格

使用ES6模板字符串标签函数，语法更简洁：

```javascript
const { s, processSchema } = require('schemoio');

const userSchema = {
    username: s`string(3,32)!`,
    age: s`number(18,120)`,
    tags: s`array<string(1,10)>`,
    profile: {
        bio: s`string(0,500)`,
        skills: s`array<string>`
    }
};
```

#### 3. Proxy对象风格

使用链式API，更接近原生JavaScript：

```javascript
const { $ } = require('schemoio');

const userSchema = {
    username: $.string.min(3).max(32).required,
    age: $.number.min(18).max(120),
    tags: $.array.of($.string.min(1).max(10)),
    profile: {
        bio: $.string.max(500),
        skills: $.array.of($.string)
    }
};
```

#### 4. Proxy对象简写风格

更简洁的链式API：

```javascript
const { $ } = require('schemoio');

const userSchema = {
    username: $.string['3-32'].required,
    age: $.number['18-120'],
    tags: $.array.of($.string['1-10']),
    profile: {
        bio: $.string['0-500'],
        skills: $.array.of($.string)
    }
};
```

#### 5. 超简洁符号风格

使用简短的符号表示类型和约束：

```javascript
const { _ } = require('schemoio');

const userSchema = {
    username: _('s:3-32!'),
    age: _('n:18-120'),
    tags: _('a<s:1-10>'),
    profile: {
        bio: _('s:0-500'),
        skills: _('a<s>')
    }
};
```

#### 6. 函数式风格

使用函数调用定义Schema：

```javascript
const { _ } = require('schemoio');

const userSchema = {
    username: _.string(3, 32, true),
    age: _.number(18, 120),
    tags: _.array(_.string(1, 10)),
    profile: {
        bio: _.string(0, 500),
        skills: _.array(_.string())
    }
};
```

### 现代风格

#### 1. 标签对象风格

使用ES6+的标签对象和计算属性名，更简洁直观：

```javascript
const { t } = require('schemoio/modern');

const userSchema = {
    username: t.string.required(3, 32),
    age: t.number(18, 120),
    tags: t.array(t.string(1, 10)),
    profile: {
        bio: t.string(0, 500),
        skills: t.array(t.string())
    }
};
```

#### 2. 函数式管道风格

使用函数组合和管道操作，更函数式：

```javascript
const { f, pipe } = require('schemoio/modern');

const userSchema = {
    username: pipe(f.string(), f.min(3), f.max(32), f.required)({}),
    age: pipe(f.number(), f.min(18), f.max(120))({}),
    tags: pipe(f.array(), f.of(pipe(f.string(), f.min(1), f.max(10))({}))({})),
    profile: {
        bio: pipe(f.string(), f.max(500))({}),
        skills: pipe(f.array(), f.of(f.string())({}))({})
    }
};
```

#### 3. 对象解构风格

直接从对象字面量推断类型，最接近原生JavaScript：

```javascript
const { schema } = require('schemoio/modern');

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
const userSchema = schema(userSchemaTemplate);
```

对象解构风格的核心思想是**"用示例数据定义数据结构"**。它通过分析对象字面量中的值类型自动推断Schema：
- 字符串值 → `string`类型
- 数字值 → `number`类型
- 布尔值 → `boolean`类型
- 数组值 → `array`类型（使用第一个元素推断数组项类型）
- 嵌套对象 → 递归处理为`object`类型

**增强功能**：对象解构风格现在支持更多高级特性：

```javascript
const enhancedSchema = schema({
    username: "!用户名(3-32)",         // 前缀!表示必填，(3-32)表示长度范围
    age: [18, 120],                   // 数组表示范围约束
    email: "user@example.com",        // 自动推断为Email格式
    status: ["active", "inactive"],   // 字符串数组表示枚举值
    profile: {
        $example: "示例值",            // 元数据对象支持
        $required: true,
        $min: 3,
        $max: 100
    }
});
```

这种风格特别适合：
- **快速原型开发**：无需关心复杂验证规则
- **从现有数据生成Schema**：可直接使用JSON数据
- **与非技术人员协作**：易于理解的数据结构定义

[查看详细文档](./docs/object-destructuring-style.md) | [查看更多示例](./examples/object-destructuring-examples.js)

#### 4. 改进的链式API风格

更现代的链式API设计，语义更清晰：

```javascript
const { c } = require('schemoio/modern');

const userSchema = {
    username: c.string.range(3, 32).required(),
    age: c.number.range(18, 120).end(),
    tags: c.array.of(c.string.range(1, 10).end()).end(),
    profile: c.object.props({
        bio: c.string.max(500).end(),
        skills: c.array.of(c.string.end()).end()
    }).end()
};
```

## 各种风格的比较

### 传统风格

| 风格 | 示例 | 优点 | 缺点 |
|------|------|------|------|
| 原始DSL | `DSL('string(3,32)!')` | 简洁，表达能力强 | 需要学习特定语法 |
| 模板字符串 | ``s`string(3,32)!` `` | 语法更简洁，无需引号 | 仍需学习特定语法 |
| Proxy对象 | `$.string.min(3).max(32).required` | 接近原生JS，易读 | 代码较长 |
| Proxy简写 | `$.string['3-32'].required` | 比完整链式API更简洁 | 特殊语法，可能不直观 |
| 超简洁符号 | `_('s:3-32!')` | 极简，代码量最少 | 需要记忆符号含义 |
| 函数式 | `_.string(3, 32, true)` | 直观，类型安全 | 代码量较大 |

### 现代风格

| 风格 | 示例 | 优点 | 缺点 |
|------|------|------|------|
| 标签对象 | `t.string.required(3, 32)` | 简洁直观，接近自然语言 | 需要理解标签对象概念 |
| 函数式管道 | `pipe(f.string(), f.min(3), f.max(32), f.required)({})` | 纯函数式，组合灵活 | 嵌套较多时可读性降低 |
| 对象解构 | `username: "用户名"` | 最接近原生JS，几乎零学习成本 | 无法定义复杂约束 |
| 改进链式API | `c.string.range(3, 32).required()` | 语义清晰，API一致性高 | 需要显式结束链 |

## 数据库转换

SchemoIO可以将定义的Schema转换为各种数据库格式：

```javascript
const { toMongoDB, toMySQL, toPostgreSQL } = require('schemoio');

// 转换为MongoDB Schema
const mongoSchema = toMongoDB(processedSchema);

// 转换为MySQL Schema
const mysqlSchema = toMySQL(processedSchema);

// 转换为PostgreSQL Schema
const pgSchema = toPostgreSQL(processedSchema);
```

## 验证数据

使用定义的Schema验证数据：

```javascript
const { validate } = require('schemoio');

const data = {
    username: 'user123',
    age: 25,
    tags: ['tag1', 'tag2'],
    profile: {
        bio: 'Hello world',
        skills: ['JavaScript', 'Node.js']
    }
};

const validationResult = validate(processedSchema, data);
console.log(validationResult.isValid); // true 或 false
console.log(validationResult.errors);  // 验证错误列表
```

## 选择哪种风格？

- 如果您喜欢**简洁的代码**，推荐使用**超简洁符号风格**或**模板字符串风格**
- 如果您喜欢**直观的代码**，推荐使用**Proxy对象风格**或**函数式风格**
- 如果您需要**类型安全**，推荐使用**函数式风格**
- 如果您需要**向后兼容**，可以使用**原始DSL风格**

## 贡献

欢迎提交问题和Pull Request！

## 许可证

MIT
