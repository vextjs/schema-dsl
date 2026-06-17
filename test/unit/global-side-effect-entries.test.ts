import { beforeEach, describe, expect, it, vi } from 'vitest'

import { uninstallStringExtensions } from '../../src/pure.js'

describe('side-effect controlled entries', () => {
  beforeEach(() => {
    uninstallStringExtensions()
    vi.resetModules()
  })

  it('pure entry should not install String.prototype extensions', async () => {
    expect(typeof ('email!' as any).description).toBe('undefined')

    await import('../../src/pure.js')

    expect(typeof ('email!' as any).description).toBe('undefined')
  })

  it('root entry should keep v1 side effects', async () => {
    await import('../../src/index.js')

    expect(typeof ('email!' as any).description).toBe('function')
    expect(('email!' as any).description('Email').toSchema()).toMatchObject({
      type: 'string',
      format: 'email',
      description: 'Email',
    })
  })

  it('compat entry should explicitly install String.prototype extensions', async () => {
    await import('../../src/compat.js')

    expect(typeof ('email!' as any).description).toBe('function')
  })

  it('register-string entry should only expose explicit install controls', async () => {
    const entry = await import('../../src/register-string.js')

    expect(typeof ('email!' as any).description).toBe('function')
    expect(typeof entry.installStringExtensions).toBe('function')
    expect(typeof entry.uninstallStringExtensions).toBe('function')
  })
})
