import React, { type ReactNode } from 'react';
import { Colors } from './Colors';
import { Shadows } from './Shadows';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function PrimaryCard({ children, className = '', style, ...props }: CardProps) {
  return (
    <div
      className={`premium-card primary-card ${className}`}
      style={{
        backgroundColor: Colors.background,
        borderRadius: '16px',
        boxShadow: Shadows.md,
        padding: '20px',
        border: '1px solid #E2E8F0',
        transition: 'box-shadow 0.2s ease',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function SecondaryCard({ children, className = '', style, ...props }: CardProps) {
  return (
    <div
      className={`premium-card secondary-card ${className}`}
      style={{
        backgroundColor: Colors.surface,
        borderRadius: '16px',
        boxShadow: Shadows.sm,
        padding: '20px',
        border: '1px solid #E2E8F0',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: ReactNode;
  label: string;
  value: string | number;
  color?: string;
  bgColor?: string;
}

export function StatCard({
  icon,
  label,
  value,
  color = Colors.primaryBlue,
  bgColor = 'rgba(10, 61, 145, 0.08)',
  className = '',
  style,
  ...props
}: StatCardProps) {
  return (
    <div
      className={`premium-card stat-card ${className}`}
      id={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: Shadows.md,
        padding: '20px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        ...style,
      }}
      {...props}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div
          style={{
            backgroundColor: bgColor,
            color: color,
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
          }}
        >
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: Colors.primaryText, marginTop: '4px' }}>
        {value}
      </div>
      <div style={{ fontSize: '13px', fontWeight: 500, color: Colors.mutedText }}>
        {label}
      </div>
    </div>
  );
}

interface ActionCardProps extends React.HTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
}

export function ActionCard({
  icon,
  label,
  description,
  className = '',
  style,
  onClick,
  ...props
}: ActionCardProps) {
  return (
    <button
      type="button"
      className={`premium-card action-card ${className}`}
      onClick={onClick}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: Shadows.md,
        padding: '20px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        textAlign: 'left',
        width: '100%',
        cursor: 'pointer',
        gap: '8px',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        ...style,
      }}
      {...props}
    >
      <div
        style={{
          backgroundColor: 'rgba(10, 61, 145, 0.08)',
          color: Colors.primaryBlue,
          padding: '10px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: '15px', fontWeight: 600, color: Colors.primaryText, marginTop: '4px' }}>
        {label}
      </div>
      {description && (
        <div style={{ fontSize: '12px', color: Colors.mutedText, lineHeight: '1.4' }}>
          {description}
        </div>
      )}
    </button>
  );
}

interface EmptyStateCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyStateCard({
  icon,
  title,
  description,
  action,
  className = '',
  style,
  ...props
}: EmptyStateCardProps) {
  return (
    <div
      className={`premium-card empty-state-card ${className}`}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: Shadows.sm,
        padding: '40px 24px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '16px',
        width: '100%',
        ...style,
      }}
      {...props}
    >
      <div
        style={{
          color: Colors.primaryBlue,
          fontSize: '36px',
          background: 'rgba(10, 61, 145, 0.05)',
          borderRadius: '50%',
          width: '72px',
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: Colors.primaryText, margin: 0 }}>
          {title}
        </h3>
        <p style={{ fontSize: '14px', color: Colors.mutedText, maxWidth: '320px', margin: 0, lineHeight: '1.5' }}>
          {description}
        </p>
      </div>
      {action && <div style={{ marginTop: '8px' }}>{action}</div>}
    </div>
  );
}
