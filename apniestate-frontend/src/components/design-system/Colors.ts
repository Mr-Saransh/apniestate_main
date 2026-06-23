// Design System Color Tokens
export const Colors = {
  primaryBlue: '#0A3D91',
  goldAccent: '#F4B400',
  successGreen: '#16A34A',
  warningAmber: '#F59E0B',
  errorRed: '#DC2626',
  background: '#FFFFFF',
  surface: '#F8FAFC',
  primaryText: '#111827',
  secondaryText: '#374151',
  mutedText: '#6B7280'
} as const;

export type ColorType = typeof Colors;
