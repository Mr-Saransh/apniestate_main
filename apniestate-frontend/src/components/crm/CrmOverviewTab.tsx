import React, { useState } from 'react';
import {
  Users, UserCheck, TrendingUp, IndianRupee, Clock, CheckCircle2,
  AlertTriangle, Calendar, Plus, ArrowUpRight, Building2, Phone, MessageCircle,
  FileSpreadsheet, Sparkles, Zap, Shield, UserPlus, ArrowRight, UserCog,
  BarChart3, Activity, AlertCircle, ArrowDownRight, Award, Check
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserCrmRole } from '@/config/crm-permissions';
import { crmApi, type CrmAnalytics, type CrmLead, type CrmFollowup } from '@/api/crm';

interface CrmOverviewTabProps {
  analytics: CrmAnalytics | null;
  leads: CrmLead[];
  followups: CrmFollowup[];
  onOpenAddLead: () => void;
  onOpenAddFollowup: () => void;
  onOpenAddDeal: () => void;
  onOpenImportCsv?: () => void;
  onOpenAddProperty?: () => void;
  onOpenInviteMember?: () => void;
  onSelectLead: (leadId: string) => void;
  onNavigateTab: (tabId: string) => void;
  onRefresh?: () => void;
}

export default function CrmOverviewTab({
  analytics,
  leads,
  followups,
  onOpenAddLead,
  onOpenAddFollowup,
  onOpenAddDeal,
  onOpenImportCsv,
  onOpenAddProperty,
  onOpenInviteMember,
  onSelectLead,
  onNavigateTab,
  onRefresh,
}: CrmOverviewTabProps) {
  const { user } = useAuth();
  const crmRole = getUserCrmRole(user);

  const [followupFilter, setFollowupFilter] = useState<'ALL' | 'TODAY' | 'OVERDUE' | 'UPCOMING'>('ALL');
  const [completingFollowupId, setCompletingFollowupId] = useState<string | null>(null);

  const pendingFollowups = followups
    .filter((f) => f.status === 'PENDING')
    .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());

  const todayFollowups = pendingFollowups.filter((f) => {
    const d = new Date(f.due_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const overdueFollowups = pendingFollowups.filter((f) => {
    return new Date(f.due_at).getTime() < new Date().setHours(0, 0, 0, 0);
  });

  const upcomingFollowups = pendingFollowups.filter((f) => {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    return new Date(f.due_at).getTime() > todayEnd;
  });

  const displayedFollowups =
    followupFilter === 'TODAY'
      ? todayFollowups
      : followupFilter === 'OVERDUE'
      ? overdueFollowups
      : followupFilter === 'UPCOMING'
      ? upcomingFollowups
      : pendingFollowups;

  const handleOverviewCall = (lead?: any) => {
    if (!lead?.phone) return;
    crmApi.createActivity({
      lead_id: lead.id,
      type: 'CALL',
      title: `Outbound call dialed from Overview to ${lead.name} (${lead.phone})`,
    }).catch(() => {});
  };

  const handleOverviewWhatsApp = (lead?: any) => {
    if (!lead?.phone) return;
    const cleanPhone = lead.phone.replace(/[^\d]/g, '');
    crmApi.createActivity({
      lead_id: lead.id,
      type: 'NOTE',
      title: `WhatsApp message initiated from Overview with ${lead.name} (${cleanPhone})`,
    }).catch(() => {});
    const msg = encodeURIComponent(`Hello ${lead.name}, this is regarding your property inquiry at Apni Estate.`);
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  const handleCompleteFollowup = async (fId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setCompletingFollowupId(fId);
      await crmApi.updateFollowup(fId, { status: 'COMPLETED', outcome: 'Followed up successfully' });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to complete followup');
    } finally {
      setCompletingFollowupId(null);
    }
  };

  const getFollowupBadge = (dueAt: string) => {
    const d = new Date(dueAt);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 86400000;
    const time = d.getTime();

    if (time < todayStart) {
      return {
        label: `Overdue (${d.toLocaleDateString([], { month: 'short', day: 'numeric' })})`,
        bg: 'bg-red-50 text-red-700 border-red-200',
      };
    } else if (time < todayEnd) {
      return {
        label: `Today • ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    } else {
      const isTomorrow = time < todayEnd + 86400000;
      return {
        label: isTomorrow
          ? `Tomorrow • ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} • ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    }
  };

  const recentLeads = leads.slice(0, 5);

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. TELECALLER DASHBOARD VIEW (Strictly personal stats)
  // ═══════════════════════════════════════════════════════════════════════════
  if (crmRole === 'TELECALLER') {
    const myLeadsCount = analytics?.myLeads !== undefined ? analytics.myLeads : leads.length;
    const myBookingsCount = analytics?.myBookings !== undefined ? analytics.myBookings : leads.filter((l) => l.status === 'BOOKED').length;
    const myVisitsCount = analytics?.mySiteVisits !== undefined ? analytics.mySiteVisits : 0;
    const todayFollowupCount = analytics?.todayFollowups !== undefined ? analytics.todayFollowups : todayFollowups.length;
    const overdueCount = analytics?.overdueFollowups !== undefined ? analytics.overdueFollowups : overdueFollowups.length;

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Telecaller Header & Quick Actions */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 border border-slate-200/80 shadow-md shadow-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2648E7] to-[#4F6DFF] text-white flex items-center justify-center shadow-md shadow-[#2648E7]/30 shrink-0">
              <Zap size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                  Sales Executive Workspace
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#2648E7]/10 text-[#2648E7]">
                  My Desk
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Focus on your personal call pipeline, scheduled visits, and pending customer follow-ups
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenAddLead}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#2648E7] to-[#4F6DFF] hover:opacity-95 shadow-md shadow-[#2648E7]/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Add Lead</span>
            </button>
            <button
              onClick={onOpenAddFollowup}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Clock size={14} className="text-[#2648E7]" />
              <span>Schedule Follow-up</span>
            </button>
            <button
              onClick={() => onNavigateTab('leads')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Users size={14} className="text-emerald-600" />
              <span>Update Lead</span>
            </button>
          </div>
        </div>

        {/* Telecaller Personal KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">My Leads</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2648E7] flex items-center justify-center">
                <Users size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{myLeadsCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Assigned to you</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Pending Follow-ups</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{pendingFollowups.length}</p>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              <span className="text-amber-600 font-bold">{todayFollowups.length} today</span>
              {overdueFollowups.length > 0 && <span className="text-red-600 font-bold ml-1.5">• {overdueFollowups.length} overdue</span>}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Overdue Calls</span>
              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle size={16} />
              </div>
            </div>
            <p className={`text-2xl font-black mt-2 ${overdueCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {overdueCount}
            </p>
            <p className="text-[11px] text-red-500 font-semibold mt-0.5">Requires attention</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">My Site Visits</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Calendar size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{myVisitsCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Visits coordinated</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">My Bookings</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-600 mt-2">{myBookingsCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Units closed</p>
          </div>
        </div>

        {/* Telecaller Personal Follow-ups & Recent Leads Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overall Follow-up Agenda List */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-[#2648E7]" />
                <h3 className="text-sm font-bold text-slate-900">Follow-up Agenda</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-[#2648E7]">
                  {pendingFollowups.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onNavigateTab('followups')}
                  className="text-xs font-bold text-[#2648E7] hover:underline flex items-center gap-1"
                >
                  <span>All Details</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>

            {/* Quick Segmented Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setFollowupFilter('ALL')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                  followupFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All ({pendingFollowups.length})
              </button>
              <button
                onClick={() => setFollowupFilter('TODAY')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                  followupFilter === 'TODAY'
                    ? 'bg-white text-amber-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Today ({todayFollowups.length})
              </button>
              <button
                onClick={() => setFollowupFilter('OVERDUE')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                  followupFilter === 'OVERDUE'
                    ? 'bg-white text-red-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Overdue ({overdueFollowups.length})
              </button>
              <button
                onClick={() => setFollowupFilter('UPCOMING')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                  followupFilter === 'UPCOMING'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Upcoming ({upcomingFollowups.length})
              </button>
            </div>

            {displayedFollowups.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-bold text-slate-700">
                  {followupFilter === 'ALL'
                    ? 'All caught up! No pending follow-ups.'
                    : followupFilter === 'TODAY'
                    ? 'No follow-ups scheduled for today.'
                    : followupFilter === 'OVERDUE'
                    ? 'No overdue follow-ups! Great job.'
                    : 'No upcoming follow-ups scheduled.'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Stay proactive by scheduling upcoming calls and visits</p>
                <button
                  onClick={onOpenAddFollowup}
                  className="mt-3 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#2648E7] bg-white border border-slate-200 shadow-sm hover:bg-slate-50"
                >
                  + Schedule a Follow-up
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {displayedFollowups.map((f) => {
                  const badge = getFollowupBadge(f.due_at);
                  const isCompleting = completingFollowupId === f.id;

                  return (
                    <div
                      key={f.id}
                      onClick={() => f.lead && onSelectLead(f.lead.id)}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-200 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="size-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm"
                          style={{ backgroundColor: f.lead?.avatar_color || '#2648E7' }}
                        >
                          {f.lead?.initials || 'L'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-900 truncate">{f.lead?.name || 'Lead'}</p>
                            {f.lead?.status && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-slate-200/70 text-slate-700">
                                {f.lead.status}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
                            {f.note || 'Scheduled follow-up contact'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${badge.bg}`}>
                          {badge.label}
                        </span>

                        {f.lead?.phone && (
                          <>
                            <a
                              href={`tel:${f.lead.phone}`}
                              onClick={() => handleOverviewCall(f.lead)}
                              className="size-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#2648E7] hover:border-[#2648E7] transition-colors"
                              title={`Call ${f.lead.phone}`}
                            >
                              <Phone size={13} />
                            </a>
                            <button
                              onClick={() => handleOverviewWhatsApp(f.lead)}
                              className="size-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-emerald-600 hover:border-emerald-500 transition-colors"
                              title={`WhatsApp ${f.lead.phone}`}
                            >
                              <MessageCircle size={13} />
                            </button>
                          </>
                        )}

                        <button
                          onClick={(e) => handleCompleteFollowup(f.id, e)}
                          disabled={isCompleting}
                          className="size-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-500 transition-colors"
                          title="Mark Follow-up as Completed"
                        >
                          <Check size={13} className={isCompleting ? 'animate-spin' : ''} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* My Recent Leads */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[#2648E7]" />
                <h3 className="text-sm font-bold text-slate-900">My Recent Leads</h3>
              </div>
              <button
                onClick={() => onNavigateTab('leads')}
                className="text-xs font-bold text-[#2648E7] hover:underline flex items-center gap-1"
              >
                <span>View All Leads</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {recentLeads.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Users size={32} className="text-slate-400 mx-auto mb-2 opacity-60" />
                <p className="text-xs font-bold text-slate-700">No leads assigned yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Add your first lead or wait for manager assignment</p>
                <button
                  onClick={onOpenAddLead}
                  className="mt-3 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#2648E7] shadow-sm hover:opacity-95"
                >
                  + Add Lead
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentLeads.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => onSelectLead(l.id)}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-200 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="size-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm"
                        style={{ backgroundColor: l.avatar_color || '#2648E7' }}
                      >
                        {l.initials || 'L'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{l.name}</p>
                        <p className="text-[11px] text-slate-500">{l.budget || l.city || 'No details'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 uppercase">
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. CRM MANAGER DASHBOARD VIEW (Team Leads, Team Performance, Unassigned)
  // ═══════════════════════════════════════════════════════════════════════════
  if (crmRole === 'CRM_MANAGER') {
    const totalLeads = analytics?.totalLeads || leads.length;
    const totalDeals = analytics?.totalDeals || leads.filter((l) => l.status === 'BOOKED').length;
    const unassignedCount = analytics?.unassignedLeads || leads.filter((l) => !l.assigned_to).length;
    const teamPerformance = analytics?.teamPerformance || [];

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Manager Header & Quick Actions */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-indigo-50/30 to-blue-50/20 border border-slate-200/80 shadow-md shadow-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2648E7] to-[#6366F1] text-white flex items-center justify-center shadow-md shadow-[#2648E7]/30 shrink-0">
              <UserCog size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                  Sales Team Management Dashboard
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#2648E7]/10 text-[#2648E7]">
                  Manager View
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Oversee telecaller activity, monitor team conversion rates, and reassign incoming inquiries
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigateTab('team')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#2648E7] to-[#4F6DFF] hover:opacity-95 shadow-md shadow-[#2648E7]/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <UserPlus size={15} strokeWidth={2.5} />
              <span>Add Telecaller</span>
            </button>
            <button
              onClick={() => onNavigateTab('leads')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Users size={14} className="text-[#2648E7]" />
              <span>Assign Leads</span>
            </button>
            <button
              onClick={() => onNavigateTab('pipeline')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <TrendingUp size={14} className="text-emerald-600" />
              <span>View Pipeline</span>
            </button>
          </div>
        </div>

        {/* Manager KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Team Leads</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2648E7] flex items-center justify-center">
                <Users size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{totalLeads}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">All active leads</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Unassigned Leads</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertCircle size={16} />
              </div>
            </div>
            <p className={`text-2xl font-black mt-2 ${unassignedCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {unassignedCount}
            </p>
            <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Needs assignment</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Today's Follow-ups</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Clock size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{analytics?.todayFollowups || todayFollowups.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Team follow-ups today</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Overdue Follow-ups</span>
              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle size={16} />
              </div>
            </div>
            <p className={`text-2xl font-black mt-2 ${(analytics?.overdueFollowups || 0) > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {analytics?.overdueFollowups || overdueFollowups.length}
            </p>
            <p className="text-[11px] text-red-500 font-semibold mt-0.5">Team action required</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Team Bookings</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-600 mt-2">{totalDeals}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Total closed units</p>
          </div>
        </div>

        {/* Team Performance Table */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-[#FCC300]" />
              <h3 className="text-sm font-bold text-slate-900">Sales Executive Performance Leaderboard</h3>
            </div>
            <button
              onClick={() => onNavigateTab('team')}
              className="text-xs font-bold text-[#2648E7] hover:underline flex items-center gap-1"
            >
              <span>Manage Team</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {teamPerformance.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Users size={32} className="text-slate-400 mx-auto mb-2 opacity-60" />
              <p className="text-xs font-bold text-slate-700">No telecallers added to the team yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Add sales executives or telecallers to track individual performance</p>
              <button
                onClick={() => onNavigateTab('team')}
                className="mt-3 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#2648E7] shadow-sm hover:opacity-95"
              >
                + Add Telecaller
              </button>
            </div>
          ) : (
            <>
              {/* Mobile Cards List (< 768px) */}
              <div className="md:hidden divide-y divide-slate-100">
                {teamPerformance.map((member) => (
                  <div key={member.userId} className="py-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-8 rounded-xl bg-[#2648E7]/10 text-[#2648E7] font-bold flex items-center justify-center text-xs shrink-0">
                          {member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-900 truncate">{member.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{member.email || member.phone || 'No contact'}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-[#2648E7] shrink-0">
                        {member.role}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Leads</span>
                        <span className="font-black text-slate-800">{member.assignedLeads}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Booked</span>
                        <span className="font-black text-emerald-600">{member.bookedLeads}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-semibold block">Conversion</span>
                        <span className="font-black text-[#2648E7]">{member.conversionRate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (>= 768px) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 px-3">Sales Executive</th>
                      <th className="pb-3 px-3">Role</th>
                      <th className="pb-3 px-3 text-center">Assigned Leads</th>
                      <th className="pb-3 px-3 text-center">Bookings</th>
                      <th className="pb-3 px-3 text-right">Conversion Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teamPerformance.map((member) => (
                      <tr key={member.userId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-xl bg-[#2648E7]/10 text-[#2648E7] font-bold flex items-center justify-center text-xs">
                              {member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{member.name}</p>
                              <p className="text-[11px] text-slate-400">{member.email || member.phone || 'No contact'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-[#2648E7]">
                            {member.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">{member.assignedLeads}</td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-600">{member.bookedLeads}</td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-black text-slate-900">{member.conversionRate}%</span>
                            <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#2648E7] to-emerald-500 rounded-full"
                                style={{ width: `${Math.min(100, member.conversionRate)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. BUILDER / OWNER DASHBOARD VIEW (Complete Executive Visibility)
  // ═══════════════════════════════════════════════════════════════════════════
  const totalLeads = analytics?.totalLeads || leads.length;
  const totalCustomers = analytics?.totalCustomers || leads.filter((l) => ['BOOKED', 'NEGOTIATION'].includes(l.status)).length;
  const totalDeals = analytics?.totalDeals || leads.filter((l) => l.status === 'BOOKED').length;
  const totalRevenue = analytics?.totalRevenue || 0;
  const totalCommission = analytics?.totalCommission || 0;
  const conversionRate = analytics?.conversionRate || 0;
  const teamPerformance = analytics?.teamPerformance || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Executive Quick Launch & Controls */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 border border-slate-200/80 shadow-md shadow-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2648E7] to-[#FCC300] text-white flex items-center justify-center shadow-md shadow-[#2648E7]/30 shrink-0">
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Real Estate CRM Command Center
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FCC300]/20 text-[#855700]">
                Builder Full Access
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Complete oversight across sales teams, client transactions, and pipeline revenue
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAddLead}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#2648E7] to-[#4F6DFF] hover:opacity-95 shadow-md shadow-[#2648E7]/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Add Lead</span>
          </button>
          <button
            onClick={() => onNavigateTab('team')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <UserPlus size={14} className="text-[#2648E7]" />
            <span>CRM Team</span>
          </button>
          {onOpenAddProperty && (
            <button
              onClick={onOpenAddProperty}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Building2 size={14} className="text-indigo-600" />
              <span>+ Property</span>
            </button>
          )}
          {onOpenImportCsv && (
            <button
              onClick={onOpenImportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" />
              <span>Import CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Builder KPI Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Inquiries / Leads</span>
            <div className="size-9 rounded-2xl bg-blue-50 text-[#2648E7] flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{totalLeads}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Active: {analytics?.activeLeads || totalLeads}</span>
            <span className="font-bold text-[#2648E7]">{conversionRate}% conv.</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Bookings & Deals</span>
            <div className="size-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600">{totalDeals}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>High-intent clients: {totalCustomers}</span>
            <span className="text-emerald-600 font-bold">Closed</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Closed Deal Value</span>
            <div className="size-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <IndianRupee size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">
            ₹{totalRevenue >= 10000000 ? `${(totalRevenue / 10000000).toFixed(2)} Cr` : totalRevenue >= 100000 ? `${(totalRevenue / 100000).toFixed(2)} L` : totalRevenue.toLocaleString()}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Commission: ₹{totalCommission.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Active CRM Team</span>
            <div className="size-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{analytics?.crmTeamCount || 1}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Managers & Telecallers</span>
            <button onClick={() => onNavigateTab('team')} className="text-[#2648E7] font-bold hover:underline">
              View Team →
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline Funnel & Team Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Breakdown */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp size={16} className="text-[#2648E7]" />
              <span>Pipeline Breakdown</span>
            </h3>
            <button
              onClick={() => onNavigateTab('pipeline')}
              className="text-xs font-bold text-[#2648E7] hover:underline"
            >
              Kanban →
            </button>
          </div>

          <div className="space-y-2.5">
            {(analytics?.pipeline || [
              { stage: 'NEW', count: leads.filter((l) => l.status === 'NEW').length },
              { stage: 'CONTACTED', count: leads.filter((l) => l.status === 'CONTACTED').length },
              { stage: 'QUALIFIED', count: leads.filter((l) => l.status === 'QUALIFIED').length },
              { stage: 'SITE_VISIT', count: leads.filter((l) => l.status === 'SITE_VISIT').length },
              { stage: 'NEGOTIATION', count: leads.filter((l) => l.status === 'NEGOTIATION').length },
              { stage: 'BOOKED', count: leads.filter((l) => l.status === 'BOOKED').length },
            ]).map((item) => (
              <div key={item.stage} className="p-3 rounded-2xl bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 capitalize">{item.stage.replace('_', ' ').toLowerCase()}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white border border-slate-200 text-[#2648E7]">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Team Leaderboard */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award size={16} className="text-[#FCC300]" />
              <span>CRM Team Performance</span>
            </h3>
            <button
              onClick={() => onNavigateTab('team')}
              className="text-xs font-bold text-[#2648E7] hover:underline"
            >
              CRM Team Directory →
            </button>
          </div>

          {teamPerformance.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Users size={32} className="text-slate-400 mx-auto mb-2 opacity-60" />
              <p className="text-xs font-bold text-slate-700">No CRM Managers or Telecallers assigned yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Invite sales managers and telecallers to build your sales team</p>
              <button
                onClick={() => onNavigateTab('team')}
                className="mt-3 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2648E7] shadow-sm hover:opacity-95"
              >
                + Invite CRM Member
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 px-3">Team Member</th>
                    <th className="pb-3 px-3">Role</th>
                    <th className="pb-3 px-3 text-center">Assigned Leads</th>
                    <th className="pb-3 px-3 text-center">Bookings</th>
                    <th className="pb-3 px-3 text-right">Conversion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamPerformance.map((member) => (
                    <tr key={member.userId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-xl bg-[#2648E7]/10 text-[#2648E7] font-bold flex items-center justify-center text-xs">
                            {member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{member.name}</p>
                            <p className="text-[11px] text-slate-400">{member.email || member.phone || 'No contact'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-[#2648E7]">
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">{member.assignedLeads}</td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-600">{member.bookedLeads}</td>
                      <td className="py-3 px-3 text-right font-black text-slate-900">{member.conversionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
