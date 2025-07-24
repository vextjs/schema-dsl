# API设计改进建议

## 概述

SchemoIO库目前提供了多种风格的Schema定义方式，包括传统风格（DSL、模板字符串、Proxy对象、超简洁符号、函数式）和现代风格（标签对象、函数式管道、对象解构、改进的链式API）。这种多样性使得用户可以选择最适合自己的风格，但也带来了一些挑战，如API一致性、学习曲线和维护成本。本文档提出了一系列API设计改进建议，旨在提高SchemoIO库的易用性、一致性和可维护性。

## 当前状态

### 传统风格API

1. **原始DSL风格**：使用字符串表达式定义Schema，如`DSL('string(3,32)!')`
2. **模板字符串风格**：使用ES6模板字符串标签函数，如``s`string(3,32)!` ``
3. **Proxy对象风格**：使用链式API，如`$.string.min(3).max(32).required`
4. **Proxy对象简写风格**：更简洁的链式API，如`$.string['3-32'].required`
5. **超简洁符号风格**：使用简短的符号表示类型  和约束，如`_('s:3-32!')`
6. **函数式风格**：使用函数调用定义Schema，如`_.string(3, 32, true)`

### 现代风格API

1. **标签对象风格**：使用ES6+的标签对象和计算属性名，如`t.string.required(3, 32)`
2. **函数式管道风格**：使用函数组合和管道操作，如`pipe(f.string(), f.min(3), f.max(32), f.required)({})`
3. **对象解构风格**：使用对象字面量推断类型，如`username: "用户名"`
4. **改进的链式API风格**：使用更现代的链式API设计，如`c.string.range(3, 32).required()`

## 改进建议

### 1. 统一API命名约定

**问题**：当前API使用不同的命名约定（DSL、s、$、_、t、f、c等），这可能导致用户混淆。

**建议**：
- 为每种风格使用更具描述性的命名，如：
  - `dsl` 替代 `DSL`
  - `template` 替代 `s`
  - `chain` 替代 `$`
  - `shorthand` 替代 `_`
  - `tag` 替代 `t`
  - `functional` 替代 `f`
  - `modern` 替代 `c`
- 保持向后兼容性，但在文档中推荐新的命名约定

**示例**：
```javascript
// 当前
const { DSL, s, $, _ } = require('schemoio');
const { t, f, pipe, schema, c } = require('schemoio/modern');

// 改进
const { dsl, template, chain, shorthand } = require('schemoio');
const { tag, functional, pipe, schema, modern } = require('schemoio/modern');
```

### 2. 简化API层次结构

**问题**：当前API层次结构较为复杂，特别是在函数式管道风格中，嵌套较多时可读性降低。

**建议**：
- 为复杂的API提供简化版本，特别是函数式管道风格
- 添加更多的辅助函数，减少嵌套层级
- 提供更多的组合函数，简化常见用例

**示例**：
```javascript
// 当前
const userSchema = {
  username: pipe(f.string(), f.min(3), f.max(32), f.required)({}),
  age: pipe(f.number(), f.min(18), f.max(120))({})
};

// 改进
const userSchema = {
  username: f.string.required({ min: 3, max: 32 }),
  age: f.number.optional({ min: 18, max: 120 })
};
```

### 3. 增强类型安全

**问题**：当前API在类型安全方面有所欠缺，特别是在使用字符串表达式和对象解构风格时。

**建议**：
- 提供TypeScript类型定义，增强IDE支持和类型检查
- 为每种风格提供类型安全的版本
- 添加运行时类型检查，提供更好的错误消息

**示例**：
```typescript
// TypeScript类型定义
type StringSchema = {
  type: 'string';
  min?: number;
  max?: number;
  required?: boolean;
  pattern?: RegExp | string;
  format?: 'email' | 'url' | 'date' | string;
};

// 类型安全的API
const userSchema = {
  username: tag.string<{ min: 3, max: 32, required: true }>(),
  age: tag.number<{ min: 18, max: 120 }>()
};
```

### 4. 统一验证API

**问题**：当前验证API与Schema定义API分离，需要单独调用`validate`函数。

**建议**：
- 为每种风格提供一致的验证API
- 允许在Schema定义时指定验证选项
- 提供链式验证API，简化验证流程

**示例**：
```javascript
// 当前
const validationResult = validate(userSchema, data);

// 改进
const userSchema = schema(userSchemaTemplate);
const validationResult = userSchema.validate(data);

// 或者链式API
const validationResult = schema(userSchemaTemplate).validate(data);
```

### 5. 简化数据库转换API

**问题**：当前数据库转换API需要单独调用`toMongoDB`、`toMySQL`、`toPostgreSQL`等函数。

**建议**：
- 为每种风格提供一致的数据库转换API
- 允许在Schema定义时指定数据库转换选项
- 提供链式数据库转换API，简化转换流程

**示例**：
```javascript
// 当前
const mongoSchema = toMongoDB(userSchema);
const mysqlSchema = toMySQL(userSchema);

// 改进
const mongoSchema = userSchema.toMongoDB();
const mysqlSchema = userSchema.toMySQL();

// 或者链式API
const mongoSchema = schema(userSchemaTemplate).toMongoDB();
```

### 6. 提供插件系统

**问题**：当前API不支持扩展，用户无法添加自定义功能。

**建议**：
- 提供插件系统，允许用户扩展库的功能
- 支持自定义类型、验证规则、数据库转换等
- 提供插件注册和管理API

**示例**：
```javascript
// 注册插件
schemoio.use(myPlugin);

// 自定义类型插件
const myPlugin = {
  name: 'custom-types',
  types: {
    email: {
      validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      toMongoDB: () => ({ bsonType: 'string', pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' }),
      toMySQL: () => 'VARCHAR(255) CHECK (email REGEXP \'^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$\')'
    }
  }
};

// 使用自定义类型
const userSchema = {
  email: tag.email.required()
};
```

## 实现步骤

1. **分析当前API**：
   - 详细分析每种风格的API设计
   - 识别共同点和差异点
   - 确定需要改进的方面

2. **设计新的API**：
   - 设计统一的命名约定
   - 设计简化的API层次结构
   - 设计类型安全的API
   - 设计一致的验证和数据库转换API
   - 设计插件系统

3. **实现新的API**：
   - 实现新的命名约定
   - 实现简化的API层次结构
   - 实现类型安全的API
   - 实现一致的验证和数据库转换API
   - 实现插件系统

4. **测试新的API**：
   - 编写单元测试
   - 编写集成测试
   - 编写性能测试

5. **更新文档**：
   - 更新API文档
   - 更新示例代码
   - 更新迁移指南

6. **发布新版本**：
   - 发布新版本
   - 提供迁移工具
   - 收集用户反馈

## 预期收益

1. **提高易用性**：统一的API命名约定和简化的API层次结构将使库更易于使用。
2. **增强类型安全**：类型安全的API将减少运行时错误，提高代码质量。
3. **简化验证和数据库转换**：一致的验证和数据库转换API将简化用户代码。
4. **支持扩展**：插件系统将允许用户扩展库的功能，满足特定需求。
5. **改进文档**：更新的文档将帮助用户更好地理解和使用库。
6. **减少维护成本**：统一的API设计将减少维护成本，使库更易于维护。

## 结论

通过实施上述改进建议，SchemoIO库将变得更加易用、一致和可维护。这些改进将使库更好地满足用户需求，提高用户体验，并减少维护成本。