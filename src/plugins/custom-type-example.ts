import type { Plugin } from '../types/plugin.js'
import { DslBuilder } from '../core/DslBuilder.js'

export const customTypeExamplePlugin: Plugin & {
  registerCustomTypes: (dslBuilder: typeof DslBuilder) => void
} = {
  name: 'custom-type-example',
  version: '1.0.0',
  description: '自定义类型注册示例插件',
  install(core, _options = {}, _context) {
    const coreRecord = core as { DslBuilder?: typeof DslBuilder }
    const builder = coreRecord.DslBuilder ?? DslBuilder

    if (!builder || typeof builder.registerType !== 'function') {
      throw new Error('DslBuilder.registerType is not available. Please upgrade to schema-dsl v1.1.0+')
    }

    this.registerCustomTypes(builder)
    console.log('[Plugin] custom-type-example installed')
  },
  uninstall() {
    console.log('[Plugin] custom-type-example uninstalled')
  },
  registerCustomTypes(dslBuilder) {
    dslBuilder.registerType('order-id', {
      type: 'string',
      pattern: /^ORD[0-9]{12}$/.source,
      minLength: 15,
      maxLength: 15,
      _customMessages: {
        pattern: '订单号格式不正确，应为ORD开头的15位字符',
      },
    })

    dslBuilder.registerType('sku', {
      type: 'string',
      pattern: /^SKU-[A-Z0-9]{6,10}$/.source,
      minLength: 10,
      maxLength: 14,
      _customMessages: {
        pattern: 'SKU编码格式不正确，应为SKU-开头加6-10位字母数字',
      },
    })

    dslBuilder.registerType('price', {
      type: 'number',
      minimum: 0,
      multipleOf: 0.01,
      _customMessages: {
        minimum: '价格不能为负数',
        multipleOf: '价格最多保留2位小数',
      },
    })

    dslBuilder.registerType('rating', {
      type: 'integer',
      minimum: 1,
      maximum: 5,
      _customMessages: {
        minimum: '评分不能低于1星',
        maximum: '评分不能超过5星',
      },
    })

    dslBuilder.registerType('color-code', {
      oneOf: [
        { type: 'string', pattern: /^#[0-9A-Fa-f]{6}$/.source },
        { type: 'string', pattern: /^#[0-9A-Fa-f]{3}$/.source },
        { type: 'string', pattern: /^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/.source },
        { type: 'string', pattern: /^rgba\(\d{1,3},\s*\d{1,3},\s*\d{1,3},\s*(0|1|0?\.\d+)\)$/.source },
      ],
    })

    dslBuilder.registerType('semver', {
      type: 'string',
      pattern: /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/.source,
      _customMessages: {
        pattern: '版本号格式不正确，应遵循语义化版本规范（如：1.0.0, 2.1.3-beta.1）',
      },
    })

    dslBuilder.registerType('dynamic-age', () => {
      const currentYear = new Date().getFullYear()
      return {
        type: 'integer',
        minimum: 0,
        maximum: currentYear - 1900,
        _customMessages: {
          minimum: '年龄不能为负数',
          maximum: `年龄不能超过${currentYear - 1900}岁`,
        },
      }
    })

    dslBuilder.registerType('phone-intl', {
      type: 'string',
      pattern: /^\+?[1-9]\d{1,14}$/.source,
      minLength: 8,
      maxLength: 15,
      _customMessages: {
        pattern: '请输入有效的国际手机号（E.164格式）',
      },
    })
  },
}

export default customTypeExamplePlugin

