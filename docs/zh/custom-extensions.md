# 自定义 DSL 类型

自定义 DSL 类型用来把你项目里的业务类型注册成 DSL 类型。例如把“租户 ID”注册成 `tenant-id` 后，业务 schema 里就可以直接写：

```ts
const schema = s({
  compact: 'tenant-id:corp!',
  named: s('tenant-id:corp!').label('租户'),
  typed: s.tenantId('corp').label('租户').require()
});
```

这页只解决三件事：

1. 怎么定义一次业务类型。
2. 三种入口分别适合什么场景。
3. 参数、必填、枚举、约束这些容易混淆的语法怎么分清。

| 入口 | 适合场景 | TypeScript 体验 |
|------|----------|-----------------|
| `'tenant-id:corp!'` | 最短 DSL 配置 | 紧凑，但裸字符串后不能提示链式方法。 |
| `s('tenant-id:corp!').label(...)` | DSL 语法加 builder 方法 | `s(...)` 后有完整 builder 提示。 |
| `s.tenantId('corp').label(...).require()` | 最强发现性和参数提示 | factory 名称和参数都可提示。 |

这三种入口必须产出等价 schema。不要为同一个业务类型维护三份定义。

## 动态值怎么写

动态值也可以写进纯 DSL，但要记住：模板字符串只是 JavaScript 先拼出一个普通字符串，schema-dsl 解析的仍然是最终字符串。

```ts
const scope = currentUser.companyId ? 'corp' : 'tenant';

const schema = s({
  tenant: `tenant-id:${scope}!`
});
```

如果 `scope` 是 `'corp'`，最终交给 schema-dsl 的就是 `tenant-id:corp!`；如果是 `'tenant'`，最终就是 `tenant-id:tenant!`。

| 写法 | 是否推荐 | 原因 |
|------|----------|------|
| `` `tenant-id:${scope}!` `` | 可以 | `scope` 是一个短字符串，最终 DSL 清晰。 |
| `` `tenant-id:${params.scope}!` `` | 可以 | 只插入对象里的某个短字段，最终仍是 `tenant-id:corp!` 这类字符串。 |
| `` `tenant-id:${params}!` `` | 不推荐 | 如果 `params` 是对象，JavaScript 会拼成 `tenant-id:[object Object]!`，用户很难排查。 |
| `s.tenantId(scope).require()` | 更推荐用于参数化类型 | TypeScript 可以提示 `scope` 合法值，也更方便重构。 |

如果变量名刚好叫 `params`，但它本身就是 `'corp'` 这样的字符串，那么 `` `tenant-id:${params}!` `` 也能工作。文档不推荐的是把整个配置对象直接插进去。

所以文档里可以展示 `` `tenant-id:${scope}!` `` 这类示例，但不能把整个对象直接塞进 `${...}`。如果值来自用户输入，先白名单校验再拼 DSL。

## 先定义一个业务类型

一个扩展定义可以理解成“把业务类型翻译成 JSON Schema 的规则”。下面这个例子把 `tenant-id` 翻译成字符串规则，并根据参数 `corp` / `tenant` 选择不同前缀。

```ts
import { registerExtensions } from 'schema-dsl/pure';

export const s = registerExtensions([
  {
    literal: 'tenant-id',
    factoryName: 'tenantId',
    segmentMode: 'params',
    params: {
      scope: {
        kind: 'enum',
        values: ['tenant', 'corp'],
        default: 'tenant',
        description: '标识命名空间'
      }
    },
    schema({ scope }) {
      return {
        type: 'string',
        pattern: scope === 'corp'
          ? '^corp_[a-z0-9]+$'
          : '^tenant_[a-z0-9]+$'
      };
    }
  }
] as const);
```

第一次读这段代码时，先记住这五个字段：

| 字段 | 你可以把它理解成 | 在例子里的作用 |
|------|------------------|----------------|
| `literal` | DSL 里写的名字 | 用户写 `'tenant-id!'` 或 `'tenant-id:corp!'` 时靠它找到扩展。 |
| `factoryName` | `s.xxx()` 的方法名 | 生成 `s.tenantId()`，让 IDE 能提示这个业务类型。 |
| `params` | 冒号后的参数规则 | 把 `tenant-id:corp!` 里的 `corp` 解析成 `{ scope: 'corp' }`。 |
| `schema` | 最终验证规则 | 输出 `{ type: 'string', pattern: ... }`。 |
| `segmentMode` | 冒号后内容怎么解释 | 这里用 `params`，表示冒号后是参数，不是数字范围或比较运算符。 |

只写 TypeScript 签名，例如 `tenantId(scope: 'tenant' | 'corp')` 不够，因为 TypeScript 只在开发时提供提示，运行时不会保留这个类型。运行时仍然需要 `params` 来解析 DSL 字符串、校验非法值、应用默认值和生成文档。

### 扩展定义字段

需要完整配置时，再看这张表：

| 字段 | 必填 | 类型 | 作用 | 何时配置 |
|------|:----:|------|------|----------|
| `literal` | 三入口业务类型需要 | `string` | DSL 字符串里的类型名，例如 `'tenant-id!'`、`'tenant-id:corp!'`。它决定纯 DSL 和 `s('...')` 如何找到扩展。 | 需要从 DSL 字符串使用这个扩展时配置。建议使用短横线命名，如 `tenant-id`、`money`。 |
| `factoryName` | 否 | `string` | namespace factory 名称，例如 `s.tenantId()`。可从 `literal` 推导；显式配置可以避免推导歧义。 | 需要 `s.xxx()` 完整类型提示时配置；名称必须是合法 JavaScript 标识符。 |
| `segmentMode` | 否 | `'none' \| 'params' \| 'constraint'` | 决定冒号后的片段如何解释。`tenant-id:corp!` 的 `corp` 是参数，`positive-money:>=0!` 的 `>=0` 是约束。 | 扩展支持冒号段时必须明确。参数化类型通常用 `params`，数值约束型扩展用 `constraint`。 |
| `params` | 否 | 参数声明对象 | 声明 DSL 参数、factory 参数、默认值、合法值、错误诊断和文档参数表。 | 扩展有参数时配置；无参静态类型可以省略。 |
| `schema` | DSL 字符串需要解析这个类型时需要 | `JSONSchema` 或参数函数 | 生成最终 JSON Schema。无参扩展可以直接给对象；参数化扩展接收归一化后的参数对象。 | 普通自定义业务类型都需要。底层 factory-only 动态扩展属于高级用法，应在自己的运行时文档里说明行为。 |

### 命名规则

| 名称 | 推荐 | 避免 |
|------|------|------|
| `literal` | `tenant-id`、`money`、`corp-code` | `string`、`number`、`constructor`、含空格或需要复杂转义的名字 |
| `factoryName` | `tenantId`、`money`、`corpCode` | `min`、`label`、`default`、`registerExtension`、任何 builder 或 namespace 已有方法 |

如果 `literal` 与内置类型冲突，或者 `factoryName` 与内置工厂、builder 方法、已有扩展冲突，应该直接报错并提示冲突来源。不要静默覆盖，因为覆盖会让同一个 DSL 在不同模块里含义不同。

## 参数配置

参数是冒号后面的短值。它应该短小、可序列化，适合写进 DSL 字符串：

```ts
const schema = s({
  tenant: 'tenant-id!',
  corpTenant: 'tenant-id:corp!',
  corpOwner: s('tenant-id:corp!').label('负责人'),
  corpAdmin: s.tenantId('corp').label('管理员').require()
});
```

这里的 `corp` 来自 `params.scope`，不是字段枚举值，也不是普通字符串约束。

对象、函数、正则、多字段选项等复杂值不要塞进 DSL 字符串，改用 `s.xxx(...)` 的 factory 参数。下面这个例子把参数消费路径完整展开：`prefix` 和 `length` 最终都会进入正则。

```ts
import { registerExtensions } from 'schema-dsl/pure';

// 扩展定义：prefix 和 length 都会进入 schema 生成逻辑
const s = registerExtensions([
  {
    literal: 'prefixed-code',
    factoryName: 'prefixedCode',
    segmentMode: 'params',
    params: {
      prefix: {
        kind: 'string',
        default: 'USR',
        description: '编号前缀'
      },
      length: {
        kind: 'number',
        default: 8,
        factoryOnly: true,
        description: '编号随机部分长度'
      }
    },
    schema({ prefix = 'USR', length = 8 }) {
      return {
        type: 'string',
        pattern: `^${prefix}_[A-Z0-9]{${length}}$`
      };
    }
  }
] as const);

const schema = s({
  compact: 'prefixed-code:INV!',                         // prefix = 'INV'，length 使用默认值 8
  precise: s.prefixedCode({ prefix: 'INV', length: 8 }).require() // factory 可以显式传完整配置
});
```

这段代码的结果很直接：

| 写法 | 进入扩展的参数 | 最终生成的规则 |
|------|----------------|----------------|
| `'prefixed-code:INV!'` | `{ prefix: 'INV', length: 8 }`，`length` 来自默认值 | 字符串必须匹配 `^INV_[A-Z0-9]{8}$` |
| `s.prefixedCode({ prefix: 'INV', length: 8 })` | `{ prefix: 'INV', length: 8 }` | 字符串必须匹配 `^INV_[A-Z0-9]{8}$` |

这样用户能看到每个参数在哪里被用到，不需要猜 `length` 这种配置项有什么作用。

### `params` 字段说明

`params` 的每个 key 是参数名，每个 value 是参数声明。它既用于解析 `'tenant-id:corp!'`，也用于约束 `s.tenantId('corp')` 的参数。

先分清两类名字，否则很容易把 `scope`、`min`、`max`、`length` 看成 schema-dsl 内置字段：

| 类型 | 示例 | 谁定义 | 用在哪里 |
|------|------|--------|----------|
| 参数名 | `scope`、`min`、`max`、`prefix`、`length` | 扩展作者自己定义 | 进入 `schema({ scope })`、`schema({ min, max })` 这类生成函数，决定最终 JSON Schema。 |
| 参数声明字段 | `kind`、`values`、`default`、`required`、`description`、`factoryOnly` | schema-dsl 约定 | 告诉 schema-dsl 怎么解析 DSL、怎么校验参数、怎么给 factory 做类型提示和错误提示。 |

例如下面这些都是“参数名”，含义由扩展作者在 `schema(...)` 里决定：

```ts
params: {
  scope: {
    kind: 'enum',
    values: ['tenant', 'corp'],
    default: 'tenant',
    description: '租户 ID 的命名空间'
  },
  length: {
    kind: 'number',
    default: 8,
    factoryOnly: true,
    description: '随机部分长度，只通过 s.xxx(...) 传入'
  }
}
```

`scope`、`min`、`max`、`length` 本身没有固定魔法。真正的效果来自 `schema(...)`：

```ts
schema({ min, max }) {
  return {
    type: 'number',
    minimum: min,
    maximum: max
  };
}
```

```ts
params: {
  scope: {
    kind: 'enum',
    values: ['tenant', 'corp'],
    default: 'tenant',
    required: false,
    description: '标识命名空间'
  }
}
```

| 字段 | 必填 | 作用 | 示例 |
|------|:----:|------|------|
| `kind` | 是 | 参数类型。决定 DSL 字符串如何转换成运行时值，也决定 factory 的参数提示。 | `'string'`、`'number'`、`'boolean'`、`'enum'` |
| `values` | `kind: 'enum'` 时是 | 枚举参数的合法值。非法值应报错。 | `['tenant', 'corp']` |
| `default` | 否 | 参数省略时使用的默认值。默认值也必须通过同一套参数校验。 | `default: 'tenant'` |
| `required` | 否 | 参数是否必须显式传入。没有默认值且业务上不能省略时设为 `true`。 | `required: true` |
| `description` | 否 | 给文档、编辑器提示和错误信息使用的人类说明。 | `'标识命名空间'` |
| `factoryOnly` | 否 | 只允许通过 `s.xxx(...)` 传入，不允许写进 DSL 字符串。 | `factoryOnly: true` |

### 参数类型

| `kind` | DSL 示例 | factory 示例 | 转换规则 |
|--------|----------|--------------|----------|
| `string` | `code-prefix:INV!` | `s.codePrefix('INV')` | 保持字符串；空字符串通常应拒绝，除非显式允许。 |
| `number` | `retry-count:3!` | `s.retryCount(3)` | 转成有限数字；拒绝 `NaN`、`Infinity`、空字符串和非数字文本。 |
| `boolean` | `flag:true!` | `s.flag(true)` | 只接受 `true` / `false` 或约定的布尔字面量。复杂开关建议用 factory。 |
| `enum` | `tenant-id:corp!` | `s.tenantId('corp')` | 必须落在 `values` 中；适合 scope、region、mode 这类短参数。 |

复杂值不要塞进 DSL 字符串：

| 参数 | 推荐写法 | 不推荐写法 |
|------|----------|------------|
| 正则 | `s.customPattern(/^[a-z0-9]+$/)` | `'custom-pattern:/^[a-z0-9]+$/!'` |
| 函数 | `s.customValidator(fn)` | `'custom-validator:(value)=>true!'` |
| 对象 | `s.prefixedCode({ prefix: 'INV', length: 8 })` | `'prefixed-code:{"prefix":"INV"}!'` |

### DSL 参数如何映射

把 DSL 字符串看成三段会更容易：

```txt
tenant-id : corp !
类型名      参数  必填标记
```

解析顺序如下：

1. 先看最后的 `!` / `?`：它们只表示字段必填或可选，不属于参数。
2. 再看类型名，例如 `tenant-id`，用它找到扩展定义。
3. 如果 `segmentMode: 'params'`，冒号后的内容按 `params` 声明解析。
4. 参数模式只处理一个短值；范围和比较符使用已有约束语法，不使用逗号拆多参数。
5. 参数缺省时使用 `default`；没有默认值且 `required: true` 时抛错。
6. 多余参数、非法枚举、非法数字、无法转换的布尔值都应该抛出可读错误。

示例：

| DSL | 解析结果 |
|-----|----------|
| `tenant-id!` | `{ scope: 'tenant' }`，字段必填 |
| `tenant-id:corp!` | `{ scope: 'corp' }`，字段必填 |
| `tenant-id:bad!` | 报错：`scope` 不在 `['tenant', 'corp']` |
| `age-range:18-65!` | 这是范围约束，输出 `minimum: 18, maximum: 65`，不走 `params` 多参数 |

### 范围值怎么写

范围值不要写成逗号分隔。schema-dsl 当前已有 range 语法，用户已经会把 `number:18-65` 理解成最小 `18`、最大 `65`，自定义类型也应该沿用这个规则。

先看用户会写什么：

```ts
const schema = s({
  age: 'age-range:18-65!'
});
```

这对用户来说只表示：年龄最小 `18`，最大 `65`。

扩展作者把这个类型声明成约束型扩展：

```ts
const s = registerExtensions([
  {
    literal: 'age-range',
    factoryName: 'ageRange',
    segmentMode: 'constraint',
    schema: { type: 'number' },
    factory(min: number, max: number) {
      return `age-range:${min}-${max}`;
    }
  }
] as const);
```

这段配置的意思是：冒号后的 `18-65` 交给现有 range parser，而不是交给 `params` 自己拆。

```ts
const schema = s({
  compact: 'age-range:18-65!',
  named: s('age-range:18-65!').label('年龄'),
  typed: s.ageRange(18, 65).label('年龄').require()
});
```

当前 `age-range:18,65!` 不支持。逗号在 schema-dsl 里主要用于 `enum:` 这类枚举列表，例如 `enum:number:1,2,3!`，不要把它作为通用多参数分隔符。

如果一个自定义类型真的需要多个彼此无关的参数，优先用 `s.xxx({ ... })` 或 `s.xxx(a, b)`，不要把它塞进一个紧凑 DSL 字符串里。

## 容易混淆的 DSL 语法

自定义 DSL 类型不能改变已有 DSL 语义。遇到下面这些写法时，先按表格区分它们：

| 语法 | 含义 |
|------|------|
| `tenant-id!` | 必填自定义字段。 |
| `tenant-id?` | 可选自定义字段。 |
| `field!: tenant-id?` | 对象 key 必填；key 级必填优先。 |
| `positive-money:>=0!` | 约束段，不是扩展参数。 |
| `tenant-id:corp!` | `segmentMode: 'params'` 时表示参数段。 |
| `active|inactive!` | 字段枚举值。 |
| `tenant-id:corp!` 且 `scope` 为 enum | 参数枚举值。 |

### 必填、可选和 key 级 required

`!` / `?` 不是扩展参数，而是字段 required 语义：

```ts
const schema = s({
  optionalA: 'tenant-id',
  optionalB: 'tenant-id?',
  requiredA: 'tenant-id!',
  'requiredB!': 'tenant-id?'
});
```

| 写法 | required 结果 | 说明 |
|------|---------------|------|
| `tenant-id` | 不 required | 默认可选。 |
| `tenant-id?` | 不 required | 显式可选。 |
| `tenant-id!` | required | value 级必填。 |
| `'field!': 'tenant-id?'` | required | key 级必填优先于 value 级可选。 |
| `s.tenantId().require()` | required | builder 写法，语义等价于 `!`。 |

### 字段枚举和参数枚举

这两类 enum 必须分清：

```ts
const schema = s({
  status: 'active|inactive!',
  level: 'enum:number:1,2,3!',
  tenant: 'tenant-id:corp!',
  tenantLimited: s('tenant-id:corp!').enum('corp_admin', 'corp_owner')
});
```

| 写法 | 类型 | 解释 |
|------|------|------|
| `active|inactive!` | 字段 enum | 字段值只能是 `active` 或 `inactive`。 |
| `enum:number:1,2,3!` | typed 字段 enum | 字段值只能是数字 `1`、`2`、`3`。 |
| `tenant-id:corp!` | 参数 enum | `corp` 选择扩展生成哪种 schema，不限制最终字段只能等于 `corp`。 |
| `.enum('corp_admin', 'corp_owner')` | 字段 enum 叠加 | 在扩展 schema 之上继续限制字段可取值。 |

每个扩展声明冒号段如何解释：

| `segmentMode` | 示例 | 含义 |
|---------------|------|------|
| `none` | `tenant-id!` | 拒绝冒号段。 |
| `params` | `tenant-id:corp!` | 冒号段映射到声明式参数。 |
| `constraint` | `positive-money:>=0!` | 冒号段解析为字段约束。 |

### `segmentMode` 三种具体例子

`segmentMode` 只回答一个问题：用户写了冒号后，冒号后的内容到底按什么规则读。

#### `segmentMode: 'none'`

适合没有参数的静态业务类型。用户只能写类型名和必填/可选标记，不能写冒号段。

```ts
const s = registerExtensions([
  {
    literal: 'snowflake-id',
    factoryName: 'snowflakeId',
    segmentMode: 'none',
    schema: {
      type: 'string',
      pattern: '^[0-9]{18,20}$'
    }
  }
] as const);

const schema = s({
  id: 'snowflake-id!'
});
```

| 用户写法 | 结果 |
|----------|------|
| `snowflake-id!` | 合法，字段是必填雪花 ID。 |
| `snowflake-id:corp!` | 报错，因为这个扩展声明了不接收冒号段。 |

#### `segmentMode: 'params'`

适合 `tenant-id:corp!` 这种“冒号后是业务参数”的类型。

```ts
const s = registerExtensions([
  {
    literal: 'tenant-id',
    factoryName: 'tenantId',
    segmentMode: 'params',
    params: {
      scope: {
        kind: 'enum',
        values: ['tenant', 'corp'],
        default: 'tenant',
        description: '租户 ID 的命名空间'
      }
    },
    schema({ scope }) {
      return {
        type: 'string',
        pattern: scope === 'corp' ? '^corp_[a-z0-9]+$' : '^tenant_[a-z0-9]+$'
      };
    }
  }
] as const);
```

| 用户写法 | 进入 `schema(...)` 的参数 | 最终含义 |
|----------|---------------------------|----------|
| `tenant-id!` | `{ scope: 'tenant' }` | 使用默认租户命名空间。 |
| `tenant-id:corp!` | `{ scope: 'corp' }` | 使用公司命名空间。 |
| `` `tenant-id:${scope}!` `` | 取决于 `scope` 拼出的最终字符串 | 动态选择命名空间，但 TypeScript 不检查字符串内部。 |
| `tenant-id:bad!` | 不进入 `schema(...)` | 报错，因为 `bad` 不在 `values` 里。 |

#### `segmentMode: 'constraint'`

适合“冒号后是比较符、范围、等值约束”的类型。用户不用重新学习一套参数语法，直接沿用核心数字约束。

```ts
const s = registerExtensions([
  {
    literal: 'positive-money',
    factoryName: 'positiveMoney',
    segmentMode: 'constraint',
    schema: {
      type: 'number',
      minimum: 0
    }
  }
] as const);

const schema = s({
  price: 'positive-money:<=999!'
});
```

| 用户写法 | 最终含义 |
|----------|----------|
| `positive-money!` | 必填数字，最小值为 `0`。 |
| `positive-money:<=999!` | 在扩展基础上继续限制最大值为 `999`。 |
| `positive-money:0-999!` | 在扩展基础上继续限制范围为 `0` 到 `999`。 |
| `positive-money:corp!` | 报错，因为 `corp` 不是数字约束。 |

### 什么时候配置 `segmentMode`

| 场景 | 推荐值 | 原因 |
|------|--------|------|
| 静态类型，没有冒号段 | `none` | 避免用户误写 `tenant-id:any!` 后被忽略。 |
| 参数化类型 | `params` | 让 `tenant-id:corp!`、`s('tenant-id:corp!')`、`s.tenantId('corp')` 使用同一参数模型。 |
| 数字或字符串约束型扩展 | `constraint` | 让 `positive-money:>=0!` 复用核心比较运算符、range 等约束解析。 |

默认不把参数和数字约束挤进同一个紧凑字符串。两者都需要时使用 builder 方法：

```ts
const schema = s({
  price: s('money:usd!').min(0),
  total: s.money('usd').min(0).require()
});
```

如果用户写成 `money:usd>=0!`，实现应该给出明确诊断，例如“`money` 使用参数模式，不能在同一冒号段里混写数值约束；请使用 `s('money:usd!').min(0)`”。不要静默把 `usd>=0` 当成参数，也不要退化成未知类型。

### 数字比较运算符属于核心约束

这些语法不是扩展参数：

| DSL | JSON Schema 语义 |
|-----|------------------|
| `number:>=0` | `minimum: 0` |
| `number:>0` | `exclusiveMinimum: 0` |
| `number:<=120` | `maximum: 120` |
| `number:<120` | `exclusiveMaximum: 120` |
| `number:=18` | `enum: [18]` |
| `number:0-100` | `minimum: 0, maximum: 100` |

自定义类型只有在声明 `segmentMode: 'constraint'` 时才应该消费这些约束。声明 `segmentMode: 'params'` 的扩展应把冒号段按参数解析。

## 发布状态和可跳过内容

普通用户定义业务类型时，只需要理解上面的 `literal`、`factoryName`、`params`、`schema` 和三种入口。

本页描述的是扩展系统的公开使用方式。请以当前安装版本的导出 API 为准；如果你在本仓库内阅读文档示例，运行前先执行本地构建。

如果你在源码或历史文档里看到直接 String 链式、编译期转换或特殊解析 hook，它们是兼容/高级能力，不是普通业务类型的主入口。

### 什么不是自定义 DSL 类型入口

自定义业务类型不需要自定义 base builder 链式方法：

```ts
s('string!').tenantId();  // 不属于自定义 DSL 类型模型
'string!'.tenantId();     // 不属于自定义 DSL 类型模型
```

已有的直接 String 链式和 transform 能力仍然是独立的兼容/作者体验工具，不应用来暴露 `tenant-id` 这类普通业务类型。

## TypeScript 提示怎么选

三种入口的提示体验不同，这是设计上的取舍：

| 写法 | 能提示什么 | 不能提示什么 | 推荐场景 |
|------|------------|--------------|----------|
| `'tenant-id:corp!'` | 普通字符串补全能力有限 | TypeScript 不会解析字符串内部 DSL，也不会提示 `.label()` | 配置最短、字段很多、无需链式增强。 |
| `s('tenant-id:corp!')` | 后续 builder 方法完整提示，例如 `.label()`、`.default()`、`.pattern()`、`.require()` | 字符串内部的 `corp` 参数通常不做静态类型检查 | 想保留 DSL 简洁性，同时追加链式增强。 |
| `s.tenantId('corp')` | factory 名、参数、返回 builder 都可提示 | 代码比纯 DSL 长 | 自定义类型、参数化类型、重构友好场景。 |

因此文档示例可以同时展示三种入口，但真实项目建议这样组织：

```ts
// schema-dsl.ts
import { registerExtensions } from 'schema-dsl/pure';

export const s = registerExtensions([
  {
    literal: 'tenant-id',
    factoryName: 'tenantId',
    segmentMode: 'params',
    params: {
      scope: {
        kind: 'enum',
        values: ['tenant', 'corp'],
        default: 'tenant'
      }
    },
    schema({ scope }) {
      return { type: 'string', pattern: `^${scope}_[a-z0-9]+$` };
    }
  }
] as const);
```

业务代码只从本地模块导入配置后的 `s`：

```ts
import { s } from './schema-dsl';

const schema = s({
  compact: 'tenant-id:corp!',
  readable: s('tenant-id:corp!').label('租户'),
  typed: s.tenantId('corp').label('租户').require()
});
```

直接调用 `s.registerExtension(...)` 和 `runtime.registerExtension(...)` 仍然适合运行时动态注册，但 TypeScript 不能因为一次运行时调用就自动知道 `s.tenantId()` 的静态类型。需要完整提示时，使用 typed 批量注册 API 或项目自己的模块增强。

## Runtime 作用域

框架、插件宿主、租户、worker 和隔离测试应把同一份扩展定义注册到 runtime 实例：

```ts
import { createRuntime } from 'schema-dsl/runtime';

const runtime = createRuntime();

const runtimeS = runtime.registerExtensions([
  {
    literal: 'tenant-id',
    factoryName: 'tenantId',
    segmentMode: 'params',
    params: {
      scope: { kind: 'enum', values: ['tenant', 'corp'], default: 'tenant' }
    },
    schema({ scope }) {
      return { type: 'string', pattern: scope === 'corp' ? '^corp_' : '^tenant_' };
    }
  }
] as const);

const schema = runtime.s({
  tenant: 'tenant-id:corp!',
  owner: runtimeS.tenantId('corp').require()
});
```

`runtimeS` 是注册时返回的 typed namespace。runtime 实例本身也会更新，但 TypeScript 静态 factory 提示主要来自这个返回值。

runtime 作用域需要看清这些事：

| 目标 | 推荐做法 | 原因 |
|------|----------|------|
| 普通应用全局扩展 | 在应用启动阶段创建并导出配置后的 `s` | 业务文件只导入一个稳定入口。 |
| 框架接入零副作用 | 从 `schema-dsl/pure` 或 `schema-dsl/runtime` 创建入口 | 不触发根入口的 String 扩展安装。 |
| 多租户 / 插件 / 测试隔离 | 每个租户、插件或测试使用独立 runtime | 扩展 registry、locale、validator cache 不互相污染。 |
| 测试后清理 | 调用 `runtime.dispose()` 或当前 API 的 reset/cleanup 能力 | 避免下一个测试复用上一个扩展。 |

不要要求用户先手动 `uninstallStringExtensions()` 才能使用 `s('xxx')`。如果目标是无副作用，从入口选择上就应该使用 `schema-dsl/pure` 或 runtime。

## 对应示例文件

**示例入口**: [custom-extensions.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/custom-extensions.ts)
**说明**: 示例使用声明式参数化 API。在本仓库内运行示例前，请先执行本地构建，确保 `dist/` 与源码一致。
