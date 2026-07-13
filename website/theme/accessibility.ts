export function enhanceThemeSwitchControls(
  root: ParentNode,
  isDark: boolean,
  label: string
): void {
  root.querySelectorAll<HTMLElement>('.rp-switch-appearance').forEach(control => {
    control.setAttribute('role', 'button');
    control.tabIndex = 0;
    control.setAttribute('aria-label', label);
    control.setAttribute('aria-pressed', String(isDark));
  });
}

export function isKeyboardActivationKey(key: string): boolean {
  return key === 'Enter' || key === ' ';
}
