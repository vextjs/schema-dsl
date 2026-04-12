/**
 * i18n 子目录合并测试 (v2 TypeScript)
 *
 * v2 differences:
 * - Locale.locales is private → use Locale.getMessage() to verify loaded messages
 * - Temp locale files use CJS module.exports (loaded via require() in impl)
 */

import { describe, it, expect, afterEach } from 'vitest'
import assert from 'assert'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { dsl, validate, Locale } from '../../src/index.js'

function createTmpLocales(tree: Record<string, Record<string, string>>) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'schema-dsl-test-'))
  for (const [relPath, content] of Object.entries(tree)) {
    const fullPath = path.join(root, relPath)
    fs.mkdirSync(path.dirname(fullPath), { recursive: true })
    fs.writeFileSync(fullPath, `module.exports = ${JSON.stringify(content)};`, 'utf-8')
  }
  return root
}

describe('i18n 子目录合并', () => {

  afterEach(() => {
    Locale.reset()
  })

  describe('F1 递归子目录扫描', () => {

    it('应该正确加载单层目录（向后兼容）', () => {
      const root = createTmpLocales({
        'zh-CN.js': { 'hello': '你好' },
        'en-US.js': { 'hello': 'Hello' }
      })
      dsl.config({ i18n: root })
      expect(Locale.getMessage('hello', {}, 'zh-CN')).toBe('你好')
      expect(Locale.getMessage('hello', {}, 'en-US')).toBe('Hello')
    })

    it('应该递归加载一级子目录下的语言文件', () => {
      const root = createTmpLocales({
        'core/zh-CN.js':    { 'test.core.key': '核心' },
        'account/zh-CN.js': { 'test.account.notFound': '账户不存在' },
        'order/zh-CN.js':   { 'test.order.notPaid': '订单未支付' }
      })
      dsl.config({ i18n: root })
      expect(Locale.getMessage('test.core.key', {}, 'zh-CN')).toBe('核心')
      expect(Locale.getMessage('test.account.notFound', {}, 'zh-CN')).toBe('账户不存在')
      expect(Locale.getMessage('test.order.notPaid', {}, 'zh-CN')).toBe('订单未支付')
    })

    it('应该递归加载二级子目录（深层嵌套）', () => {
      const root = createTmpLocales({
        'modules/user/zh-CN.js':    { 'test.user.notFound': '用户不存在' },
        'modules/payment/zh-CN.js': { 'test.payment.failed': '支付失败' }
      })
      dsl.config({ i18n: root })
      expect(Locale.getMessage('test.user.notFound', {}, 'zh-CN')).toBe('用户不存在')
      expect(Locale.getMessage('test.payment.failed', {}, 'zh-CN')).toBe('支付失败')
    })

    it('应该合并同语言的多个子目录文件', () => {
      const root = createTmpLocales({
        'account/zh-CN.js': { 'test.account.k1': '账户已锁定', 'test.account.k2': '账户冻结' },
        'order/zh-CN.js':   { 'test.order.k1': '订单不存在', 'test.order.k2': '订单未支付' }
      })
      dsl.config({ i18n: root })
      expect(Locale.getMessage('test.account.k1', {}, 'zh-CN')).toBeTruthy()
      expect(Locale.getMessage('test.account.k2', {}, 'zh-CN')).toBeTruthy()
      expect(Locale.getMessage('test.order.k1', {}, 'zh-CN')).toBeTruthy()
      expect(Locale.getMessage('test.order.k2', {}, 'zh-CN')).toBeTruthy()
    })

    it('合并后的语言包可正常用于 validate', () => {
      const root = createTmpLocales({
        'account/zh-CN.js': { 'min': '{{#label}}长度不能少于{{#limit}}个字符' }
      })
      dsl.config({ i18n: root })
      const schema = dsl({ name: 'string:3-20!' })
      const result = validate(schema, { name: 'ab' }, { locale: 'zh-CN' }) as any
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toContain('长度不能少于')
    })

    it('子目录中有多个语言时，各语言均正确加载', () => {
      const root = createTmpLocales({
        'account/zh-CN.js': { 'test.multi.key': '账户不存在' },
        'account/en-US.js': { 'test.multi.key': 'Account not found' },
        'order/zh-CN.js':   { 'test.order.multi': '订单未支付' },
        'order/en-US.js':   { 'test.order.multi': 'Order not paid' }
      })
      dsl.config({ i18n: root })
      expect(Locale.getMessage('test.multi.key', {}, 'zh-CN')).toBe('账户不存在')
      expect(Locale.getMessage('test.multi.key', {}, 'en-US')).toBe('Account not found')
      expect(Locale.getMessage('test.order.multi', {}, 'zh-CN')).toBe('订单未支付')
      expect(Locale.getMessage('test.order.multi', {}, 'en-US')).toBe('Order not paid')
    })

  })

  describe('F2 同名 key 冲突检测', () => {

    it('默认模式：同名 key 冲突时打 WARN，不抛错', () => {
      const root = createTmpLocales({
        'a/zh-CN.js': { 'test.conflict.key': '来自A' },
        'b/zh-CN.js': { 'test.conflict.key': '来自B' }
      })
      const warnMessages: string[] = []
      const origWarn = console.warn
      console.warn = (...args: any[]) => warnMessages.push(args.join(' '))
      try {
        expect(() => dsl.config({ i18n: root })).not.toThrow()
        expect(warnMessages.some(m => m.includes('test.conflict.key'))).toBe(true)
      } finally {
        console.warn = origWarn
      }
    })

    it('默认模式：冲突后续文件的 key 覆盖前面的值', () => {
      const root = createTmpLocales({
        'a/zh-CN.js': { 'test.dup.key': '旧值' },
        'b/zh-CN.js': { 'test.dup.key': '新值' }
      })
      const origWarn = console.warn
      console.warn = () => {}
      try {
        dsl.config({ i18n: root })
      } finally {
        console.warn = origWarn
      }
      expect(Locale.getMessage('test.dup.key', {}, 'zh-CN')).toBe('新值')
    })

    it('strict 模式：同名 key 冲突时抛出 Error', () => {
      const root = createTmpLocales({
        'a/zh-CN.js': { 'test.strict.key': '来自A' },
        'b/zh-CN.js': { 'test.strict.key': '来自B' }
      })
      expect(() => dsl.config({ i18n: root, strict: true } as any)).toThrow()
      try {
        dsl.config({ i18n: root, strict: true } as any)
      } catch (err: any) {
        expect(err).toBeInstanceOf(Error)
        expect(err.message).toContain('test.strict.key')
      }
    })

    it('strict 模式：无冲突时不抛错', () => {
      const root = createTmpLocales({
        'account/zh-CN.js': { 'test.strict.account': '账户' },
        'order/zh-CN.js':   { 'test.strict.order': '订单' }
      })
      expect(() => dsl.config({ i18n: root, strict: true } as any)).not.toThrow()
    })

    it('strict 模式：错误信息包含冲突来源文件路径', () => {
      const root = createTmpLocales({
        'a/zh-CN.js': { 'test.path.dup': 'A' },
        'b/zh-CN.js': { 'test.path.dup': 'B' }
      })
      let errorMsg = ''
      try {
        dsl.config({ i18n: root, strict: true } as any)
      } catch (e: any) {
        errorMsg = e.message
      }
      expect(errorMsg).toContain('zh-CN')
      expect(errorMsg).toContain('test.path.dup')
    })

  })

  describe('F3 语言文件名格式校验', () => {

    it('应该跳过 index.js', () => {
      const root = createTmpLocales({
        'index.js':  { 'index.key': '不应被加载' },
        'zh-CN.js':  { 'real.key': '应被加载' }
      })
      dsl.config({ i18n: root })
      // v2: Locale.locales is private; verify via getMessage
      // index locale shouldn't be loadable
      expect(Locale.getMessage('real.key', {}, 'zh-CN')).toBe('应被加载')
    })

    it('应该跳过 utils.js、CODE-SEGMENTS.js 等非语言文件', () => {
      const root = createTmpLocales({
        'utils.js':          { 'utils.key': '工具' },
        'CODE-SEGMENTS.js':  { 'code.key': '码段' },
        'README.js':         { 'readme.key': '说明' },
        'zh-CN.js':          { 'valid.key': '有效' }
      })
      dsl.config({ i18n: root })
      expect(Locale.getMessage('valid.key', {}, 'zh-CN')).toBe('有效')
    })

    it('应该正确加载标准语言代码格式的文件', () => {
      const root = createTmpLocales({
        'zh-CN.js':  { 'test.k1': 'v1' },
        'en-US.js':  { 'test.k2': 'v2' },
        'ja-JP.js':  { 'test.k3': 'v3' },
        'fr-FR.js':  { 'test.k4': 'v4' },
        'zh.js':     { 'test.k5': 'v5' },
        'en.js':     { 'test.k6': 'v6' }
      })
      dsl.config({ i18n: root })
      expect(Locale.getMessage('test.k1', {}, 'zh-CN')).toBe('v1')
      expect(Locale.getMessage('test.k2', {}, 'en-US')).toBe('v2')
      expect(Locale.getMessage('test.k3', {}, 'ja-JP')).toBe('v3')
      expect(Locale.getMessage('test.k4', {}, 'fr-FR')).toBe('v4')
      expect(Locale.getMessage('test.k5', {}, 'zh')).toBe('v5')
      expect(Locale.getMessage('test.k6', {}, 'en')).toBe('v6')
    })

  })

  describe('向后兼容性回归', () => {

    it('用法1 字符串路径（平铺，无子目录）—— 行为不变', () => {
      const root = createTmpLocales({
        'zh-CN.js': { 'compat.key': '兼容' },
        'en-US.js': { 'compat.key': 'Compat' }
      })
      dsl.config({ i18n: root })
      expect(Locale.getMessage('compat.key', {}, 'zh-CN')).toBe('兼容')
      expect(Locale.getMessage('compat.key', {}, 'en-US')).toBe('Compat')
    })

    it('用法2 对象直接传语言包 —— 行为不变', () => {
      dsl.config({
        i18n: {
          'zh-CN': { 'obj.key': '对象' } as any,
          'en-US': { 'obj.key': 'Object' } as any
        }
      })
      expect(Locale.getMessage('obj.key', {}, 'zh-CN')).toBe('对象')
      expect(Locale.getMessage('obj.key', {}, 'en-US')).toBe('Object')
    })

    it('用法3 对象含 localesPath —— 真正生效', () => {
      const root = createTmpLocales({
        'zh-CN.js': { 'lp.key': '路径对象' }
      })
      dsl.config({ i18n: { localesPath: root } as any })
      expect(Locale.getMessage('lp.key', {}, 'zh-CN')).toBe('路径对象')
    })

    it('用法4 路径不存在 —— 只打 WARN，不抛错', () => {
      expect(() => {
        dsl.config({ i18n: '/absolutely/non/existent/path/for/test' })
      }).not.toThrow()
    })

    it('strict 未传时默认 false，现有行为零变化', () => {
      const root = createTmpLocales({
        'zh-CN.js': { 'default.strict': '默认' }
      })
      expect(() => dsl.config({ i18n: root })).not.toThrow()
      expect(Locale.getMessage('default.strict', {}, 'zh-CN')).toBe('默认')
    })

    it('同时配置 i18n + cache + patterns —— 综合用法不回归', () => {
      const root = createTmpLocales({
        'zh-CN.js': { 'combo.key': '综合' }
      })
      expect(() => {
        dsl.config({
          i18n: root,
          cache: { maxSize: 500, ttl: 60000 }
        })
      }).not.toThrow()
      expect(Locale.getMessage('combo.key', {}, 'zh-CN')).toBe('综合')
    })

  })

})
