/**
 * Validator 核心测试 — v2 迁移（v1 Validator.test.js）
 *
 * v2 变更：
 * - ajvOptions 不直接暴露（内部 _ajvOptions）
 * - 构造函数通过 ValidatorOptions 配置，不直接传 AJV 选项
 * - JSONSchemaCore 不再导出，直接用 JSON Schema 对象
 * - Validator.create() / Validator.quickValidate() 存在
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Validator } from '../../../src/index.js'

describe('Validator', () => {
  let validator: InstanceType<typeof Validator>

  beforeEach(() => {
    validator = new Validator()
  })

  describe('构造函数', () => {
    it('应该创建 Validator 实例', () => {
      expect(validator).toBeInstanceOf(Validator)
    })

    it('ajvOptions 通过 public getter 暴露（v1 compat）', () => {
      expect('ajvOptions' in validator).toBe(true)
      expect((validator as any).ajvOptions).toBeDefined()
    })

    it('应该接受配置选项', () => {
      // v2 通过 ValidatorOptions 配置（smartCoerce, cache 等）
      const customValidator = new Validator({ smartCoerce: true })
      expect(customValidator).toBeInstanceOf(Validator)
    })

    it('应该支持 cache: false 关闭缓存（文档兼容简写）', () => {
      const customValidator = new Validator({ cache: false })
      expect(customValidator.cache.options.enabled).toBe(false)
    })

    it('应该支持 cache: true 启用默认缓存配置（文档兼容简写）', () => {
      const customValidator = new Validator({ cache: true })
      expect(customValidator.cache.options.enabled).toBe(true)
      expect(customValidator.cache.options.maxSize).toBeGreaterThan(0)
    })

    it('应该把 cache.statsEnabled 透传给 CacheManager', () => {
      const customValidator = new Validator({
        cache: {
          maxSize: 10,
          statsEnabled: false,
        },
      })

      expect(customValidator.cache.options.maxSize).toBe(10)
      expect(customValidator.cache.options.statsEnabled).toBe(false)
    })
  })

  describe('validate()', () => {
    it('应该验证有效数据', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      }

      const data = { name: 'John', age: 25 }
      const result = validator.validate(schema, data)

      expect(result.valid).toBe(true)
      // v1 compat: valid 时 errors 为空数组
      expect(result.errors).toEqual([])
    })

    it('应该检测无效数据', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      }

      const data = { age: 'invalid' }
      const result = validator.validate(schema, data)

      expect(result.valid).toBe(false)
      expect(result.errors!.length).toBeGreaterThan(0)
    })

    it('应该验证字符串长度约束', () => {
      const schema = { type: 'string', minLength: 3, maxLength: 10 }

      expect(validator.validate(schema, 'abc').valid).toBe(true)
      expect(validator.validate(schema, 'ab').valid).toBe(false)
      expect(validator.validate(schema, 'abcdefghijk').valid).toBe(false)
    })

    it('应该验证数字范围约束', () => {
      const schema = { type: 'number', minimum: 0, maximum: 100 }

      expect(validator.validate(schema, 50).valid).toBe(true)
      expect(validator.validate(schema, -1).valid).toBe(false)
      expect(validator.validate(schema, 101).valid).toBe(false)
    })

    it('应该验证邮箱格式', () => {
      const schema = { type: 'string', format: 'email' }

      expect(validator.validate(schema, 'test@example.com').valid).toBe(true)
      expect(validator.validate(schema, 'invalid-email').valid).toBe(false)
    })

    it('应该验证枚举值', () => {
      const schema = { type: 'string', enum: ['active', 'inactive', 'pending'] }

      expect(validator.validate(schema, 'active').valid).toBe(true)
      expect(validator.validate(schema, 'invalid').valid).toBe(false)
    })
  })

  describe('compile()', () => {
    it('应该编译 Schema 为验证函数', () => {
      const schema = { type: 'string', minLength: 3 }
      const validateFn = validator.compile(schema)
      expect(typeof validateFn).toBe('function')
    })

    it('应该缓存编译结果', () => {
      const schema = { type: 'string' }
      const cacheKey = 'test-key'

      const fn1 = validator.compile(schema, cacheKey)
      const fn2 = validator.compile(schema, cacheKey)

      expect(fn1).toBe(fn2)
    })
  })

  describe('validateBatch()', () => {
    it('应该批量验证数据', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      }

      const dataArray = [{ name: 'John' }, { name: 'Jane' }, { age: 25 }]

      const results = validator.validateBatch(schema, dataArray)

      expect(results).toHaveLength(3)
      expect(results[0].valid).toBe(true)
      expect(results[1].valid).toBe(true)
      expect(results[2].valid).toBe(false)
    })
  })

  describe('addKeyword()', () => {
    it('应该添加自定义关键字', () => {
      validator.addKeyword('isEven', {
        keyword: 'isEven',
        type: 'number',
        validate: (_schema: unknown, data: unknown) => (data as number) % 2 === 0,
      })

      const schema = { type: 'number', isEven: true }

      expect(validator.validate(schema, 4).valid).toBe(true)
      expect(validator.validate(schema, 5).valid).toBe(false)
    })

    it('应该兼容 v1 两参数写法且不触发 AJV deprecated 警告', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      try {
        validator.addKeyword('isPositive', {
          type: 'number',
          validate: (_schema: unknown, data: unknown) => (data as number) > 0,
        } as any)

        const schema = { type: 'number', isPositive: true }

        expect(validator.validate(schema, 1).valid).toBe(true)
        expect(validator.validate(schema, 0).valid).toBe(false)
        expect(warnSpy.mock.calls.flat().join('\n')).not.toContain('these parameters are deprecated')
      } finally {
        warnSpy.mockRestore()
      }
    })
  })

  describe('addFormat()', () => {
    it('应该添加自定义格式', () => {
      validator.addFormat('uppercase', /^[A-Z]+$/)

      const schema = { type: 'string', format: 'uppercase' }

      expect(validator.validate(schema, 'ABC').valid).toBe(true)
      expect(validator.validate(schema, 'abc').valid).toBe(false)
    })
  })

  describe('clearCache()', () => {
    it('应该清空缓存后重新编译', () => {
      const schema = { type: 'string' }
      validator.compile(schema, 'key1')

      validator.clearCache()

      const fn1 = validator.compile(schema, 'key1')
      const fn2 = validator.compile(schema, 'key1')
      expect(fn1).toBe(fn2) // 重新缓存后应该相等
    })
  })

  describe('静态方法', () => {
    it('Validator.create() 应该创建实例', () => {
      const instance = Validator.create()
      expect(instance).toBeInstanceOf(Validator)
    })

    it('Validator.quickValidate() 应该快速验证', () => {
      const schema = { type: 'string' }
      expect(Validator.quickValidate(schema, 'test')).toBe(true)
      expect(Validator.quickValidate(schema, 123)).toBe(false)
    })
  })
})
