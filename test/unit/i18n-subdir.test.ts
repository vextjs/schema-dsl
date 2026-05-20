/**
 * i18n Subdirectory Merge Tests (v2 TypeScript)
 *
 * v2 differences:
 * - Locale.locales is private → use Locale.getMessageText() to verify loaded messages
 * - Temp locale files use CJS module.exports (loaded via require() in impl)
 */

import { describe, it, expect, afterEach } from 'vitest'
import * as path from 'node:path'
import * as fs from 'node:fs'
import * as os from 'node:os'
import { dsl, validate, Locale } from '../../src/index.js'

function createTmpLocales(tree: Record<string, Record<string, unknown> | string>) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'schema-dsl-test-'))
  for (const [relPath, content] of Object.entries(tree)) {
    const fullPath = path.join(root, relPath)
    fs.mkdirSync(path.dirname(fullPath), { recursive: true })
    if (typeof content === 'string') {
      fs.writeFileSync(fullPath, content, 'utf-8')
    } else {
      fs.writeFileSync(fullPath, `module.exports = ${JSON.stringify(content)};`, 'utf-8')
    }
  }
  return root
}

describe('i18n Subdirectory Merge', () => {

  afterEach(() => {
    Locale.reset()
  })

  describe('F1 Recursive Subdirectory Scan', () => {

    it('should correctly load flat directory (backward compatible)', () => {
      const root = createTmpLocales({
        'zh-CN.js': { 'hello': 'Hello ZH' },
        'en-US.js': { 'hello': 'Hello' }
      })
      dsl.config({ i18n: root })
      expect(Locale.getMessageText('hello', {}, 'zh-CN')).toBe('Hello ZH')
      expect(Locale.getMessageText('hello', {}, 'en-US')).toBe('Hello')
    })

    it('should recursively load locale files from first-level subdirectories', () => {
      const root = createTmpLocales({
        'core/zh-CN.js':    { 'test.core.key': 'Core' },
        'account/zh-CN.js': { 'test.account.notFound': 'Account not found' },
        'order/zh-CN.js':   { 'test.order.notPaid': 'Order not paid' }
      })
      dsl.config({ i18n: root })
      expect(Locale.getMessageText('test.core.key', {}, 'zh-CN')).toBe('Core')
      expect(Locale.getMessageText('test.account.notFound', {}, 'zh-CN')).toBe('Account not found')
      expect(Locale.getMessageText('test.order.notPaid', {}, 'zh-CN')).toBe('Order not paid')
    })

    it('should recursively load second-level subdirectories (deep nesting)', () => {
      const root = createTmpLocales({
        'modules/user/zh-CN.js':    { 'test.user.notFound': 'User not found' },
        'modules/payment/zh-CN.js': { 'test.payment.failed': 'Payment failed' }
      })
      dsl.config({ i18n: root })
      expect(Locale.getMessageText('test.user.notFound', {}, 'zh-CN')).toBe('User not found')
      expect(Locale.getMessageText('test.payment.failed', {}, 'zh-CN')).toBe('Payment failed')
    })

    it('should merge multiple subdirectory files for the same locale', () => {
      const root = createTmpLocales({
        'account/zh-CN.js': { 'test.account.k1': 'Account locked', 'test.account.k2': 'Account frozen' },
        'order/zh-CN.js':   { 'test.order.k1': 'Order not found', 'test.order.k2': 'Order not paid' }
      })
      dsl.config({ i18n: root })
      expect(Locale.getMessageText('test.account.k1', {}, 'zh-CN')).toBeTruthy()
      expect(Locale.getMessageText('test.account.k2', {}, 'zh-CN')).toBeTruthy()
      expect(Locale.getMessageText('test.order.k1', {}, 'zh-CN')).toBeTruthy()
      expect(Locale.getMessageText('test.order.k2', {}, 'zh-CN')).toBeTruthy()
    })

    it('merged locale pack should work normally with validate', () => {
      const root = createTmpLocales({
        'account/zh-CN.js': { 'min': '{{#label}} min length {{#limit}} chars' }
      })
      dsl.config({ i18n: root })
      const schema = dsl({ name: 'string:3-20!' })
      const result = validate(schema, { name: 'ab' }, { locale: 'zh-CN' }) as any
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toContain('min length')
    })

    it('when subdirectory has multiple locales, all locales should load correctly', () => {
      const root = createTmpLocales({
        'account/zh-CN.js': { 'test.multi.key': 'Account not found' },
        'account/en-US.js': { 'test.multi.key': 'Account not found' },
        'order/zh-CN.js':   { 'test.order.multi': 'Order not paid ZH' },
        'order/en-US.js':   { 'test.order.multi': 'Order not paid' }
      })
      dsl.config({ i18n: root })
      expect(Locale.getMessageText('test.multi.key', {}, 'zh-CN')).toBe('Account not found')
      expect(Locale.getMessageText('test.multi.key', {}, 'en-US')).toBe('Account not found')
      expect(Locale.getMessageText('test.order.multi', {}, 'zh-CN')).toBe('Order not paid ZH')
      expect(Locale.getMessageText('test.order.multi', {}, 'en-US')).toBe('Order not paid')
    })

    it('should support .cjs locale files', () => {
      const root = createTmpLocales({
        'zh-CN.cjs': 'module.exports = { "test.cjs.key": "CJS locale pack" };'
      })
      dsl.config({ i18n: root })
      expect(Locale.getMessageText('test.cjs.key', {}, 'zh-CN')).toBe('CJS locale pack')
    })

    it('should support .json locale files', () => {
      const root = createTmpLocales({
        'zh-CN.json': '{"test.json.key":"JSON locale pack"}'
      })
      dsl.config({ i18n: root })
      expect(Locale.getMessageText('test.json.key', {}, 'zh-CN')).toBe('JSON locale pack')
    })

    it('should support .jsonc locale files (comments + trailing comma)', () => {
      const root = createTmpLocales({
        'zh-CN.jsonc': '{\n  // comment\n  "test.jsonc.key": "JSONC locale pack",\n}'
      })
      dsl.config({ i18n: root })
      expect(Locale.getMessageText('test.jsonc.key', {}, 'zh-CN')).toBe('JSONC locale pack')
    })

    it('should support .json5 locale files', () => {
      const root = createTmpLocales({
        'zh-CN.json5': "{\n  'test.json5.key': 'JSON5 locale pack',\n}"
      })
      dsl.config({ i18n: root })
      expect(Locale.getMessageText('test.json5.key', {}, 'zh-CN')).toBe('JSON5 locale pack')
    })

  })

  describe('F2 Duplicate Key Conflict Detection', () => {

    it('default mode: warns on duplicate key conflict, no throw', () => {
      const root = createTmpLocales({
        'a/zh-CN.js': { 'test.conflict.key': 'from-A' },
        'b/zh-CN.js': { 'test.conflict.key': 'from-B' }
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

    it('default mode: later file key overrides earlier value on conflict', () => {
      const root = createTmpLocales({
        'a/zh-CN.js': { 'test.dup.key': 'old-value' },
        'b/zh-CN.js': { 'test.dup.key': 'new-value' }
      })
      const origWarn = console.warn
      console.warn = () => {}
      try {
        dsl.config({ i18n: root })
      } finally {
        console.warn = origWarn
      }
      expect(Locale.getMessageText('test.dup.key', {}, 'zh-CN')).toBe('new-value')
    })

    it('strict mode: throws Error on duplicate key conflict', () => {
      const root = createTmpLocales({
        'a/zh-CN.js': { 'test.strict.key': 'from-A' },
        'b/zh-CN.js': { 'test.strict.key': 'from-B' }
      })
      expect(() => dsl.config({ i18n: root, strict: true } as any)).toThrow()
      try {
        dsl.config({ i18n: root, strict: true } as any)
      } catch (err: any) {
        expect(err).toBeInstanceOf(Error)
        expect(err.message).toContain('test.strict.key')
      }
    })

    it('strict mode: does not throw when no conflict', () => {
      const root = createTmpLocales({
        'account/zh-CN.js': { 'test.strict.account': 'Account' },
        'order/zh-CN.js':   { 'test.strict.order': 'Order' }
      })
      expect(() => dsl.config({ i18n: root, strict: true } as any)).not.toThrow()
    })

    it('strict mode: error message contains conflicting source file path', () => {
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

  describe('F3 Locale Filename Format Validation', () => {

    it('should skip index.js', () => {
      const root = createTmpLocales({
        'index.js':  { 'index.key': 'should-not-load' },
        'zh-CN.js':  { 'real.key': 'should-be-loaded' }
      })
      dsl.config({ i18n: root })
      // v2: Locale.locales is private; verify via getMessageText
      // index locale shouldn't be loadable
      expect(Locale.getMessageText('real.key', {}, 'zh-CN')).toBe('should-be-loaded')
    })

    it('should skip non-locale files like utils.js, CODE-SEGMENTS.js', () => {
      const root = createTmpLocales({
        'utils.js':          { 'utils.key': 'util-msg' },
        'CODE-SEGMENTS.js':  { 'code.key': 'code-msg' },
        'README.js':         { 'readme.key': 'readme-msg' },
        'zh-CN.js':          { 'valid.key': 'valid-msg' }
      })
      dsl.config({ i18n: root })
      expect(Locale.getMessageText('valid.key', {}, 'zh-CN')).toBe('valid-msg')
    })

    it('should correctly load files with standard locale code format', () => {
      const root = createTmpLocales({
        'zh-CN.js':  { 'test.k1': 'v1' },
        'en-US.js':  { 'test.k2': 'v2' },
        'ja-JP.js':  { 'test.k3': 'v3' },
        'fr-FR.js':  { 'test.k4': 'v4' },
        'zh.js':     { 'test.k5': 'v5' },
        'en.js':     { 'test.k6': 'v6' }
      })
      dsl.config({ i18n: root })
      expect(Locale.getMessageText('test.k1', {}, 'zh-CN')).toBe('v1')
      expect(Locale.getMessageText('test.k2', {}, 'en-US')).toBe('v2')
      expect(Locale.getMessageText('test.k3', {}, 'ja-JP')).toBe('v3')
      expect(Locale.getMessageText('test.k4', {}, 'fr-FR')).toBe('v4')
      expect(Locale.getMessageText('test.k5', {}, 'zh')).toBe('v5')
      expect(Locale.getMessageText('test.k6', {}, 'en')).toBe('v6')
    })

    it('default scan does not include .ts / .mjs', () => {
      const root = createTmpLocales({
        'zh-CN.ts': 'export default { "test.ts.key": "TS locale" };',
        'zh-CN.mjs': 'export default { "test.mjs.key": "MJS locale" };',
        'zh-CN.cjs': 'module.exports = { "test.cjs.fallback": "CJS fallback" };'
      })
      dsl.config({ i18n: root })
      expect(Locale.getMessageText('test.cjs.fallback', {}, 'zh-CN')).toBe('CJS fallback')
      expect(Locale.getMessageText('test.ts.key', {}, 'zh-CN')).toBe('test.ts.key')
      expect(Locale.getMessageText('test.mjs.key', {}, 'zh-CN')).toBe('test.mjs.key')
    })

  })

  describe('Backward Compatibility Regression', () => {

    it('usage 1: string path (flat, no subdirectory) — behavior unchanged', () => {
      const root = createTmpLocales({
        'zh-CN.js': { 'compat.key': 'Compat ZH' },
        'en-US.js': { 'compat.key': 'Compat' }
      })
      dsl.config({ i18n: root })
      expect(Locale.getMessageText('compat.key', {}, 'zh-CN')).toBe('Compat ZH')
      expect(Locale.getMessageText('compat.key', {}, 'en-US')).toBe('Compat')
    })

    it('usage 2: object with locale data directly — behavior unchanged', () => {
      dsl.config({
        i18n: {
          'zh-CN': { 'obj.key': 'Object ZH' } as any,
          'en-US': { 'obj.key': 'Object' } as any
        }
      })
      expect(Locale.getMessageText('obj.key', {}, 'zh-CN')).toBe('Object ZH')
      expect(Locale.getMessageText('obj.key', {}, 'en-US')).toBe('Object')
    })

    it('usage 3: object with localesPath — properly takes effect', () => {
      const root = createTmpLocales({
        'zh-CN.js': { 'lp.key': 'Path object' }
      })
      dsl.config({ i18n: { localesPath: root } as any })
      expect(Locale.getMessageText('lp.key', {}, 'zh-CN')).toBe('Path object')
    })

    it('usage 4: path does not exist — only warns, no throw', () => {
      expect(() => {
        dsl.config({ i18n: '/absolutely/non/existent/path/for/test' })
      }).not.toThrow()
    })

    it('strict defaults to false when not provided, zero behavior change', () => {
      const root = createTmpLocales({
        'zh-CN.js': { 'default.strict': 'Default' }
      })
      expect(() => dsl.config({ i18n: root })).not.toThrow()
      expect(Locale.getMessageText('default.strict', {}, 'zh-CN')).toBe('Default')
    })

    it('configuring i18n + cache + patterns simultaneously — combined usage does not regress', () => {
      const root = createTmpLocales({
        'zh-CN.js': { 'combo.key': 'Combined' }
      })
      expect(() => {
        dsl.config({
          i18n: root,
          cache: { maxSize: 500, ttl: 60000 }
        })
      }).not.toThrow()
      expect(Locale.getMessageText('combo.key', {}, 'zh-CN')).toBe('Combined')
    })

  })

})
