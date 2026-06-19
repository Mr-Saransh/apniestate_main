export default function LoadingSpinner({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) {
  if (size === 'lg') {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
          Loading...
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
      <div className={`spinner ${size === 'sm' ? 'spinner-sm' : ''}`} />
    </div>
  );
}
