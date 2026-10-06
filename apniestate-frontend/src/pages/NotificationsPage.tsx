import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { Card } from '@/components/shared/FigmaComponents';
import {
  CheckCircle,
  AlertTriangle,
  Bell,
  Clock,
  Info,
  ArrowLeft,
  ChevronRight,
  Check,
  Users,
  Calendar,
  FileText,
  Sparkles,
  Inbox
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAppMode } from '@/context/AppModeContext';
import { getUserCrmRole } from '@/config/crm-permissions';

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  type: string | null;
  link?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  priority?: string | null;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mode, setMode, isCrmOnly } = useAppMode();
  const crmRole = getUserCrmRole(user);
  const isCrmMode = mode === 'CRM' || isCrmOnly;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");

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
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  const handleMarkOneRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.patch(`/notifications/${id}`, {});
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark single notification read:', err);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    // 1. Mark as read if unread
    if (!n.is_read) {
      try {
        await apiClient.patch(`/notifications/${n.id}`, {});
        setNotifications(prev =>
          prev.map(item => (item.id === n.id ? { ...item, is_read: true } : item))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Error marking as read on click:', err);
      }
    }

    // 2. Telecallers / CRM-only staff: STRICTLY confine to CRM routes
    if (isCrmOnly || crmRole === 'TELECALLER') {
      if (n.link && n.link.startsWith('/crm')) {
        navigate(n.link);
        return;
      }
      if (n.entity_type === 'CrmLead' || n.type?.includes('LEAD') || n.title.toLowerCase().includes('lead')) {
        navigate('/crm?tab=leads');
        return;
      }
      if (n.entity_type === 'CrmFollowup' || n.type?.includes('FOLLOWUP') || n.title.toLowerCase().includes('follow-up')) {
        navigate('/crm?tab=followups');
        return;
      }
      if (n.entity_type === 'CrmActivity' || n.type?.includes('ACTIVITY')) {
        navigate('/crm?tab=activities');
        return;
      }
      // Fallback: stay safely in CRM
      navigate('/crm?tab=overview');
      return;
    }

    // 3. Dual-role or ERP users (Builder, Manager, Accountant)
    if (n.link) {
      if (n.link.startsWith('/crm')) {
        setMode('CRM');
      } else {
        setMode('ERP');
      }
      navigate(n.link);
      return;
    }

    if (n.entity_type === 'MaterialRequest') {
      navigate('/purchase?tab=requests');
      return;
    }
    if (n.entity_type === 'Expense') {
      navigate('/finance?tab=expenses');
      return;
    }
    if (n.entity_type === 'Task') {
      navigate('/operations?tab=tasks');
      return;
    }
    if (n.entity_type === 'Milestone') {
      navigate('/progress?tab=milestones');
      return;
    }
    if (n.entity_type === 'CrmLead' || n.entity_type === 'CrmFollowup') {
      setMode('CRM');
      navigate('/crm');
      return;
    }

    // Generic fallback
    navigate(isCrmMode ? '/crm' : '/dashboard');
  };

  // Enriched notifications with category tags, icons, and formatted time
  const enrichedNotifs = notifications.map(n => {
    let category = "General";
    let icon = Info;
    let color = "text-blue-500 bg-blue-50 border-blue-200";

    const titleLower = n.title.toLowerCase();
    const typeLower = (n.type || '').toLowerCase();
    const entityType = n.entity_type || '';

    if (
      entityType === 'CrmFollowup' ||
      typeLower.includes('followup') ||
      titleLower.includes('follow-up')
    ) {
      category = "Follow-ups";
      icon = Clock;
      color = "text-amber-600 bg-amber-50 border-amber-200";
    } else if (
      entityType === 'CrmLead' ||
      typeLower.includes('lead') ||
      titleLower.includes('lead')
    ) {
      category = "Leads";
      icon = Users;
      color = "text-indigo-600 bg-indigo-50 border-indigo-200";
    } else if (
      entityType === 'CrmActivity' ||
      typeLower.includes('activity') ||
      titleLower.includes('visit')
    ) {
      category = "Activities";
      icon = Calendar;
      color = "text-violet-600 bg-violet-50 border-violet-200";
    } else if (
      titleLower.includes('approv') ||
      typeLower === 'success' ||
      entityType === 'MaterialRequest' ||
      entityType === 'Expense'
    ) {
      category = "Approvals";
      icon = CheckCircle;
      color = "text-emerald-600 bg-emerald-50 border-emerald-200";
    } else if (
      typeLower === 'danger' ||
      typeLower === 'warning' ||
      titleLower.includes('alert') ||
      titleLower.includes('overdue')
    ) {
      category = "Alerts";
      icon = AlertTriangle;
      color = "text-rose-600 bg-rose-50 border-rose-200";
    } else if (
      entityType === 'Task' ||
      entityType === 'Milestone' ||
      titleLower.includes('task') ||
      titleLower.includes('milestone')
    ) {
      category = "Tasks";
      icon = FileText;
      color = "text-sky-600 bg-sky-50 border-sky-200";
    }

    const date = new Date(n.created_at);
    const time = isNaN(date.getTime())
      ? ''
      : date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });

    return { ...n, category, icon, color, time };
  });

  const filterTabs = isCrmMode
    ? (["All", "Follow-ups", "Leads", "Activities", "Alerts"] as const)
    : (["All", "Approvals", "Alerts", "Tasks", "Follow-ups"] as const);

  const filtered = filter === "All"
    ? enrichedNotifs
    : enrichedNotifs.filter(n => n.category === filter);

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-xs text-muted-foreground font-semibold">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Header with Back button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(isCrmMode ? '/crm' : '/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors shadow-sm shrink-0"
            title="Return to Workspace"
          >
            <ArrowLeft size={14} />
            <span>Back to {isCrmMode ? 'CRM' : 'Dashboard'}</span>
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-foreground flex items-center gap-2">
              <Bell size={20} className="text-primary" />
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-black">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isCrmMode
                ? 'Follow-up reminders, lead alerts, and CRM tasks'
                : 'Project alerts, approval requests, and operations updates'}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="self-start sm:self-center flex items-center gap-1.5 text-xs text-primary font-bold hover:underline px-2.5 py-1 rounded-lg hover:bg-primary/5 transition-colors"
          >
            <Check size={14} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {filterTabs.map(tabName => {
          const count = tabName === "All"
            ? enrichedNotifs.length
            : enrichedNotifs.filter(n => n.category === tabName).length;

          return (
            <button
              key={tabName}
              onClick={() => setFilter(tabName)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                filter === tabName
                  ? "bg-primary text-white scale-[1.02]"
                  : "bg-white border border-border text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span>{tabName}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  filter === tabName
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notification List */}
      <Card noPad className="overflow-hidden shadow-sm border border-border rounded-2xl bg-white">
        {filtered.length === 0 ? (
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
            <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Inbox size={26} />
            </div>
            <p className="text-sm font-bold text-slate-800">You're all caught up!</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {filter === "All"
                ? "No notifications right now. Any newly assigned leads, scheduled follow-up alerts, or approvals will appear here."
                : `No notifications found in the "${filter}" category.`}
            </p>
            <button
              onClick={() => navigate(isCrmMode ? '/crm' : '/dashboard')}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm"
            >
              Return to {isCrmMode ? 'CRM Workspace' : 'Dashboard'}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(n => {
              const IconComp = n.icon;
              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`group flex items-start gap-3.5 px-4 sm:px-5 py-3.5 cursor-pointer transition-all ${
                    !n.is_read
                      ? "bg-blue-50/40 hover:bg-blue-50/70"
                      : "hover:bg-slate-50"
                  }`}
                >
                  {/* Category icon badge */}
                  <div
                    className={`size-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${n.color}`}
                  >
                    <IconComp size={18} />
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={`text-xs sm:text-sm ${
                          !n.is_read
                            ? "font-extrabold text-slate-900"
                            : "font-semibold text-slate-800"
                        }`}
                      >
                        {n.title}
                      </p>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        {n.category}
                      </span>
                      {n.priority === 'HIGH' && (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-red-100 text-red-600 border border-red-200">
                          HIGH
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground font-medium">
                      <span>{n.time}</span>
                      <span className="text-primary font-bold group-hover:underline flex items-center gap-0.5">
                        View Details <ChevronRight size={11} />
                      </span>
                    </div>
                  </div>

                  {/* Unread dot / quick mark read button */}
                  <div className="flex items-center gap-2 shrink-0 self-center">
                    {!n.is_read ? (
                      <button
                        onClick={e => handleMarkOneRead(n.id, e)}
                        title="Mark as read"
                        className="size-7 rounded-lg hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
                      >
                        <span className="size-2 rounded-full bg-primary ring-2 ring-primary/20" />
                      </button>
                    ) : (
                      <div className="text-slate-300 group-hover:text-slate-500 transition-colors">
                        <ChevronRight size={16} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
