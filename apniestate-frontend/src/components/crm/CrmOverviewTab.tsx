import React from 'react';
import {
  Users, UserCheck, TrendingUp, IndianRupee, Clock, CheckCircle2,
  AlertTriangle, Calendar, Plus, ArrowUpRight, Building2, Phone, MessageCircle,
  FileSpreadsheet, Sparkles, Zap, Shield, UserPlus, ArrowRight, UserCog,
  BarChart3, Activity, AlertCircle, ArrowDownRight, Award
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserCrmRole } from '@/config/crm-permissions';
import { type CrmAnalytics, type CrmLead, type CrmFollowup } from '@/api/crm';

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
}: CrmOverviewTabProps) {
  const { user } = useAuth();
  const crmRole = getUserCrmRole(user);

  const todayFollowups = followups.filter((f) => {
    if (f.status !== 'PENDING') return false;
    const d = new Date(f.due_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const overdueFollowups = followups.filter((f) => {
    if (f.status !== 'PENDING') return false;
    return new Date(f.due_at).getTime() < new Date().setHours(0, 0, 0, 0);
  });

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
              <span className="text-xs font-bold text-slate-500">Today's Follow-ups</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{todayFollowupCount}</p>
            <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Scheduled for today</p>
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
          {/* Today's Follow-up Agenda */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-[#2648E7]" />
                <h3 className="text-sm font-bold text-slate-900">Today's Scheduled Follow-ups</h3>
              </div>
              <button
                onClick={() => onNavigateTab('followups')}
                className="text-xs font-bold text-[#2648E7] hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {todayFollowups.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-bold text-slate-700">All caught up for today!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No pending follow-ups scheduled for right now</p>
                <button
                  onClick={onOpenAddFollowup}
                  className="mt-3 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#2648E7] bg-white border border-slate-200 shadow-sm hover:bg-slate-50"
                >
                  + Schedule a Follow-up
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayFollowups.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => f.lead && onSelectLead(f.lead.id)}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-200 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="size-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm"
                        style={{ backgroundColor: f.lead?.avatar_color || '#2648E7' }}
                      >
                        {f.lead?.initials || 'L'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{f.lead?.name || 'Lead'}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{f.note || 'Scheduled call/visit'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {f.lead?.phone && (
                        <a
                          href={`tel:${f.lead.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="size-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#2648E7] hover:border-[#2648E7]"
                        >
                          <Phone size={13} />
                        </a>
                      )}
                      <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200">
                        {new Date(f.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
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
            <div className="overflow-x-auto">
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
