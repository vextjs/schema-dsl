# 自定义扩展指南

> **版本**: v1.0.2  
> **更新日期**: 2025-12-31  
> **用途**: 教你如何扩展schema-dsl，添加自己的验证器

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

1. **AJV关键字** - 底层验证逻辑
2. **DslBuilder方法** - DSL语法糖
3. **预定义模式** - 常用正则模式
4. **多语言消息** - 错误消息国际化

---

## 添加自定义AJV关键字

### 步骤1：注册关键字

在 `src/validators/CustomKeywords.ts` 中添加：

```javascript
static registerCustomValidators(ajv) {
  // 示例：手机号归属地验证
  ajv.addKeyword({
    keyword: 'phoneLocation',
    type: 'string',
    schemaType: 'string', // location参数类型
    validate: function validate(location, phoneNumber) {
      // location: 期望的归属地，如 'beijing'
      // phoneNumber: 用户输入的手机号
      
      const locationPrefixes = {
        'beijing': ['130', '131', '132'],
        'shanghai': ['133', '134', '135']
      };
      
      const prefixes = locationPrefixes[location];
      if (!prefixes) {
        validate.errors = [{
          keyword: 'phoneLocation',
          message: 'phone.location.unknown',
          params: { location }
        }];
        return false;
      }
      
      const prefix = phoneNumber.substring(0, 3);
      if (!prefixes.includes(prefix)) {
        validate.errors = [{
          keyword: 'phoneLocation',
          message: 'phone.location.mismatch',
          params: { expected: location, actual: prefix }
        }];
        return false;
      }
      
      return true;
    },
    errors: true
  });
}
```

### 步骤2：在registerAll中调用

```javascript
static registerAll(ajv) {
  // ...existing keywords...
  this.registerCustomValidators(ajv);
}
```

### 步骤3：添加多语言消息

在 `src/locales/zh-CN.ts` 中：

```javascript
module.exports = {
  // ...existing messages...
  'phone.location.unknown': '未知的归属地: {{#location}}',
  'phone.location.mismatch': '手机号归属地不匹配，期望{{#expected}}'
};
```

---

## 扩展DslBuilder方法

### 步骤1：添加便捷方法

在 `src/core/DslBuilder.ts` 中添加：

```javascript
/**
 * 手机号归属地验证
 * @param {string} location - 归属地
 * @returns {DslBuilder}
 */
phoneLocation(location) {
  if (this._baseSchema.type !== 'string') {
    throw new Error('phoneLocation() only applies to string type');
  }
  this._baseSchema.phoneLocation = location;
  return this;
}
```

### 步骤2：使用新方法

```javascript
const schema = dsl({
  mobile: dsl('string!').phone('cn').phoneLocation('beijing')
});

validate(schema, { mobile: '13012345678' });
```

---

## 添加预定义模式

### 步骤1：创建模式文件

创建 `src/config/patterns/custom.ts`：

```javascript
module.exports = {
  /**
   * 微信号验证
   */
  wechat: {
    pattern: /^[a-zA-Z]([a-zA-Z0-9_-]{5,19})$/,
    key: 'pattern.wechat',
    min: 6,
    max: 20
  },
  
  /**
   * QQ号验证
   */
  qq: {
    pattern: /^[1-9][0-9]{4,10}$/,
    key: 'pattern.qq',
    min: 5,
    max: 11
  }
};
```

### 步骤2：导出模式

在 `src/config/patterns.ts`（或对应聚合导出文件）中：

```javascript
module.exports = {
  // ...existing patterns...
  custom: require('./custom')
};
```

### 步骤3：添加DslBuilder方法

```javascript
/**
 * 微信号验证
 * @returns {DslBuilder}
 */
wechat() {
  if (this._baseSchema.type !== 'string') {
    throw new Error('wechat() only applies to string type');
  }
  const config = patterns.custom.wechat;
  return this.pattern(config.pattern).messages({ 'pattern': config.key });
}
```

### 步骤4：添加多语言

```javascript
// src/locales/zh-CN.ts
'pattern.wechat': '{{#label}}必须是有效的微信号',
'pattern.qq': '{{#label}}必须是有效的QQ号'
```

---

## 多语言支持

### 添加新语言

1. **创建语言文件**

创建 `src/locales/ko-KR.ts`（韩语）：

```javascript
module.exports = {
  required: '{{#label}}은(는) 필수 항목입니다',
  type: '{{#label}}은(는) {{#expected}} 유형이어야 합니다',
  // ...其他73个键
};
```

2. **配置加载**

```javascript
dsl.config({
  i18n: path.join(__dirname, 'i18n/locales')
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

