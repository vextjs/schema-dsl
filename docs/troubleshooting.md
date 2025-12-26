# 常见问题排查指南

> **用途**: 快速解决 SchemaIO 使用中的常见问题  
> **更新**: 2025-12-26  

---

## 📑 目录

- [验证问题](#验证问题)
- [性能问题](#性能问题)
- [多语言问题](#多语言问题)
- [导出器问题](#导出器问题)
- [String扩展问题](#string扩展问题)
- [调试技巧](#调试技巧)

---

## 验证问题

### 问题1: 验证总是失败，但不知道原因

**症状**:
```javascript
const result = validate(schema, data);
console.log(result.valid); // false
console.log(result.errors); // 看不懂错误信息
```

**排查步骤**:

1. **检查 errors 数组**
```javascript
console.log(JSON.stringify(result.errors, null, 2));
// 查看完整的错误对象
```

2. **启用详细错误信息**
```javascript
const validator = new Validator({ verbose: true });
const result = validator.validate(schema, data);
```

3. **使用 Schema 分析工具**
```javascript
const { SchemaUtils } = require('schema-dsl');
console.log(SchemaUtils.analyze(schema));
```

4. **检查字段名是否正确**
```javascript
// ❌ 错误：路径使用 . 分隔
{ 'user.name': 'string!' }

// ✅ 正确：使用嵌套对象
{ 
  user: {
    name: 'string!'
  }
}
```

---

### 问题2: 自定义验证器不工作

**症状**:
```javascript
email: 'email!'.custom(async (value) => {
  // 这里的代码没有执行
})
```

**可能原因及解决方案**:

#### 原因1: 异步验证器在同步模式下不执行

```javascript
// ❌ 错误：在 validate() 中使用异步验证器
const result = validate(schema, data); // 同步模式

// ✅ 解决1：使用 validateAsync()
const result = await validateAsync(schema, data);

// ✅ 解决2：使用同步验证器
email: 'email!'.custom((value) => {
  // 同步代码
  if (checkSync(value)) return '邮箱已被占用';
})
```

#### 原因2: custom() 返回值不正确

```javascript
// ❌ 错误：返回 true/false
.custom((value) => {
  return value.includes('@'); // 返回 boolean
})

// ✅ 正确：只在失败时返回错误消息
.custom((value) => {
  if (!value.includes('@')) {
    return '必须包含@符号'; // 失败时返回消息
  }
  // 成功时无需返回
})
```

---

### 问题3: 嵌套对象验证失败

**症状**:
```javascript
const schema = dsl({
  user: {
    name: 'string!',
    email: 'email!'
  }
});

// 验证失败：user 字段不是必填
```

**解决方案**:
```javascript
// ✅ 方案1: 标记对象本身为必填
const schema = dsl({
  'user!': {  // 注意这里的 !
    name: 'string!',
    email: 'email!'
  }
});

// ✅ 方案2: 在数据中确保有 user 对象
const data = {
  user: {
    name: 'John',
    email: 'john@example.com'
  }
};
```

---

### 问题4: 数组验证不符合预期

**症状**:
```javascript
tags: 'array!1-10<string>'
// 传入空数组却通过了
```

**检查语法**:
```javascript
// ❌ 错误语法
'array!1-10<string>'  // ! 位置错误

// ✅ 正确语法（两种方式）
'array:1-10<string>!' // 方式1：! 在最后
'array!1-10<string>'  // 方式2：会自动转换为 array:1-10!

// 建议使用方式1，更清晰
```

---

## 性能问题

### 问题5: 验证速度慢

**症状**: 验证大量数据时性能差

**排查清单**:

#### 1. 检查是否使用了缓存
```javascript
// ❌ 未使用缓存
app.post('/api/user', (req, res) => {
  const schema = dsl({ username: 'string!' }); // 每次都创建
  validate(schema, req.body);
});

// ✅ 使用缓存
const userSchema = dsl({ username: 'string!' }); // 创建一次
app.post('/api/user', (req, res) => {
  validate(userSchema, req.body); // 重复使用
});
```

#### 2. 使用 compile() 预编译
```javascript
const validator = new Validator();
const validateFn = validator.compile(schema); // 预编译

// 重复使用
app.post('/api/user', (req, res) => {
  const result = validateFn(req.body);
});
```

#### 3. 避免过于复杂的正则表达式
```javascript
// ❌ 复杂正则（可能导致 ReDoS）
.pattern(/^(a+)+$/)

// ✅ 简单高效的正则
.pattern(/^[a-zA-Z0-9_]+$/)
```

#### 4. 批量验证优化
```javascript
// ❌ 循环验证
records.forEach(record => {
  validate(schema, record);
});

// ✅ 批量验证
validator.validateBatch(schema, records);
```

---

### 问题6: 内存占用过高

**原因**: 未清理缓存

**解决方案**:
```javascript
const validator = new Validator({ cache: true });

// 定期清理缓存
setInterval(() => {
  validator.clearCache();
}, 3600000); // 每小时清理一次

// 或者在适当时机手动清理
app.post('/admin/clear-cache', (req, res) => {
  validator.clearCache();
  res.json({ message: 'Cache cleared' });
});
```

---

## 多语言问题

### 问题7: 错误消息未翻译

**症状**: 显示英文错误消息，期望显示中文

**排查步骤**:

#### 1. 检查语言包是否加载
```javascript
const { Locale } = require('schema-dsl');
console.log(Object.keys(Locale.locales));
// 应该包含: ['zh-CN', 'en-US', 'ja-JP', ...]
```

#### 2. 检查 Validator 配置
```javascript
// ❌ 未指定语言
const validator = new Validator();

// ✅ 指定语言
const validator = new Validator({ locale: 'zh-CN' });
```

#### 3. 动态切换语言
```javascript
const result = validator.validate(schema, data, {
  locale: 'zh-CN'  // 动态指定
});
```

---

### 问题8: 自定义错误消息未生效

**症状**: 设置了 messages() 但没有显示

**检查错误关键字**:
```javascript
// ❌ 错误：使用了错误的关键字
username: 'string:3-32!'.messages({
  'length': '长度不正确'  // 错误的关键字
})

// ✅ 正确：使用正确的关键字
username: 'string:3-32!'.messages({
  'min': '至少3个字符',
  'max': '最多32个字符',
  'required': '用户名不能为空'
})
```

**常用错误关键字**:
- `required` - 必填字段为空
- `min` / `max` - 长度约束（推荐）
- `minLength` / `maxLength` - 长度约束（兼容）
- `pattern` - 正则验证失败
- `format` - 格式验证失败（email、url等）
- `enum` - 枚举值不匹配

---

## 导出器问题

### 问题9: 导出的 DDL 无法执行

**症状**: MySQL/PostgreSQL DDL 语句执行报错

**常见问题**:

#### 1. 字段名包含保留关键字
```javascript
// ❌ 问题：使用了 SQL 保留字
const schema = dsl({
  order: 'string!',  // 'order' 是 SQL 保留字
  group: 'string'    // 'group' 是 SQL 保留字
});

// ✅ 解决：使用反引号包裹或重命名
const schema = dsl({
  order_id: 'string!',
  group_name: 'string'
});
```

#### 2. 数据类型不支持
```javascript
// 某些 JSON Schema 类型在数据库中没有直接对应

// 检查导出结果
const exporter = new MySQLExporter();
const ddl = exporter.export('users', schema);
console.log(ddl); // 检查生成的 SQL
```

---

### 问题10: MongoDB 验证规则不生效

**症状**: 集合创建成功，但不验证数据

**检查步骤**:

#### 1. 确认使用了 validator
```javascript
const command = exporter.generateCreateCommand('users', schema);
console.log(command);
// 应该包含 validator 字段
```

#### 2. 检查 validationLevel
```javascript
db.createCollection('users', {
  validator: { $jsonSchema: mongoSchema },
  validationLevel: 'strict',    // 必须设置
  validationAction: 'error'     // 验证失败时报错
});
```

---

## String扩展问题

### 问题11: String 扩展方法未定义

**症状**:
```javascript
'string!'.pattern(/test/);
// TypeError: "string!".pattern is not a function
```

**原因**: String 扩展未安装

**解决方案**:
```javascript
// SchemaIO 默认会自动安装 String 扩展
// 如果未生效，手动安装：
const { installStringExtensions } = require('schema-dsl');
installStringExtensions();

// 或者使用 dsl() 包裹（非侵入式）
const schema = dsl({
  username: dsl('string!').pattern(/test/)
});
```

---

## 调试技巧

### 技巧1: 查看生成的 JSON Schema

```javascript
const schema = dsl({
  username: 'string:3-32!',
  email: 'email!'
});

console.log(JSON.stringify(schema, null, 2));
// 查看实际生成的 JSON Schema 结构
```

### 技巧2: 使用 Schema 分析工具

```javascript
const { SchemaUtils } = require('schema-dsl');

// 分析 Schema 结构
const analysis = SchemaUtils.analyze(schema);
console.log(analysis);
// 输出字段列表、约束信息、嵌套深度等
```

### 技巧3: 启用详细日志

```javascript
// 在开发环境启用详细日志
process.env.SCHEMAIO_DEBUG = 'true';

const validator = new Validator({
  verbose: true,
  allErrors: true  // 返回所有错误，不只是第一个
});
```

### 技巧4: 单元测试验证

```javascript
// 为你的 Schema 编写测试
describe('User Schema', () => {
  it('should validate correct data', () => {
    const result = validate(userSchema, {
      username: 'john_doe',
      email: 'john@example.com'
    });
    expect(result.valid).to.be.true;
  });

  it('should reject invalid email', () => {
    const result = validate(userSchema, {
      username: 'john_doe',
      email: 'invalid'
    });
    expect(result.valid).to.be.false;
    expect(result.errors[0].path).to.equal('email');
  });
});
```

---

## 获取帮助

如果以上方法无法解决你的问题：

1. **查看文档**: [完整文档索引](INDEX.md)
2. **查看示例**: [examples/](../examples/) 目录
3. **GitHub Issues**: [提交问题](https://github.com/schema-dsl/schema-dsl/issues)
4. **常见问题**: [FAQ.md](faq.md)

---

## 贡献

发现了新的常见问题？欢迎提交 PR 补充本文档！

