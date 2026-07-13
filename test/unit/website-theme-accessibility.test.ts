import { describe, expect, it } from 'vitest'
import {
  enhanceThemeSwitchControls,
  isKeyboardActivationKey,
} from '../../website/theme/accessibility.js'

type FakeControl = {
  tabIndex: number
  attributes: Map<string, string>
  setAttribute(name: string, value: string): void
}

function createControl(): FakeControl {
  return {
    tabIndex: -1,
    attributes: new Map<string, string>(),
    setAttribute(name, value) {
      this.attributes.set(name, value)
    },
  }
}

function createRoot(controls: FakeControl[]): ParentNode {
  return {
    querySelectorAll(selector: string) {
      expect(selector).toBe('.rp-switch-appearance')
      return controls
    },
  } as unknown as ParentNode
}

describe('website theme accessibility helpers', () => {
  it('projects stable English toggle semantics for every light-theme control', () => {
    const controls = [createControl(), createControl()]

    enhanceThemeSwitchControls(createRoot(controls), false, 'Dark theme')

    for (const control of controls) {
      expect(control.tabIndex).toBe(0)
      expect(Object.fromEntries(control.attributes)).toEqual({
        role: 'button',
        'aria-label': 'Dark theme',
        'aria-pressed': 'false',
      })
    }
  })

  it('updates pressed state without changing the localized accessible name', () => {
    const control = createControl()
    const root = createRoot([control])

    enhanceThemeSwitchControls(root, false, '深色主题')
    enhanceThemeSwitchControls(root, true, '深色主题')

    expect(control.tabIndex).toBe(0)
    expect(control.attributes.get('role')).toBe('button')
    expect(control.attributes.get('aria-label')).toBe('深色主题')
    expect(control.attributes.get('aria-pressed')).toBe('true')
  })

  it('only treats Enter and Space as button activation keys', () => {
    expect(isKeyboardActivationKey('Enter')).toBe(true)
    expect(isKeyboardActivationKey(' ')).toBe(true)
    expect(isKeyboardActivationKey('Spacebar')).toBe(false)
    expect(isKeyboardActivationKey('Escape')).toBe(false)
    expect(isKeyboardActivationKey('Tab')).toBe(false)
  })
})
