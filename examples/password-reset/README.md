# 密码重置示例

完整的密码重置验证示例，展示 ref() 功能的实际应用。

## 功能展示

- ✅ 字段引用（ref）
- ✅ 密码强度验证
- ✅ 密码确认验证
- ✅ 错误消息定制
- ✅ 多语言支持

## 文件结构

```
examples/password-reset/
├── README.md          # 本文件
├── schema.js          # Schema定义
└── test.js            # 测试示例
```

## Schema定义

```javascript
const { dsl } = require('schemaio');
const Locale = require('schemaio/lib/core/Locale');

// 设置中文
Locale.setLocale('zh-CN');

const passwordResetSchema = dsl({
  // 新密码：8-64字符，必须包含大小写字母和数字
  newPassword: 'string:8-64!'
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .label('新密码')
    .messages({
      'minLength': '{{#label}}长度不能少于8位',
      'maxLength': '{{#label}}长度不能超过64位',
      'pattern': '{{#label}}必须包含大小写字母和数字'
    }),
  
  // 确认密码：必填
  confirmPassword: 'string:8-64!'
    .label('确认密码')
    .custom((value, helpers, { parent }) => {
      if (value !== parent.newPassword) {
        return '两次输入的密码不一致';
      }
    })
});

module.exports = passwordResetSchema;
```

## 使用示例

```javascript
const passwordResetSchema = require('./schema');

// 成功案例
const validData = {
  newPassword: 'Password123',
  confirmPassword: 'Password123'
};

const result1 = await passwordResetSchema.validate(validData, {
  root: validData
});
console.log(result1.isValid);  // true

// 失败案例1：密码不一致
const invalidData1 = {
  newPassword: 'Password123',
  confirmPassword: 'Different123'
};

const result2 = await passwordResetSchema.validate(invalidData1, {
  root: invalidData1
});
console.log(result2.errors[0].message);
// "两次输入的密码不一致"

// 失败案例2：密码强度不够
const invalidData2 = {
  newPassword: 'weak',
  confirmPassword: 'weak'
};

const result3 = await passwordResetSchema.validate(invalidData2, {
  root: invalidData2
});
console.log(result3.errors);
// [
//   { message: "新密码长度不能少于8位", type: "string.min" },
//   { message: "新密码必须包含大小写字母和数字", type: "string.pattern" }
// ]
```

## Express路由示例

```javascript
const express = require('express');
const passwordResetSchema = require('./schema');

const router = express.Router();

router.post('/reset-password', async (req, res) => {
  const result = await passwordResetSchema.validate(req.body, {
    root: req.body,
    abortEarly: false
  });

  if (!result.isValid) {
    return res.status(400).json({
      success: false,
      errors: result.errors.map(err => ({
        field: err.path?.join('.') || err.context?.key,
        message: err.message
      }))
    });
  }

  // 更新密码逻辑...
  res.json({ success: true, message: '密码重置成功' });
});

module.exports = router;
```

## 测试

```bash
# 安装依赖
npm install schemaio

# 运行测试
node examples/password-reset/test.js
```

## 核心要点

1. **ref()功能**: 使用 `ref('newPassword')` 引用新密码字段
2. **密码强度**: 使用正则表达式验证密码强度
3. **错误消息**: 自定义友好的中文错误提示
4. **上下文传递**: 验证时传递 `{ root: data }` 使ref可以解析

## 扩展建议

1. 添加旧密码验证
2. 添加密码历史检查（不能与最近3次密码相同）
3. 添加密码强度指示器
4. 集成验证码验证

