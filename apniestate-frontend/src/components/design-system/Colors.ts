// Design System Color Tokens
export const Colors = {
  primaryBlue: 'var(--color-primary-dark, #1e3a8a)',
  goldAccent: 'var(--color-cta, #F5A623)',
  successGreen: 'var(--color-success, #10B981)',
  warningAmber: 'var(--color-warning, #F59E0B)',
  errorRed: 'var(--color-danger, #EF4444)',
  background: 'var(--color-surface, #FFFFFF)',
  surface: 'var(--color-bg, #F8FAFC)',
  primaryText: 'var(--color-text, #0F172A)',
  secondaryText: 'var(--color-text-secondary, #475569)',
  mutedText: 'var(--color-text-muted, #94A3B8)'
} as const;

export type ColorType = typeof Colors;
