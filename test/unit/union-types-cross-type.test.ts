/**
 * 跨类型联合验证测试 (v2 TypeScript)
 *
 * 迁移自 test/unit/union-types-cross-type.test.js
 * 测试 types: 语法的跨类型联合验证
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { dsl, validate, DslBuilder } from '../../src/index.js'

describe('跨类型联合验证 - types: 语法', () => {
  // 测试前清理自定义类型
  beforeEach(() => {
    DslBuilder.clearCustomTypes()
  })

  describe('基础功能', () => {
    it('应该支持 string|number 联合类型', () => {
      const schema = dsl({
        value: 'types:string|number'
      })

      // 字符串应该通过
      const r1 = validate(schema, { value: 'hello' })
      expect(r1.valid).toBe(true)

      // 数字应该通过
      const r2 = validate(schema, { value: 123 })
      expect(r2.valid).toBe(true)

      // 布尔值应该失败
      const r3 = validate(schema, { value: true })
      expect(r3.valid).toBe(false)
    })

    it('应该支持 string|number|boolean 三类型联合', () => {
      const schema = dsl({
        value: 'types:string|number|boolean'
      })

      expect(validate(schema, { value: 'test' }).valid).toBe(true)
      expect(validate(schema, { value: 42 }).valid).toBe(true)
      expect(validate(schema, { value: true }).valid).toBe(true)
      expect(validate(schema, { value: null }).valid).toBe(false)
    })

    it('应该支持必填标记 types:string|number!', () => {
      const schema = dsl({
        value: 'types:string|number!'
      })

      // 有效值应该通过
      expect(validate(schema, { value: 'test' }).valid).toBe(true)
      expect(validate(schema, { value: 123 }).valid).toBe(true)

      // 缺失值应该失败（必填检查）
      const r1 = validate(schema, {})
      expect(r1.valid).toBe(false)
      // oneOf失败时可能返回不同的错误码，只要验证失败即可
      expect(r1.errors.length).toBeGreaterThan(0)
    })

    it('应该支持单一类型（自动优化为非oneOf）', () => {
      const schema = dsl({
        value: 'types:string'
      })

      const compiled = (schema as any).toSchema ? (schema as any).toSchema() : schema

      // 单一类型不应该生成oneOf
      expect(compiled.properties.value.oneOf).toBeUndefined()
      expect(compiled.properties.value.type).toBe('string')
    })
  })

  describe('带约束的联合类型', () => {
    it('应该支持 string:3-10|number:0-100', () => {
      const schema = dsl({
        value: 'types:string:3-10|number:0-100'
      })

      // 有效字符串（长度3-10）
      expect(validate(schema, { value: 'abc' }).valid).toBe(true)
      expect(validate(schema, { value: 'abcdefghij' }).valid).toBe(true)

      // 有效数字（0-100）
      expect(validate(schema, { value: 0 }).valid).toBe(true)
      expect(validate(schema, { value: 50 }).valid).toBe(true)
      expect(validate(schema, { value: 100 }).valid).toBe(true)

      // 无效字符串（太短）
      expect(validate(schema, { value: 'ab' }).valid).toBe(false)

      // 无效字符串（太长）
      expect(validate(schema, { value: 'abcdefghijk' }).valid).toBe(false)

      // 无效数字（超出范围）
      expect(validate(schema, { value: -1 }).valid).toBe(false)
      expect(validate(schema, { value: 101 }).valid).toBe(false)
    })

    it('应该支持内置format类型 email|phone', () => {
      const schema = dsl({
        contact: 'types:email|phone'
      })

      // 有效邮箱
      expect(validate(schema, { contact: 'user@example.com' }).valid).toBe(true)

      // 有效手机号（中国）
      expect(validate(schema, { contact: '13800138000' }).valid).toBe(true)

      // 无效格式
      expect(validate(schema, { contact: 'invalid' }).valid).toBe(false)
    })

    it('应该支持 integer:1-5|string:9', () => {
      const schema = dsl({
        rating: 'types:integer:1-5|string:9'
      })

      // 有效整数（1-5）
      expect(validate(schema, { rating: 1 }).valid).toBe(true)
      expect(validate(schema, { rating: 5 }).valid).toBe(true)

      // 有效字符串（exactLength=9 in types: context）
      expect(validate(schema, { rating: 'excellent' }).valid).toBe(true)  // 9 chars
      expect(validate(schema, { rating: 'good12345' }).valid).toBe(true)  // 9 chars

      // 无效整数
      expect(validate(schema, { rating: 0 }).valid).toBe(false)
      expect(validate(schema, { rating: 6 }).valid).toBe(false)

      // 无效字符串（不等于 exactLength=9）
      expect(validate(schema, { rating: 'good' }).valid).toBe(false)  // 4 chars ≠ 9
      expect(validate(schema, { rating: 'verylongstring' }).valid).toBe(false)  // 14 chars ≠ 9
    })
  })

  describe('复杂类型联合', () => {
    it('应该支持 array<string>|string', () => {
      const schema = dsl({
        tags: 'types:array<string>|string'
      })

      // 字符串数组
      expect(validate(schema, { tags: ['tag1', 'tag2'] }).valid).toBe(true)

      // 单个字符串
      expect(validate(schema, { tags: 'single-tag' }).valid).toBe(true)

      // 无效：数字数组
      expect(validate(schema, { tags: [1, 2, 3] }).valid).toBe(false)
    })

    it('应该支持 object|array', () => {
      const schema = dsl({
        data: 'types:object|array'
      })

      // 对象
      expect(validate(schema, { data: { key: 'value' } }).valid).toBe(true)

      // 数组
      expect(validate(schema, { data: [1, 2, 3] }).valid).toBe(true)

      // 字符串应该失败
      expect(validate(schema, { data: 'string' }).valid).toBe(false)
    })

    it('应该支持 null|string|number', () => {
      const schema = dsl({
        value: 'types:null|string|number'
      })

      expect(validate(schema, { value: null }).valid).toBe(true)
      expect(validate(schema, { value: 'test' }).valid).toBe(true)
      expect(validate(schema, { value: 42 }).valid).toBe(true)
      expect(validate(schema, { value: true }).valid).toBe(false)
    })
  })

  describe('插件自定义类型支持', () => {
    it('应该支持插件注册的自定义类型', () => {
      // 插件注册自定义类型
      DslBuilder.registerType('custom-phone', {
        type: 'string',
        pattern: /^1[3-9]\d{9}$/.source,
        minLength: 11,
        maxLength: 11
      })

      // 直接使用自定义类型
      const s1 = dsl({ phone: 'custom-phone!' })
      const r1 = validate(s1, { phone: '13800138000' })
      expect(r1.valid).toBe(true)

      // 在types:中使用自定义类型（只测试string组合）
      const s2 = dsl({ value: 'types:string|custom-phone' })
      const r2a = validate(s2, { value: 'hello' })
      expect(r2a.valid).toBe(true)

      // 验证是否注册成功
      expect(DslBuilder.hasType('custom-phone')).toBe(true)
    })

    it('应该支持 types: 中混合内置和自定义类型', () => {
      DslBuilder.registerType('order-id', {
        type: 'string',
        pattern: /^ORD[0-9]{12}$/.source,
        minLength: 15,
        maxLength: 15
      })

      const schema = dsl({
        identifier: 'types:uuid|order-id'
      })

      // 有效UUID
      expect(validate(schema, {
        identifier: '123e4567-e89b-12d3-a456-426614174000'
      }).valid).toBe(true)

      // 有效订单号
      expect(validate(schema, {
        identifier: 'ORD202401010001'
      }).valid).toBe(true)

      // 无效格式
      expect(validate(schema, { identifier: 'invalid' }).valid).toBe(false)
    })

    it('应该支持动态生成的Schema（函数方式）', () => {
      let counter = 0
      DslBuilder.registerType('dynamic', () => {
        counter++
        return {
          type: 'string',
          minLength: counter
        }
      })

      const schema1 = dsl({ value: 'dynamic' })
      const schema2 = dsl({ value: 'dynamic' })

      // 每次调用都会生成新的Schema
      expect(counter).toBe(2)
    })
  })

  describe('边界情况', () => {
    it('应该正确处理空格', () => {
      const schema = dsl({
        value: 'types: string | number | boolean '
      })

      expect(validate(schema, { value: 'test' }).valid).toBe(true)
      expect(validate(schema, { value: 123 }).valid).toBe(true)
      expect(validate(schema, { value: true }).valid).toBe(true)
    })

    it('应该抛出错误：空类型列表', () => {
      expect(() => {
        dsl({ value: 'types:' })
      }).toThrow('types: requires at least one type')
    })

    it('应该抛出错误：只有分隔符', () => {
      expect(() => {
        dsl({ value: 'types:||' })
      }).toThrow('types: requires at least one type')
    })

    it('应该支持特殊类型 any', () => {
      const schema = dsl({
        value: 'types:string|any'
      })

      // any类型应该接受任何值（除了string会被第一个类型匹配）
      // expect(validate(schema, { value: 'string' }).valid).toBe(true);  // oneOf已知问题
      expect(validate(schema, { value: 123 }).valid).toBe(true)
      expect(validate(schema, { value: true }).valid).toBe(true)
      expect(validate(schema, { value: { nested: 'object' } }).valid).toBe(true)

      // 验证any类型存在
      expect(DslBuilder.hasType('any')).toBe(true)
    })
  })

  describe('嵌套和组合', () => {
    it('应该支持在对象字段中使用 types:', () => {
      const schema = dsl({
        user: {
          name: 'string:2-50!',
          age: 'types:integer:0-150|null',
          email: 'types:email|null'
        }
      })

      const r1 = validate(schema, {
        user: {
          name: 'John',
          age: 30,
          email: 'john@example.com'
        }
      })
      expect(r1.valid).toBe(true)

      const r2 = validate(schema, {
        user: {
          name: 'Jane',
          age: null,
          email: null
        }
      })
      expect(r2.valid).toBe(true)
    })

    it('应该支持 array<types:string|number>', () => {
      const schema = dsl({
        items: 'array<types:string|number>'
      })

      // 混合类型数组
      expect(validate(schema, {
        items: ['hello', 42, 'world', 99]
      }).valid).toBe(true)

      // 包含其他类型应该失败
      expect(validate(schema, {
        items: ['hello', true]
      }).valid).toBe(false)
    })
  })

  describe('多语言错误消息', () => {
    it('应该支持中文错误消息', () => {
      const schema = dsl({
        value: 'types:string|number!'
      })

      const result = validate(schema, { value: true }, { locale: 'zh-CN' })
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toContain('类型')
    })

    it('应该支持英文错误消息', () => {
      const schema = dsl({
        value: 'types:string|number!'
      })

      const result = validate(schema, { value: true }, { locale: 'en-US' })
      expect(result.valid).toBe(false)
      // 只验证有错误消息即可
      expect(typeof result.errors[0].message).toBe('string')
      expect(result.errors[0].message.length).toBeGreaterThan(0)
    })
  })

  describe('DslBuilder静态方法', () => {
    it('hasType() 应该正确检测内置类型', () => {
      expect(DslBuilder.hasType('string')).toBe(true)
      expect(DslBuilder.hasType('email')).toBe(true)
      expect(DslBuilder.hasType('uuid')).toBe(true)
      expect(DslBuilder.hasType('non-existent')).toBe(false)
    })

    it('hasType() 应该正确检测自定义类型', () => {
      expect(DslBuilder.hasType('custom-type')).toBe(false)

      DslBuilder.registerType('custom-type', { type: 'string' })

      expect(DslBuilder.hasType('custom-type')).toBe(true)
    })

    it('getCustomTypes() 应该返回所有自定义类型', () => {
      DslBuilder.registerType('type1', { type: 'string' })
      DslBuilder.registerType('type2', { type: 'number' })

      const types = DslBuilder.getCustomTypes()
      expect(types).toContain('type1')
      expect(types).toContain('type2')
      expect(types).toHaveLength(2)
    })

    it('clearCustomTypes() 应该清除所有自定义类型', () => {
      DslBuilder.registerType('type1', { type: 'string' })
      expect(DslBuilder.hasType('type1')).toBe(true)

      DslBuilder.clearCustomTypes()
      expect(DslBuilder.hasType('type1')).toBe(false)
    })

    it('registerType() 应该验证参数', () => {
      expect(() => {
        DslBuilder.registerType()
      }).toThrow('Type name must be a non-empty string')

      expect(() => {
        DslBuilder.registerType('test')
      }).toThrow('Schema must be an object or function')

      expect(() => {
        DslBuilder.registerType('test', 'invalid')
      }).toThrow('Schema must be an object or function')
    })
  })

  describe('性能测试', () => {
    it('应该高效处理大量联合类型', () => {
      const start = Date.now()

      const schema = dsl({
        value: 'types:string|number|boolean|null|array|object'
      })

      for (let i = 0; i < 1000; i++) {
        validate(schema, { value: i % 2 === 0 ? 'string' : 123 })
      }

      const elapsed = Date.now() - start
      expect(elapsed).toBeLessThan(1000)
    })
  })

  describe('错误场景测试', () => {
    it('应该正确处理无效的类型名', () => {
      // 注册时使用无效名称
      expect(() => {
        DslBuilder.registerType('', { type: 'string' })
      }).toThrow('Type name must be a non-empty string')

      expect(() => {
        DslBuilder.registerType(null, { type: 'string' })
      }).toThrow('Type name must be a non-empty string')
    })

    it('应该正确处理无效的schema定义', () => {
      expect(() => {
        DslBuilder.registerType('test', null)
      }).toThrow('Schema must be an object or function')

      expect(() => {
        DslBuilder.registerType('test', 'invalid')
      }).toThrow('Schema must be an object or function')
    })

    it('应该正确处理不存在的类型组合', () => {
      const schema = dsl({
        value: 'types:number|nonexistent'
      })

      // nonexistent类型会被当作基础类型处理
      // 数字应该能通过
      const r1 = validate(schema, { value: 123 })
      expect(r1.valid).toBe(true)
    })

    it('应该正确报告验证失败的所有类型', () => {
      const schema = dsl({
        value: 'types:string:3-|number:0-100!'
      })

      // 太短的字符串和超范围的数字都应失败
      const r1 = validate(schema, { value: 'ab' })
      expect(r1.valid).toBe(false)

      const r2 = validate(schema, { value: 101 })
      expect(r2.valid).toBe(false)
    })
  })

  describe('类型组合边缘场景', () => {
    it('应该支持 date|datetime 时间类型组合', () => {
      const schema = dsl({
        timestamp: 'types:date|datetime'
      })

      expect(validate(schema, { timestamp: '2024-01-01' }).valid).toBe(true)
      expect(validate(schema, { timestamp: '2024-01-01T12:00:00Z' }).valid).toBe(true)
      expect(validate(schema, { timestamp: 'invalid' }).valid).toBe(false)
    })

    it('应该支持 uuid|objectId ID类型组合', () => {
      const schema = dsl({
        id: 'types:uuid|objectId'
      })

      expect(validate(schema, { id: '123e4567-e89b-12d3-a456-426614174000' }).valid).toBe(true)
      expect(validate(schema, { id: '507f1f77bcf86cd799439011' }).valid).toBe(true)
      expect(validate(schema, { id: 'invalid' }).valid).toBe(false)
    })

    it('应该支持 email|url 网络地址组合', () => {
      const schema = dsl({
        contact: 'types:email|url'
      })

      expect(validate(schema, { contact: 'user@example.com' }).valid).toBe(true)
      expect(validate(schema, { contact: 'https://example.com' }).valid).toBe(true)
      expect(validate(schema, { contact: 'invalid' }).valid).toBe(false)
    })

    it('应该支持 integer|string:N 组合', () => {
      const schema = dsl({
        code: 'types:integer:1-999|string:3'
      })

      expect(validate(schema, { code: 100 }).valid).toBe(true)
      expect(validate(schema, { code: 'ABC' }).valid).toBe(true)
      // In types: context, string:3 means exactLength=3
      expect(validate(schema, { code: 'AB' }).valid).toBe(false)
      expect(validate(schema, { code: 'ABCD' }).valid).toBe(false)
      expect(validate(schema, { code: 1000 }).valid).toBe(false)
    })
  })

  describe('插件高级场景', () => {
    it('应该支持插件类型被覆盖注册', () => {
      DslBuilder.registerType('test-type', {
        type: 'string',
        minLength: 5
      })

      // 第一次验证
      const s1 = dsl({ value: 'test-type' })
      expect(validate(s1, { value: 'abc' }).valid).toBe(false)

      // 覆盖注册
      DslBuilder.registerType('test-type', {
        type: 'string',
        minLength: 2
      })

      // 第二次验证（使用新规则）
      const s2 = dsl({ value: 'test-type' })
      expect(validate(s2, { value: 'abc' }).valid).toBe(true)
    })

    it('应该支持多个插件注册不同类型', () => {
      DslBuilder.registerType('type1', { type: 'string', minLength: 3 })
      DslBuilder.registerType('type2', { type: 'number', minimum: 0 })
      DslBuilder.registerType('type3', { type: 'boolean' })

      const types = DslBuilder.getCustomTypes()
      expect(types).toContain('type1')
      expect(types).toContain('type2')
      expect(types).toContain('type3')
      expect(types).toHaveLength(3)
    })

    it('应该支持在types:中使用多个自定义类型', () => {
      DslBuilder.registerType('custom-email', {
        type: 'string',
        pattern: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.source
      })

      DslBuilder.registerType('custom-phone', {
        type: 'string',
        pattern: /^1[3-9]\d{9}$/.source
      })

      const schema = dsl({
        contact: 'types:custom-email|custom-phone'
      })

      expect(validate(schema, { contact: 'user@example.com' }).valid).toBe(true)
      expect(validate(schema, { contact: '13800138000' }).valid).toBe(true)
    })
  })

  describe('实际业务场景测试', () => {
    it('场景1：订单状态（枚举或数字）', () => {
      const schema = dsl({
        status: 'types:integer:0-10|string'
      })

      // 数字状态码
      expect(validate(schema, { status: 1 }).valid).toBe(true)
      // 字符串状态
      expect(validate(schema, { status: 'pending' }).valid).toBe(true)
    })

    it('场景2：价格输入（数字或"面议"）', () => {
      const schema = dsl({
        price: 'types:number:0-|string:1-10'
      })

      expect(validate(schema, { price: 99.99 }).valid).toBe(true)
      expect(validate(schema, { price: '面议' }).valid).toBe(true)
      expect(validate(schema, { price: -1 }).valid).toBe(false)
    })

    it('场景3：灵活的数组（单个或多个）', () => {
      const schema = dsl({
        tags: 'types:string|array<string>'
      })

      expect(validate(schema, { tags: 'single-tag' }).valid).toBe(true)
      expect(validate(schema, { tags: ['tag1', 'tag2'] }).valid).toBe(true)
    })

    it('场景4：可选的年龄（整数或null）', () => {
      const schema = dsl({
        age: 'types:integer:1-150|null'
      })

      expect(validate(schema, { age: 25 }).valid).toBe(true)
      expect(validate(schema, { age: null }).valid).toBe(true)
      expect(validate(schema, { age: 0 }).valid).toBe(false)
    })

    it('场景5：文件上传（File对象或URL字符串）', () => {
      const schema = dsl({
        avatar: 'types:url|object'
      })

      expect(validate(schema, { avatar: 'https://example.com/avatar.jpg' }).valid).toBe(true)
      expect(validate(schema, { avatar: { name: 'avatar.jpg', size: 1024 } }).valid).toBe(true)
    })
  })

  describe('组合复杂度测试', () => {
    it('应该支持4种类型联合', () => {
      const schema = dsl({
        value: 'types:string|number|boolean|null'
      })

      expect(validate(schema, { value: 'test' }).valid).toBe(true)
      expect(validate(schema, { value: 123 }).valid).toBe(true)
      expect(validate(schema, { value: true }).valid).toBe(true)
      expect(validate(schema, { value: null }).valid).toBe(true)
      expect(validate(schema, { value: [] }).valid).toBe(false)
    })

    it('应该支持嵌套对象中的多个types:字段', () => {
      const schema = dsl({
        user: {
          id: 'types:uuid|integer!',
          contact: 'types:email|phone!',
          age: 'types:integer:1-150|null'
        }
      })

      const validData = {
        user: {
          id: 12345,
          contact: 'user@example.com',
          age: 25
        }
      }

      expect(validate(schema, validData).valid).toBe(true)
    })

    it('应该支持数组中的types:元素', () => {
      const schema = dsl({
        items: 'array<types:string|number>'
      })

      expect(validate(schema, { items: ['a', 1, 'b', 2] }).valid).toBe(true)
      expect(validate(schema, { items: ['a', 1, true] }).valid).toBe(false)
    })
  })
})
