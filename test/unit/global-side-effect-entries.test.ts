import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { uninstallStringExtensions } from '../../src/pure.js'

describe('side-effect controlled entries', () => {
  beforeEach(() => {
    uninstallStringExtensions()
    vi.resetModules()
  })

  afterEach(() => {
    uninstallStringExtensions()
  })

  it('pure entry should not install String.prototype extensions', async () => {
    expect(typeof ('email!' as any).description).toBe('undefined')

    await import('../../src/pure.js')

    expect(typeof ('email!' as any).description).toBe('undefined')
  })

  it('root entry should not mutate String.prototype', async () => {
    const before = Object.getOwnPropertyDescriptors(String.prototype)

    await import('../../src/index.js')

    const after = Object.getOwnPropertyDescriptors(String.prototype)
    const changed = Reflect.ownKeys({ ...before, ...after }).filter((key) => {
      const left = before[key as keyof typeof before]
      const right = after[key as keyof typeof after]
      if (!left || !right) return true
      return left.configurable !== right.configurable
        || left.enumerable !== right.enumerable
        || left.writable !== right.writable
        || !Object.is(left.value, right.value)
        || !Object.is(left.get, right.get)
        || !Object.is(left.set, right.set)
    })

    expect(changed).toEqual([])
    expect(typeof ('email!' as any).description).toBe('undefined')
  })

  it('compat entry should explicitly install String.prototype extensions', async () => {
    await import('../../src/compat.js')

    expect(typeof ('email!' as any).description).toBe('function')
  })

  it('register-string entry should install extensions and expose explicit controls', async () => {
    const entry = await import('../../src/register-string.js')

    expect(typeof ('email!' as any).description).toBe('function')
    expect(typeof entry.installStringExtensions).toBe('function')
    expect(typeof entry.uninstallStringExtensions).toBe('function')
  })
})
