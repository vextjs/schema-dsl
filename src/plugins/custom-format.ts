import type { Plugin } from '../types/plugin.js'
import { DslBuilder } from '../core/DslBuilder.js'
import type { Validator } from '../core/Validator.js'

interface FormatConfig {
  pattern?: RegExp
  validate?: (value: string) => boolean
  schema: Record<string, unknown>
}

const FORMATS: Record<string, FormatConfig> = {
  'phone-cn': {
    pattern: /^1[3-9]\d{9}$/,
    schema: { type: 'string', pattern: /^1[3-9]\d{9}$/.source, minLength: 11, maxLength: 11 },
  },
  'postal-code-cn': {
    pattern: /^\d{6}$/,
    schema: { type: 'string', pattern: /^\d{6}$/.source, minLength: 6, maxLength: 6 },
  },
  'ipv4-custom': {
    pattern: /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    schema: { type: 'string', format: 'ipv4' },
  },
  'wechat': {
    pattern: /^[a-zA-Z][-_a-zA-Z0-9]{5,19}$/,
    schema: { type: 'string', pattern: /^[a-zA-Z][-_a-zA-Z0-9]{5,19}$/.source, minLength: 6, maxLength: 20 },
  },
  'qq': {
    pattern: /^[1-9][0-9]{4,10}$/,
    schema: { type: 'string', pattern: /^[1-9][0-9]{4,10}$/.source, minLength: 5, maxLength: 11 },
  },
  'bank-card': {
    validate: (value: string) => {
      if (!/^\d{16,19}$/.test(value)) return false

      let sum = 0
      let shouldDouble = false

      for (let i = value.length - 1; i >= 0; i -= 1) {
        let digit = Number.parseInt(value[i], 10)

        if (shouldDouble) {
          digit *= 2
          if (digit > 9) digit -= 9
        }

        sum += digit
        shouldDouble = !shouldDouble
      }

      return sum % 10 === 0
    },
    schema: { type: 'string', minLength: 16, maxLength: 19, pattern: /^\d{16,19}$/.source },
  },
  'license-plate': {
    pattern: /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$/,
    schema: {
      type: 'string',
      pattern: /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$/.source,
    },
  },
  'credit-code': {
    pattern: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/,
    schema: {
      type: 'string',
      pattern: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/.source,
      minLength: 18,
      maxLength: 18,
    },
  },
  'passport-cn': {
    pattern: /^[EG]\d{8}$/,
    schema: { type: 'string', pattern: /^[EG]\d{8}$/.source, minLength: 9, maxLength: 9 },
  },
  'hk-macao-pass': {
    pattern: /^[HM]\d{8,10}$/,
    schema: { type: 'string', pattern: /^[HM]\d{8,10}$/.source, minLength: 9, maxLength: 11 },
  },
}

type AjvFormatRegistry = {
  addFormat: (name: string, definition: RegExp | { validate: RegExp | ((value: string) => boolean) }) => void
  formats?: Record<string, unknown>
}

interface ResourceAcquisitionState {
  names: Set<string>
  leases: number
}

const FORMAT_ACQUISITIONS_KEY = Symbol.for('schema-dsl.v2.plugins.custom-format.acquisitions')
const TYPE_ACQUISITIONS_KEY = Symbol.for('schema-dsl.v2.plugins.custom-format.type-acquisitions')
const formatAcquisitionHost = globalThis as typeof globalThis & Record<symbol, WeakMap<object, ResourceAcquisitionState> | undefined>
const ACQUIRED_FORMAT_RESOURCES = formatAcquisitionHost[FORMAT_ACQUISITIONS_KEY]
  ??= new WeakMap<object, ResourceAcquisitionState>()
const ACQUIRED_TYPE_RESOURCES = formatAcquisitionHost[TYPE_ACQUISITIONS_KEY]
  ??= new WeakMap<object, ResourceAcquisitionState>()

function acquisitionState(
  resources: WeakMap<object, ResourceAcquisitionState>,
  owner: object,
): ResourceAcquisitionState {
  let state = resources.get(owner)
  if (!state) {
    state = { names: new Set<string>(), leases: 0 }
    resources.set(owner, state)
  }
  return state
}

function typeAcquisitionState(dslBuilder: typeof DslBuilder): ResourceAcquisitionState {
  const owner = dslBuilder as unknown as object
  const state = acquisitionState(ACQUIRED_TYPE_RESOURCES, owner)
  if (state.names.size > 0 && [...state.names].every(name => !dslBuilder.hasType(name))) {
    state.names.clear()
    state.leases = 0
  }
  return state
}

function getValidator(core: unknown): Validator {
  const coreRecord = core as { getDefaultValidator?: () => Validator }
  const validator = coreRecord.getDefaultValidator?.()
  if (!validator) {
    throw new Error('getDefaultValidator() is not available. Please provide schema-dsl core object.')
  }
  return validator
}

function getAjvLike(core: unknown): AjvFormatRegistry {
  return getValidator(core).getAjv() as AjvFormatRegistry
}

function getDslBuilderLike(core: unknown): typeof DslBuilder {
  const coreRecord = core as { DslBuilder?: typeof DslBuilder }
  return coreRecord.DslBuilder ?? DslBuilder
}

export const customFormatPlugin: Plugin & {
  addCustomFormats: (ajv: { addFormat: (name: string, definition: { validate: RegExp | ((value: string) => boolean) }) => void }, dslBuilder: typeof DslBuilder) => void
} = {
  name: 'custom-format',
  version: '2.0.0',
  description: 'Custom format validation plugin (with DSL type registration)',
  install(core, _options = {}, _context) {
    const ajv = getAjvLike(core)
    const dslBuilder = getDslBuilderLike(core)
    this.addCustomFormats(ajv, dslBuilder)
    acquisitionState(ACQUIRED_FORMAT_RESOURCES, ajv as object).leases++
    typeAcquisitionState(dslBuilder).leases++
  },
  uninstall(core) {
    if (!core) return
    const validator = getValidator(core)
    const ajv = validator.getAjv() as AjvFormatRegistry
    const dslBuilder = getDslBuilderLike(core)
    const formatState = ACQUIRED_FORMAT_RESOURCES.get(ajv as object)
    const typeOwner = dslBuilder as unknown as object
    const typeState = ACQUIRED_TYPE_RESOURCES.get(typeOwner)

    if (formatState) {
      if (formatState.leases > 0) formatState.leases--
      if (formatState.leases === 0) {
        for (const name of formatState.names) delete ajv.formats?.[name]
        ACQUIRED_FORMAT_RESOURCES.delete(ajv as object)
      }
    }

    if (typeState) {
      if (typeState.leases > 0) typeState.leases--
      if (typeState.leases === 0) {
        for (const name of typeState.names) dslBuilder.unregisterType(name)
        ACQUIRED_TYPE_RESOURCES.delete(typeOwner)
      }
    }

    if (formatState || typeState) validator.clearCache()
  },
  addCustomFormats(ajv, dslBuilder) {
    const registry = ajv as AjvFormatRegistry
    const formatState = acquisitionState(ACQUIRED_FORMAT_RESOURCES, ajv as object)
    const typeState = typeAcquisitionState(dslBuilder)
    for (const [name, config] of Object.entries(FORMATS)) {
      if (!registry.formats || !Object.prototype.hasOwnProperty.call(registry.formats, name)) {
        ajv.addFormat(name, {
          validate: config.validate ?? config.pattern!,
        })
        formatState.names.add(name)
      }
      if (typeof dslBuilder.hasType !== 'function' || !dslBuilder.hasType(name)) {
        dslBuilder.registerType(name, config.schema)
        typeState.names.add(name)
      }
    }
  },
}

export default customFormatPlugin


