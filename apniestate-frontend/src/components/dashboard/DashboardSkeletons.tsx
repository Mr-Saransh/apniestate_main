import React from 'react';

export function SkeletonPulse({ style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        background: 'linear-gradient(90deg, #E2E8F0 25%, #EDF2F7 50%, #E2E8F0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer-wave 1.5s infinite linear',
        borderRadius: '8px',
        ...style
      }}
      {...props}
    />
  );
}

// 1. KPI Loading Grid
export function KpiGridSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', width: '100%' }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '20px',
            height: '104px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 6px rgba(0,0,0,0.01)'
          }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <SkeletonPulse style={{ width: '60%', height: '14px' }} />
            <SkeletonPulse style={{ width: '40%', height: '24px' }} />
          </div>
          <SkeletonPulse style={{ width: '44px', height: '44px', borderRadius: '12px' }} />
        </div>
      ))}
    </div>
  );
}

// 2. Card Dashboard Component Skeleton (e.g. project list or calendar)
export function DashboardCardSkeleton({ title }: { title?: string }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '20px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        minHeight: '260px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {title ? (
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{title}</h3>
        ) : (
          <SkeletonPulse style={{ width: '180px', height: '18px' }} />
        )}
        <SkeletonPulse style={{ width: '80px', height: '14px' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <SkeletonPulse style={{ width: '50%', height: '14px' }} />
              <SkeletonPulse style={{ width: '15%', height: '14px' }} />
            </div>
            <SkeletonPulse style={{ width: '100%', height: '8px', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. Dense List Row Loader
export function DenseListSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            border: '1px solid #E2E8F0',
            borderRadius: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <SkeletonPulse style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <SkeletonPulse style={{ width: '45%', height: '13px' }} />
              <SkeletonPulse style={{ width: '25%', height: '11px' }} />
            </div>
          </div>
          <SkeletonPulse style={{ width: '60px', height: '18px', borderRadius: '6px' }} />
        </div>
      ))}
    </div>
  );
}

// Inline shimmer keyframes style element to inject in DOM
export function ShimmerStyle() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes shimmer-wave {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}} />
  );
}
