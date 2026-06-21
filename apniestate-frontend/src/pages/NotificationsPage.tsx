import { Bell, CheckCheck } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'danger';
}

const demoNotifications: Notification[] = [
  { id: '1', title: 'Material Request Approved', message: 'Cement (50 bags) for Skyline Heights has been approved', time: '10 min ago', read: false, type: 'success' },
  { id: '2', title: 'Task Overdue', message: 'Plumbing completion - Block B is past its due date', time: '1 hour ago', read: false, type: 'danger' },
  { id: '3', title: 'New Task Assigned', message: 'You have been assigned "Electrical wiring - Floor 3"', time: '3 hours ago', read: false, type: 'info' },
  { id: '4', title: 'Payment Processed', message: 'PKR 2,680,000 payment to vendor has been processed', time: '1 day ago', read: true, type: 'success' },
  { id: '5', title: 'Low Stock Alert', message: 'PVC Pipes (4") stock is below minimum quantity', time: '2 days ago', read: true, type: 'warning' },
];

const typeColors: Record<string, { color: string; bg: string }> = {
  info: { color: 'var(--color-primary)', bg: 'var(--color-primary-50)' },
  warning: { color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  success: { color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  danger: { color: 'var(--color-danger)', bg: 'var(--color-danger-bg)' },
};

export default function NotificationsPage() {
  const unreadCount = demoNotifications.filter(n => !n.read).length;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Notifications</h1>
            <p className="page-subtitle">{unreadCount} unread</p>
          </div>
          {unreadCount > 0 && (
            <button className="btn btn-ghost btn-sm">
              <CheckCheck size={16} />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {demoNotifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={36} />}
          title="No notifications"
          description="You're all caught up!"
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {demoNotifications.map((notif) => (
            <div
              key={notif.id}
              className="list-card"
              style={{
                background: notif.read ? 'var(--color-surface)' : 'var(--color-primary-50)',
              }}
              id={`notif-${notif.id}`}
            >
              <div
                className="list-card-icon"
                style={{
                  background: typeColors[notif.type].bg,
                  color: typeColors[notif.type].color,
                  borderRadius: 'var(--radius-full)',
                }}
              >
                <Bell size={18} />
              </div>
              <div className="list-card-content">
                <div className="list-card-title" style={{
                  fontWeight: notif.read ? 'var(--font-weight-medium)' : 'var(--font-weight-semibold)',
                }}>
                  {notif.title}
                </div>
                <div className="list-card-subtitle">{notif.message}</div>
              </div>
              <div className="list-card-meta">
                <div className="list-card-date">{notif.time}</div>
                {!notif.read && (
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    marginTop: 4,
                    marginLeft: 'auto',
                  }} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
