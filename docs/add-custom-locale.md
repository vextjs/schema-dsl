# 添加自定义语言包指南

**版本**: v1.0.9  
**最后更新**: 2026-01-04

---

## 📖 概述

本指南将教你如何为 schema-dsl 添加自定义语言包或扩展现有语言。

---

## 🚀 快速开始

### 推荐方式：配置语言包目录（一次性加载所有语言）⭐

**正确的使用方式**：在应用启动时一次性加载所有语言包，运行时直接切换。

#### 第1步：创建语言包文件


#### 第1步：创建语言包文件

```bash
# 项目结构
my-project/
├── locales/              # 语言包目录
│   ├── zh-CN.js         # 中文（已存在，将被覆盖/合并）
│   ├── en-US.js         # 英文（已存在，将被覆盖/合并）
│   └── pt-BR.js         # 葡萄牙语（新增）
└── app.js
```

#### 第2步：定义语言包（`locales/pt-BR.js`）

```javascript
module.exports = {
  // 通用验证错误
  'required': '{{#label}} é obrigatório',
  'type': '{{#label}} deve ser do tipo {{#expected}}',
  'min': '{{#label}} deve ter pelo menos {{#limit}} caracteres',
  'max': '{{#label}} não pode exceder {{#limit}} caracteres',
  'length': '{{#label}} deve ter exatamente {{#limit}} caracteres',
  'pattern': '{{#label}} formato inválido',
  'enum': '{{#label}} deve ser um dos seguintes valores: {{#allowed}}',
  
  // 格式验证
  'format.email': '{{#label}} deve ser um e-mail válido',
  'format.url': '{{#label}} deve ser uma URL válida',
  'format.uuid': '{{#label}} deve ser um UUID válido',
  'format.date': '{{#label}} deve ser uma data válida (YYYY-MM-DD)',
  'format.datetime': '{{#label}} deve ser uma data/hora válida (ISO 8601)',
  
  // 字符串验证
  'string.minLength': '{{#label}} deve ter pelo menos {{#limit}} caracteres',
  'string.maxLength': '{{#label}} não pode exceder {{#limit}} caracteres',
  'string.pattern': '{{#label}} formato inválido',
  'string.alphanum': '{{#label}} deve conter apenas letras e números',
  
  // 数字验证
  'number.base': '{{#label}} deve ser um número',
  'number.min': '{{#label}} não pode ser menor que {{#limit}}',
  'number.max': '{{#label}} não pode ser maior que {{#limit}}',
  'number.integer': '{{#label}} deve ser um inteiro',
  'number.positive': '{{#label}} deve ser um número positivo',
  'number.negative': '{{#label}} deve ser um número negativo',
  
  // 布尔验证
  'boolean.base': '{{#label}} deve ser um booleano',
  
  // 对象验证
  'object.base': '{{#label}} deve ser um objeto',
  
  // 数组验证
  'array.base': '{{#label}} deve ser um array',
  'array.min': '{{#label}} deve ter pelo menos {{#limit}} itens',
  'array.max': '{{#label}} não pode ter mais de {{#limit}} itens',
  
  // 日期验证
  'date.base': '{{#label}} deve ser uma data válida',
  'date.min': '{{#label}} não pode ser anterior a {{#limit}}',
  'date.max': '{{#label}} não pode ser posterior a {{#limit}}',
  
  // 自定义模式
  'pattern.phone.cn': 'Número de telefone inválido',
  'pattern.idCard.cn': 'Número de identidade inválido',
  'pattern.creditCard': 'Número de cartão de crédito inválido',
  'pattern.objectId': 'ObjectId inválido',
  'pattern.hexColor': 'Código de cor hexadecimal inválido',
  'pattern.macAddress': 'Endereço MAC inválido',
  'pattern.cron': 'Expressão Cron inválida',
  'pattern.slug': 'Slug deve conter apenas letras minúsculas, números e hífens'
};
```

#### 第3步：应用启动时一次性加载所有语言

```javascript
const { dsl, validate } = require('schema-dsl');
const path = require('path');

// ========== 应用启动时配置（只执行一次）==========
dsl.config({
  i18n: path.join(__dirname, 'locales')  // 自动加载目录下所有语言文件
});

// 说明：
// 1. 自动扫描 locales/ 目录下的所有 .js 和 .json 文件
// 2. 从文件名提取语言代码（如 pt-BR.js → pt-BR）
// 3. 自动加载并注册所有语言包
// 4. 用户自定义的语言包会与系统默认语言包合并，用户的优先

// ========== 运行时直接切换语言（无需重新加载）==========
const schema = dsl({ username: 'string:3-32!' });

// 使用葡萄牙语
const result1 = validate(schema, { username: 'ab' }, { locale: 'pt-BR' });
// 错误消息: "username deve ter pelo menos 3 caracteres"

// 使用中文
const result2 = validate(schema, { username: 'ab' }, { locale: 'zh-CN' });
// 错误消息: "username长度不能少于3个字符"

// 使用英文
const result3 = validate(schema, { username: 'ab' }, { locale: 'en-US' });
// 错误消息: "username length must be at least 3"
```

#### 语言包合并策略

```javascript
// 系统内置的 zh-CN 语言包
const systemZhCN = {
  'required': '{{#label}}是必填项',
  'string.minLength': '{{#label}}长度不能少于{{#limit}}个字符'
};

// 用户自定义的 locales/zh-CN.js
const userZhCN = {
  'required': '{{#label}}必须填写',  // 覆盖系统默认
  'custom.myError': '自定义错误'     // 新增自定义消息
};

// 最终合并结果（深度合并）
const finalZhCN = {
  'required': '{{#label}}必须填写',                      // ✅ 用户的优先
  'string.minLength': '{{#label}}长度不能少于{{#limit}}个字符', // 保留系统默认
  'custom.myError': '自定义错误'                         // 新增自定义消息
};
```

---

### 方式2：直接传入对象（适合动态配置）

```javascript
const { dsl } = require('schema-dsl');

// 应用启动时配置
dsl.config({
  i18n: {
    'pt-BR': require('./locales/pt-BR'),
    'de-DE': require('./locales/de-DE'),
    'ko-KR': require('./locales/ko-KR')
  }
});

// 运行时直接切换
validate(schema, data, { locale: 'pt-BR' });
validate(schema, data, { locale: 'de-DE' });
```

---

## ⚠️ 错误示例（不推荐）

### ❌ 错误：运行时单个加载语言包

```javascript
const { Locale } = require('schema-dsl');

// ❌ 不推荐：在每次验证前动态加载
function validateUser(data, locale) {
  if (locale === 'pt-BR') {
    Locale.addLocale('pt-BR', require('./locales/pt-BR'));  // 每次都加载，性能差
  }
  return validate(schema, data, { locale });
}
```

}

// ✅ 正确：应用启动时一次性加载
// app.js 启动入口
dsl.config({ i18n: './locales' });  // 只加载一次

// 运行时直接切换，无需重新加载
function validateUser(data, locale) {
  return validate(schema, data, { locale });  // ✅ 直接切换，性能好
}
```

### 为什么推荐"首次加载，运行时切换"？

| 方式 | 加载次数 | 性能 | 内存 | 推荐度 |
|------|---------|------|------|--------|
| **首次加载所有** | 1次 | ⭐⭐⭐⭐⭐ 极快 | 低 | ✅ 强烈推荐 |
| 运行时单个加载 | N次 | ⭐⭐ 慢 | 中 | ❌ 不推荐 |

---

## 🎯 完整示例

```javascript
// ========== app.js（应用启动入口）==========
const express = require('express');
const { dsl, validate } = require('schema-dsl');
const path = require('path');

// 应用启动时一次性加载所有语言包
dsl.config({
  i18n: path.join(__dirname, 'locales')
});

const app = express();

// ========== routes/user.js（业务路由）==========
const userSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120'
});

app.post('/api/users', (req, res) => {
  // 从请求头获取用户语言偏好
  const locale = req.headers['accept-language'] || 'en-US';
  
  // 验证（直接切换语言，无需加载）
  const result = validate(userSchema, req.body, { locale });
  
  if (!result.valid) {
    return res.status(400).json({
      errors: result.errors  // 自动使用用户偏好的语言
    });
  }
  
  // 处理请求...
});
```

---

## 📋 完整的消息键列表

### 通用键

| 键名 | 说明 | 示例 |
|-----|------|------|
| `required` | 必填字段 | `{{#label}} é obrigatório` |
| `type` | 类型错误 | `{{#label}} deve ser do tipo {{#expected}}` |
| `min` | 最小长度（通用） | `{{#label}} deve ter pelo menos {{#limit}} caracteres` |
| `max` | 最大长度（通用） | `{{#label}} não pode exceder {{#limit}} caracteres` |
| `length` | 精确长度 | `{{#label}} deve ter exatamente {{#limit}} caracteres` |
| `pattern` | 模式匹配 | `{{#label}} formato inválido` |
| `enum` | 枚举值 | `{{#label}} deve ser um dos seguintes: {{#allowed}}` |

### 字符串验证键

| 键名 | 说明 | 可用变量 |
|-----|------|---------|
| `string.minLength` | 最小长度 | `{{#label}}`, `{{#limit}}` |
| `string.maxLength` | 最大长度 | `{{#label}}`, `{{#limit}}` |
| `string.length` | 精确长度 | `{{#label}}`, `{{#limit}}` |
| `string.pattern` | 模式匹配 | `{{#label}}` |
| `string.alphanum` | 字母数字 | `{{#label}}` |
| `string.enum` | 枚举值 | `{{#label}}`, `{{#valids}}` |

### 数字验证键

| 键名 | 说明 | 可用变量 |
|-----|------|---------|
| `number.base` | 类型错误 | `{{#label}}` |
| `number.min` | 最小值 | `{{#label}}`, `{{#limit}}` |
| `number.max` | 最大值 | `{{#label}}`, `{{#limit}}` |
| `number.integer` | 整数 | `{{#label}}` |
| `number.positive` | 正数 | `{{#label}}` |
| `number.negative` | 负数 | `{{#label}}` |
| `number.precision` | 小数精度 | `{{#label}}`, `{{#limit}}` |
| `number.port` | 端口号 | `{{#label}}` |

### 格式验证键

| 键名 | 说明 |
|-----|------|
| `format.email` | 邮箱格式 |
| `format.url` | URL格式 |
| `format.uuid` | UUID格式 |
| `format.date` | 日期格式 |
| `format.datetime` | 日期时间格式 |
| `format.time` | 时间格式 |
| `format.ipv4` | IPv4地址 |
| `format.ipv6` | IPv6地址 |
| `format.binary` | Base64编码 |

### 自定义模式键

| 键名 | 说明 |
|-----|------|
| `pattern.phone.cn` | 中国手机号 |
| `pattern.phone.us` | 美国电话号 |
| `pattern.idCard.cn` | 中国身份证 |
| `pattern.creditCard` | 信用卡号 |
| `pattern.objectId` | MongoDB ObjectId |
| `pattern.hexColor` | 十六进制颜色 |
| `pattern.macAddress` | MAC地址 |
| `pattern.cron` | Cron表达式 |
| `pattern.slug` | URL别名 |
| `pattern.username` | 用户名 |
| `pattern.password.weak` | 弱密码 |
| `pattern.password.medium` | 中等密码 |
| `pattern.password.strong` | 强密码 |
| `pattern.password.veryStrong` | 超强密码 |

---

## 🎨 模板变量

所有错误消息支持以下模板变量：

| 变量 | 说明 | 使用示例 |
|------|------|---------|
| `{{#label}}` | 字段标签 | `{{#label}} é obrigatório` |
| `{{#limit}}` | 限制值（长度/大小） | `deve ter pelo menos {{#limit}} caracteres` |
| `{{#allowed}}` | 允许的值列表 | `deve ser um dos seguintes: {{#allowed}}` |
| `{{#expected}}` | 期望的类型 | `deve ser do tipo {{#expected}}` |
| `{{#valids}}` | 有效值列表（数组） | `deve ser: {{#valids}}` |
| `{{#path}}` | 字段路径 | `Erro no campo {{#path}}` |

---

## 📚 参考内置语言包

你可以参考内置的语言包作为模板：

```javascript
// 查看中文语言包
const zhCN = require('schema-dsl/lib/locales/zh-CN');
console.log(zhCN);

// 查看英文语言包
const enUS = require('schema-dsl/lib/locales/en-US');
console.log(enUS);
```

或者直接查看源码：
- 中文：`node_modules/schema-dsl/lib/locales/zh-CN.js`
- 英文：`node_modules/schema-dsl/lib/locales/en-US.js`
- 日语：`node_modules/schema-dsl/lib/locales/ja-JP.js`
- 西班牙语：`node_modules/schema-dsl/lib/locales/es-ES.js`
- 法语：`node_modules/schema-dsl/lib/locales/fr-FR.js`

---

## ✅ 最佳实践

1. **完整性**：确保翻译所有常用的错误消息键
2. **一致性**：保持错误消息风格统一
3. **模板变量**：正确使用 `{{#label}}`、`{{#limit}}` 等变量
4. **测试**：添加语言包后进行测试，确保所有消息正确显示
5. **文档**：为自定义语言包编写使用说明

---

## 🤝 贡献语言包

如果你为 schema-dsl 添加了新语言包，欢迎提交 Pull Request：

1. Fork 项目
2. 在 `lib/locales/` 目录创建新语言文件（如 `pt-BR.js`）
3. 完整翻译所有消息键
4. 在 `lib/locales/index.js` 中注册新语言
5. 添加测试用例（在 `test/unit/locales/` 目录）
6. 提交 Pull Request

---

## 📞 支持

如果你在添加语言包时遇到问题：

- 查看 [多语言配置指南](./i18n.md)
- 查看 [动态多语言配置指南](./dynamic-locale.md)
- 提交 Issue: https://github.com/your-repo/schema-dsl/issues

