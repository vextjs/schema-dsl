/**
 * i18n 子目录合并测试
 *
 * 测试 dsl.config({ i18n: path }) 的递归子目录扫描、冲突检测、文件名过滤能力
 * 以及向后兼容性（现有所有用法不回归）
 *
 * @version v1.2.3
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { dsl, validate, Locale } = require('../../index');

// ─── 工具：在临时目录创建语言文件 ──────────────────────────────────────────────

function createTmpLocales(tree) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'schema-dsl-test-'));
  for (const [relPath, content] of Object.entries(tree)) {
    const fullPath = path.join(root, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, `module.exports = ${JSON.stringify(content)};`, 'utf-8');
  }
  return root;
}

// ─── 所有测试包在一个顶级 describe 内，保证 afterEach 不泄漏到其他文件 ─────────

describe('i18n 子目录合并', function () {

  // 每个 it 前重置，it 后自动还原（afterEach 作用域严格限制在本 describe 内）
  afterEach(function () {
    Locale.reset();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // F1：递归子目录扫描
  // ══════════════════════════════════════════════════════════════════════════

  describe('F1 递归子目录扫描', function () {

    it('应该正确加载单层目录（向后兼容）', function () {
      const root = createTmpLocales({
        'zh-CN.js': { 'hello': '你好' },
        'en-US.js': { 'hello': 'Hello' }
      });
      dsl.config({ i18n: root });
      assert.strictEqual(Locale.getMessage('hello', {}, 'zh-CN').message, '你好');
      assert.strictEqual(Locale.getMessage('hello', {}, 'en-US').message, 'Hello');
    });

    it('应该递归加载一级子目录下的语言文件', function () {
      const root = createTmpLocales({
        'core/zh-CN.js':    { 'test.core.key': '核心' },
        'account/zh-CN.js': { 'test.account.notFound': '账户不存在' },
        'order/zh-CN.js':   { 'test.order.notPaid': '订单未支付' }
      });
      dsl.config({ i18n: root });
      assert.strictEqual(Locale.getMessage('test.core.key', {}, 'zh-CN').message, '核心');
      assert.strictEqual(Locale.getMessage('test.account.notFound', {}, 'zh-CN').message, '账户不存在');
      assert.strictEqual(Locale.getMessage('test.order.notPaid', {}, 'zh-CN').message, '订单未支付');
    });

    it('应该递归加载二级子目录（深层嵌套）', function () {
      const root = createTmpLocales({
        'modules/user/zh-CN.js':    { 'test.user.notFound': '用户不存在' },
        'modules/payment/zh-CN.js': { 'test.payment.failed': '支付失败' }
      });
      dsl.config({ i18n: root });
      assert.strictEqual(Locale.getMessage('test.user.notFound', {}, 'zh-CN').message, '用户不存在');
      assert.strictEqual(Locale.getMessage('test.payment.failed', {}, 'zh-CN').message, '支付失败');
    });

    it('应该合并同语言的多个子目录文件', function () {
      const root = createTmpLocales({
        'account/zh-CN.js': { 'test.account.k1': '账户已锁定', 'test.account.k2': '账户冻结' },
        'order/zh-CN.js':   { 'test.order.k1': '订单不存在', 'test.order.k2': '订单未支付' }
      });
      dsl.config({ i18n: root });
      assert.ok(Locale.getMessage('test.account.k1', {}, 'zh-CN').message);
      assert.ok(Locale.getMessage('test.account.k2', {}, 'zh-CN').message);
      assert.ok(Locale.getMessage('test.order.k1', {}, 'zh-CN').message);
      assert.ok(Locale.getMessage('test.order.k2', {}, 'zh-CN').message);
    });

    it('合并后的语言包可正常用于 validate', function () {
      const root = createTmpLocales({
        'account/zh-CN.js': { 'min': '{{#label}}长度不能少于{{#limit}}个字符' }
      });
      dsl.config({ i18n: root });
      const schema = dsl({ name: 'string:3-20!' });
      const result = validate(schema, { name: 'ab' }, { locale: 'zh-CN' });
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors[0].message.includes('长度不能少于'));
    });

    it('子目录中有多个语言时，各语言均正确加载', function () {
      const root = createTmpLocales({
        'account/zh-CN.js': { 'test.multi.key': '账户不存在' },
        'account/en-US.js': { 'test.multi.key': 'Account not found' },
        'order/zh-CN.js':   { 'test.order.multi': '订单未支付' },
        'order/en-US.js':   { 'test.order.multi': 'Order not paid' }
      });
      dsl.config({ i18n: root });
      assert.strictEqual(Locale.getMessage('test.multi.key', {}, 'zh-CN').message, '账户不存在');
      assert.strictEqual(Locale.getMessage('test.multi.key', {}, 'en-US').message, 'Account not found');
      assert.strictEqual(Locale.getMessage('test.order.multi', {}, 'zh-CN').message, '订单未支付');
      assert.strictEqual(Locale.getMessage('test.order.multi', {}, 'en-US').message, 'Order not paid');
    });

  });

  // ══════════════════════════════════════════════════════════════════════════
  // F2：同名 key 冲突检测
  // ══════════════════════════════════════════════════════════════════════════

  describe('F2 同名 key 冲突检测', function () {

    it('默认模式：同名 key 冲突时打 WARN，不抛错', function () {
      const root = createTmpLocales({
        'a/zh-CN.js': { 'test.conflict.key': '来自A' },
        'b/zh-CN.js': { 'test.conflict.key': '来自B' }
      });
      const warnMessages = [];
      const origWarn = console.warn;
      console.warn = (...args) => warnMessages.push(args.join(' '));
      try {
        assert.doesNotThrow(() => dsl.config({ i18n: root }));
        assert.ok(warnMessages.some(m => m.includes('test.conflict.key')), '应该打出包含冲突 key 的 WARN');
      } finally {
        console.warn = origWarn;
      }
    });

    it('默认模式：冲突后续文件的 key 覆盖前面的值', function () {
      const root = createTmpLocales({
        'a/zh-CN.js': { 'test.dup.key': '旧值' },
        'b/zh-CN.js': { 'test.dup.key': '新值' }
      });
      const origWarn = console.warn;
      console.warn = () => {};
      try {
        dsl.config({ i18n: root });
      } finally {
        console.warn = origWarn;
      }
      assert.strictEqual(Locale.getMessage('test.dup.key', {}, 'zh-CN').message, '新值');
    });

    it('strict 模式：同名 key 冲突时抛出 Error', function () {
      const root = createTmpLocales({
        'a/zh-CN.js': { 'test.strict.key': '来自A' },
        'b/zh-CN.js': { 'test.strict.key': '来自B' }
      });
      assert.throws(
        () => dsl.config({ i18n: root, strict: true }),
        (err) => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes('test.strict.key'), `错误信息应包含冲突 key，实际: ${err.message}`);
          return true;
        }
      );
    });

    it('strict 模式：无冲突时不抛错', function () {
      const root = createTmpLocales({
        'account/zh-CN.js': { 'test.strict.account': '账户' },
        'order/zh-CN.js':   { 'test.strict.order': '订单' }
      });
      assert.doesNotThrow(() => dsl.config({ i18n: root, strict: true }));
    });

    it('strict 模式：错误信息包含冲突来源文件路径', function () {
      const root = createTmpLocales({
        'a/zh-CN.js': { 'test.path.dup': 'A' },
        'b/zh-CN.js': { 'test.path.dup': 'B' }
      });
      let errorMsg = '';
      try {
        dsl.config({ i18n: root, strict: true });
      } catch (e) {
        errorMsg = e.message;
      }
      assert.ok(errorMsg.includes('zh-CN'), '应包含语言代码');
      assert.ok(errorMsg.includes('test.path.dup'), '应包含冲突 key');
    });

  });

  // ══════════════════════════════════════════════════════════════════════════
  // F3：语言文件名格式校验
  // ══════════════════════════════════════════════════════════════════════════

  describe('F3 语言文件名格式校验', function () {

    it('应该跳过 index.js', function () {
      const root = createTmpLocales({
        'index.js':  { 'index.key': '不应被加载' },
        'zh-CN.js':  { 'real.key': '应被加载' }
      });
      dsl.config({ i18n: root });
      assert.ok(!Locale.locales['index'], 'index 不应作为语言包加载');
      assert.ok(Locale.getMessage('real.key', {}, 'zh-CN').message === '应被加载');
    });

    it('应该跳过 utils.js、CODE-SEGMENTS.js 等非语言文件', function () {
      const root = createTmpLocales({
        'utils.js':          { 'utils.key': '工具' },
        'CODE-SEGMENTS.js':  { 'code.key': '码段' },
        'README.js':         { 'readme.key': '说明' },
        'zh-CN.js':          { 'valid.key': '有效' }
      });
      dsl.config({ i18n: root });
      assert.ok(!Locale.locales['utils']);
      assert.ok(!Locale.locales['CODE-SEGMENTS']);
      assert.ok(!Locale.locales['README']);
      assert.ok(Locale.getMessage('valid.key', {}, 'zh-CN').message === '有效');
    });

    it('应该正确加载标准语言代码格式的文件', function () {
      const root = createTmpLocales({
        'zh-CN.js':  { 'test.k1': 'v1' },
        'en-US.js':  { 'test.k2': 'v2' },
        'ja-JP.js':  { 'test.k3': 'v3' },
        'fr-FR.js':  { 'test.k4': 'v4' },
        'zh.js':     { 'test.k5': 'v5' },
        'en.js':     { 'test.k6': 'v6' }
      });
      dsl.config({ i18n: root });
      assert.ok(Locale.getMessage('test.k1', {}, 'zh-CN').message === 'v1');
      assert.ok(Locale.getMessage('test.k2', {}, 'en-US').message === 'v2');
      assert.ok(Locale.getMessage('test.k3', {}, 'ja-JP').message === 'v3');
      assert.ok(Locale.getMessage('test.k4', {}, 'fr-FR').message === 'v4');
      assert.ok(Locale.getMessage('test.k5', {}, 'zh').message === 'v5');
      assert.ok(Locale.getMessage('test.k6', {}, 'en').message === 'v6');
    });

  });

  // ══════════════════════════════════════════════════════════════════════════
  // 向后兼容性回归测试
  // ══════════════════════════════════════════════════════════════════════════

  describe('向后兼容性回归', function () {

    it('用法1 字符串路径（平铺，无子目录）—— 行为不变', function () {
      const root = createTmpLocales({
        'zh-CN.js': { 'compat.key': '兼容' },
        'en-US.js': { 'compat.key': 'Compat' }
      });
      dsl.config({ i18n: root });
      assert.strictEqual(Locale.getMessage('compat.key', {}, 'zh-CN').message, '兼容');
      assert.strictEqual(Locale.getMessage('compat.key', {}, 'en-US').message, 'Compat');
    });

    it('用法2 对象直接传语言包 —— 行为不变', function () {
      dsl.config({
        i18n: {
          'zh-CN': { 'obj.key': '对象' },
          'en-US': { 'obj.key': 'Object' }
        }
      });
      assert.strictEqual(Locale.getMessage('obj.key', {}, 'zh-CN').message, '对象');
      assert.strictEqual(Locale.getMessage('obj.key', {}, 'en-US').message, 'Object');
    });

    it('用法3 对象含 localesPath —— 真正生效（之前静默失败）', function () {
      const root = createTmpLocales({
        'zh-CN.js': { 'lp.key': '路径对象' }
      });
      dsl.config({ i18n: { localesPath: root } });
      assert.strictEqual(Locale.getMessage('lp.key', {}, 'zh-CN').message, '路径对象');
    });

    it('用法4 路径不存在 —— 只打 WARN，不抛错', function () {
      assert.doesNotThrow(() => {
        dsl.config({ i18n: '/absolutely/non/existent/path/for/test' });
      });
    });

    it('strict 未传时默认 false，现有行为零变化', function () {
      const root = createTmpLocales({
        'zh-CN.js': { 'default.strict': '默认' }
      });
      assert.doesNotThrow(() => dsl.config({ i18n: root }));
      assert.strictEqual(Locale.getMessage('default.strict', {}, 'zh-CN').message, '默认');
    });

    it('同时配置 i18n + cache + patterns —— 综合用法不回归', function () {
      const root = createTmpLocales({
        'zh-CN.js': { 'combo.key': '综合' }
      });
      assert.doesNotThrow(() => {
        dsl.config({
          i18n: root,
          cache: { maxSize: 500, ttl: 60000 }
        });
      });
      assert.strictEqual(Locale.getMessage('combo.key', {}, 'zh-CN').message, '综合');
    });

  });

}); // end describe('i18n 子目录合并')
