# SchemaIO API 参考文档


> **更新时间**: 2025-12-25  

---

## 📑 目录

- [dsl() 函数](#dsl-函数)
- [DslBuilder 类](#dslbuilder-类)
- [String 扩展](#string-扩展)
- [Validator 类](#validator-类)
- [导出器](#导出器)
- [工具函数](#工具函数)

---

## dsl() 函数

### 描述

DSL 主入口函数，支持字符串和对象两种定义方式。

### 语法

```javascript
dsl(definition: string | object): DslBuilder | JSONSchema
```

### 参数

- `definition` (**string** | **object**) - DSL定义
  - 字符串：返回 DslBuilder 实例（可链式调用）
  - 对象：返回 JSON Schema 对象

### 返回值

- **DslBuilder** - 当参数为字符串时
- **Object** - 当参数为对象时（JSON Schema）

### 示例

```javascript
// 字符串：返回 DslBuilder
const builder = dsl('email!');
builder.pattern(/custom/).label('邮箱');

// 对象：返回 JSON Schema
const schema = dsl({
  username: 'string:3-32!',
  email: 'email!'
});
```

---

## DslBuilder 类

### 描述

Schema 构建器类，支持链式调用添加验证规则。

### 构造函数

```javascript
new DslBuilder(dslString: string)
```

**参数**:
- `dslString` (**string**) - DSL字符串，如 `'string:3-32!'`

### 方法

#### `.pattern(regex, message?)`

添加正则表达式验证。

**参数**:
- `regex` (**RegExp** | **string**) - 正则表达式
- `message` (**string**, 可选) - 自定义错误消息

**返回**: **DslBuilder**

**示例**:
```javascript
dsl('string:3-32!')
  .pattern(/^[a-zA-Z0-9_]+$/, '只能包含字母、数字和下划线')
```

---

#### `.label(text)`

设置字段标签（用于错误消息）。

**参数**:
- `text` (**string**) - 标签文本

**返回**: **DslBuilder**

**示例**:
```javascript
dsl('email!').label('邮箱地址')
```

---

#### `.messages(messages)`

自定义错误消息。

**参数**:
- `messages` (**Object**) - 错误消息对象
  - 键：错误代码（如 `'string.min'`）
  - 值：错误消息模板

**返回**: **DslBuilder**

**示例**:
```javascript
dsl('string:3-32!')
  .messages({
    'min': '至少{{#limit}}个字符',
    'max': '最多{{#limit}}个字符'
  })
```

---

#### `.description(text)`

设置字段描述。

**参数**:
- `text` (**string**) - 描述文本

**返回**: **DslBuilder**

**示例**:
```javascript
dsl('url').description('个人主页链接')
```

---

#### `.custom(validator)`

添加自定义验证器。

**参数**:
- `validator` (**Function**) - 验证函数
  - 签名：`(value) => boolean | Promise<boolean> | { error, message }`
  - 返回 `true` 表示通过
  - 返回 `false` 或错误对象表示失败

**返回**: **DslBuilder**

**示例**:
```javascript
dsl('string:3-32!')
  .custom(async (value) => {
    const exists = await checkUsernameExists(value);
    if (exists) {
      return { error: 'username.exists', message: '用户名已存在' };
    }
    return true;
  })
```


---

#### `.default(value)`

设置默认值。

**参数**:
- `value` (**any**) - 默认值

**返回**: **DslBuilder**

**示例**:
```javascript
dsl('string').default('guest')
```

---

#### `.username(preset?)`

用户名验证（自动设置长度和正则）。

**参数**:
- `preset` (**string** | **Object**, 可选) - 预设配置
  - 字符串：`'short'` | `'medium'` | `'long'` | `'5-20'`
  - 对象：`{ minLength, maxLength, allowUnderscore, allowNumber }`
  - 默认值：`'medium'` (3-32位)

**返回**: **DslBuilder**

**示例**:
```javascript
// 默认 medium (3-32位)
dsl('string!').username()

// 自定义范围
dsl('string!').username('5-20')

// 使用预设
dsl('string!').username('short')  // 3-16位
```

---

#### `.password(strength?)`

密码强度验证（自动设置长度和正则）。

**参数**:
- `strength` (**string**, 可选) - 强度级别
  - `'weak'` - 最少6位
  - `'medium'` - 8位，字母+数字（默认）
  - `'strong'` - 8位，大小写+数字
  - `'veryStrong'` - 10位，大小写+数字+特殊字符

**返回**: **DslBuilder**

**示例**:
```javascript
dsl('string!').password('strong')
```

---

#### `.phone(country?)`

手机号验证（自动设置长度和正则）。

**参数**:
- `country` (**string**, 可选) - 国家代码
  - `'cn'` - 中国（默认）
  - `'us'` - 美国
  - `'uk'` - 英国
  - `'hk'` - 香港
  - `'tw'` - 台湾
  - `'international'` - 国际格式

**返回**: **DslBuilder**

**注意**: 自动将类型纠正为 `string`（即使写成 `number` 也会自动修正）

**示例**:
```javascript
// 推荐写法
dsl('string!').phone('cn')

// 自动纠正：number → string
dsl('number!').phone('cn')  // 自动纠正为 string
```

---

#### `.toSchema()`

转换为 JSON Schema 对象。

**返回**: **Object** - JSON Schema对象

**示例**:
```javascript
const schema = dsl('email!').label('邮箱').toSchema();
// { type: 'string', format: 'email', _label: '邮箱', _required: true }
```

---

#### `.validate(data, context?)`

验证数据（便捷方法）。

**参数**:
- `data` (**any**) - 待验证数据
- `context` (**Object**, 可选) - 验证上下文

**返回**: **Promise<Object>** - 验证结果
  - `valid` (**boolean**) - 是否通过
  - `errors` (**Array**, 可选) - 错误列表
  - `data` (**any**, 可选) - 验证通过的数据

**示例**:
```javascript
const result = await dsl('email!').validate('user@example.com');
console.log(result.valid); // true
```

---

### 静态方法 

#### `dsl.match(field, map)```

创建条件验证规则（类似 switch-case）。

**参数**:
- `field` (**string**) - 依赖的字段名
- `map` (**Object**) - 值与Schema的映射
  - `[value: string]`: 对应的Schema
  - `_default` (**optional**): 默认Schema

**返回**: **Object** - 内部Match结构

**示例**:
```javascript
dsl.match('type', {
  email: 'email!',
  phone: 'string:11!',
  _default: 'string'
})
```

#### `dsl.if(condition, thenSchema, elseSchema)`

创建简单的条件验证规则。

**参数**:
- `condition` (**string**) - 条件字段名
- `thenSchema` (**string|Object**) - 满足条件时的Schema
- `elseSchema` (**string|Object**, 可选) - 不满足条件时的Schema

**返回**: **Object** - 内部If结构

**示例**:
```javascript
dsl.if('isVip', 'number:0-50', 'number:0-10')
```

---

## DslBuilder 类

### 描述

Schema 构建器类，支持链式调用添加验证规则。

### 构造函数

```javascript
new DslBuilder(dslString: string)
```

**参数**:
- `dslString` (**string**) - DSL字符串，如 `'string:3-32!'`

### 方法

#### `.pattern(regex, message?)`

添加正则表达式验证。

**参数**:
- `regex` (**RegExp** | **string**) - 正则表达式
- `message` (**string**, 可选) - 自定义错误消息

**返回**: **DslBuilder**

**示例**:
```javascript
dsl('string:3-32!')
  .pattern(/^[a-zA-Z0-9_]+$/, '只能包含字母、数字和下划线')
```

---

#### `.label(text)`

设置字段标签（用于错误消息）。

**参数**:
- `text` (**string**) - 标签文本

**返回**: **DslBuilder**

**示例**:
```javascript
dsl('email!').label('邮箱地址')
```

---

#### `.messages(messages)`

自定义错误消息。

**参数**:
- `messages` (**Object**) - 错误消息对象
  - 键：错误代码（如 `'string.min'`）
  - 值：错误消息模板

**返回**: **DslBuilder**

**示例**:
```javascript
dsl('string:3-32!')
  .messages({
    'string.min': '至少{{#limit}}个字符',
    'string.max': '最多{{#limit}}个字符'
  })
```

---

#### `.description(text)`

设置字段描述。

**参数**:
- `text` (**string**) - 描述文本

**返回**: **DslBuilder**

**示例**:
```javascript
dsl('url').description('个人主页链接')
```

---

#### `.custom(validator)`

添加自定义验证器。

**参数**:
- `validator` (**Function**) - 验证函数
  - 签名：`(value) => boolean | Promise<boolean> | { error, message }`
  - 返回 `true` 表示通过
  - 返回 `false` 或错误对象表示失败

**返回**: **DslBuilder**

**示例**:
```javascript
dsl('string:3-32!')
  .custom(async (value) => {
    const exists = await checkUsernameExists(value);
    if (exists) {
      return { error: 'username.exists', message: '用户名已存在' };
    }
    return true;
  })
```

---

#### `.when(refField, options)`

条件验证（根据其他字段值动态验证）。

**参数**:
- `refField` (**string**) - 引用字段名
- `options` (**Object**) - 条件选项
  - `is` (**any**) - 期望值
  - `then` (**DslBuilder** | **Object**) - 满足条件时的Schema
  - `otherwise` (**DslBuilder** | **Object**, 可选) - 不满足时的Schema

**返回**: **DslBuilder**

**示例**:
```javascript
dsl('string')
  .when('contactType', {
    is: 'email',
    then: dsl('email!'),
    otherwise: dsl('string').pattern(/^\d{11}$/)
  })
```

---

#### `.default(value)`

设置默认值。

**参数**:
- `value` (**any**) - 默认值

**返回**: **DslBuilder**

**示例**:
```javascript
dsl('string').default('guest')
```

---

#### `.username(preset?)`

用户名验证（自动设置长度和正则）。

**参数**:
- `preset` (**string** | **Object**, 可选) - 预设配置
  - 字符串：`'short'` | `'medium'` | `'long'` | `'5-20'`
  - 对象：`{ minLength, maxLength, allowUnderscore, allowNumber }`
  - 默认值：`'medium'` (3-32位)

**返回**: **DslBuilder**

**示例**:
```javascript
// 默认 medium (3-32位)
dsl('string!').username()

// 自定义范围
dsl('string!').username('5-20')

// 使用预设
dsl('string!').username('short')  // 3-16位
```

---

#### `.password(strength?)`

密码强度验证（自动设置长度和正则）。

**参数**:
- `strength` (**string**, 可选) - 强度级别
  - `'weak'` - 最少6位
  - `'medium'` - 8位，字母+数字（默认）
  - `'strong'` - 8位，大小写+数字
  - `'veryStrong'` - 10位，大小写+数字+特殊字符

**返回**: **DslBuilder**

**示例**:
```javascript
dsl('string!').password('strong')
```

---

#### `.phone(country?)`

手机号验证（自动设置长度和正则）。

**参数**:
- `country` (**string**, 可选) - 国家代码
  - `'cn'` - 中国（默认）
  - `'us'` - 美国
  - `'uk'` - 英国
  - `'hk'` - 香港
  - `'tw'` - 台湾
  - `'international'` - 国际格式

**返回**: **DslBuilder**

**注意**: 自动将类型纠正为 `string`（即使写成 `number` 也会自动修正）

**示例**:
```javascript
// 推荐写法
dsl('string!').phone('cn')

// 自动纠正：number → string
dsl('number!').phone('cn')  // 自动纠正为 string
```

---

#### `.toSchema()`

转换为 JSON Schema 对象。

**返回**: **Object** - JSON Schema对象

**示例**:
```javascript
const schema = dsl('email!').label('邮箱').toSchema();
// { type: 'string', format: 'email', _label: '邮箱', _required: true }
```

---

#### `.validate(data, context?)`

验证数据（便捷方法）。

**参数**:
- `data` (**any**) - 待验证数据
- `context` (**Object**, 可选) - 验证上下文

**返回**: **Promise<Object>** - 验证结果
  - `valid` (**boolean**) - 是否通过
  - `errors` (**Array**, 可选) - 错误列表
  - `data` (**any**, 可选) - 验证通过的数据

**示例**:
```javascript
const result = await dsl('email!').validate('user@example.com');
console.log(result.valid); // true
```

---

### 静态方法 

#### `dsl.match(field, map)```

创建条件验证规则（类似 switch-case）。

**参数**:
- `field` (**string**) - 依赖的字段名
- `map` (**Object**) - 值与Schema的映射
  - `[value: string]`: 对应的Schema
  - `_default` (**optional**): 默认Schema

**返回**: **Object** - 内部Match结构

**示例**:
```javascript
dsl.match('type', {
  email: 'email!',
  phone: 'string:11!',
  _default: 'string'
})
```

#### `dsl.if(condition, thenSchema, elseSchema)`

创建简单的条件验证规则。

**参数**:
- `condition` (**string**) - 条件字段名
- `thenSchema` (**string|Object**) - 满足条件时的Schema
- `elseSchema` (**string|Object**, 可选) - 不满足条件时的Schema

**返回**: **Object** - 内部If结构

**示例**:
```javascript
dsl.if('isVip', 'number:0-50', 'number:0-10')
```

---

## DslBuilder 类

### 描述

Schema 构建器类，支持链式调用添加验证规则。

### 构造函数

```javascript
new DslBuilder(dslString: string)
```

**参数**:
- `dslString` (**string**) - DSL字符串，如 `'string:3-32!'`

### 方法

#### `.pattern(regex, message?)`

添加正则表达式验证。

**参数**:
- `regex` (**RegExp** | **string**) - 正则表达式
- `message` (**string**, 可选) - 自定义错误消息

**返回**: **DslBuilder**

**示例**:
```javascript
dsl('string:3-32!')
  .pattern(/^[a-zA-Z0-9_]+$/, '只能包含字母、数字和下划线')
```

---

#### `.label(text)`

设置字段标签（用于错误消息）。

**参数**:
- `text` (**string**) - 标签文本

**返回**: **DslBuilder**

**示例**:
```javascript
dsl('email!').label('邮箱地址')
```

---

#### `.messages(messages)`

自定义错误消息。

**参数**:
- `messages` (**Object**) - 错误消息对象
  - 键：错误代码（如 `'string.min'`）
  - 值：错误消息模板

**返回**: **DslBuilder**

**示例**:
```javascript
dsl('string:3-32!')
  .messages({
    'string.min': '至少{{#limit}}个字符',
    'string.max': '最多{{#limit}}个字符'
  })
```

---

#### `.description(text)`

设置字段描述。

**参数**:
- `text` (**string**) - 描述文本

**返回**: **DslBuilder**

**示例**:
```javascript
dsl('url').description('个人主页链接')
```

---

#### `.custom(validator)`

添加自定义验证器。

**参数**:
- `validator` (**Function**) - 验证函数
  - 签名：`(value) => boolean | Promise<boolean> | { error, message }`
  - 返回 `true` 表示通过
  - 返回 `false` 或错误对象表示失败

**返回**: **DslBuilder**

**示例**:
```javascript
dsl('string:3-32!')
  .custom(async (value) => {
    const exists = await checkUsernameExists(value);
    if (exists) {
      return { error: 'username.exists', message: '用户名已存在' };
    }
    return true;
  })
```

---

#### `.when(refField, options)`

条件验证（根据其他字段值动态验证）。

**参数**:
- `refField` (**string**) - 引用字段名
- `options` (**Object**) - 条件选项
  - `is` (**any**) - 期望值
  - `then` (**DslBuilder** | **Object**) - 满足条件时的Schema
  - `otherwise` (**DslBuilder** | **Object**, 可选) - 不满足时的Schema

**返回**: **DslBuilder**

**示例**:
```javascript
dsl('string')
  .when('contactType', {
    is: 'email',
    then: dsl('email!'),
    otherwise: dsl('string').pattern(/^\d{11}$/)
  })
```

---

#### `.default(value)`

设置默认值。

**参数**:
- `value` (**any**) - 默认值

**返回**: **DslBuilder**

**示例**:
```javascript
dsl('string').default('guest')
```

---

#### `.username(preset?)`

用户名验证（自动设置长度和正则）。

**参数**:
- `preset` (**string** | **Object**, 可选) - 预设配置
  - 字符串：`'short'` | `'medium'` | `'long'` | `'5-20'`
  - 对象：`{ minLength, maxLength, allowUnderscore, allowNumber }`
  - 默认值：`'medium'` (3-32位)

**返回**: **DslBuilder**

**示例**:
```javascript
// 默认 medium (3-32位)
dsl('string!').username()

// 自定义范围
dsl('string!').username('5-20')

// 使用预设
dsl('string!').username('short')  // 3-16位
```

---

#### `.password(strength?)`

密码强度验证（自动设置长度和正则）。

**参数**:
- `strength` (**string**, 可选) - 强度级别
  - `'weak'` - 最少6位
  - `'medium'` - 8位，字母+数字（默认）
  - `'strong'` - 8位，大小写+数字
  - `'veryStrong'` - 10位，大小写+数字+特殊字符

**返回**: **DslBuilder**

**示例**:
```javascript
dsl('string!').password('strong')
```

---

#### `.phone(country?)`

手机号验证（自动设置长度和正则）。

**参数**:
- `country` (**string**, 可选) - 国家代码
  - `'cn'` - 中国（默认）
  - `'us'` - 美国
  - `'uk'` - 英国
  - `'hk'` - 香港
  - `'tw'` - 台湾
  - `'international'` - 国际格式

**返回**: **DslBuilder**

**注意**: 自动将类型纠正为 `string`（即使写成 `number` 也会自动修正）

**示例**:
```javascript
// 推荐写法
dsl('string!').phone('cn')

// 自动纠正：number → string
dsl('number!').phone('cn')  // 自动纠正为 string
```

---

#### `.toSchema()`

转换为 JSON Schema 对象。

**返回**: **Object** - JSON Schema对象

**示例**:
```javascript
const schema = dsl('email!').label('邮箱').toSchema();
// { type: 'string', format: 'email', _label: '邮箱', _required: true }
```

---

#### `.validate(data, context?)`

验证数据（便捷方法）。

**参数**:
- `data` (**any**) - 待验证数据
- `context` (**Object**, 可选) - 验证上下文

**返回**: **Promise<Object>** - 验证结果
  - `valid` (**boolean**) - 是否通过
  - `errors` (**Array**, 可选) - 错误列表
  - `data` (**any**, 可选) - 验证通过的数据

**示例**:
```javascript
const result = await dsl('email!').validate('user@example.com');
console.log(result.valid); // true
```

---

### 静态方法 

#### `dsl.match(field, map)```

创建条件验证规则（类似 switch-case）。

**参数**:
- `field` (**string**) - 依赖的字段名
- `map` (**Object**) - 值与Schema的映射
  - `[value: string]`: 对应的Schema
  - `_default` (**optional**): 默认Schema

**返回**: **Object** - 内部Match结构

**示例**:
```javascript
dsl.match('type', {
  email: 'email!',
  phone: 'string:11!',
  _default: 'string'
})
```

#### `dsl.if(condition, thenSchema, elseSchema)`

创建简单的条件验证规则。

**参数**:
- `condition` (**string**) - 条件字段名
- `thenSchema` (**string|Object**) - 满足条件时的Schema
- `elseSchema` (**string|Object**, 可选) - 不满足条件时的Schema

**返回**: **Object** - 内部If结构

**示例**:
```javascript
dsl.if('isVip', 'number:0-50', 'number:0-10')
```

---

## 导出器

### MongoDBExporter

导出为 MongoDB 验证Schema。

```javascript
const { MongoDBExporter } = require('schema-dsl');

const exporter = new MongoDBExporter({ strict: true });
const mongoSchema = exporter.export(jsonSchema);
const command = exporter.generateCommand('users', jsonSchema);
```

**方法**:
- `export(schema)` - 导出为MongoDB Schema
- `generateCommand(collection, schema)` - 生成 createCollection 命令

---

### MySQLExporter

导出为 MySQL DDL。

```javascript
const { MySQLExporter } = require('schema-dsl');

const exporter = new MySQLExporter();
const ddl = exporter.export(jsonSchema, { tableName: 'users' });
```

**方法**:
- `export(schema, options)` - 导出为MySQL DDL

---

### PostgreSQLExporter

导出为 PostgreSQL DDL。

```javascript
const { PostgreSQLExporter } = require('schema-dsl');

const exporter = new PostgreSQLExporter();
const ddl = exporter.export(jsonSchema, { tableName: 'users' });
```

**方法**:
- `export(schema, options)` - 导出为PostgreSQL DDL

---

## 工具函数

### TypeConverter

类型转换工具。

```javascript
const { TypeConverter } = require('schema-dsl');

TypeConverter.toJSONSchema(dslSchema);
```

---

### SchemaHelper

Schema辅助工具。

```javascript
const { SchemaHelper } = require('schema-dsl');

SchemaHelper.merge(schema1, schema2);
SchemaHelper.clone(schema);
```

---

## DSL 语法快速参考

### 基本类型

```
string, number, integer, boolean
email, url, uuid, date, datetime
```

### 约束

```
string:min-max      # 字符串长度
number:min-max      # 数字范围
value1|value2       # 枚举
!                   # 必填
```

### 数组

```
array<type>         # 数组
array<string:1-50>  # 带约束的数组元素
```

### 示例

```javascript
'string:3-32!'              // 必填字符串，长度3-32
'email!'                    // 必填邮箱
'number:18-120'             // 可选数字，范围18-120
'active|inactive|pending'   // 枚举
'array<string:1-20>'        // 字符串数组
```

---

## 常量

### ErrorCodes

错误代码常量。

```javascript
const { ErrorCodes } = require('schema-dsl');

console.log(ErrorCodes.STRING_MIN);     // 'string.min'
console.log(ErrorCodes.NUMBER_RANGE);   // 'number.range'
```

---

### Locale

多语言支持。

```javascript
const { Locale } = require('schema-dsl');

Locale.setLocale('zh-CN');  // 设置中文
Locale.setLocale('en-US');  // 设置英文
```

---

## 完整示例

```javascript
const { dsl, Validator } = require('schema-dsl');

// 定义Schema（使用String扩展）
const userSchema = dsl({
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({
      'string.pattern': '只能包含字母、数字和下划线'
    })
    .label('用户名'),
  
  email: 'email!'
    .label('邮箱地址'),
  
  password: 'string:8-64!'
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .label('密码'),
  
  age: 'number:18-120',
  role: 'user|admin|moderator'
});

// 验证数据
const validator = new Validator();
const result = validator.validate(userSchema, {
  username: 'john_doe',
  email: 'john@example.com',
  password: 'Password123',
  age: 25,
  role: 'user'
});

console.log(result.valid); // true
```

---

## 更多资源

- [DSL 语法完整指南](./dsl-syntax.md)
- [错误处理](./error-handling.md)
- [示例代码](../examples/)
- [GitHub](https://github.com/yourname/schema-dsl)

---

**文档版本**: v2.0.1  
**最后更新**: 2025-12-25


