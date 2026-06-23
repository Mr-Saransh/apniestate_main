import React, { type ButtonHTMLAttributes } from 'react';
import { Colors } from './Colors';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  style,
  disabled,
  ...props
}: ButtonProps) {
  let backgroundColor: string = Colors.primaryBlue;
  let textColor: string = '#FFFFFF';
  let hoverBg: string = '#08337A';

  if (variant === 'secondary') {
    backgroundColor = '#E2E8F0';
    textColor = Colors.secondaryText;
    hoverBg = '#CBD5E1';
  } else if (variant === 'danger') {
    backgroundColor = Colors.errorRed;
    textColor = '#FFFFFF';
    hoverBg = '#B91C1C';
  }

  let padding = '10px 18px';
  let fontSize = '14px';
  let minHeight = '42px';

  if (size === 'sm') {
    padding = '6px 12px';
    fontSize = '12px';
    minHeight = '32px';
  } else if (size === 'lg') {
    padding = '14px 24px';
    fontSize = '16px';
    minHeight = '50px';
  }

  return (
    <button
      className={`btn-design-system ${className}`}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? '#E2E8F0' : backgroundColor,
        color: disabled ? Colors.mutedText : textColor,
        padding,
        fontSize,
        minHeight,
        borderRadius: '12px',
        fontWeight: 600,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'background-color 0.15s ease, transform 0.1s ease',
        boxShadow: variant === 'primary' && !disabled ? '0 4px 6px -1px rgba(10, 61, 145, 0.15)' : 'none',
        opacity: disabled ? 0.7 : 1,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
