import { CheckCircle, Package, CreditCard, FileText, AlertTriangle } from 'lucide-react';

interface Activity {
  id: string;
  type: 'completion' | 'delivery' | 'payment' | 'report' | 'alert';
  title: string;
  subtitle: string;
  time: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

const iconMap = {
  completion: { icon: CheckCircle, color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  delivery: { icon: Package, color: 'var(--color-info)', bg: 'var(--color-info-bg)' },
  payment: { icon: CreditCard, color: 'var(--color-accent)', bg: 'rgba(197, 160, 78, 0.1)' },
  report: { icon: FileText, color: 'var(--color-primary)', bg: 'var(--color-primary-50)' },
  alert: { icon: AlertTriangle, color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
};

export default function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {activities.map((activity) => {
        const { icon: Icon, color, bg } = iconMap[activity.type];
        return (
          <div
            key={activity.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              transition: 'background var(--transition-fast)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: bg,
                color: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-text)',
                  marginBottom: 2,
                }}
              >
                {activity.title}
              </div>
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {activity.subtitle}
              </div>
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {activity.time}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type { Activity };
