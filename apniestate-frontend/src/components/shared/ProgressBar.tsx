interface ProgressBarProps {
  value: number;
  label?: string;
  showPercentage?: boolean;
}

export default function ProgressBar({ value, label, showPercentage = true }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div>
      {(label || showPercentage) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-2)',
          }}
        >
          {label && (
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              {label}
            </span>
          )}
          {showPercentage && (
            <span
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text)',
              }}
            >
              {clamped}%
            </span>
          )}
        </div>
      )}
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
