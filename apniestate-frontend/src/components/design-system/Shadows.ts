// Design System Shadow Tokens
export const Shadows = {
  sm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  md: '0 4px 12px rgba(0,0,0,0.08)',
  lg: '0 8px 24px rgba(0,0,0,0.10)',
  card: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)',
  cardHover: '0 4px 16px rgba(10,61,145,0.08)'
} as const;

export type ShadowsType = typeof Shadows;
