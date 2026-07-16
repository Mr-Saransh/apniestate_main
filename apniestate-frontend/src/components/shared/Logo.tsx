import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dark' | 'light' | 'monochrome';
  className?: string;
  style?: React.CSSProperties;
}

const logoHeights = {
  sm: '28px',  // Mobile Top App Bar / Navbars
  md: '38px',  // Desktop Sidebar / Top Navigation
  lg: '44px',  // Dashboard Welcome sections / Pages
  xl: '64px',  // Auth screens (Login, Signup) / Splash
};

export default function Logo({ size = 'md', variant = 'default', className = '', style }: LogoProps) {
  const height = logoHeights[size];

  // Map variant to canonical asset path
  let src = '/branding/logo.png';
  if (variant === 'dark') {
    src = '/branding/logo-dark.png';
  } else if (variant === 'light') {
    src = '/branding/logo-light.png';
  } else if (variant === 'monochrome') {
    src = '/branding/logo-monochrome.png';
  }

  return (
    <div
      className={`apni-estate-logo-wrapper ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      <img
        src={src}
        alt="Apni Estate"
        style={{
          height: height,
          width: 'auto',
          maxWidth: '100%',
          objectFit: 'contain',
          display: 'block',
          borderRadius: '8px'
        }}
        draggable={false}
      />
    </div>
  );
}
