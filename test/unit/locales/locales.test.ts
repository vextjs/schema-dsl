/**
 * 语言包完整性测试
 * 测试 zh-CN / en-US / ja-JP 三包关键 key 一致且非空
 */

import { describe, it, expect } from 'vitest'
import zhCN from '../../../src/locales/zh-CN.js'
import enUS from '../../../src/locales/en-US.js'
import jaJP from '../../../src/locales/ja-JP.js'

const REQUIRED_KEYS = [
  'required',
  'type',
  'min',
  'max',
  'pattern',
  'enum',
  'custom',
  'format.email',
  'format.url',
]

describe('语言包完整性', () => {
  describe('zh-CN', () => {
    for (const key of REQUIRED_KEYS) {
      it(`包含 key: ${key}`, () => {
        const val = (zhCN as Record<string, unknown>)[key]
        expect(val).toBeTruthy()
      })
    }
  })

  describe('en-US', () => {
    for (const key of REQUIRED_KEYS) {
      it(`包含 key: ${key}`, () => {
        const val = (enUS as Record<string, unknown>)[key]
        expect(val).toBeTruthy()
      })
    }
  })

  describe('ja-JP', () => {
    for (const key of REQUIRED_KEYS) {
      it(`包含 key: ${key}`, () => {
        const val = (jaJP as Record<string, unknown>)[key]
        expect(val).toBeTruthy()
      })
    }
  })

  describe('三包 key 集合一致', () => {
    it('zh-CN 与 en-US 的 key 集合相同', () => {
      const zhKeys = new Set(Object.keys(zhCN))
      const enKeys = new Set(Object.keys(enUS))
      const onlyInZh = [...zhKeys].filter(k => !enKeys.has(k))
      const onlyInEn = [...enKeys].filter(k => !zhKeys.has(k))
      expect(onlyInZh).toHaveLength(0)
      expect(onlyInEn).toHaveLength(0)
    })

    it('zh-CN 与 ja-JP 的 key 集合相同', () => {
      const zhKeys = new Set(Object.keys(zhCN))
      const jaKeys = new Set(Object.keys(jaJP))
      const onlyInZh = [...zhKeys].filter(k => !jaKeys.has(k))
      const onlyInJa = [...jaKeys].filter(k => !zhKeys.has(k))
      expect(onlyInZh).toHaveLength(0)
      expect(onlyInJa).toHaveLength(0)
    })
  })
})
