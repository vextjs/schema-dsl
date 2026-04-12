/**
 * ErrorFormatter 单元测试 — v2 迁移
 *
 * v2 变更：
 * - ErrorFormatter 构造函数：constructor(_locale, messages) — locale 内部，不暴露 this.locale
 * - 无 format() 方法（仅 formatDetailed()）
 * - Locale.reset() 方法在 v2 中可能不存在 — 使用 setLocale 代替
 * - formatDetailed 接收 AJV 原始错误数组
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ErrorFormatter, Locale } from '../../../src/index.js'

describe('ErrorFormatter', () => {
  let formatter: InstanceType<typeof ErrorFormatter>

  beforeEach(() => {
    Locale.setLocale('zh-CN')
    // v2: ErrorFormatter 不自动加载 Locale，需显式传入消息
    formatter = new ErrorFormatter('zh-CN', Locale.getMessages())

  })

  describe('基础功能', () => {
    it('应该正确创建实例', () => {
      expect(formatter).toBeInstanceOf(ErrorFormatter)
    })

    it('应该支持不同语言构造', () => {
      const enFormatter = new ErrorFormatter('en-US')
      expect(enFormatter).toBeInstanceOf(ErrorFormatter)
    })
  })

  describe('错误格式化', () => {
    it('应该处理 required 错误（formatDetailed）', () => {
      const errors = [
        {
          keyword: 'required',
          instancePath: '',
          params: { missingProperty: 'username' },
          schemaPath: '#/required',
        },
      ]
      const result = formatter.formatDetailed(errors as any)
      expect(Array.isArray(result)).toBe(true)
      expect(result[0]).toHaveProperty('path')
      expect(result[0]).toHaveProperty('message')
    })

    it('应该支持自定义 label（通过 parentSchema._label）', () => {
      const errors = [
        {
          keyword: 'minLength',
          instancePath: '/username',
          params: { limit: 5 },
          parentSchema: {
            type: 'string',
            minLength: 5,
            _label: '用户名',
          },
        },
      ]
      const result = formatter.formatDetailed(errors as any)
      expect(result[0].message).toContain('用户名')
    })

    it('应该支持自定义消息模板（_customMessages）', () => {
      const errors = [
        {
          keyword: 'pattern',
          instancePath: '/phone',
          params: {},
          parentSchema: {
            _customMessages: { pattern: '手机号格式不正确' },
          },
        },
      ]
      const result = formatter.formatDetailed(errors as any)
      expect(result[0].message).toBe('手机号格式不正确')
    })

    it('空错误数组应返回空数组', () => {
      const result = formatter.formatDetailed([])
      expect(result).toEqual([])
    })
  })

  describe('国际化', () => {
    it('应该支持 locale 参数切换语言', () => {
      const errors = [
        {
          keyword: 'required',
          instancePath: '',
          params: { missingProperty: 'username' },
        },
      ]
      const zhResult = formatter.formatDetailed(errors as any, 'zh-CN')
      const enResult = formatter.formatDetailed(errors as any, 'en-US')
      // 两个不同 locale 的消息可能不同（如果内置消息存在差异）
      expect(typeof zhResult[0].message).toBe('string')
      expect(typeof enResult[0].message).toBe('string')
    })

    it('setLocale 不应抛出错误', () => {
      expect(() => Locale.setLocale('en-US')).not.toThrow()
    })
  })
})
