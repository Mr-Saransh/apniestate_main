// Design System Typography Tokens
export const Typography = {
  fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  sizes: {
    xs: '0.8125rem',   // 13px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    md: '1.125rem',    // 18px
    lg: '1.25rem',     // 20px
    xl: '1.5rem',      // 24px
    xxl: '1.75rem',    // 28px
    xxxl: '2rem',      // 32px
    xxxxl: '2.5rem',   // 40px
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  }
} as const;

export type TypographyType = typeof Typography;
