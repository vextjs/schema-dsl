/**
 * 完整的多语言配置示例
 *
 * 演示如何使用 dsl.config() 配置用户自定义语言包
 * 以及如何在 Express 应用中实现动态语言切换
 */

const express = require('express');
const { dsl, validate, Locale } = require('../index');
const path = require('path');

console.log('========== 多语言配置完整示例 ==========\n');

// ========================================
// 步骤 1：应用启动时配置
// ========================================
console.log('【步骤 1】配置用户语言包和缓存\n');

dsl.config({
  // 用户语言包配置
  i18n: {
    // 方式 A：从目录加载（推荐用于大型项目）
    // localesPath: path.join(__dirname, 'i18n/labels'),

    // 方式 B：直接传入对象（推荐用于小型项目）
    locales: {
      'zh-CN': {
        // 字段标签
        'username': '用户名',
        'email': '邮箱地址',
        'password': '密码',
        'age': '年龄',
        'phone': '手机号',

        // 嵌套字段
        'address.city': '城市',
        'address.street': '街道',

        // 自定义错误消息
        'custom.invalidEmail': '邮箱格式不正确，请重新输入',
        'custom.emailTaken': '该邮箱已被注册',
        'custom.usernameTaken': '该用户名已被使用',
        'custom.passwordWeak': '密码强度不够，请包含大小写字母和数字'
      },
      'en-US': {
        // Field labels
        'username': 'Username',
        'email': 'Email Address',
        'password': 'Password',
        'age': 'Age',
        'phone': 'Phone Number',

        // Nested fields
        'address.city': 'City',
        'address.street': 'Street',

        // Custom error messages
        'custom.invalidEmail': 'Invalid email format, please try again',
        'custom.emailTaken': 'This email is already registered',
        'custom.usernameTaken': 'This username is already taken',
        'custom.passwordWeak': 'Password is too weak, please include uppercase, lowercase and numbers'
      },
      'ja-JP': {
        // フィールドラベル
        'username': 'ユーザー名',
        'email': 'メールアドレス',
        'password': 'パスワード',
        'age': '年齢',
        'phone': '電話番号',

        // ネストされたフィールド
        'address.city': '都市',
        'address.street': '通り',

        // カスタムエラーメッセージ
        'custom.invalidEmail': 'メール形式が正しくありません',
        'custom.emailTaken': 'このメールは既に登録されています',
        'custom.usernameTaken': 'このユーザー名は既に使用されています',
        'custom.passwordWeak': 'パスワードが弱すぎます'
      }
    }
  },

  // 缓存配置（可选，大型项目推荐）
  cache: {
    maxSize: 10000,   // 大型项目：1万个 Schema
    ttl: 7200000      // 2 小时
  }
});

console.log('✅ 配置完成\n');

// ========================================
// 步骤 2：定义 Schema（使用 key 引用语言包）
// ========================================
console.log('【步骤 2】定义 Schema\n');

const userSchema = dsl({
  username: 'string:3-32!'.label('username'),
  email: 'email!'.label('email').messages({
    'format': 'custom.invalidEmail'
  }),
  password: 'string:8-32!'.label('password'),
  age: 'number:18-120'.label('age'),
  phone: 'string'.label('phone'),
  address: dsl({
    city: 'string!'.label('address.city'),
    street: 'string!'.label('address.street')
  })
});

console.log('✅ Schema 定义完成\n');

// ========================================
// 步骤 3：测试不同语言的验证
// ========================================
console.log('【步骤 3】测试多语言验证\n');

const testData = {
  username: 'ab',
  email: 'invalid-email',
  password: '123',
  age: 15,
  address: {}
};

// 中文
console.log('--- 中文验证 ---');
let result = validate(userSchema, testData, { locale: 'zh-CN' });
console.log('有效:', result.valid);
console.log('错误:');
result.errors.forEach(err => {
  console.log(`  - ${err.path}: ${err.message}`);
});

console.log('\n--- 英文验证 ---');
result = validate(userSchema, testData, { locale: 'en-US' });
console.log('有效:', result.valid);
console.log('错误:');
result.errors.forEach(err => {
  console.log(`  - ${err.path}: ${err.message}`);
});

console.log('\n--- 日文验证 ---');
result = validate(userSchema, testData, { locale: 'ja-JP' });
console.log('有效:', result.valid);
console.log('错误:');
result.errors.forEach(err => {
  console.log(`  - ${err.path}: ${err.message}`);
});

console.log('\n========================================');
console.log('【步骤 4】Express 集成示例');
console.log('========================================\n');

// ========================================
// Express 应用示例
// ========================================

const app = express();
app.use(express.json());

// 中间件：提取语言参数
app.use((req, res, next) => {
  // 优先级：URL 参数 > Accept-Language 头 > 默认
  req.locale = req.query.lang ||
               req.headers['accept-language'] ||
               'zh-CN';

  // 只取主语言代码
  if (req.locale.includes(',')) {
    req.locale = req.locale.split(',')[0].trim();
  }

  next();
});

// API 路由：用户注册
app.post('/api/register', (req, res) => {
  console.log(`\n[POST /api/register] 语言: ${req.locale}`);

  // 使用全局 validate，传递 locale 参数
  const result = validate(userSchema, req.body, {
    locale: req.locale
  });

  if (!result.valid) {
    return res.status(400).json({
      success: false,
      errors: result.errors
    });
  }

  // 注册逻辑...
  res.json({
    success: true,
    message: '注册成功'
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 启动服务器
const PORT = 3000;
const server = app.listen(PORT, () => {
  console.log(`✅ Express 服务器启动成功`);
  console.log(`   地址: http://localhost:${PORT}`);
  console.log(`\n测试 API:`);
  console.log(`   curl -X POST http://localhost:${PORT}/api/register \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -H "Accept-Language: zh-CN" \\`);
  console.log(`     -d '{"username":"ab","email":"bad"}'`);
  console.log(`\n按 Ctrl+C 停止服务器\n`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n\n正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

// ========================================
// 前端集成示例（React）
// ========================================

console.log('========================================');
console.log('【步骤 5】前端集成示例（React）');
console.log('========================================\n');

const frontendExample = `
// src/api/validation.js
export async function validateUser(formData, locale = 'zh-CN') {
  const response = await fetch('http://localhost:3000/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': locale  // ← 传递语言
    },
    body: JSON.stringify(formData)
  });
  
  return response.json();
}

// src/components/RegisterForm.jsx
import { useState } from 'react';
import { validateUser } from '../api/validation';

function RegisterForm() {
  const [locale, setLocale] = useState('zh-CN');
  const [errors, setErrors] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = {
      username: e.target.username.value,
      email: e.target.email.value,
      password: e.target.password.value,
      age: Number(e.target.age.value)
    };

    const result = await validateUser(formData, locale);
    
    if (!result.success) {
      setErrors(result.errors);
    } else {
      alert('注册成功！');
    }
  };

  return (
    <div>
      {/* 语言切换 */}
      <select value={locale} onChange={(e) => setLocale(e.target.value)}>
        <option value="zh-CN">中文</option>
        <option value="en-US">English</option>
        <option value="ja-JP">日本語</option>
      </select>

      <form onSubmit={handleSubmit}>
        <input name="username" placeholder="用户名" />
        <input name="email" type="email" placeholder="邮箱" />
        <input name="password" type="password" placeholder="密码" />
        <input name="age" type="number" placeholder="年龄" />
        <button type="submit">注册</button>
      </form>

      {/* 错误显示 */}
      {errors.map(err => (
        <div key={err.path} style={{ color: 'red' }}>
          {err.message}  {/* 已经是对应语言 */}
        </div>
      ))}
    </div>
  );
}
`;

console.log('React 示例代码:');
console.log(frontendExample);

console.log('\n========== 示例完成 ==========');

