# 自定义扩展指南

> **版本**: 2.0.11
> **更新日期**: 2026-06-17
> **用途**: 说明当前版本推荐的运行时扩展方式，以及在维护 schema-dsl 自身源码时如何继续深入扩展

---

## 📑 目录

- [快速开始](#快速开始)
- [添加自定义AJV关键字](#添加自定义ajv关键字)
- [注册自定义 DSL 类型](#注册自定义-dsl-类型)
- [封装预定义模式](#封装预定义模式)
- [多语言支持](#多语言支持)
- [完整示例](#完整示例)

---

## 快速开始

schema-dsl采用模块化设计，你可以轻松扩展：

1. **`Validator.addKeyword()`** - 运行时注册自定义 AJV 关键字
2. **`TypeRegistry.register()` / `DslBuilder.registerType()`** - 注册自定义 DSL 类型
3. **`PluginManager` + `schema-dsl/plugins/*`** - 组合插件、hook 与官方插件入口
4. **`Locale.addLocale()` / `dsl.config({ i18n })`** - 扩展多语言消息
5. **`transformSchemaDsl({ additionalMethods })` + `schema-dsl/string-types`** - 编译期 String 链式自定义方法与显式 TypeScript 提示
6. **`schema-dsl/runtime` 的 `createRuntime()`** - 为框架或租户隔离自定义类型、pattern 和消息

## 当前版本推荐路径

> ⚠️ 如果你是把 `schema-dsl` 当成依赖使用，优先通过公开运行时 API 扩展，而不是直接修改 `src/*`。
> 只有在你维护 `schema-dsl` 自身源码时，才需要继续阅读后面的“修改内部模块”类示例。

- 自定义关键字：优先用 `new Validator().addKeyword(name, definition)`
- 自定义类型：优先用 `TypeRegistry.register()` 或 `DslBuilder.registerType()`
- 官方插件：优先用 `PluginManager` 配合 `schema-dsl/plugins/custom-format`、`schema-dsl/plugins/custom-validator`、`schema-dsl/plugins/custom-type-example`
- 自定义语言：优先用 `Locale.addLocale()` 或 `dsl.config({ i18n: { locales } })`
- 自定义 String 链式写法：在 transform 中配置 `additionalMethods`；如果链式调用起点是已注册的自定义 DSL 类型字面量，还需要配置 `additionalTypes` 或 `additionalTypePatterns`；同时通过 `schema-dsl/string-types` 做 IDE 提示扩展。transform 只负责改写源码；实际的 `dsl('...').yourMethod()` 运行时方法仍需由你的扩展提供。
- 框架或租户隔离：优先使用 `schema-dsl/runtime` 的 `createRuntime()`，让自定义类型、pattern 覆盖、messages、messageProvider 和 Validator/AJV 缓存都保留在单个 runtime 实例中。
- runtime custom type 与 dynamic type factory 应在 app/plugin 启动期注册。避免 request 级 factory 捕获 request 对象或大型 app 容器；请求级 locale/messages 应通过 `validate(..., options)` 传入。

---

## 运行时隔离扩展

当扩展不能写入全局 `TypeRegistry`、`Locale` 或 `PATTERNS` 对象时，使用 `schema-dsl/runtime`：

```typescript
import { createRuntime } from 'schema-dsl/runtime';

const runtime = createRuntime({
  types: {
    tenantId: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
  },
  patterns: {
    phone: {
      zz: { pattern: /^ZZ-\d{2}$/, min: 5, max: 5, key: 'pattern.phone.zz' }
    }
  },
  messages: {
    'pattern.phone.zz': 'Tenant phone format is invalid'
  },
  messageProvider: ({ key, locale, fallback }) =>
    key === 'number.min' ? `[${locale}] {{#label}} must be >= {{#limit}}` : fallback
});

const schema = runtime.dsl({
  id: 'tenantId!',
  phone: 'phone:zz',
  age: 'number:18-120'
});
```

热重载时优先使用 `runtime.configure(nextOptions, { mode: 'replace' })`，或先 `runtime.configure({}, { mode: 'reset' })` 后加载下一组扩展。app/plugin 实例卸载时调用 `runtime.dispose()`。

`runtime.dsl('string')` / `runtime.compileField('string')` 会保留内建链式方法 TypeScript 提示。自定义链式方法仍需要正常增强 builder 接口，并在扩展代码中提供对应运行时方法。

---

## 编译期 String 链式自定义方法

当项目已有自己的 builder 方法时，把方法名加入 `additionalMethods`，静态 String 链式调用就会被改写为 `dsl(...)` 链：

```typescript
import { transformSchemaDsl } from 'schema-dsl/transform';

const result = transformSchemaDsl(
  'export const tenant = "string!".tenantId().label("租户")',
  {
    filename: 'schema.ts',
    additionalMethods: ['tenantId']
  }
);
```

TypeScript 提示通过 `schema-dsl/string-types` 显式导入和接口增强完成：

```typescript
import 'schema-dsl/string-types';
import { dsl, type IDslBuilder } from 'schema-dsl/pure';

declare module 'schema-dsl/pure' {
  interface IDslBuilder {
    tenantId(): this;
  }
}

declare module 'schema-dsl/string-types' {
  interface SchemaDslStringExtensions {
    tenantId(): IDslBuilder;
  }
}

const tenantFromString = 'string!'.tenantId().label('租户');
const tenantFromDsl = dsl('string!').tenantId().label('租户');
```

只有在你明确要替换完整内建 transform 方法集合时才使用 `methods`；普通用户扩展优先使用 `additionalMethods`。

当字符串字面量本身是已注册的自定义 DSL 类型时，还需要追加类型名或匹配规则：

```typescript
const result = transformSchemaDsl(
  'export const tenant = "tenant-id!".tenantId().label("租户")',
  {
    filename: 'schema.ts',
    additionalMethods: ['tenantId'],
    additionalTypes: ['tenant-id']
  }
);
```

如果类型名由约定或生成规则决定，可使用 `additionalTypePatterns`，例如 `{ additionalTypePatterns: ['^tenant-[0-9]+!?$'] }`。

---

## 添加自定义AJV关键字

### 步骤1：通过公开 API 注册关键字

```javascript
const { Validator } = require('schema-dsl');

const validator = new Validator();

validator.addKeyword('isPositive', {
  type: 'number',
  validate: (_schema, data) => data > 0
});

const result = validator.validate({ type: 'number', isPositive: true }, 42);
```

### 步骤2：需要复用时，再封装成插件

```javascript
const plugin = {
  name: 'my-validator-plugin',
  install(core) {
    const validator = new core.Validator();
    validator.addKeyword('isPositive', {
      type: 'number',
      validate: (_schema, data) => data > 0
    });
  }
};
```

---

## 注册自定义 DSL 类型

### 运行时推荐写法

```javascript
const { DslBuilder, dsl } = require('schema-dsl');

DslBuilder.registerType('invoice-id', {
  type: 'string',
  pattern: '^INV-\\d{4}$'
});

const schema = dsl({ id: 'invoice-id!' });
```

### 低层入口

```javascript
const { TypeRegistry } = require('schema-dsl');

TypeRegistry.register('evenNumber', {
  baseSchema: { type: 'number', multipleOf: 2 }
});
```

> 如果你要扩展 `schema-dsl` 自身源码，才需要继续修改 `DslBuilder` 内部方法或 parser/compiler 逻辑。

---

## 封装预定义模式

当前版本更推荐用“自定义类型 + 现有约束”或“插件”来封装预定义模式，而不是直接要求业务侧修改包内 `src/config/patterns/*`。

```typescript
import { DslBuilder } from 'schema-dsl';

DslBuilder.registerType('wechat-id', {
  type: 'string',
  pattern: '^[a-zA-Z]([a-zA-Z0-9_-]{5,19})$'
});
```

---

## 多语言支持

### 添加新语言

1. **运行时追加语言**

```typescript
import { Locale } from 'schema-dsl';

Locale.addLocale('fr-FR', {
  required: '{{#label}} est obligatoire',
  type: '{{#label}} doit etre de type {{#expected}}'
});
```

2. **或通过配置对象集中注入**

```javascript
dsl.config({
  i18n: {
    locales: {
      'fr-FR': {
        required: '{{#label}} est obligatoire'
      }
    }
  }
});
```

3. **使用新语言**

```javascript
validate(schema, data, { locale: 'fr-FR' });
```

### 自定义错误消息

```javascript
// 全局配置
dsl.config({
  i18n: {
    'zh-CN': {
      'custom.emailTaken': '该邮箱已被注册',
      'custom.invalidFormat': '格式不正确'
    }
  }
});

// 使用
const schema = dsl({ email: 'email!' });
schema.properties.email._customMessages = {
  'format': 'custom.emailTaken'
};
```

---

## 完整示例

### 示例1：银行卡号验证器

```javascript
// 1. 添加AJV关键字
static registerBankCard Validator(ajv) {
  ajv.addKeyword({
    keyword: 'bankCard',
    type: 'string',
    schemaType: 'boolean',
    validate: function validate(schema, cardNumber) {
      if (!schema) return true;
      
      // Luhn算法验证
      let sum = 0;
      let isEven = false;
      
      for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber[i], 10);
        
        if (isEven) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        
        sum += digit;
        isEven = !isEven;
      }
      
      if (sum % 10 !== 0) {
        validate.errors = [{
          keyword: 'bankCard',
          message: 'pattern.bankCard',
          params: {}
        }];
        return false;
      }
      
      return true;
    },
    errors: true
  });
}

// 2. 添加DslBuilder方法
bankCard() {
  if (this._baseSchema.type !== 'string') {
    throw new Error('bankCard() only applies to string type');
  }
  this._baseSchema.bankCard = true;
  return this;
}

// 3. 添加多语言
'pattern.bankCard': '{{#label}}必须是有效的银行卡号'

// 4. 使用
const schema = dsl({ cardNumber: dsl('string!').bankCard() });
validate(schema, { cardNumber: '6222026006956145' });
```

### 示例2：IP段验证器

```javascript
// 1. 添加AJV关键字
static registerIPRange(ajv) {
  ajv.addKeyword({
    keyword: 'ipRange',
    type: 'string',
    schemaType: 'array', // [min, max]
    validate: function validate(range, ip) {
      const ipToNumber = (ip) => {
        return ip.split('.').reduce((acc, octet) => {
          return (acc << 8) + parseInt(octet, 10);
        }, 0);
      };
      
      const ipNum = ipToNumber(ip);
      const [minIP, maxIP] = range;
      const minNum = ipToNumber(minIP);
      const maxNum = ipToNumber(maxIP);
      
      if (ipNum < minNum || ipNum > maxNum) {
        validate.errors = [{
          keyword: 'ipRange',
          message: 'ip.range',
          params: { min: minIP, max: maxIP }
        }];
        return false;
      }
      
      return true;
    },
    errors: true
  });
}

// 2. 使用
const schema = {
  type: 'string',
  format: 'ipv4',
  ipRange: ['192.168.1.1', '192.168.1.255']
};
```

---

## 最佳实践

### 1. 命名规范

- **关键字**：小驼峰，如 `phoneLocation`
- **方法名**：小驼峰，如 `.phoneLocation()`
- **消息键**：点分隔，如 `phone.location.mismatch`

### 2. 错误消息

- 使用占位符：`{{#label}}`, `{{#limit}}`, `{{#expected}}`
- 提供详细的错误信息
- 支持多语言

### 3. 性能优化

- 预编译正则表达式
- 避免复杂的循环
- 使用纯函数

### 4. 测试覆盖

```javascript
describe('Custom Validator - bankCard', function() {
  it('应该验证有效的银行卡号', function() {
    const schema = dsl({ card: dsl('string!').bankCard() });
    expect(validate(schema, { card: '6222026006956145' }).valid).to.be.true;
  });
  
  it('应该拒绝无效的银行卡号', function() {
    const schema = dsl({ card: dsl('string!').bankCard() });
    expect(validate(schema, { card: '1234567890123456' }).valid).to.be.false;
  });
});
```

---

## 参考资料

- [AJV自定义关键字文档](https://ajv.js.org/guide/user-keywords.html)
- [JSON Schema规范](https://json-schema.org/)
- [schema-dsl API文档](./api-reference.md)
- [验证指南](./validation-guide.md)

---

**需要帮助？** 访问 [GitHub Issues](https://github.com/vextjs/schema-dsl/issues)

---

## 对应示例文件

**示例入口**: [custom-extensions-guide.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/custom-extensions-guide.ts)  
**说明**: 以运行时公开 API 为主，覆盖 `Validator.addKeyword()`、`DslBuilder.registerType()`、`Locale.addLocale()` 和官方插件入口四条扩展路径。

