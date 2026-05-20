/**
 * ConstraintParser unit tests
 * Tests constraint string parsing: ranges/formats/enums/custom
 */

import { describe, it, expect } from 'vitest'
import { ConstraintParser } from '../../../src/parser/ConstraintParser.js'

describe('ConstraintParser', () => {
  describe('parse(str, baseType) — string range', () => {
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

  describe('parse(str, baseType) — number range', () => {
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

  describe('parse(str, baseType) — comparison operators', () => {
    it('>=18 → minimum:18', () => {
      const r = ConstraintParser.parse('>=18', 'number')
      expect(r.minimum).toBe(18)
    })

    it('<=100 → maximum:100', () => {
      const r = ConstraintParser.parse('<=100', 'number')
      expect(r.maximum).toBe(100)
    })
  })

  describe('parse(str, baseType) — enum', () => {
    it('a|b|c → enum', () => {
      const r = ConstraintParser.parse('a|b|c', 'string')
      expect(r.enum).toEqual(['a', 'b', 'c'])
    })
  })

  describe('parse(str, baseType) — empty/invalid', () => {
    it('empty string returns {}', () => {
      const r = ConstraintParser.parse('', 'string')
      expect(r).toEqual({})
    })
  })
})
