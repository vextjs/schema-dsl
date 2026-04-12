/**
 * 联合类型测试 (v2 TypeScript)
 *
 * 迁移自 test/unit/union-type.test.js
 */

import { describe, it, expect } from 'vitest'
import { dsl, validate } from '../../src/index.js'

describe('联合类型 - Union Type Pattern', () => {
  describe('邮箱或手机号', () => {
    const schema = dsl({
      contact: dsl('string!')
        .pattern(/^([^\s@]+@[^\s@]+\.[^\s@]+|1[3-9]\d{9})$/)
        .messages({ pattern: 'pattern.emailOrPhone' })
        .label('联系方式')
    })

    it('应该接受有效的邮箱', () => {
      const result = validate(schema, { contact: 'test@example.com' })
      expect(result.valid).toBe(true)
    })

    it('应该接受有效的手机号', () => {
      const result = validate(schema, { contact: '13800138000' })
      expect(result.valid).toBe(true)
    })

    it('应该拒绝无效格式', () => {
      const result = validate(schema, { contact: 'invalid' })
      expect(result.valid).toBe(false)
    })

    it('应该支持中文错误消息', () => {
      const result = validate(schema, { contact: 'invalid' }, { locale: 'zh-CN' })
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toBe('必须是邮箱或手机号')
    })

    it('应该支持英文错误消息', () => {
      const result = validate(schema, { contact: 'invalid' }, { locale: 'en-US' })
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toBe('Must be an email or phone number')
    })
  })

  describe('用户名或邮箱', () => {
    const schema = dsl({
      username: dsl('string:3-32!')
        .pattern(/^([^\s@]+@[^\s@]+\.[^\s@]+|[a-zA-Z0-9_]+)$/)
        .messages({ pattern: 'pattern.usernameOrEmail' })
        .label('用户名')
    })

    it('应该接受有效的用户名', () => {
      const result = validate(schema, { username: 'john_doe' })
      expect(result.valid).toBe(true)
    })

    it('应该接受有效的邮箱', () => {
      const result = validate(schema, { username: 'user@example.com' })
      expect(result.valid).toBe(true)
    })

    it('应该拒绝包含特殊字符的用户名', () => {
      const result = validate(schema, { username: 'invalid!@#' })
      expect(result.valid).toBe(false)
    })

    it('应该拒绝太短的用户名', () => {
      const result = validate(schema, { username: 'ab' })
      expect(result.valid).toBe(false)
    })

    it('应该支持多语言', () => {
      const r1 = validate(schema, { username: 'invalid!@#' }, { locale: 'zh-CN' })
      expect(r1.errors[0].message).toBe('必须是用户名或邮箱')

      const r2 = validate(schema, { username: 'invalid!@#' }, { locale: 'en-US' })
      expect(r2.errors[0].message).toBe('Must be a username or email')
    })
  })

  describe('HTTP 或 HTTPS URL', () => {
    const schema = dsl({
      website: dsl('string!')
        .pattern(/^https?:\/\/.+$/)
        .messages({ pattern: 'pattern.httpOrHttps' })
        .label('网站地址')
    })

    it('应该接受 http URL', () => {
      const result = validate(schema, { website: 'http://example.com' })
      expect(result.valid).toBe(true)
    })

    it('应该接受 https URL', () => {
      const result = validate(schema, { website: 'https://example.com' })
      expect(result.valid).toBe(true)
    })

    it('应该拒绝其他协议', () => {
      const result = validate(schema, { website: 'ftp://example.com' })
      expect(result.valid).toBe(false)
    })

    it('应该支持多语言', () => {
      const r1 = validate(schema, { website: 'ftp://example.com' }, { locale: 'zh-CN' })
      expect(r1.errors[0].message).toBe('必须是 http 或 https 开头的 URL')

      const r2 = validate(schema, { website: 'ftp://example.com' }, { locale: 'en-US' })
      expect(r2.errors[0].message).toBe('Must be a URL starting with http or https')
    })
  })

  describe('直接写错误消息（不使用多语言）', () => {
    const schema = dsl({
      contact: dsl('string!')
        .pattern(/^([^\s@]+@[^\s@]+\.[^\s@]+|1[3-9]\d{9})$/)
        .messages({ pattern: '必须是邮箱或手机号' })
    })

    it('应该显示自定义错误消息', () => {
      const result = validate(schema, { contact: 'invalid' })
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toBe('必须是邮箱或手机号')
    })

    it('自定义消息不受 locale 影响', () => {
      const r1 = validate(schema, { contact: 'invalid' }, { locale: 'zh-CN' })
      expect(r1.errors[0].message).toBe('必须是邮箱或手机号')

      const r2 = validate(schema, { contact: 'invalid' }, { locale: 'en-US' })
      expect(r2.errors[0].message).toBe('必须是邮箱或手机号')
    })
  })
})
