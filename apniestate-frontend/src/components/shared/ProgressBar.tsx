interface ProgressBarProps {
  value: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ProgressBar({ value, label, size = 'md' }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const sizeClass = size === 'sm' ? 'progress-bar-sm' : size === 'lg' ? 'progress-bar-lg' : '';

  return (
    <div>
      {label && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-2)',
        }}>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>
            {label}
          </span>
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-primary)' }}>
            {clampedValue}%
          </span>
        </div>
      )}
      <div className={`progress-bar ${sizeClass}`}>
        <div className="progress-bar-fill" style={{ width: `${clampedValue}%` }} />
      </div>
    </div>
  );
}
