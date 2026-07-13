import type { Plugin } from '../types/plugin.js'
import { DslBuilder } from '../core/DslBuilder.js'

interface TypeAcquisitionState {
  names: Set<string>
  leases: number
}

const TYPE_ACQUISITIONS_KEY = Symbol.for('schema-dsl.v2.plugins.custom-type-example.acquisitions')
const typeAcquisitionHost = globalThis as typeof globalThis & Record<symbol, WeakMap<object, TypeAcquisitionState> | undefined>
const ACQUIRED_TYPES = typeAcquisitionHost[TYPE_ACQUISITIONS_KEY]
  ??= new WeakMap<object, TypeAcquisitionState>()

function typeAcquisitionState(builder: typeof DslBuilder): TypeAcquisitionState {
  let state = ACQUIRED_TYPES.get(builder)
  if (state && state.names.size > 0 && [...state.names].every(name => !builder.hasType(name))) {
    state.names.clear()
    state.leases = 0
  }
  if (!state) {
    state = { names: new Set<string>(), leases: 0 }
    ACQUIRED_TYPES.set(builder, state)
  }
  return state
}

export const customTypeExamplePlugin: Plugin & {
  registerCustomTypes: (dslBuilder: typeof DslBuilder) => void
} = {
  name: 'custom-type-example',
  version: '1.0.0',
  description: 'Custom type registration example plugin',
  install(core, _options = {}, _context) {
    const coreRecord = core as { DslBuilder?: typeof DslBuilder }
    const builder = coreRecord.DslBuilder ?? DslBuilder

    if (!builder || typeof builder.registerType !== 'function') {
      throw new Error('DslBuilder.registerType is not available. Please upgrade to schema-dsl v1.1.0+')
    }

    this.registerCustomTypes(builder)
    typeAcquisitionState(builder).leases++
  },
  uninstall(core) {
    const coreRecord = core as { DslBuilder?: typeof DslBuilder } | undefined
    const builder = coreRecord?.DslBuilder ?? DslBuilder
    const state = ACQUIRED_TYPES.get(builder)
    if (state && state.leases > 0) state.leases--
    if (state && state.leases > 0) return
    for (const name of state?.names ?? []) builder.unregisterType(name)
    ACQUIRED_TYPES.delete(builder)
  },
  registerCustomTypes(dslBuilder) {
    const state = typeAcquisitionState(dslBuilder)
    const register = (name: string, schema: Parameters<typeof DslBuilder.registerType>[1]): void => {
      if (typeof dslBuilder.hasType === 'function' && dslBuilder.hasType(name)) return
      dslBuilder.registerType(name, schema)
      state.names.add(name)
    }

    register('order-id', {
      type: 'string',
      pattern: /^ORD[0-9]{12}$/.source,
      minLength: 15,
      maxLength: 15,
      _customMessages: {
        pattern: 'Invalid order ID format; must be 15 characters starting with ORD',
      },
    })

    register('sku', {
      type: 'string',
      pattern: /^SKU-[A-Z0-9]{6,10}$/.source,
      minLength: 10,
      maxLength: 14,
      _customMessages: {
        pattern: 'Invalid SKU format; must be SKU- followed by 6–10 alphanumeric characters',
      },
    })

    register('price', {
      type: 'number',
      minimum: 0,
      multipleOf: 0.01,
      _customMessages: {
        minimum: 'Price cannot be negative',
        multipleOf: 'Price can have at most 2 decimal places',
      },
    })

    register('rating', {
      type: 'integer',
      minimum: 1,
      maximum: 5,
      _customMessages: {
        minimum: 'Rating cannot be lower than 1 star',
        maximum: 'Rating cannot exceed 5 stars',
      },
    })

    register('color-code', {
      oneOf: [
        { type: 'string', pattern: /^#[0-9A-Fa-f]{6}$/.source },
        { type: 'string', pattern: /^#[0-9A-Fa-f]{3}$/.source },
        { type: 'string', pattern: /^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/.source },
        { type: 'string', pattern: /^rgba\(\d{1,3},\s*\d{1,3},\s*\d{1,3},\s*(0|1|0?\.\d+)\)$/.source },
      ],
    })

    register('semver', {
      type: 'string',
      pattern: /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/.source,
      _customMessages: {
        pattern: 'Invalid version format; must follow semantic versioning (e.g. 1.0.0, 2.1.3-beta.1)',
      },
    })

    register('dynamic-age', () => {
      const currentYear = new Date().getFullYear()
      return {
        type: 'integer',
        minimum: 0,
        maximum: currentYear - 1900,
        _customMessages: {
          minimum: 'Age cannot be negative',
          maximum: `Age cannot exceed ${currentYear - 1900} years`,
        },
      }
    })

    register('phone-intl', {
      type: 'string',
      pattern: /^\+?[1-9]\d{1,14}$/.source,
      minLength: 8,
      maxLength: 15,
      _customMessages: {
        pattern: 'Please enter a valid international phone number (E.164 format)',
      },
    })
  },
}

export default customTypeExamplePlugin

