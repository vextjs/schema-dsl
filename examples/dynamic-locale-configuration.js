/**
 * 动态多语言配置完整示例
 *
 * 演示如何在各种场景下动态配置和切换语言
 */

const { dsl, validate, Locale } = require('../index');

console.log('========== 动态多语言配置示例 ==========\n');

// ========================================
// 示例 1: 基本的语言切换
// ========================================
console.log('【示例 1】基本的语言切换\n');

const userSchema = dsl({
  email: 'email!',
  age: 'number:18-120!'
});

// 中文环境
Locale.setLocale('zh-CN');
let result = validate(userSchema, { email: 'invalid', age: 10 });
console.log('中文错误:', result.errors.map(e => e.message).join(', '));

// 切换到英文
Locale.setLocale('en-US');
result = validate(userSchema, { email: 'invalid', age: 10 });
console.log('英文错误:', result.errors.map(e => e.message).join(', '));

console.log('\n' + '='.repeat(60) + '\n');

// ========================================
// 示例 2: 使用 dsl.config() 批量配置语言包
// ========================================
console.log('【示例 2】使用 dsl.config() 批量配置\n');

dsl.config({
  locales: {
    'zh-CN': {
      'custom.tooYoung': '{{#label}}年龄太小，需满18岁',
      'custom.emailTaken': '{{#label}}已被占用'
    },
    'en-US': {
      'custom.tooYoung': '{{#label}} is too young, must be 18+',
      'custom.emailTaken': '{{#label}} is already taken'
    }
  }
});

// 测试自定义消息
Locale.setLocale('zh-CN');
console.log('中文自定义:', Locale.getMessage('custom.tooYoung'));

Locale.setLocale('en-US');
console.log('英文自定义:', Locale.getMessage('custom.tooYoung'));

console.log('\n' + '='.repeat(60) + '\n');

// ========================================
// 示例 3: 模拟前端语言切换
// ========================================
console.log('【示例 3】模拟前端语言切换\n');

class LanguageManager {
  constructor() {
    this.locale = 'en-US';
    this.storage = {}; // 模拟 localStorage
  }

  // 获取用户偏好语言
  getUserPreference() {
    return this.storage.userLanguage || this.detectBrowserLanguage();
  }

  // 检测浏览器语言（模拟）
  detectBrowserLanguage() {
    // 模拟 navigator.language
    const browserLang = 'zh-CN';
    const langMap = {
      'zh': 'zh-CN',
      'zh-CN': 'zh-CN',
      'en': 'en-US',
      'en-US': 'en-US'
    };
    return langMap[browserLang] || langMap[browserLang.split('-')[0]] || 'en-US';
  }

  // 切换语言
  changeLanguage(newLocale) {
    console.log(`切换语言: ${this.locale} → ${newLocale}`);
    this.locale = newLocale;
    this.storage.userLanguage = newLocale;
    Locale.setLocale(newLocale);
  }

  // 初始化
  init() {
    const preferredLang = this.getUserPreference();
    console.log(`初始化语言: ${preferredLang}`);
    this.changeLanguage(preferredLang);
  }
}

const langManager = new LanguageManager();
langManager.init();

// 验证（使用检测到的语言）
result = validate(userSchema, { email: 'test', age: 15 });
console.log('当前语言:', Locale.getLocale());
console.log('错误消息:', result.errors.map(e => e.message).join(', '));

// 用户手动切换
langManager.changeLanguage('en-US');
result = validate(userSchema, { email: 'test', age: 15 });
console.log('错误消息:', result.errors.map(e => e.message).join(', '));

console.log('\n' + '='.repeat(60) + '\n');

// ========================================
// 示例 4: 模拟服务端请求语言切换
// ========================================
console.log('【示例 4】服务端请求语言切换（安全模式）\n');

function validateWithLocale(schema, data, requestLocale) {
  // 保存原始语言
  const originalLocale = Locale.getLocale();

  try {
    // 临时切换到请求的语言
    Locale.setLocale(requestLocale);

    // 执行验证
    const result = validate(schema, data);

    return {
      locale: requestLocale,
      errors: result.errors
    };
  } finally {
    // 恢复原始语言（重要！）
    Locale.setLocale(originalLocale);
  }
}

// 模拟多个并发请求
console.log('请求1 (中文):');
const req1 = validateWithLocale(userSchema, { email: 'bad' }, 'zh-CN');
console.log('  语言:', req1.locale);
console.log('  错误:', req1.errors.map(e => e.message).join(', '));

console.log('\n请求2 (英文):');
const req2 = validateWithLocale(userSchema, { email: 'bad' }, 'en-US');
console.log('  语言:', req2.locale);
console.log('  错误:', req2.errors.map(e => e.message).join(', '));

console.log('\n请求3 (日文):');
const req3 = validateWithLocale(userSchema, { email: 'bad' }, 'ja-JP');
console.log('  语言:', req3.locale);
console.log('  错误:', req3.errors.map(e => e.message).join(', '));

console.log('\n全局语言未被污染:', Locale.getLocale());

console.log('\n' + '='.repeat(60) + '\n');

// ========================================
// 示例 5: 动态加载语言包（模拟）
// ========================================
console.log('【示例 5】动态加载语言包\n');

class LocaleLoader {
  constructor() {
    this.loadedLocales = new Set(['en-US']); // 默认已加载
  }

  // 模拟异步加载语言包
  async loadLocale(locale) {
    if (this.loadedLocales.has(locale)) {
      console.log(`语言包 "${locale}" 已加载，跳过`);
      return;
    }

    console.log(`正在加载语言包 "${locale}"...`);

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 100));

    // 模拟语言包内容
    const mockLanguagePacks = {
      'fr-FR': {
        'required': '{{#label}} est requis',
        'format.email': '{{#label}} doit être une adresse e-mail valide'
      },
      'de-DE': {
        'required': '{{#label}} ist erforderlich',
        'format.email': '{{#label}} muss eine gültige E-Mail-Adresse sein'
      }
    };

    const messages = mockLanguagePacks[locale];
    if (messages) {
      Locale.addLocale(locale, messages);
      this.loadedLocales.add(locale);
      console.log(`✅ 语言包 "${locale}" 加载成功`);
    } else {
      console.log(`❌ 语言包 "${locale}" 不存在，回退到英文`);
      return 'en-US';
    }
  }

  // 切换语言（带自动加载）
  async changeLanguage(locale) {
    await this.loadLocale(locale);
    Locale.setLocale(locale);
    console.log(`当前语言: ${Locale.getLocale()}\n`);
  }
}

const loader = new LocaleLoader();

(async () => {
  // 加载法语
  await loader.changeLanguage('fr-FR');
  result = validate(userSchema, { email: 'mauvais' });
  console.log('法语错误:', result.errors.map(e => e.message).join(', '));

  console.log('');

  // 加载德语
  await loader.changeLanguage('de-DE');
  result = validate(userSchema, { email: 'schlecht' });
  console.log('德语错误:', result.errors.map(e => e.message).join(', '));

  console.log('\n' + '='.repeat(60) + '\n');

  // ========================================
  // 示例 6: 同时获取多种语言的错误消息
  // ========================================
  console.log('【示例 6】同时获取多种语言的错误消息\n');

  const ErrorFormatter = require('../lib/core/ErrorFormatter');
  const Validator = require('../lib/core/Validator');

  const validator = new Validator();
  const invalidData = { email: 'invalid-email', age: 10 };

  // 执行验证
  const validationResult = validator.validate(userSchema, invalidData);

  // 获取多种语言的错误消息
  const languages = ['zh-CN', 'en-US', 'ja-JP'];
  const multiLangErrors = {};

  languages.forEach(lang => {
    const formatter = new ErrorFormatter(lang);
    multiLangErrors[lang] = formatter.formatDetailed(validationResult.errors);
  });

  console.log('多语言错误消息:');
  console.log(JSON.stringify(multiLangErrors, null, 2));

  console.log('\n' + '='.repeat(60) + '\n');

  // ========================================
  // 示例 7: 完整的前端应用场景
  // ========================================
  console.log('【示例 7】完整的前端应用场景\n');

  class FormValidator {
    constructor() {
      this.schema = dsl({
        username: 'string:3-20!'.label('username'),
        email: 'email!'.label('email'),
        password: 'string:8-32!'.label('password')
      });

      // 初始化语言
      this.initLanguage();
    }

    initLanguage() {
      // 1. 从 localStorage 恢复
      const savedLang = this.getStoredLanguage();

      // 2. 如果没有保存，检测浏览器语言
      const lang = savedLang || this.detectBrowserLanguage();

      // 3. 设置语言
      this.changeLanguage(lang);

      console.log(`应用启动，语言初始化为: ${lang}`);
    }

    getStoredLanguage() {
      // 模拟 localStorage.getItem
      return null; // 首次访问
    }

    detectBrowserLanguage() {
      // 模拟 navigator.language
      return 'zh-CN';
    }

    changeLanguage(lang) {
      console.log(`用户选择语言: ${lang}`);
      Locale.setLocale(lang);
      // 模拟 localStorage.setItem
    }

    validateForm(formData) {
      const result = validate(this.schema, formData);

      return {
        valid: result.valid,
        errors: result.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      };
    }
  }

  const formValidator = new FormValidator();

  // 模拟表单提交
  console.log('\n提交表单（中文环境）:');
  let formResult = formValidator.validateForm({
    username: 'ab',
    email: 'bad',
    password: '123'
  });
  console.log('验证结果:', JSON.stringify(formResult, null, 2));

  // 用户切换语言
  console.log('\n用户切换到英文:');
  formValidator.changeLanguage('en-US');

  console.log('\n再次提交表单（英文环境）:');
  formResult = formValidator.validateForm({
    username: 'ab',
    email: 'bad',
    password: '123'
  });
  console.log('验证结果:', JSON.stringify(formResult, null, 2));

  console.log('\n========== 所有示例完成 ==========');
})();

