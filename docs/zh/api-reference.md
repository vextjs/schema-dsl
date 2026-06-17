# schema-dsl API 参考文档


> **更新时间**: 2026-06-17

---

## 📑 目录

- [dsl() 函数](#dsl-函数)
- [DslBuilder 类](#dslbuilder-类)
- [String 扩展](#string-扩展)
- [包入口与编译期转换](#包入口与编译期转换)
- [Validator 类](#validator-类)
- [导出器](#导出器)
- [工具函数](#工具函数)
- [常量](#常量)
- [v1 兼容根导出](#v1-兼容根导出)
- [完整示例](#完整示例)

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
  - 签名：`(value) => boolean | string | { error, message } | void`
  - 返回 `true` 表示通过
  - 返回 `false`、错误消息字符串或错误对象表示失败
  - 同步验证器由 `validate()` 和 `validateAsync()` 均执行；异步验证器（返回 `Promise`）仅由 `validateAsync()` 执行，`validate()` 调用时会返回明确的同步错误提示

**返回**: **DslBuilder**

**示例**:
```javascript
dsl('string:3-32!')
  .custom((value) => {
    if (value === 'admin') {
      return { error: 'username.exists', message: '用户名已存在' };
    }
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

**注意**: `phone()` 仅适用于 `string` schema。请使用 `dsl('string!').phone('cn')`；在 number schema 上调用会抛错，避免混合残留数字约束和字符串约束。

**示例**:
```javascript
// 推荐写法
dsl('string!').phone('cn')
```

---

#### `.toSchema()`

转换为 JSON Schema 对象（含内部标记）。

**返回**: **Object** - JSON Schema 对象（包含 `_required`、`_customMessages`、`_label` 等 schema-dsl 内部字段）

**示例**:
```javascript
const schema = dsl('email!').label('邮箱').toSchema();
// { type: 'string', format: 'email', _label: '邮箱', _required: true }
```

---

#### `.toJsonSchema()` <sup>v1.2.5+</sup>

转换为纯净的 JSON Schema 对象（无内部标记）。

与 `toSchema()` 不同，`toJsonSchema()` 会自动清理所有 schema-dsl 内部标记：
- **下划线前缀字段**：`_required`、`_customMessages`、`_label`、`_customValidators`、`_whenConditions`
- **自定义验证关键字（直接清除）**：`alphanum`、`lowercase`、`uppercase`、`trim`、`jsonString`、`port`、`requiredAll`、`strictSchema`、`noSparse`、`includesRequired`、`dateFormat`、`dateGreater`、`dateLess`、`precision`
- **`exactLength` 特殊翻译**：不直接清除，而是转换为标准 JSON Schema `{ minLength: N, maxLength: N }`（与 v1 DslBuilder `string:N` 行为兼容）

> ⚠️ `multipleOf` 是标准 JSON Schema 字段，**不会**被清除（v2 修复了 v1 的错误行为）。

返回的对象可直接嵌入 OpenAPI / JSON Schema 等标准文档中，无需下游再做清理。

**返回**: **Object** - 纯净的 JSON Schema 对象

**适用场景**:
- 生成 OpenAPI 文档
- 导出给外部系统消费
- 任何需要标准 JSON Schema 的场景

**示例**:
```javascript
// 对比 toSchema() 与 toJsonSchema()
const builder = dsl('string:3-32!').label('用户名').messages({ min: '至少3个字符' });

builder.toSchema();
// { type: 'string', minLength: 3, maxLength: 32, _required: true, _label: '用户名', _customMessages: { min: '至少3个字符' } }

builder.toJsonSchema();
// { type: 'string', minLength: 3, maxLength: 32 }
// 注意：不含 _required、_label、_customMessages 等内部字段

// string:N 单值语法（exactLength → minLength + maxLength）
const exact = dsl('string:6!');
exact.toSchema();
// { type: 'string', exactLength: 6, _required: true }
exact.toJsonSchema();
// { type: 'string', minLength: 6, maxLength: 6 }
// 注：exactLength 自动翻译为标准 JSON Schema 的 minLength + maxLength（v1 兼容行为）

// enum 示例
const enumBuilder = dsl('enum:admin,user,guest!');
enumBuilder.toJsonSchema();
// { type: 'string', enum: ['admin', 'user', 'guest'] }

// 用于 OpenAPI 文档生成
const schema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:0-120'
});
// 遍历各字段调用 toJsonSchema() 即可获得标准 JSON Schema
```

---

#### `.validate(data)`

验证数据（便捷方法）。

**参数**:
- `data` (**any**) - 待验证数据

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

#### `dsl.match(field, map)`

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

## 运行时辅助函数

### `VERSION`

根模块导出的当前包版本号。该值从 `package.json` 读取，因此会与发布包版本保持一致。

```javascript
const { VERSION } = require('schema-dsl');

console.log(VERSION);
```

---

### `dsl.config(options)`

全局配置入口，在应用启动时调用一次，设置 i18n、缓存、自定义正则和严格类型解析模式。

```javascript
const { dsl } = require('schema-dsl');

dsl.config({
  // i18n：内置语言包路径 / 内联 locale bundle / { localesPath } / { locales }
  i18n: './locales',

  // 默认语言（默认 'en-US'）
  defaultLocale: 'zh-CN',

  // 编译缓存配置
  cache: { maxSize: 2000, ttl: 0, enabled: true },

  // strict: true → 遇到未知类型直接抛出 Error（默认 false：warn + 回退 string）
  strict: true,

  // 追加自定义正则规则（phone / idCard / creditCard 等）
  patterns: {
    phone: { us: /^\+1\d{10}$/ }
  }
});
```

**参数** (`DslConfigOptions`):

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `i18n` | `string \| object` | — | 语言包路径或内联对象 |
| `defaultLocale` | `string` | `'en-US'` | 默认语言 |
| `cache` | `CacheOptions` | — | `maxSize` / `ttl` / `enabled` / `statsEnabled` |
| `strict` | `boolean` | `false` | `true` 时解析未知 DSL 类型抛出 Error |
| `patterns` | `object` | — | 追加自定义格式正则（phone/idCard/creditCard） |

---

### `getDefaultValidator()`

获取顶层 `validate()` / `validateAsync()` 便捷函数内部复用的默认 `Validator` 单例。

```javascript
const { getDefaultValidator } = require('schema-dsl');

const validator = getDefaultValidator();
console.log(validator.getCacheStats());
```

---

### `resetDefaultValidator()`

重置顶层 `validate()` / `validateAsync()` 使用的默认 `Validator` 单例。

```javascript
const { resetDefaultValidator } = require('schema-dsl');

resetDefaultValidator();
```

---

### `resetRuntimeState()`

重置测试、worker 或多租户隔离进程中可能共享的运行时状态：默认 validator 单例、自定义类型、locale 状态、严格解析模式，以及运行期追加的 pattern key。

```javascript
const { resetRuntimeState } = require('schema-dsl');

resetRuntimeState();
```

---

<a id="string-扩展"></a>

### `installStringExtensions(dslFunction?)`

安装或重新安装 String 扩展。root entry 默认已经安装，用于兼容 v1.1.x 的 `'string!'.description(...)` 链式写法；显式调用通常只用于主动卸载后的重新启用，或传入自定义 `dslFunction`。

```javascript
const { installStringExtensions } = require('schema-dsl');

installStringExtensions();
```

---

### `uninstallStringExtensions()`

卸载挂载到 `String.prototype` 上的扩展方法。卸载后如需链式调用，请使用 `dsl('...')` 包裹字符串，或再次调用 `installStringExtensions()`。

```javascript
const { uninstallStringExtensions } = require('schema-dsl');

uninstallStringExtensions();
```

---

## 包入口与编译期转换

### `schema-dsl/pure`

导入同一套核心 API，但不会安装 `String.prototype` 扩展。适合库、worker、测试或对全局原型副作用敏感的隔离运行时。

```javascript
import { dsl, validate, uninstallStringExtensions } from 'schema-dsl/pure';

uninstallStringExtensions();

const schema = dsl({
  email: dsl('email!').description('登录邮箱')
});

const result = validate(schema, { email: 'user@example.com' });
```

---

### `schema-dsl/compat` 与 `schema-dsl/register-string`

`schema-dsl/compat` 保留 v1 兼容 root 行为，导入时会安装 String 扩展。`schema-dsl/register-string` 是显式副作用入口，用于在应用启动阶段主动注册 String 链式 API。

```javascript
import 'schema-dsl/register-string';
import { dsl } from 'schema-dsl/pure';

const schema = dsl({
  email: 'email!'.description('登录邮箱')
});
```

---

### `transformSchemaDsl(source, options?)`

在编译期改写静态 String 链式 DSL 调用，并注入来自 `schema-dsl/pure` 的 `dsl` 导入。默认只改写 schema-dsl 字符串字面量上的 `.description()` 链，例如 `"email!".description("登录邮箱")`；如需更多链式方法，可通过 `methods` 显式开启。

```javascript
import { transformSchemaDsl } from 'schema-dsl/transform';

const result = transformSchemaDsl(
  'export const field = "email!".description("登录邮箱")',
  { filename: 'schema.ts' }
);

console.log(result.changed);
console.log(result.code);
```

**选项**:

| 字段 | 类型 | 默认值 | 说明 |
|------|------|------|------|
| `filename` | `string` | `'<unknown>'` | 用于解析模式、source map 和 warning 的文件名 |
| `sourceMap` | `boolean | 'inline'` | `false` | 启用后生成 source map |
| `importFrom` | `string` | `'schema-dsl/pure'` | 注入 `dsl` helper 时使用的导入来源 |
| `methods` | `readonly string[]` | `['description']` | 允许被编译期改写的链式方法名 |
| `include` | `(filename) => boolean` | - | 可选文件过滤器 |
| `onWarning` | `(warning) => void` | - | 接收解析失败和跳过字面量的 warning |

**返回值**:

```javascript
{
  code: string,
  changed: boolean,
  warnings: Array<{ code: string, message: string, filename?: string, loc?: object }>,
  map?: object
}
```

---

### `schemaDslEsbuildPlugin(options?)`

把 `transformSchemaDsl()` 接入 esbuild 插件流程。`esbuild` 是可选 peer dependency，只有使用该适配器的项目需要安装。

```javascript
import { build } from 'esbuild';
import { schemaDslEsbuildPlugin } from 'schema-dsl/esbuild';

await build({
  entryPoints: ['src/schema.ts'],
  bundle: true,
  outfile: 'dist/schema.js',
  plugins: [schemaDslEsbuildPlugin()]
});
```

该适配器只转换 `file` namespace 下的 JavaScript/TypeScript 源文件，跳过 `node_modules`，并把虚拟模块交给其所属插件处理。

---

## Validator 类

**参数**:
- `options` (**Object**, 可选) - Validator 配置项

### 方法

#### `.compile(schema, cacheKey?)`

编译 Schema 为 AJV 验证函数。

**参数**:
- `schema` (**Object**) - JSON Schema
- `cacheKey` (**string** | **null**, 可选) - 缓存键

**返回**: **Function** - AJV 验证函数

**示例**:
```javascript
const validator = new Validator();
const validate = validator.compile(schema, 'user-schema');
const ok = validate(data);
```

---

#### `.validate(schema, data, options?)`

同步验证。

**参数**:
- `schema` (**Object** | **Function**) - JSON Schema 或已编译的验证函数
- `data` (**any**) - 待验证数据
- `options` (**Object**, 可选) - 验证选项

**返回**: **Object**
- `valid` (**boolean**) - 是否通过
- `errors` (**Array**, 可选) - 错误列表
- `data` (**any**, 可选) - 经过处理后的数据

**示例**:
```javascript
const validator = new Validator();
const result = validator.validate(schema, payload);
console.log(result.valid);
```

---

#### `.validateAsync(schema, data, options?)`

异步验证。验证失败时抛出 `ValidationError`。

**参数**:
- `schema` (**Object** | **Function**) - JSON Schema 或已编译的验证函数
- `data` (**any**) - 待验证数据
- `options` (**Object**, 可选) - 验证选项

**返回**: **Promise<any>** - 验证通过后的数据

**示例**:
```javascript
const validator = new Validator();
await validator.validateAsync(schema, payload);
```

---

#### `.validateBatch(schema, dataArray)`

批量验证。Schema 只编译一次，多次复用。

**参数**:
- `schema` (**Object**) - JSON Schema
- `dataArray` (**Array**) - 待验证数据数组

**返回**: **Array<Object>** - 每项对应一个验证结果

**示例**:
```javascript
const validator = new Validator();
const results = validator.validateBatch(schema, records);
```

---

#### `.addKeyword(keyword, definition)`

添加 AJV 自定义关键字。

**参数**:
- `keyword` (**string**) - 关键字名称
- `definition` (**Object**) - AJV 关键字定义

**返回**: **Validator**

**示例**:
```javascript
const validator = new Validator();
validator.addKeyword('isEven', {
  type: 'number',
  validate: (_schema, data) => data % 2 === 0
});
```

---

#### `.addFormat(name, validator)`

添加 AJV 自定义格式。

**参数**:
- `name` (**string**) - 格式名称
- `validator` (**Function** | **Object**) - AJV format 定义

**返回**: **Validator**

**示例**:
```javascript
const validator = new Validator();
validator.addFormat('phone-cn', /^1[3-9]\d{9}$/);
```

---

#### `.addSchema(uri, schema)`

添加 schema 引用。

**参数**:
- `uri` (**string**) - schema 标识
- `schema` (**Object**) - JSON Schema

**返回**: **Validator**

**示例**:
```javascript
const validator = new Validator();
validator.addSchema('user.schema.json', schema);
```

---

#### `.removeSchema(uri)`

删除 schema 引用。

**参数**:
- `uri` (**string**) - schema 标识

**返回**: **Validator**

**示例**:
```javascript
const validator = new Validator();
validator.removeSchema('user.schema.json');
```

---

#### `.getAjv()`

获取底层 AJV 实例。

**返回**: **Ajv**

**示例**:
```javascript
const validator = new Validator();
const ajv = validator.getAjv();
```

---

#### `.clearCache()`

清空编译缓存。

**返回**: `void`

**示例**:
```javascript
const validator = new Validator();
validator.clearCache();
```

---

#### `.getCacheStats()`

获取缓存统计信息。

**返回**: **Object**

**示例**:
```javascript
const validator = new Validator();
console.log(validator.getCacheStats());
```

---

### 静态方法

#### `Validator.create(options?)`

创建 `Validator` 实例。

**返回**: **Validator**

**示例**:
```javascript
const validator = Validator.create();
```

---

#### `Validator.quickValidate(schema, data)`

快速验证。

**参数**:
- `schema` (**Object**) - JSON Schema
- `data` (**any**) - 待验证数据

**返回**: **boolean**

**示例**:
```javascript
const ok = Validator.quickValidate(schema, data);
```

---

## 导出器

### BaseExporter

用于自定义导出器子类的抽象基类。内置导出器继承它的通用 options 保存和 schema 断言辅助方法；业务代码通常直接使用 `MongoDBExporter`、`MySQLExporter`、`PostgreSQLExporter` 或 `MarkdownExporter`。

```javascript
const { BaseExporter } = require('schema-dsl');

console.log(typeof BaseExporter); // 'function'
```

---

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
const ddl = exporter.export('users', jsonSchema);
```

**方法**:
- `export(tableName, schema)` - 导出为MySQL DDL

---

### PostgreSQLExporter

导出为 PostgreSQL DDL。

```javascript
const { PostgreSQLExporter } = require('schema-dsl');

const exporter = new PostgreSQLExporter();
const ddl = exporter.export('users', jsonSchema);
```

**方法**:
- `export(tableName, schema)` - 导出为PostgreSQL DDL

---

## 工具函数

### TypeConverter

类型转换工具。

```javascript
const { TypeConverter } = require('schema-dsl');

TypeConverter.toJSONSchemaType('string');
TypeConverter.toMongoDBType('integer');
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

### ErrorFormatter

验证错误格式化工具，用于把 Ajv 原始错误数组或简化错误对象转换成统一的错误项结构或消息文本。

```javascript
const { ErrorFormatter } = require('schema-dsl');

const formatter = new ErrorFormatter('zh-CN');
const errors = formatter.formatDetailed(ajvValidate.errors);
console.log(errors[0].message);
```

**方法**:
- `new ErrorFormatter(locale?, messages?)` - 创建错误格式化器
- `format(error, locale?)` - 格式化单个错误为消息字符串
- `formatDetailed(errors, locale?, customMessages?, alreadyMerged?)` - 格式化错误数组为标准错误项列表

---

### MessageTemplate

错误消息模板封装类，内部委托 `renderTemplate()` 执行占位符替换。

```javascript
const { MessageTemplate } = require('schema-dsl');

const template = new MessageTemplate('{{#label}} is required');
console.log(template.render({ label: 'Email' }));
```

**方法**:
- `new MessageTemplate(template)` - 创建模板实例
- `render(context)` - 渲染当前模板
- `MessageTemplate.render(template, context)` - 静态快速渲染
- `MessageTemplate.renderBatch(templates, context)` - 批量渲染多个模板

---

### renderTemplate(template, params)

底层模板渲染函数，同时兼容 `{{#key}}` 和 `{key}` 两种占位符格式。

```javascript
const { renderTemplate } = require('schema-dsl');

const msg = renderTemplate('{field} must be {min}~{max}', {
  field: 'age',
  min: 18,
  max: 65,
});

console.log(msg); // age must be 18~65
```

---

### JSONSchemaCore

`JSONSchemaCore` 是 v1 兼容外观类，用于以链式方式构建 JSON Schema，并可直接调用 `validate()` 做快速校验。

```javascript
const { JSONSchemaCore } = require('schema-dsl');

const schema = new JSONSchemaCore()
  .type('object')
  .property('email', { type: 'string', format: 'email' })
  .required('email')
  .getSchema();
```

**常用方法**:
- `type(typeName)`
- `property(name, schema)`
- `properties(properties)`
- `required(fields)`
- `format(formatName)`
- `pattern(pattern)`
- `items(schema)`
- `toSchema()` / `getSchema()`
- `validate(data)`

---

### 类型注册与内部解析边界

`schema-dsl` 的 root API 只保留业务可依赖的稳定入口。DSL 解析器、约束解析器、Schema 编译器和 Adapter 属于内部实现细节，不再作为 root API 文档化导出；业务代码应优先使用 `dsl()`、`DslBuilder`、`Validator` 和 `validate()`。

#### TypeRegistry

统一类型注册表。它是自定义类型扩展的公开入口；如果只需要注册 DSL 类型，也可以优先使用更高层的 `DslBuilder.registerType()`。

- `TypeRegistry.resolve(typeName)`
- `TypeRegistry.register(name, def)`
- `TypeRegistry.registerDynamic(name, factory)`
- `TypeRegistry.unregister(name)`
- `DslBuilder.unregisterType(name)` — 同时从 Builder 侧自定义类型表和 `TypeRegistry` 移除一个自定义类型
- `TypeRegistry.has(typeName)`
- `TypeRegistry.getInternalKeys()`
- `TypeRegistry.toJsonSchema(schema)`
- `TypeRegistry.clearCustomTypes()` — 清空所有自定义类型（含通过 `TypeRegistry.register()` / `DslBuilder.registerType()` 注册的类型），适合测试后清理状态
- `TypeRegistry.setStrict(flag)` — 设置严格模式，等效于 `dsl.config({ strict: flag })`

---

## DSL 语法快速参考

### 基本类型

```text
string, number, integer, boolean
email, url, uuid, date, datetime
```

### 约束

```text
string:N            # 精确长度（exactLength = N，等同于 minLength: N, maxLength: N）
string:min-max      # 字符串长度范围
number:min-max      # 数字范围
value1|value2       # 枚举
!                   # 必填
```

### 数组

```text
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

### `VERSION`

与 `package.json` 版本一致的字符串导出。

```javascript
const { VERSION } = require('schema-dsl');

console.log(VERSION);
```

---

### `VALIDATION`, `CACHE`, `FORMATS`, `CONSTANTS`

命名常量以及聚合命名空间 `CONSTANTS`。常规代码可优先使用命名导出；需要遍历所有常量分组时可使用 `CONSTANTS`。

```javascript
const { VALIDATION, CACHE, FORMATS, CONSTANTS } = require('schema-dsl');

console.log(VALIDATION.MAX_RECURSION_DEPTH);
console.log(CACHE.ENABLED);
console.log(FORMATS.BUILT_IN.includes('email'));
console.log(CONSTANTS.FORMATS === FORMATS);
```

---

### `PATTERNS`, `PATTERN_IPV4`, `PATTERN_IPV6`

可复用的正则分组和 IPv4/IPv6 辅助正则，供内置 format 与自定义验证场景使用。

```javascript
const { PATTERNS, PATTERN_IPV4, PATTERN_IPV6 } = require('schema-dsl');

console.log(Object.keys(PATTERNS.phone));
console.log(PATTERN_IPV4.test('127.0.0.1'));
console.log(PATTERN_IPV6.test('::1'));
```

---

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

### ConditionalBuilder

`dsl.if(conditionFn)` 返回的链式条件构建器，适用于运行时动态条件校验。

**常用方法**:
- `if(condition)`
- `and(condition)`
- `or(condition)`
- `elseIf(condition)`
- `message(msg)`
- `then(schema)`
- `else(schema)`
- `toSchema()`
- `build()` - `toSchema()` 的别名
- `validate(data, options?)`
- `validateAsync(data, options?)`
- `assert(data, options?)`
- `check(data)`

更完整的示例和行为说明请参考 [conditional-api.md](./conditional-api.md)。

---

## v1 兼容根导出

v2 是基于 v1 JavaScript 线的 TypeScript 重构。以下根导出仍属于兼容面，即使大多数业务代码会通过更高层 API 间接使用它们。

| 导出 | 用途 | 更多说明 |
|------|------|----------|
| `VERSION` | 与 `package.json` 对齐的运行时包版本字符串。 | 本页 |
| `CONSTANTS` | 验证、缓存、格式和插件常量命名空间；`VALIDATION`、`CACHE`、`FORMATS`、`PATTERNS`、`PATTERN_IPV4`、`PATTERN_IPV6` 等也提供命名导出。 | 本页 |
| `BaseExporter` | 自定义导出器子类使用的抽象基类。 | 本页 |
| `CacheManager` | `Validator` 使用的 LRU/TTL 缓存，也可用于手动缓存场景。 | [cache-manager.md](./cache-manager.md) |
| `CustomKeywords` | 注册 schema-dsl 自定义 AJV 关键字。多数应用通过 `Validator` 间接使用。 | [add-keyword.md](./add-keyword.md) |
| `I18nError` | 国际化业务错误工具，提供 `create()`、`throw()`、`assert()`、`is()` 和 `toJSON()`。 | [error-handling.md](./error-handling.md) |
| `PluginManager` | v1 兼容插件流程使用的插件注册与 hook 管理器。 | [plugin-system.md](./plugin-system.md) |
| `resetRuntimeState` | 用于测试和 worker 清理的全局运行时状态重置工具。 | 本页 |

对应示例 [api-reference.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/api-reference.ts) 会运行这些导出，`npm run examples:run` 可用于捕获 API reference 漂移。

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
- [示例代码](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/api-reference.ts)
- [GitHub](https://github.com/vextjs/schema-dsl)

---

## 对应示例文件

**示例入口**: [api-reference.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/api-reference.ts)  
**说明**: 覆盖 `dsl()`、`validate()`、`validateAsync()`、默认 `Validator` 单例、`CacheManager`、`CustomKeywords`、`I18nError`、`PluginManager`、`CONSTANTS`、模板渲染、`JSONSchemaCore`、`ErrorFormatter`、`ObjectDslBuilder` 与 `TypeRegistry` 等公开 API 的可运行调用链。

---

**最后更新**: 2026-06-17

