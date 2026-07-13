import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { PH, Card } from '@/components/shared/FigmaComponents';
import { CheckCircle, AlertTriangle, Bell, Clock, Info } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  type: string | null;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | "Approvals" | "Alerts" | "Mentions">("All");

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

  // Enhance backend notifications with UI categories for the Figma design
  const enrichedNotifs = notifications.map(n => {
    let type: "Approvals" | "Alerts" | "Mentions" | "Info" = "Info";
    let icon = Info;
    let color = "text-blue-500";

    if (n.type === 'success' || n.title.toLowerCase().includes('approv')) {
      type = "Approvals";
      icon = CheckCircle;
      color = "text-emerald-500";
    } else if (n.type === 'danger' || n.type === 'warning' || n.title.toLowerCase().includes('alert')) {
      type = "Alerts";
      icon = AlertTriangle;
      color = n.type === 'danger' ? "text-red-500" : "text-amber-500";
    } else if (n.message.toLowerCase().includes('mention')) {
      type = "Mentions";
      icon = Bell;
      color = "text-primary";
    }

    const time = new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

    return { ...n, uiType: type, icon, color, time };
  });

  const filtered = filter === "All" ? enrichedNotifs : enrichedNotifs.filter(n => n.uiType === filter);

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mt-5 mr-5 ml-5">
        <PH title="Notifications" sub={`${unreadCount} unread alerts and approvals`} />
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="text-xs text-primary font-semibold hover:underline">
            Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-2 mr-5 ml-5 overflow-x-auto pb-1 no-scrollbar">
        {(["All", "Approvals", "Alerts", "Mentions"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === f ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:bg-muted"}`}
          >
            {f}
          </button>
        ))}
      </div>

      <Card noPad>
        {filtered.length === 0 ? (
          <div className="p-8 text-center mr-5 ml-5 text-muted-foreground text-sm">No notifications found</div>
        ) : (
          filtered.map((n, i) => (
            <div key={n.id || i} className={`flex gap-3 px-4 py-3 ${!n.is_read ? "bg-primary/5" : ""} ${i < filtered.length - 1 ? "border-b border-border" : ""}`}>
              <n.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${n.color}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${!n.is_read ? 'font-bold' : 'font-semibold'} text-foreground`}>{n.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
                <p className="text-[9px] text-muted-foreground mt-1.5">{n.time}</p>
              </div>
              {!n.is_read && (
                <div className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0" />
              )}
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
