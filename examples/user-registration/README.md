# 用户注册系统示例

完整的企业级用户注册验证示例，展示 SchemaIO 的所有高级功能。

## 功能展示

- ✅ 错误消息定制
- ✅ 字段标签
- ✅ 多语言支持
- ✅ 异步验证（数据库检查）
- ✅ 密码强度验证
- ✅ 字段引用（密码确认）
- ✅ 自定义验证器
- ✅ Express路由集成

## 文件结构

```
examples/user-registration/
├── README.md          # 本文件
├── schema.js          # Schema定义
├── routes.js          # Express路由
├── database.js        # 模拟数据库
└── server.js          # 服务器启动
```

## 快速开始

### 1. 安装依赖

```bash
npm install express body-parser
```

### 2. 启动服务器

```bash
node examples/user-registration/server.js
```

### 3. 测试API

```bash
# 成功注册
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "Password123",
    "confirmPassword": "Password123",
    "phone": "13800138000"
  }'

# 验证失败（用户名太短）
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ab",
    "email": "john@example.com",
    "password": "Password123",
    "confirmPassword": "Password123",
    "phone": "13800138000"
  }'

# 密码不一致
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "Password123",
    "confirmPassword": "Different123",
    "phone": "13800138000"
  }'
```

## 多语言测试

```bash
# 中文错误消息
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -d '{ "username": "ab" }'

# 英文错误消息
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -H "Accept-Language: en-US" \
  -d '{ "username": "ab" }'
```

## Schema说明

详见 `schema.js` 文件，包含：

- 用户名：3-32字符，字母数字下划线，自动转小写
- 邮箱：自动转小写，去空格，异步检查重复
- 密码：8-64字符，必须包含大小写字母和数字
- 确认密码：必须与密码字段一致
- 手机号：中国大陆11位，异步检查重复

## 响应格式

### 成功响应

```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "username": "john_doe"
  }
}
```

### 验证失败响应

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "请检查输入信息",
  "errors": [
    {
      "field": "username",
      "message": "用户名长度不能少于3个字符",
      "code": "string.min",
      "context": {
        "label": "用户名",
        "limit": 3,
        "value": "ab"
      }
    }
  ]
}
```

## 技术要点

1. **错误消息定制**: 每个字段都有友好的中文错误提示
2. **字段标签**: 使用 `.label()` 设置字段的友好名称
3. **异步验证**: 使用 `.custom()` 实现数据库重复检查
4. **密码确认**: 使用 `.valid(ref('password'))` 引用密码字段
5. **自动转换**: 使用 `.lowercase()` 和 `.trim()` 自动清洗数据
6. **多语言**: 根据 `Accept-Language` 头自动切换语言

## 扩展建议

1. 添加验证码验证
2. 添加邀请码功能
3. 集成真实数据库（MongoDB/MySQL）
4. 添加邮箱验证
5. 添加手机号验证码

