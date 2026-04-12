/**
 * ConstraintParser 单元测试
 * 测试约束字符串解析：范围/格式/枚举/自定义
 */

import { describe, it, expect } from 'vitest'
import { ConstraintParser } from '../../../src/parser/ConstraintParser.js'

describe('ConstraintParser', () => {
  describe('parse(str, baseType) — string 范围', () => {
    it('3-32 → minLength/maxLength', () => {
      const r = ConstraintParser.parse('3-32', 'string')
      expect(r.minLength).toBe(3)
      expect(r.maxLength).toBe(32)
    })

    it('2- → minLength only', () => {
      const r = ConstraintParser.parse('2-', 'string')
      expect(r.minLength).toBe(2)
      expect(r.maxLength).toBeUndefined()
    })

    it('-10 → maxLength only', () => {
      const r = ConstraintParser.parse('-10', 'string')
      expect(r.maxLength).toBe(10)
    })
  })

  describe('parse(str, baseType) — number 范围', () => {
    it('0-100 → minimum/maximum', () => {
      const r = ConstraintParser.parse('0-100', 'number')
      expect(r.minimum).toBe(0)
      expect(r.maximum).toBe(100)
    })

    it('1- → minimum only', () => {
      const r = ConstraintParser.parse('1-', 'number')
      expect(r.minimum).toBe(1)
      expect(r.maximum).toBeUndefined()
    })
  })

  describe('parse(str, baseType) — 比较运算符', () => {
    it('>=18 → minimum:18', () => {
      const r = ConstraintParser.parse('>=18', 'number')
      expect(r.minimum).toBe(18)
    })

    it('<=100 → maximum:100', () => {
      const r = ConstraintParser.parse('<=100', 'number')
      expect(r.maximum).toBe(100)
    })
  })

  describe('parse(str, baseType) — 枚举', () => {
    it('a|b|c → enum', () => {
      const r = ConstraintParser.parse('a|b|c', 'string')
      expect(r.enum).toEqual(['a', 'b', 'c'])
    })
  })

  describe('parse(str, baseType) — 空/无效', () => {
    it('空字符串返回 {}', () => {
      const r = ConstraintParser.parse('', 'string')
      expect(r).toEqual({})
    })
  })
})
