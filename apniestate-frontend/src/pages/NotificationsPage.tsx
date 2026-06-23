import { useState, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { apiClient } from '@/api/client';

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  type: string | null;
}

const typeColors: Record<string, { color: string; bg: string }> = {
  info: { color: 'var(--color-primary)', bg: 'var(--color-primary-50)' },
  warning: { color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  success: { color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  danger: { color: 'var(--color-danger)', bg: 'var(--color-danger-bg)' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get<any>('/notifications');
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await apiClient.post('/notifications', { action: 'mark_all_read' });
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1 className="page-title">Notifications</h1>
            <p className="page-subtitle">{unreadCount} unread alerts</p>
          </div>
          {unreadCount > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={handleMarkAllRead}>
              <CheckCheck size={16} />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={36} />}
          title="No notifications"
          description="You're all caught up!"
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {notifications.map((notif) => {
            const notifType = notif.type || 'info';
            const colorScheme = typeColors[notifType] || typeColors.info;
            
            return (
              <div
                key={notif.id}
                className="list-card"
                style={{
                  background: notif.is_read ? 'var(--color-surface)' : 'rgba(59, 130, 246, 0.05)',
                  padding: 'var(--space-4)',
                  borderBottom: '1px solid #E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                  transition: 'background-color 0.2s'
                }}
                id={`notif-${notif.id}`}
              >
                <div
                  className="list-card-icon"
                  style={{
                    background: colorScheme.bg,
                    color: colorScheme.color,
                    borderRadius: 'var(--radius-full)',
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Bell size={18} />
                </div>
                <div className="list-card-content" style={{ flex: 1 }}>
                  <div className="list-card-title" style={{
                    fontWeight: notif.is_read ? 'var(--font-weight-medium)' : 'var(--font-weight-semibold)',
                    color: 'var(--color-text)'
                  }}>
                    {notif.title}
                  </div>
                  <div className="list-card-subtitle" style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '2px' }}>
                    {notif.message}
                  </div>
                </div>
                <div className="list-card-meta" style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="list-card-date" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    {new Date(notif.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  {!notif.is_read && (
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--color-primary)',
                      marginTop: 6,
                      marginLeft: 'auto',
                    }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

