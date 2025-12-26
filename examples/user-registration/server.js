/**
 * 用户注册服务器
 *
 * 启动方法：node examples/user-registration/server.js
 */

const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 路由
app.use('/api', routes);

// 首页
app.get('/', (req, res) => {
  res.send(`
    <h1>SchemaIO 用户注册示例</h1>
    <p>请使用POST请求测试API:</p>
    <pre>
POST http://localhost:${PORT}/api/register
Content-Type: application/json
Accept-Language: zh-CN

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "Password123",
  "confirmPassword": "Password123",
  "phone": "13800138001",
  "agreeTerms": true
}
    </pre>
    <p><a href="/api/users">查看已注册用户</a></p>
  `);
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    code: 'SERVER_ERROR',
    message: '服务器内部错误'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
========================================
  用户注册示例服务器已启动
========================================
  地址: http://localhost:${PORT}
  API: http://localhost:${PORT}/api/register
  
  测试命令:
  curl -X POST http://localhost:${PORT}/api/register \\
    -H "Content-Type: application/json" \\
    -H "Accept-Language: zh-CN" \\
    -d '{"username":"test","email":"test@example.com","password":"Password123","confirmPassword":"Password123","phone":"13800138001","agreeTerms":true}'
========================================
  `);
});

module.exports = app;


