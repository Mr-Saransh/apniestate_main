import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  style?: React.CSSProperties;
}

const sizeClasses = {
  sm: { svg: 24, font: '14px' },
  md: { svg: 32, font: '18px' },
  lg: { svg: 40, font: '22px' },
  xl: { svg: 64, font: '32px' },
};

export default function Logo({ size = 'md', className = '', style }: LogoProps) {
  const dimensions = sizeClasses[size];

  return (
    <div
      className={`logo-container ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: size === 'xl' ? '16px' : '8px',
        userSelect: 'none',
        ...style,
      }}
    >
      <svg
        width={dimensions.svg}
        height={dimensions.svg}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Modern geometric construction logo representing roofs and buildings */}
        <path
          d="M20 4L34 16H28V32H12V16H6L20 4Z"
          fill="var(--color-primary, #0A3D91)"
        />
        <path
          d="M20 12L28 19V32H12V19L20 12Z"
          fill="#F4B400"
          opacity="0.9"
        />
        <rect x="17" y="22" width="6" height="10" fill="#0A3D91" />
      </svg>
      {size !== 'sm' && (
        <span
          style={{
            fontWeight: 800,
            fontSize: dimensions.font,
            fontFamily: 'Outfit, Inter, sans-serif',
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, var(--color-primary, #0A3D91) 0%, #0052D4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          Apni<span style={{ color: '#F4B400', WebkitTextFillColor: 'initial', marginLeft: '2px' }}>Estate</span>
        </span>
      )}
    </div>
  );
}
