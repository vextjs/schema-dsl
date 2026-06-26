import { describe, expect, it } from 'vitest'
import { SchemaUtils } from '../../../src/utils/SchemaUtils.js'

describe('SchemaUtils', () => {
  it('pick preserves __proto__ as an own property', () => {
    const properties = Object.create(null)
    properties['__proto__'] = { type: 'string' }
    properties['name'] = { type: 'string' }

    const picked = SchemaUtils.pick({
      type: 'object',
      properties,
      required: ['__proto__', 'name'],
    } as any, ['__proto__'])

    expect(Object.prototype.hasOwnProperty.call(picked.properties, '__proto__')).toBe(true)
    expect(Object.getPrototypeOf(picked.properties)).toBeNull()
    expect(picked.properties?.['__proto__']).toEqual({ type: 'string' })
    expect(picked.required).toEqual(['__proto__'])
  })

  it('extend merges __proto__ properties without mutating result prototype', () => {
    const extensionProperties = Object.create(null)
    extensionProperties['__proto__'] = { type: 'number' }

    const extended = SchemaUtils.extend({
      type: 'object',
      properties: {},
    } as any, {
      type: 'object',
      properties: extensionProperties,
      required: ['__proto__'],
    } as any)

    expect(Object.prototype.hasOwnProperty.call(extended.properties, '__proto__')).toBe(true)
    expect(Object.getPrototypeOf(extended.properties)).toBeNull()
    expect(extended.properties?.['__proto__']).toEqual({ type: 'number' })
    expect(extended.required).toEqual(['__proto__'])
  })
})
