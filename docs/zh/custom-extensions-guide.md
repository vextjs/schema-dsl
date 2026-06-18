# 高级扩展组合指南

> **版本**: 2.0.11
> **更新日期**: 2026-06-18
> **用途**: 在你已经理解各个独立扩展路径后，说明如何组合自定义类型、factory、链式方法、关键字、多语言、runtime 隔离和插件。

---


## 阅读本页之前

大多数项目应先阅读更聚焦的页面：

- [扩展概览](extensions-overview.md) - 判断该选哪条扩展路径。
- [自定义 DSL 类型](plugin-type-registration.md) - 注册可复用 DSL 字面量。
- [自定义 s.xxx() 工厂](custom-factories.md) - 暴露可发现的 namespace factory。
- [自定义链式方法](custom-chain-methods.md) - 给已有 builder 增加方法。
- [自定义校验关键字](add-keyword.md) - 添加 AJV keyword。
- [框架集成与目录结构](framework-extension-setup.md) - 组织可复用扩展模块。

只有当一个扩展包需要组合多种能力时，再阅读本页。

## 快速开始

schema-dsl 采用模块化设计，高级扩展可以组合：

1. **`Validator.addKeyword()`** - 运行时注册自定义 AJV 关键字
2. **`registerExtension()` / `s.registerExtension()` / `TypeRegistry.register()` / `DslBuilder.registerType()`** - 注册自定义 DSL 类型和可选 namespace factory
3. **`PluginManager` + `schema-dsl/plugins/*`** - 组合插件、hook 与官方插件入口
4. **`Locale.addLocale()` / `s.config({ i18n })`** - 扩展多语言消息
5. **`transformSchemaDsl({ additionalMethods })` + `schema-dsl/string-types`** - 编译期 String 链式自定义方法与显式 TypeScript 提示
6. **`schema-dsl/runtime` 的 `createRuntime()`** - 为框架或租户隔离自定义类型、pattern 和消息

## 当前版本推荐路径

> ⚠️ 如果你是把 `schema-dsl` 当成依赖使用，优先通过公开运行时 API 扩展，而不是直接修改 `src/*`。
> 只有在你维护 `schema-dsl` 自身源码时，才需要继续阅读后面的“修改内部模块”类示例。

- 自定义关键字：优先用 `new Validator().addKeyword(name, definition)`
- 自定义类型与 namespace factory：如果希望 DSL 字面量和 `s.tenantId()` 同时存在，优先用 `registerExtension()` / `s.registerExtension()`；如果只需要字面量类型，继续用 `TypeRegistry.register()` 或 `DslBuilder.registerType()`。
- `factoryName` 必须是合法 JavaScript/TypeScript 标识符，例如 `tenantId`，因为它会成为可点调用的 namespace 方法和 module augmentation 方法名。
- 官方插件：优先用 `PluginManager` 配合 `schema-dsl/plugins/custom-format`、`schema-dsl/plugins/custom-validator`、`schema-dsl/plugins/custom-type-example`
- 自定义语言：优先用 `Locale.addLocale()` 或 `s.config({ i18n: { locales } })`
- 自定义 String 链式写法：在 transform 中配置 `additionalMethods`；如果链式调用起点是已注册的自定义 DSL 类型字面量，还需要配置 `additionalTypes` 或 `additionalTypePatterns`；同时通过 `schema-dsl/string-types` 做 IDE 提示扩展。transform 只负责改写源码；实际的 `s('...').yourMethod()` 运行时方法仍需由你的扩展提供。
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

const schema = runtime.s({
  id: 'tenantId!',
  phone: 'phone:zz',
  age: 'number:18-120'
});
```

热重载时优先使用 `runtime.configure(nextOptions, { mode: 'replace' })`，或先 `runtime.configure({}, { mode: 'reset' })` 后加载下一组扩展。app/plugin 实例卸载时调用 `runtime.dispose()`。

`runtime.s('string')` / `runtime.compileField('string')` 会保留内建链式方法 TypeScript 提示。自定义链式方法仍需要正常增强 builder 接口，并在扩展代码中提供对应运行时方法。

runtime namespace factory 也保持实例隔离：

```typescript
runtime.registerExtension({
  literal: 'tenant-id',
  factoryName: 'tenantId',
  schema: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
});

const tenant = runtime.s.tenantId().require().toSchema();
```

---

## 编译期 String 链式自定义方法

当项目已有自己的 builder 方法时，把方法名加入 `additionalMethods`，静态 String 链式调用就会被改写为 `s(...)` 链：

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

TypeScript 提示通过 `schema-dsl/string-types` 显式导入和接口增强完成。下面的直接字符串写法需要先经过 transform 改写后再运行；没有 transform 时请使用 `s('...')` 或 `s.xxx()`：

```typescript
import 'schema-dsl/string-types';
import { DslBuilder, s, registerExtension, type IDslBuilder } from 'schema-dsl/pure';

registerExtension({
  literal: 'tenant-id',
  factoryName: 'tenantId',
  exposeStringChain: true,
  schema: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
});

function installTenantIdBuilderMethod() {
  const proto = DslBuilder.prototype as unknown as {
    tenantId?: (this: IDslBuilder) => IDslBuilder;
  };

  proto.tenantId ??= function tenantId(this: IDslBuilder) {
    return this.pattern(/^tenant_[a-z0-9]+$/);
  };
}

installTenantIdBuilderMethod();

declare module 'schema-dsl/pure' {
  interface DslNamespaceFactories {
    tenantId(): IDslBuilder;
  }

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
const tenantFromDsl = s('string!').tenantId().label('租户');
const tenantFromNamespace = s.tenantId().label('租户');
```

`exposeStringChain: true` 会让 `defineExtension()` 根据 factory 名派生 `transformMethods: ['tenantId']`。它不会自动安装运行时 builder 方法，也不会自动生成 TypeScript 声明；仍需按上例提供运行时方法实现和 module augmentation。

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
import { Validator } from 'schema-dsl/pure';

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
import { DslBuilder, s } from 'schema-dsl/pure';

DslBuilder.registerType('invoice-id', {
  type: 'string',
  pattern: '^INV-\\d{4}$'
});

const schema = s({ id: 'invoice-id!' });
```

### 低层入口

```javascript
import { TypeRegistry } from 'schema-dsl/pure';

TypeRegistry.register('evenNumber', {
  baseSchema: { type: 'number', multipleOf: 2 }
});
```

> 如果你要扩展 `schema-dsl` 自身源码，才需要继续修改 `DslBuilder` 内部方法或 parser/compiler 逻辑。

---

## 封装预定义模式

当前版本更推荐用“自定义类型 + 现有约束”或“插件”来封装预定义模式，而不是直接要求业务侧修改包内 `src/config/patterns/*`。

```typescript
import { DslBuilder } from 'schema-dsl/pure';

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
import { Locale } from 'schema-dsl/pure';

Locale.addLocale('fr-FR', {
  required: '{{#label}} est obligatoire',
  type: '{{#label}} doit etre de type {{#expected}}'
});
```

2. **或通过配置对象集中注入**

```javascript
s.config({
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
s.config({
  i18n: {
    'zh-CN': {
      'custom.emailTaken': '该邮箱已被注册',
      'custom.invalidFormat': '格式不正确'
    }
  }
});

// 使用
const schema = s({ email: 'email!' });
schema.properties.email._customMessages = {
  'format': 'custom.emailTaken'
};
```

---

## 组合配方示例

### 配方 1：银行卡号验证概念

下面展示一个“关键字 + builder 方法 + 消息”组合扩展需要哪些部分。生产代码建议按 [框架集成与目录结构](framework-extension-setup.md) 拆成独立模块维护。

```text
1. 注册名为 bankCard 的 AJV keyword。
2. 添加名为 bankCard() 的 builder 方法。
3. 添加 pattern.bankCard 多语言消息。
4. 在字段定义中使用 s('string!').bankCard()。
```

运行时 keyword 形态：

```javascript
function registerBankCardKeyword(ajv) {
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
```

### 配方 2：IP 段关键字

```javascript
function registerIPRangeKeyword(ajv) {
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
    const schema = s({ card: s('string!').bankCard() });
    expect(validate(schema, { card: '6222026006956145' }).valid).to.be.true;
  });
  
  it('应该拒绝无效的银行卡号', function() {
    const schema = s({ card: s('string!').bankCard() });
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
**说明**: 在一个高级示例中组合自定义关键字、自定义 DSL 类型、namespace factory、链式方法运行时 setup、多语言消息、transform 配置和插件安装。

