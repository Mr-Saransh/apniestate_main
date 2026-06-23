import React, { type ReactNode } from 'react';
import { Colors } from './Colors';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  style?: React.CSSProperties;
}

export function Badge({ children, variant = 'primary', style }: BadgeProps) {
  let backgroundColor = 'rgba(10, 61, 145, 0.08)';
  let color = Colors.primaryBlue;

  if (variant === 'success') {
    backgroundColor = 'rgba(22, 163, 74, 0.1)';
    color = Colors.successGreen;
  } else if (variant === 'warning') {
    backgroundColor = 'rgba(245, 158, 11, 0.1)';
    color = Colors.warningAmber;
  } else if (variant === 'danger') {
    backgroundColor = 'rgba(220, 38, 38, 0.1)';
    color = Colors.errorRed;
  } else if (variant === 'neutral') {
    backgroundColor = '#E2E8F0';
    color = Colors.secondaryText;
  }

  return (
    <span
      className="badge-design-system"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor,
        color,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  );
}
