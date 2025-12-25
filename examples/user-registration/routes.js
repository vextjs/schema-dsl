/**
 * Express路由实现
 * 展示如何在实际项目中使用SchemaIO
 */

const express = require('express');
const { createRegisterSchema, db } = require('./schema');

const router = express.Router();

/**
 * 注册API
 * POST /api/register
 */
router.post('/register', async (req, res) => {
  try {
    // 获取用户语言（从请求头）
    const userLang = req.headers['accept-language'] || 'zh-CN';
    const lang = userLang.startsWith('zh') ? 'zh-CN' : 'en-US';

    // 创建Schema
    const schema = createRegisterSchema(lang);

    // 验证数据（传入整个body作为context用于password确认）
    const result = await schema.validate(req.body, {
      abortEarly: false,  // 收集所有错误
      context: req.body    // 传递上下文给自定义验证器
    });

    if (!result.isValid) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: lang === 'zh-CN' ? '请检查输入信息' : 'Please check your input',
        errors: result.errors.map(err => ({
          field: err.path ? err.path.join('.') : err.context?.key,
          message: err.message,
          code: err.type,
          context: err.context
        }))
      });
    }

    // 创建用户（模拟）
    const newUser = {
      id: Date.now().toString(),
      username: result.data.username,
      email: result.data.email,
      phone: result.data.phone,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);

    // 返回成功
    res.json({
      success: true,
      message: lang === 'zh-CN' ? '注册成功' : 'Registration successful',
      data: {
        userId: newUser.id,
        username: newUser.username
      }
    });

  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: '服务器内部错误'
    });
  }
});

/**
 * 获取已注册用户列表（测试用）
 * GET /api/users
 */
router.get('/users', (req, res) => {
  res.json({
    success: true,
    data: db.users.map(u => ({
      username: u.username,
      email: u.email,
      phone: u.phone
    }))
  });
});

module.exports = router;

