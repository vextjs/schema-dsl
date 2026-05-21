# schema-dsl 功能索引


> **更新时间**: 2026-04-30  
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

**代码位置**: `src/index.ts` / `src/adapters/DslAdapter.ts`

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
- ✅ `toSchema()` - 转为JSON Schema（含内部标记字段）
- ✅ `toJsonSchema()` - 转为纯净 JSON Schema（自动清理 `_required`/`_customMessages` 等内部标记，适用于 OpenAPI / 外部系统）🆕 v1.2.5
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

**代码位置**: `src/core/DslBuilder.ts`

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
- 📖 [README](https://github.com/vextjs/schema-dsl/blob/main/README.md)


**代码位置**: `src/core/StringExtensions.ts`

---

## 验证功能

### Validator 类

**功能**: JSON Schema验证器（基于ajv）

**可用方法**:
- ✅ `validate(schema, data, options)` - 验证数据
- ✅ `compile(schema, cacheKey)` - 编译Schema
- ✅ `validateBatch(schema, dataArray)` - 批量验证
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

**代码位置**: `src/core/Validator.ts`

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

**代码位置**: `src/index.ts`（默认单例导出）

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
- 📖 [数据库导出指南](./export-guide.md)
- 📖 [示例代码](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/feature-index.ts)

**代码位置**: `src/exporters/MongoDBExporter.ts`

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
- 📖 [数据库导出指南](./export-guide.md)
- 📖 [示例代码](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/feature-index.ts)

**代码位置**: `src/exporters/MySQLExporter.ts`

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
- 📖 [数据库导出指南](./export-guide.md)
- 📖 [示例代码](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/feature-index.ts)

**代码位置**: `src/exporters/PostgreSQLExporter.ts`

---

## 工具函数

### SchemaUtils

**功能**: Schema复用、合并、操作工具

**可用方法**:
- ✅ `reusable(factory)` - 创建可复用片段
- ✅ `createLibrary(fragments)` - 创建片段库
- ✅ `extend(baseSchema, extensions)` - 扩展Schema
- ✅ `pick(schema, fields)` - 筛选字段
- ✅ `omit(schema, fields)` - 排除字段
- ✅ `partial(schema, fields?)` - 将字段改为可选
- ✅ `validateBatch(schema, dataArray, ajvInstance)` - 带汇总统计的批量验证
- ✅ `withPerformance(validator)` - 为 Validator 包装性能信息
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
const extended = SchemaUtils.extend(schema1, { age: 'number' });
```

**文档位置**:
- 📖 [API参考 - SchemaUtils](./api-reference.md#工具函数)

**代码位置**: `src/utils/SchemaUtils.ts`

---

### TypeConverter

**功能**: 类型转换工具（JSON Schema ↔ 数据库类型）

**可用方法**:
- ✅ `toJSONSchemaType(nativeType)` - 转为 JSON Schema `type` 字符串
- ✅ `toMongoDBType(jsonSchemaType)` - 转为 MongoDB BSON 类型
- ✅ `toMySQLType(jsonSchemaType, schema?)` - 转为 MySQL 数据类型
- ✅ `toPostgreSQLType(jsonSchemaType, schema?)` - 转为 PostgreSQL 数据类型
- ✅ `normalizePropertyName(name)` - 规范化属性名
- ✅ `formatToRegex(format)` - 格式验证转正则

**文档位置**:
- 📖 [TypeConverter 文档](./type-converter.md)

**代码位置**: `src/utils/TypeConverter.ts`

---

### SchemaHelper

**功能**: Schema分析和辅助工具

**可用方法**:
- ✅ `isValidSchema(schema)` - 验证 Schema 有效性
- ✅ `generateSchemaId(schema)` - 生成基于内容的 Schema ID
- ✅ `getFieldPaths(schema)` - 提取字段路径
- ✅ `flattenSchema(schema)` - 扁平化 Schema
- ✅ `cloneSchema(schema)` - 克隆 Schema
- ✅ `extractRequiredFields(schema)` - 提取 required 字段
- ✅ `compareSchemas(schema1, schema2)` - 比较 Schema
- ✅ `simplifySchema(schema)` - 精简 Schema
- ✅ `isValidPropertyName(name)` - 校验属性名
- ✅ `getSchemaComplexity(schema)` - 评估复杂度
- ✅ `summarizeSchema(schema)` - 生成摘要

**文档位置**:
- 📖 [SchemaHelper 文档](./schema-helper.md)

**代码位置**: `src/utils/SchemaHelper.ts`

---

## 错误处理

### ErrorFormatter

**功能**: 格式化验证错误信息

**可用方法**:
- ✅ `new ErrorFormatter(locale?, messages?)` - 创建格式化器
- ✅ `format(error, locale?)` - 格式化单个错误为消息字符串
- ✅ `formatDetailed(errors, locale?, customMessages?, alreadyMerged?)` - 格式化错误数组为标准错误项

**文档位置**:
- 📖 [API参考 - ErrorFormatter / MessageTemplate / 底层解析工具](./api-reference.md)
- 📖 [错误处理文档](./error-handling.md)

**代码位置**: `src/core/ErrorFormatter.ts`

---

### ErrorCodes

**功能**: 错误码定义

**代码位置**: `src/core/ErrorCodes.ts`

---

### MessageTemplate

**功能**: 错误消息模板

**可用方法**:
- ✅ `render(template, vars)` - 渲染模板
- ✅ `MessageTemplate.render(template, vars)` - 快速渲染（静态方法）
- ✅ `MessageTemplate.renderBatch(templates, vars)` - 批量渲染（静态方法）

**文档位置**:
- 📖 [API参考 - MessageTemplate](./api-reference.md#messagetemplate)

**代码位置**: `src/core/MessageTemplate.ts`

---

### 类型注册与模板工具

**功能**: 面向进阶集成的模板渲染、JSON Schema 外观与自定义类型注册能力

**可用导出**:
- ✅ `renderTemplate(template, params)`
- ✅ `JSONSchemaCore`
- ✅ `TypeRegistry`

**文档位置**:
- 📖 [API参考 - renderTemplate / JSONSchemaCore / 类型注册与内部解析边界](./api-reference.md)

**代码位置**: `src/core/TemplateEngine.ts` / `src/core/JSONSchemaCore.ts` / `src/parser/TypeRegistry.ts`

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
- ✅ ja-JP（日语）
- ✅ es-ES（西班牙语）
- ✅ fr-FR（法语）

**文档位置**:
- 📖 [API参考 - Locale](./api-reference.md)

**代码位置**: `src/core/Locale.ts`

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
- 📖 [CacheManager 文档](./cache-manager.md)

**代码位置**: `src/core/CacheManager.ts`

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
- 📖 [错误处理文档](./error-handling.md)

**代码位置**: `src/validators/CustomKeywords.ts`

---

## 示例代码

### 完整示例目录

**基础示例**:
- 📄 [dsl-syntax.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/dsl-syntax.ts) - DSL基础用法
- 📄 [string-extensions.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/string-extensions.ts) - String扩展示例

**场景示例**:
- 📄 [quick-start.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/quick-start.ts) - 用户注册式的基础表单验证起点
- 📄 [validation-guide.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/validation-guide.ts) - 失败路径、错误处理与规则组合示例

**导出示例**:
- 📄 [feature-index.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/feature-index.ts) - 功能索引代表性示例

---

## 功能覆盖检查

### ✅ 已完整文档化

1. ✅ DSL语法 - `docs/dsl-syntax.md` (2815行)
2. ✅ String扩展 - `docs/string-extensions.md`
3. ✅ Validator类 - `docs/validate.md`
4. ✅ API参考 - `docs/api-reference.md`
5. ✅ 快速开始 - `docs/quick-start.md`
6. ✅ 数据库导出 - `README.md` + `docs/export-guide.md`
7. ✅ 自定义验证 - `README.md`
8. ✅ Schema工具 - `docs/schema-utils.md` + `docs/schema-helper.md`

### ⚠️ 文档需要补充

1. ⚠️ ErrorFormatter - 当前已在 API 参考与错误处理文档中覆盖；如需更聚焦入口，可后续增补专项文档
2. ⚠️ PluginManager - 可补一份更聚焦的 API/Hook 速查
3. ⚠️ 性能与基准测试 - 可继续补充独立诊断手册
4. ⚠️ 示例运行方式 - 可补充统一的 TypeScript 示例编译说明
5. ⚠️ 错误处理 - 可继续补充更完整的框架集成案例

### 📝 计划补充

- [ ] 增补 `ErrorFormatter` 专项文档
- [ ] 增补 Plugin Hook 速查文档
- [ ] 增补 TypeScript 示例统一运行说明
- [ ] 增补性能调优/基准解读手册

---

## 相关文档

- 📖 [README.md](https://github.com/vextjs/schema-dsl/blob/main/README.md) - 项目介绍
- 📖 [快速开始](./quick-start.md) - 5分钟入门
- 📖 [DSL语法指南](./dsl-syntax.md) - 完整语法
- 📖 [String扩展](./string-extensions.md) - String扩展特性
- 📖 [API参考](./api-reference.md) - 完整API
- 📖 [CHANGELOG](https://github.com/vextjs/schema-dsl/blob/main/CHANGELOG.md) - 更新日志
- 📖 [STATUS](https://github.com/vextjs/schema-dsl/blob/main/STATUS.md) - 项目状态

---

## 对应示例文件

**示例入口**: [feature-index.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/feature-index.ts)  
**说明**: 以单文件串联 DSL、String 扩展和导出器三个代表性能力，作为功能索引页的快速落地入口。

---

**最后更新**: 2026-05-08
**维护者**: schema-dsl Team


