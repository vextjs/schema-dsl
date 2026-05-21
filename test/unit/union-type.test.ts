/**
 * Union Type Tests (v2 TypeScript)
 *
 * Migrated from test/unit/union-type.test.js
 */

import { describe, it, expect } from 'vitest'
import { dsl, validate } from '../../src/index.js'

describe('Union Type Pattern', () => {
  describe('Email or Phone Number', () => {
    const schema = dsl({
      contact: dsl('string!')
        .pattern(/^([^\s@]+@[^\s@]+\.[^\s@]+|1[3-9]\d{9})$/)
        .messages({ pattern: 'pattern.emailOrPhone' })
        .label('Contact')
    })

    it('should accept a valid email', () => {
      const result = validate(schema, { contact: 'test@example.com' })
      expect(result.valid).toBe(true)
    })

    it('should accept a valid phone number', () => {
      const result = validate(schema, { contact: '13800138000' })
      expect(result.valid).toBe(true)
    })

    it('should reject invalid formats', () => {
      const result = validate(schema, { contact: 'invalid' })
      expect(result.valid).toBe(false)
    })

    it('should support Chinese error messages', () => {
      const result = validate(schema, { contact: 'invalid' }, { locale: 'zh-CN' })
      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toBe('\u5fc5\u987b\u662f\u90ae\u7bb1\u6216\u624b\u673a\u53f7')
    })

    it('should support English error messages', () => {
      const result = validate(schema, { contact: 'invalid' }, { locale: 'en-US' })
      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toBe('Must be an email or phone number')
    })
  })

  describe('Username or Email', () => {
    const schema = dsl({
      username: dsl('string:3-32!')
        .pattern(/^([^\s@]+@[^\s@]+\.[^\s@]+|[a-zA-Z0-9_]+)$/)
        .messages({ pattern: 'pattern.usernameOrEmail' })
        .label('Username')
    })

    it('should accept a valid username', () => {
      const result = validate(schema, { username: 'john_doe' })
      expect(result.valid).toBe(true)
    })

    it('should accept a valid email', () => {
      const result = validate(schema, { username: 'user@example.com' })
      expect(result.valid).toBe(true)
    })

    it('should reject usernames with special characters', () => {
      const result = validate(schema, { username: 'invalid!@#' })
      expect(result.valid).toBe(false)
    })

    it('should reject usernames that are too short', () => {
      const result = validate(schema, { username: 'ab' })
      expect(result.valid).toBe(false)
    })

    it('should support multiple languages', () => {
      const r1 = validate(schema, { username: 'invalid!@#' }, { locale: 'zh-CN' })
      expect(r1.errors![0].message).toBe('\u5fc5\u987b\u662f\u7528\u6237\u540d\u6216\u90ae\u7bb1')

      const r2 = validate(schema, { username: 'invalid!@#' }, { locale: 'en-US' })
      expect(r2.errors![0].message).toBe('Must be a username or email')
    })
  })

  describe('HTTP or HTTPS URL', () => {
    const schema = dsl({
      website: dsl('string!')
        .pattern(/^https?:\/\/.+$/)
        .messages({ pattern: 'pattern.httpOrHttps' })
        .label('Website URL')
    })

    it('should accept http URLs', () => {
      const result = validate(schema, { website: 'http://example.com' })
      expect(result.valid).toBe(true)
    })

    it('should accept https URLs', () => {
      const result = validate(schema, { website: 'https://example.com' })
      expect(result.valid).toBe(true)
    })

    it('should reject other protocols', () => {
      const result = validate(schema, { website: 'ftp://example.com' })
      expect(result.valid).toBe(false)
    })

    it('should support multiple languages', () => {
      const r1 = validate(schema, { website: 'ftp://example.com' }, { locale: 'zh-CN' })
      expect(r1.errors![0].message).toBe('\u5fc5\u987b\u662f http \u6216 https \u5f00\u5934\u7684 URL')

      const r2 = validate(schema, { website: 'ftp://example.com' }, { locale: 'en-US' })
      expect(r2.errors![0].message).toBe('Must be a URL starting with http or https')
    })
  })

  describe('Inline Error Message (no i18n)', () => {
    const schema = dsl({
      contact: dsl('string!')
        .pattern(/^([^\s@]+@[^\s@]+\.[^\s@]+|1[3-9]\d{9})$/)
        .messages({ pattern: 'Must be an email or phone number' })
    })

    it('should display custom error messages', () => {
      const result = validate(schema, { contact: 'invalid' })
      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toBe('Must be an email or phone number')
    })

    it('custom messages should be unaffected by locale', () => {
      const r1 = validate(schema, { contact: 'invalid' }, { locale: 'zh-CN' })
      expect(r1.errors![0].message).toBe('Must be an email or phone number')

      const r2 = validate(schema, { contact: 'invalid' }, { locale: 'en-US' })
      expect(r2.errors![0].message).toBe('Must be an email or phone number')
    })
  })
})
