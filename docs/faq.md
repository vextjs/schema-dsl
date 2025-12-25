# 常见问题解答 (FAQ)

> **更新时间**: 2025-12-25  
> **适用版本**: v2.0.1

---

## 📑 目录

- [基础问题](#基础问题)
- [DSL 语法问题](#dsl-语法问题)
- [验证问题](#验证问题)
- [性能问题](#性能问题)
- [错误处理](#错误处理)
- [数据库导出](#数据库导出)
- [TypeScript 支持](#typescript-支持)

---

## 基础问题

### Q: SchemaIO 和 Joi、Yup 有什么区别？

**A**: SchemaIO 采用 DSL 语法，更简洁：

```javascript
// SchemaIO - 简洁
const schema = dsl({
  username: 'string:3-32!',
  email: 'email!'
});

// Joi - 繁琐
const schema = Joi.object({
  username: Joi.string().min(3).max(32).required(),
  email: Joi.string().email().required()
});
```

**主要区别**：
- 更简洁的 DSL 语法
- 支持数据库 Schema 导出
- 内置常见验证器（username、password、phone）
- 基于 JSON Schema 标准

---

### Q: 如何安装 SchemaIO？

```bash
npm install schemaio
```

**Node.js 版本要求**：>= 12.0.0

---

### Q: 支持 ES Modules 吗？

**A**: 支持。

```javascript
// CommonJS
const { dsl, validate } = require('schemaio');

// ES Modules
import { dsl, validate } from 'schemaio';
```

---

## DSL 语法问题

### Q: `'string:3-32!'` 是什么意思？

**A**: 这是 DSL 语法：
- `string` - 类型
- `3-32` - 长度范围（最小3，最大32）
- `!` - 必填

更多示例：
```javascript
'string:10'      // 最大长度10
'string:3-'      // 最小长度3
'number:0-100'   // 数值范围0-100
'email!'         // 必填邮箱
'a|b|c'          // 枚举值
```

---

### Q: 如何定义数组？

**A**: 使用 `array` 类型：

```javascript
// 简单数组
tags: 'array'

// 带长度约束
tags: 'array:1-10'      // 1-10个元素
tags: 'array!1-10'      // 必填，1-10个元素

// 带元素类型
tags: 'array<string>'   // 字符串数组
tags: 'array<number>'   // 数字数组
tags: 'array<string:1-20>'  // 带约束的字符串数组
```

---

### Q: 如何定义嵌套对象？

**A**: 直接嵌套即可：

```javascript
const schema = dsl({
  user: {
    name: 'string!',
    address: {
      city: 'string!',
      zip: 'string:5-10!'
    }
  }
});
```

---

### Q: 如何使用 String 扩展？

**A**: 字符串可以直接链式调用方法：

```javascript
const schema = dsl({
  email: 'email!'
    .label('邮箱地址')
    .messages({
      'required': '{{#label}}不能为空',
      'format': '请输入有效的{{#label}}'
    }),

  username: 'string:3-32!'
    .pattern(/^[a-z0-9_]+$/)
    .label('用户名')
    .username('medium')
});
```

---

## 验证问题

### Q: 如何验证数据？

**A**: 使用 `validate()` 函数或 `Validator` 类：

```javascript
// 方式1：便捷函数
const { dsl, validate } = require('schemaio');
const result = validate(schema, data);

// 方式2：Validator 实例
const { Validator } = require('schemaio');
const validator = new Validator();
const result = validator.validate(schema, data);
```

---

### Q: 验证结果的格式是什么？

**A**: 返回对象包含：

```javascript
{
  valid: true/false,    // 是否通过
  errors: [],           // 错误数组（如果有）
  data: {},             // 验证后的数据（可能包含默认值）
  performance: {        // 性能信息
    duration: 1.5       // 验证耗时（毫秒）
  }
}
```

---

### Q: 如何获取所有错误而不是只有第一个？

**A**: 默认就是返回所有错误。如果只需要第一个：

```javascript
const validator = new Validator({ allErrors: false });
```

---

### Q: 如何使用默认值？

**A**: 使用 `.default()` 方法：

```javascript
const schema = dsl({
  status: 'string'.default('active'),
  count: 'integer'.default(0)
});

const result = validate(schema, {});
console.log(result.data);
// { status: 'active', count: 0 }
```

---

## 性能问题

### Q: 验证速度慢怎么办？

**A**: 使用预编译：

```javascript
const validator = new Validator();

// 预编译一次
const validateUser = validator.compile(userSchema);

// 多次使用
validateUser(data1);  // 快
validateUser(data2);  // 快
validateUser(data3);  // 快
```

---

### Q: 缓存如何工作？

**A**: SchemaIO 内置 LRU 缓存：

```javascript
const validator = new Validator({
  cache: {
    maxSize: 100,    // 最大缓存数
    ttl: 3600000     // 1小时过期
  }
});
```

---

### Q: 如何批量验证？

**A**: 使用 `validateBatch()`：

```javascript
const results = validator.validateBatch(schema, [data1, data2, data3]);
// 返回结果数组
```

---

## 错误处理

### Q: 如何自定义错误消息？

**A**: 使用 `.messages()` 方法：

```javascript
username: 'string:3-32!'
  .label('用户名')
  .messages({
    'min': '{{#label}}太短了',
    'max': '{{#label}}太长了',
    'required': '请输入{{#label}}'
  })
```

---

### Q: 如何支持多语言？

**A**: 使用 `Locale` 类：

```javascript
const { Locale } = require('schemaio');

// 添加语言包
Locale.addLocale('zh-CN', {
  'required': '{{#label}}不能为空',
  'min': '{{#label}}长度不能少于{{#limit}}'
});

// 验证时指定语言
validator.validate(schema, data, { locale: 'zh-CN' });
```

---

### Q: 错误路径格式是什么？

**A**: JSON Pointer 格式：

```javascript
'/username'           // 顶层字段
'/user/name'          // 嵌套字段
'/items/0/name'       // 数组元素
```

---

## 数据库导出

### Q: 如何导出为 MongoDB Schema？

```javascript
const { exporters } = require('schemaio');

const exporter = new exporters.MongoDBExporter();
const mongoSchema = exporter.export(schema);
```

---

### Q: 如何导出为 MySQL DDL？

```javascript
const exporter = new exporters.MySQLExporter();
const ddl = exporter.export('table_name', schema);
```

---

### Q: 如何导出为 PostgreSQL DDL？

```javascript
const exporter = new exporters.PostgreSQLExporter({ schema: 'public' });
const ddl = exporter.export('table_name', schema);
```

---

### Q: 导出时如何添加注释？

**A**: 使用 `.description()`：

```javascript
username: 'string:3-32!'
  .description('用户登录名，只能包含字母数字')
```

MySQL 会生成 `COMMENT`，PostgreSQL 会生成 `COMMENT ON COLUMN`。

---

## TypeScript 支持

### Q: SchemaIO 支持 TypeScript 吗？

**A**: 支持，类型定义在 `index.d.ts`：

```typescript
import { dsl, validate, DslBuilder, Validator } from 'schemaio';

const schema = dsl({
  username: 'string:3-32!',
  email: 'email!'
});

const result = validate(schema, data);
if (result.valid) {
  console.log(result.data);
}
```

---

### Q: 如何获得 String 扩展的类型提示？

**A**: 类型定义包含全局 String 扩展：

```typescript
// TypeScript 会识别这些方法
const schema = dsl({
  email: 'email!'.label('邮箱').messages({ ... })
});
```

---

## 更多问题

如果您有其他问题：

1. 查看 [完整文档](INDEX.md)
2. 查看 [DSL 语法指南](dsl-syntax.md)
3. 查看 [API 参考](api-reference.md)
4. 提交 [GitHub Issue](https://github.com/schemaio/schemaio/issues)

---

## 相关文档

- [快速开始](quick-start.md)
- [DSL 语法](dsl-syntax.md)
- [验证指南](validation-guide.md)
- [导出指南](export-guide.md)
- [错误处理](error-handling.md)
