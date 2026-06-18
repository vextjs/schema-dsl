# label vs description 使用指南

## 📋 快速对比

| 属性 | 用途 | 显示位置 | 示例 |
|------|------|----------|------|
| **label** | 字段名称 | 错误消息中 | "邮箱地址不能为空" |
| **description** | 字段说明 | 表单提示/文档 | "用于登录和接收通知" |

---

## 🎯 详细说明

### label（标签）

**作用**: 在错误消息中替换字段名

**使用场景**:
- 让错误消息更友好
- 中文化字段名
- 简化技术字段名

**示例**:

```javascript
// 不使用label
email: 'email!'
// 错误消息: "email is required"  ❌ 不友好

// 使用label
email: s('email!').label('邮箱地址')
// 错误消息: "邮箱地址不能为空"  ✅ 友好
```

**完整示例**:

```javascript
const schema = s({
  userEmail: s('email!').label('用户邮箱')
    .messages({
      'required': '{{#label}}不能为空',  // 使用label值
      'format': '{{#label}}格式不正确'
    })
});

// 验证失败时:
// 错误: "用户邮箱不能为空"
// 错误: "用户邮箱格式不正确"
```

---

### description（描述）

**作用**: 提供字段的详细说明

**使用场景**:
- 表单输入提示
- API文档生成
- Schema文档
- 帮助用户理解字段用途

**示例**:

```javascript
email: s('email!').label('邮箱地址')
  .description('用于登录和接收系统通知')
```

**在表单中使用**:

```html
<div class="form-field">
  <label>邮箱地址</label>  <!-- 来自 label -->
  <input type="email" />
  <span class="hint">用于登录和接收系统通知</span>  <!-- 来自 description -->
</div>
```

**在导出 / 文档工具中**:

```json
{
  "email": {
    "type": "string",
    "format": "email",
    "_label": "邮箱地址",          // label 在 schema-dsl 内部以 _label 保存
    "description": "用于登录和接收系统通知"  // 来自 description
  }
}
```

`SchemaUtils.toMarkdown()`、导出器或你自己的表单渲染层，通常会再把 `_label` 映射成展示标题。

---

## 💡 最佳实践

### 1. label 是必需的（用户可见字段）

```javascript
const schema = s({
  // ✅ 好：所有用户可见字段都有label
  username: s('string:3-32!').label('用户名'),
  email: s('email!').label('邮箱地址'),
  password: s('string:8-64!').label('密码'),
  
  // ⚠️ 可以：内部字段可以不用label
  userId: 'uuid!',
  createdAt: 'date!'
});
```

### 2. description 是可选的（需要说明时使用）

```javascript
const schema = s({
  // ✅ 复杂字段：添加description
  apiKey: s('string:32!').label('API密钥')
    .description('用于调用第三方API，请妥善保管'),
  
  // ✅ 简单字段：不需要description
  name: s('string:1-50!').label('姓名'),
  
  // ✅ 有特殊要求的字段：添加description
  password: s('string:8-64!').label('密码')
    .description('必须包含大小写字母和数字')
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
});
```

### 3. 组合使用示例

```javascript
const userSchema = s({
  // 完整的字段定义
  email: s('email!').label('邮箱地址')                    // 错误消息中显示
    .description('用于登录和接收通知')    // 表单提示/文档
    .messages({
      'required': '{{#label}}不能为空',
      'format': '请输入有效的{{#label}}'
    }),
  
  // 简单字段
  age: s('number:18-120').label('年龄'),
  
  // 复杂字段
  bio: s('string:500').label('个人简介')
    .description('介绍你自己，最多500字'),
  
  // 内部字段（无需label/description）
  userId: 'uuid!',
  createdAt: 'date!'
});
```

---

## 📊 使用场景对比

| 场景 | label | description |
|------|-------|-------------|
| **错误消息** | ✅ 必需 | ❌ 不使用 |
| **表单标签** | ✅ 推荐 | ⚠️ 可选 |
| **表单提示** | ❌ 不使用 | ✅ 推荐 |
| **API文档** | ✅ 作为title | ✅ 作为说明 |
| **Schema文档** | ✅ 字段名 | ✅ 字段说明 |
| **内部字段** | ⚠️ 可选 | ⚠️ 可选 |

---

## 🎨 实际效果

### 验证错误显示

```javascript
// Schema定义
const schema = s({
  email: s('email!').label('邮箱地址')
    .messages({
      'required': '{{#label}}不能为空',
      'format': '{{#label}}格式不正确'
    })
});

// 验证空值
validator.validate(schema, { email: '' });
// 错误: "邮箱地址不能为空"  ← 使用了label

// 验证错误格式
validator.validate(schema, { email: 'invalid' });
// 错误: "邮箱地址格式不正确"  ← 使用了label
```

### 表单渲染

```javascript
const schema = s({
  password: s('string:8-64!').label('登录密码')
    .description('8-64位，包含大小写字母和数字')
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
});

// 渲染为HTML
<div class="form-field">
  <label>登录密码</label>                              ← label
  <input type="password" />
  <span class="hint">8-64位，包含大小写字母和数字</span>  ← description
</div>
```

---

## ✅ 总结

### label

- **必需性**: 用户可见字段推荐使用
- **用途**: 让错误消息更友好
- **位置**: 错误消息、表单标签
- **格式**: 简短的名词（2-6个字）

### description

- **必需性**: 可选，需要说明时使用
- **用途**: 帮助用户理解字段用途
- **位置**: 表单提示、API文档
- **格式**: 完整的句子或短语

### 推荐组合

```javascript
// 最小配置（简单字段）
name: s('string:1-50!').label('姓名')

// 标准配置（常规字段）
email: s('email!').label('邮箱地址')
  .messages({ 'format': '请输入有效的{{#label}}' })

// 完整配置（复杂字段）
apiKey: s('string:32!').label('API密钥')
  .description('用于调用第三方API，请妥善保管')
  .pattern(/^[A-Za-z0-9]{32}$/)
  .messages({
    'required': '{{#label}}不能为空',
    'pattern': '{{#label}}格式不正确'
  })
```

---

**记住**: label用于错误消息和展示标题来源，description用于帮助说明！

---

## 对应示例文件

**示例入口**: [label-vs-description.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/label-vs-description.ts)  
**说明**: 直接展示 `_label` / `description` 在 schema 中的实际落点，以及验证错误如何消费 `label`。


