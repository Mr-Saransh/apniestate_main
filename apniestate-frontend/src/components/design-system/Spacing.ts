// Design System Spacing Tokens
export const Spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem',  // 8px
  md: '0.75rem', // 12px
  lg: '1rem',    // 16px
  xl: '1.25rem', // 20px
  xxl: '1.5rem', // 24px
  xxxl: '2rem',  // 32px
} as const;

export type SpacingType = typeof Spacing;
