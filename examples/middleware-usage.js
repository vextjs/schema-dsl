/**
 * 中间件使用示例
 *
 * 演示如何在 Express/Koa 中使用中间件动态配置 Validator
 */

const express = require('express');
const { dsl, Validator, Locale } = require('../index');

// 确保加载所有语言包
require('../lib/locales/index');

// 扩展语言包以支持 Label 翻译 (可选)
Locale.addLocale('zh-CN', {
  'label.username': '用户名',
  'label.email': '邮箱',
  'label.age': '年龄'
});
Locale.addLocale('en-US', {
  'label.username': 'Username',
  'label.email': 'Email',
  'label.age': 'Age'
});

const app = express();
const validator = new Validator();

// ========== 中间件定义 ==========

/**
 * SchemaIO 验证中间件
 *
 * 1. 从请求头获取语言
 * 2. 创建绑定了语言的 validate 方法
 * 3. 挂载到 req 对象上
 */
const schemaIoMiddleware = (req, res, next) => {
  // 获取语言 (支持 accept-language 头或 query 参数)
  const lang = req.query.lang || req.headers['accept-language'] || 'en-US';

  // 简单的语言匹配逻辑 (例如取前两个字符或完整匹配)
  // 这里假设完整匹配，实际项目中可能需要更复杂的解析
  const locale = lang.includes('zh') ? 'zh-CN' :
                 lang.includes('ja') ? 'ja-JP' :
                 lang.includes('es') ? 'es-ES' :
                 lang.includes('fr') ? 'fr-FR' : 'en-US';

  // 挂载 validate 方法
  req.validate = (schema, data) => {
    return validator.validate(schema, data, { locale });
  };

  next();
};

app.use(schemaIoMiddleware);
app.use(express.json());

// ========== 路由定义 ==========

const userSchema = dsl({
  username: 'string:3-32!'.username(), // 自动查找 label.username
  email: 'email!',                     // 自动查找 label.email
  age: 'integer:0-150'                 // 自动查找 label.age
});

app.post('/users', (req, res) => {
  const result = req.validate(userSchema, req.body);

  if (!result.valid) {
    return res.status(400).json({
      error: 'Validation Failed',
      details: result.errors.map(e => e.message)
    });
  }

  res.json({ message: 'User created', data: result.data });
});

// ========== 启动服务器 (仅用于演示) ==========

if (require.main === module) {
  const port = 3000;
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Try sending POST /users with different Accept-Language headers');
    console.log('Example: curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -H "Accept-Language: zh-CN" -d "{}"');
  });
}

module.exports = app;

