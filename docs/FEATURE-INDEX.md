# SchemaIO 功能索引


> **更新时间**: 2025-12-25  
> **用途**: 快速查找所有功能及其文档位置  

---

## 📑 目录

- [核心API](#核心api)
- [验证功能](#验证功能)
- [导出器](#导出器)
- [工具函数](#工具函数)
- [错误处理](#错误处理)
- [配置管理](#配置管理)
- [示例代码](#示例代码)

---

## 核心API

### dsl() 函数

**功能**: DSL主入口，支持字符串和对象定义

**使用示例**:
```javascript
const { dsl } = require('schema-dsl');

// 字符串定义
const builder = dsl('email!');

// 对象定义
const schema = dsl({
  username: 'string:3-32!',
  email: 'email!'
});
```

**文档位置**:
- 📖 [API参考 - dsl()函数](./api-reference.md#dsl-函数)
- 📖 [快速开始](./quick-start.md)
- 📖 [DSL语法指南](./dsl-syntax.md)

**代码位置**: `lib/adapters/DslAdapter.js`

---

### DslBuilder 类

**功能**: Schema构建器，支持链式调用

**可用方法**:
- ✅ `pattern(regex, message?)` - 正则验证
- ✅ `label(text)` - 字段标签
- ✅ `messages(obj)` - 自定义错误消息
- ✅ `description(text)` - 字段描述
- ✅ `custom(fn)` - 自定义验证器
- ✅ `when(field, opts)` - 条件验证
- ✅ `default(value)` - 默认值
- ✅ `toSchema()` - 转为JSON Schema
- ✅ `validate(data)` - 验证数据
- ✅ `validateNestingDepth(schema, maxDepth)` - 检测嵌套深度（静态方法）

**默认验证器方法**:
- ✅ `username(preset?)` - 用户名验证（preset: 'short'|'medium'|'long'|'5-20'）
- ✅ `password(strength?)` - 密码强度验证（strength: 'weak'|'medium'|'strong'|'veryStrong'）
- ✅ `phone(country?)` - 手机号验证（country: 'cn'|'us'|'uk'|'hk'|'tw'|'international'）

**使用示例**:
```javascript
// 基础链式调用
const schema = dsl('string:3-32!')
  .pattern(/^[a-zA-Z0-9_]+$/)
  .label('用户名')
  .messages({ 'pattern': '只能包含字母、数字和下划线' });

// 使用默认验证器
const userSchema = dsl({
  username: dsl('string!').username(),           // 自动设置3-32长度+正则
  password: dsl('string!').password('strong'),   // 强密码验证
  phone: dsl('string!').phone('cn')              // 中国手机号验证
});
```

**文档位置**:
- 📖 [API参考 - DslBuilder类](./api-reference.md#dslbuilder-类)
- 📖 [String扩展文档](./string-extensions.md)

**代码位置**: `lib/core/DslBuilder.js`

---

### String 扩展

**功能**: 字符串直接链式调用，无需 dsl() 包裹

**可用方法**: 与 DslBuilder 相同

**使用示例**:
```javascript
const schema = dsl({
  email: 'email!'.pattern(/custom/).label('邮箱'),
  username: 'string:3-32!'.pattern(/^\w+$/).label('用户名')
});
```

**文档位置**:
- 📖 [String扩展完整文档](./string-extensions.md)
- 📖 [README - v2.0.1新特性](../README.md#-v201-新特性)

**代码位置**: `lib/core/StringExtensions.js`

---

## 验证功能

### Validator 类

**功能**: JSON Schema验证器（基于ajv）

**可用方法**:
- ✅ `validate(schema, data, options)` - 验证数据
- ✅ `compile(schema, cacheKey)` - 编译Schema
- ✅ `validateBatch(schema, dataArray, options)` - 批量验证
- ✅ `addKeyword(name, definition)` - 添加自定义关键字
- ✅ `addFormat(name, validator)` - 添加自定义格式
- ✅ `clearCache()` - 清空缓存
- ✅ `Validator.create(options)` - 创建实例（静态方法）
- ✅ `Validator.quickValidate(schema, data)` - 快速验证（静态方法）

**使用示例**:
```javascript
const { Validator } = require('schema-dsl');

const validator = new Validator();
const result = validator.validate(schema, data);

console.log(result.valid);   // true/false
console.log(result.errors);  // 错误列表
```

**文档位置**:
- 📖 [API参考 - Validator类](./api-reference.md#validator-类)
- 📖 [validate方法详解](./validate.md)
- 📖 [快速开始](./quick-start.md)

**代码位置**: `lib/core/Validator.js`

---

### validate() 便捷函数

**功能**: 单例验证，无需 new Validator()

**使用示例**:
```javascript
const { dsl, validate } = require('schema-dsl');

const schema = dsl({ email: 'email!' });
const result = validate(schema, { email: 'test@example.com' });
```

**文档位置**:
- 📖 [API参考 - validate()函数](./api-reference.md)
- 📖 [快速开始](./quick-start.md#1-hello-world30秒)

**代码位置**: `index.js` (单例实现)

---

## 导出器

### MongoDBExporter

**功能**: 导出MongoDB $jsonSchema格式

**可用方法**:
- ✅ `export(schema)` - 导出Schema
- ✅ `generateCreateCommand(collectionName, schema)` - 生成createCollection命令
- ✅ `generateCommand(collectionName, schema)` - 生成可执行命令字符串
- ✅ `MongoDBExporter.export(schema)` - 快速导出（静态方法）

**使用示例**:
```javascript
const { exporters } = require('schema-dsl');

const exporter = new exporters.MongoDBExporter();
const mongoSchema = exporter.export(jsonSchema);

// 生成命令
const command = exporter.generateCommand('users', jsonSchema);
console.log(command);
```

**文档位置**:
- 📖 [README - 数据库导出](../README.md#️-数据库导出)
- 📖 [示例代码](../examples/export-demo.js)

**代码位置**: `lib/exporters/MongoDBExporter.js`

---

### MySQLExporter

**功能**: 导出MySQL CREATE TABLE DDL

**可用方法**:
- ✅ `export(tableName, schema, options)` - 导出DDL
- ✅ `MySQLExporter.export(tableName, schema)` - 快速导出（静态方法）

**使用示例**:
```javascript
const { exporters } = require('schema-dsl');

const exporter = new exporters.MySQLExporter();
const ddl = exporter.export('users', jsonSchema);

console.log(ddl);
// CREATE TABLE `users` (
//   `username` VARCHAR(32) NOT NULL,
//   ...
// );
```

**文档位置**:
- 📖 [README - 数据库导出](../README.md#mysql-ddl)
- 📖 [示例代码](../examples/export-demo.js)

**代码位置**: `lib/exporters/MySQLExporter.js`

---

### PostgreSQLExporter

**功能**: 导出PostgreSQL CREATE TABLE DDL

**可用方法**:
- ✅ `export(tableName, schema, options)` - 导出DDL
- ✅ `PostgreSQLExporter.export(tableName, schema)` - 快速导出（静态方法）

**使用示例**:
```javascript
const { exporters } = require('schema-dsl');

const exporter = new exporters.PostgreSQLExporter();
const ddl = exporter.export('users', jsonSchema);

console.log(ddl);
// CREATE TABLE public.users (
//   username VARCHAR(32) NOT NULL,
//   ...
// );
```

**文档位置**:
- 📖 [README - 数据库导出](../README.md#postgresql-ddl)
- 📖 [示例代码](../examples/export-demo.js)

**代码位置**: `lib/exporters/PostgreSQLExporter.js`

---

## 工具函数

### SchemaUtils

**功能**: Schema复用、合并、操作工具

**可用方法**:
- ✅ `reusable(factory)` - 创建可复用片段
- ✅ `createLibrary(fragments)` - 创建片段库
- ✅ `merge(...schemas)` - 合并多个Schema
- ✅ `extend(baseSchema, extensions)` - 扩展Schema
- ✅ `pick(schema, fields)` - 筛选字段
- ✅ `omit(schema, fields)` - 排除字段
- ✅ `toMarkdown(schema)` - 导出为Markdown
- ✅ `toHTML(schema)` - 导出为HTML
- ✅ `clone(schema)` - 深度克隆

**使用示例**:
```javascript
const { SchemaUtils, dsl } = require('schema-dsl');

// Schema复用
const emailField = SchemaUtils.reusable(() => dsl('email!'));

const schema1 = dsl({ email: emailField() });
const schema2 = dsl({ contactEmail: emailField() });

// Schema合并
const merged = SchemaUtils.merge(schema1, schema2);
```

**文档位置**:
- 📖 [API参考 - SchemaUtils](./api-reference.md#工具函数)
- 📖 [示例代码](../examples/v2.0.1-features.js)

**代码位置**: `lib/utils/SchemaUtils.js`

---

### TypeConverter

**功能**: 类型转换工具（JSON Schema ↔ 数据库类型）

**可用方法**:
- ✅ `toMongoType(jsonSchemaType)` - 转为MongoDB BSON类型
- ✅ `toMySQLType(jsonSchemaProperty)` - 转为MySQL数据类型
- ✅ `toPostgreSQLType(jsonSchemaProperty)` - 转为PostgreSQL数据类型
- ✅ `formatToRegex(format)` - 格式验证转正则

**文档位置**:
- 📖 [API参考 - TypeConverter](./api-reference.md#typeconverter)

**代码位置**: `lib/utils/TypeConverter.js`

---

### SchemaHelper

**功能**: Schema分析和辅助工具

**可用方法**:
- ✅ `validate(schema)` - 验证Schema有效性
- ✅ `getFieldPaths(schema)` - 提取字段路径
- ✅ `flatten(schema)` - 扁平化Schema
- ✅ `clone(schema)` - 克隆Schema
- ✅ `getComplexity(schema)` - 评估复杂度

**文档位置**:
- 📖 [API参考 - SchemaHelper](./api-reference.md#schemahelper)

**代码位置**: `lib/utils/SchemaHelper.js`

---

## 错误处理

### ErrorFormatter

**功能**: 格式化验证错误信息

**可用方法**:
- ✅ `format(errors, options)` - 格式化错误列表
- ✅ `formatSingle(error, options)` - 格式化单个错误
- ✅ `toJSON(errors)` - 转为JSON格式
- ✅ `toText(errors)` - 转为文本格式

**文档位置**:
- 📖 [API参考 - ErrorFormatter](./api-reference.md)
- 📖 [错误处理文档](./error-handling.md)

**代码位置**: `lib/core/ErrorFormatter.js`

---

### ErrorCodes

**功能**: 错误码定义

**代码位置**: `lib/core/ErrorCodes.js`

---

### MessageTemplate

**功能**: 错误消息模板

**可用方法**:
- ✅ `render(template, vars)` - 渲染模板
- ✅ `MessageTemplate.render(template, vars)` - 快速渲染（静态方法）
- ✅ `MessageTemplate.renderBatch(templates, vars)` - 批量渲染（静态方法）

**文档位置**:
- 📖 [API参考 - MessageTemplate](./api-reference.md)

**代码位置**: `lib/core/MessageTemplate.js`

---

### Locale

**功能**: 国际化支持

**可用方法**:
- ✅ `setLocale(locale)` - 设置语言
- ✅ `getLocale()` - 获取当前语言
- ✅ `addLocale(locale, messages)` - 添加语言包
- ✅ `setMessages(messages)` - 设置全局消息
- ✅ `getMessage(code, customMessages)` - 获取消息
- ✅ `getAvailableLocales()` - 获取可用语言
- ✅ `reset()` - 重置

**支持语言**:
- ✅ en-US（英语）
- ✅ zh-CN（中文）

**文档位置**:
- 📖 [API参考 - Locale](./api-reference.md)

**代码位置**: `lib/core/Locale.js`

---

## 配置管理

### CacheManager

**功能**: Schema编译缓存管理

**可用方法**:
- ✅ `get(key)` - 获取缓存
- ✅ `set(key, value)` - 设置缓存
- ✅ `has(key)` - 检查缓存
- ✅ `delete(key)` - 删除缓存
- ✅ `clear()` - 清空缓存
- ✅ `size()` - 缓存大小

**文档位置**:
- 📖 [API参考 - CacheManager](./api-reference.md)

**代码位置**: `lib/core/CacheManager.js`

---

### CustomKeywords

**功能**: 自定义验证关键字

**可用关键字**:
- ✅ `regex` - 正则验证
- ✅ `validate` - 函数验证
- ✅ `range` - 数值范围

**使用示例**:
```javascript
const { Validator, CustomKeywords } = require('schema-dsl');

const validator = new Validator();
CustomKeywords.registerAll(validator.getAjv());

const schema = {
  type: 'string',
  regex: '^[a-z]+$'
};
```

**文档位置**:
- 📖 [README - 自定义验证](../README.md#-自定义验证)

**代码位置**: `lib/validators/CustomKeywords.js`

---

## 示例代码

### 完整示例目录

**基础示例**:
- 📄 [dsl-style.js](../examples/dsl-style.js) - DSL基础用法
- 📄 [string-extensions.js](../examples/string-extensions.js) - String扩展示例
- 📄 [v2.0.1-features.js](../examples/v2.0.1-features.js) - v2.0.1新功能完整示例
- 📄 [v2.0.1-simple.js](../examples/v2.0.1-simple.js) - v2.0.1简单示例

**场景示例**:
- 📁 [user-registration/](../examples/user-registration/) - 用户注册表单验证
- 📁 [password-reset/](../examples/password-reset/) - 密码重置流程

**导出示例**:
- 📄 [export-demo.js](../examples/export-demo.js) - 数据库导出示例

---

## 功能覆盖检查

### ✅ 已完整文档化

1. ✅ DSL语法 - `docs/dsl-syntax.md` (2815行)
2. ✅ String扩展 - `docs/string-extensions.md`
3. ✅ Validator类 - `docs/validate.md`
4. ✅ API参考 - `docs/api-reference.md`
5. ✅ 快速开始 - `docs/quick-start.md`
6. ✅ 数据库导出 - `README.md` + `examples/export-demo.js`
7. ✅ 自定义验证 - `README.md`
8. ✅ Schema工具 - `examples/v2.0.1-features.js`

### ⚠️ 文档需要补充

1. ⚠️ ErrorFormatter - 缺少独立文档
2. ⚠️ CacheManager - 缺少独立文档
3. ⚠️ TypeConverter - 缺少独立文档
4. ⚠️ SchemaHelper - 缺少独立文档
5. ⚠️ 错误处理 - 需要完整文档

### 📝 计划补充

- [ ] 创建 `docs/error-handling.md` - 错误处理完整指南
- [ ] 创建 `docs/utilities.md` - 工具函数完整文档
- [ ] 创建 `docs/advanced.md` - 高级用法指南
- [ ] 创建 `docs/performance.md` - 性能优化指南

---

## 相关文档

- 📖 [README.md](../README.md) - 项目介绍
- 📖 [快速开始](./quick-start.md) - 5分钟入门
- 📖 [DSL语法指南](./dsl-syntax.md) - 完整语法（2815行）
- 📖 [String扩展](./string-extensions.md) - v2.0.1新特性
- 📖 [API参考](./api-reference.md) - 完整API
- 📖 [CHANGELOG](../CHANGELOG.md) - 更新日志
- 📖 [STATUS](../STATUS.md) - 项目状态

---

**最后更新**: 2025-12-25  
**维护者**: SchemaIO Team


