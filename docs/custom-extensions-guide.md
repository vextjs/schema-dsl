# 自定义扩展指南

> **版本**: 2.0.0-beta.2  
> **更新日期**: 2026-05-08  
> **用途**: 说明当前版本推荐的运行时扩展方式，以及在维护 schema-dsl 自身源码时如何继续深入扩展

---

## 📑 目录

- [快速开始](#快速开始)
- [添加自定义AJV关键字](#添加自定义ajv关键字)
- [扩展DslBuilder方法](#扩展dslbuilder方法)
- [添加预定义模式](#添加预定义模式)
- [多语言支持](#多语言支持)
- [完整示例](#完整示例)

---

## 快速开始

schema-dsl采用模块化设计，你可以轻松扩展：

1. **`Validator.addKeyword()`** - 运行时注册自定义 AJV 关键字
2. **`TypeRegistry.register()` / `DslBuilder.registerType()`** - 注册自定义 DSL 类型
3. **`PluginManager` + `schema-dsl/plugins/*`** - 组合插件、hook 与官方插件入口
4. **`Locale.addLocale()` / `dsl.config({ i18n })`** - 扩展多语言消息

## 当前版本推荐路径

> ⚠️ 如果你是把 `schema-dsl` 当成依赖使用，优先通过公开运行时 API 扩展，而不是直接修改 `src/*`。
> 只有在你维护 `schema-dsl` 自身源码时，才需要继续阅读后面的“修改内部模块”类示例。

- 自定义关键字：优先用 `new Validator().addKeyword(name, definition)`
- 自定义类型：优先用 `TypeRegistry.register()` 或 `DslBuilder.registerType()`
- 官方插件：优先用 `PluginManager` 配合 `schema-dsl/plugins/custom-format`、`schema-dsl/plugins/custom-validator`、`schema-dsl/plugins/custom-type-example`
- 自定义语言：优先用 `Locale.addLocale()` 或 `dsl.config({ i18n: { locales } })`

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

Locale.addLocale('ko-KR', {
  required: '{{#label}}은(는) 필수 항목입니다',
  type: '{{#label}}은(는) {{#expected}} 유형이어야 합니다'
});
```

2. **或通过配置对象集中注入**

```javascript
dsl.config({
  i18n: {
    locales: {
      'ko-KR': {
        required: '{{#label}}은(는) 필수 항목입니다'
      }
    }
  }
});
```

3. **使用新语言**

```javascript
validate(schema, data, { locale: 'ko-KR' });
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

**示例入口**: [custom-extensions-guide.ts](https://github.com/vextjs/schema-dsl/blob/v2/examples/docs/custom-extensions-guide.ts)  
**说明**: 以运行时公开 API 为主，覆盖 `Validator.addKeyword()`、`DslBuilder.registerType()`、`Locale.addLocale()` 和官方插件入口四条扩展路径。

