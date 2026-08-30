import React from 'react';
import {
  Users, UserCheck, TrendingUp, IndianRupee, Clock, CheckCircle2,
  AlertTriangle, Calendar, Plus, ArrowUpRight, Building2, Phone, MessageCircle,
  FileSpreadsheet, Sparkles, Zap
} from 'lucide-react';
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
  onSelectLead,
  onNavigateTab,
}: CrmOverviewTabProps) {
  const todayFollowups = followups.filter(f => {
    if (f.status !== 'PENDING') return false;
    const d = new Date(f.due_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const overdueFollowups = followups.filter(f => {
    if (f.status !== 'PENDING') return false;
    return new Date(f.due_at).getTime() < new Date().setHours(0, 0, 0, 0);
  });

  const recentLeads = leads.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Premium CRM Quick Launch Card */}
      <div className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 border border-slate-200/80 shadow-md shadow-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2648E7]/10 text-[#2648E7] flex items-center justify-center shrink-0 shadow-inner">
              <Zap size={20} className="fill-[#2648E7]/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                  CRM Quick Launch
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#2648E7]/10 text-[#2648E7] tracking-wider">
                  Fast Actions
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Instant triggers to create leads, catalog properties, and record deals
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

            {onOpenAddProperty && (
              <button
                onClick={onOpenAddProperty}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <Building2 size={14} className="text-[#2648E7]" />
                <span>+ Property</span>
              </button>
            )}

            {onOpenImportCsv && (
              <button
                onClick={onOpenImportCsv}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <FileSpreadsheet size={14} className="text-emerald-600" />
                <span>Import CSV</span>
              </button>
            )}

            <button
              onClick={onOpenAddFollowup}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Clock size={14} className="text-indigo-600" />
              <span>Schedule Follow-up</span>
            </button>

            <button
              onClick={onOpenAddDeal}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200/80 hover:bg-amber-100 shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <IndianRupee size={14} className="text-amber-700" />
              <span>Record Deal</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Leads */}
        <div
          onClick={() => onNavigateTab('leads')}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-[#2648E7] cursor-pointer transition-all hover:shadow-md group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Leads</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <Users size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-slate-900">
              {analytics?.activeLeads ?? leads.length}
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {analytics?.totalLeads ?? leads.length} Total
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Inquiries in sales funnel</p>
        </div>

        {/* Won Deals Revenue */}
        <div
          onClick={() => onNavigateTab('customers')}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-amber-500 cursor-pointer transition-all hover:shadow-md group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Won Deals Value</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-slate-900">
              ₹{((analytics?.totalRevenue || 0) / 100000).toFixed(1)}L
            </span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              {analytics?.totalDeals || 0} Closed
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Commission: ₹{(analytics?.totalCommission || 0).toLocaleString('en-IN')}</p>
        </div>

        {/* Today's Follow-ups */}
        <div
          onClick={() => onNavigateTab('followups')}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-emerald-500 cursor-pointer transition-all hover:shadow-md group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Follow-ups</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <Clock size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-slate-900">
              {todayFollowups.length}
            </span>
            {overdueFollowups.length > 0 && (
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                {overdueFollowups.length} Overdue
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Client calls & visits scheduled</p>
        </div>

        {/* Conversion Rate */}
        <div
          onClick={() => onNavigateTab('pipeline')}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-purple-500 cursor-pointer transition-all hover:shadow-md group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conversion Rate</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-slate-900">
              {analytics?.conversionRate || 0}%
            </span>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              Booked / Total
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Lead to customer conversion</p>
        </div>
      </div>

      {/* Main Grid: Pipeline Summary + Today's Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Stage Funnel */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sales Pipeline Funnel</h3>
              <p className="text-xs text-slate-500">Live distribution of leads across sales stages</p>
            </div>
            <button
              onClick={() => onNavigateTab('pipeline')}
              className="text-xs font-bold text-[#2648E7] hover:underline flex items-center gap-1"
            >
              Open Kanban Board <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="space-y-2.5 pt-2">
            {[
              { key: 'NEW', label: 'New Inquiries', color: '#2648E7' },
              { key: 'CONTACTED', label: 'Contacted', color: '#8B5CF6' },
              { key: 'QUALIFIED', label: 'Qualified', color: '#3B82F6' },
              { key: 'SITE_VISIT', label: 'Site Visit Scheduled', color: '#F59E0B' },
              { key: 'NEGOTIATION', label: 'In Negotiation', color: '#EC4899' },
              { key: 'BOOKED', label: 'Booked / Won Deals', color: '#10B981' },
            ].map(stage => {
              const count = leads.filter(l => l.status === stage.key).length;
              const percent = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
              return (
                <div key={stage.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">{stage.label}</span>
                    <span className="text-slate-500 font-semibold">{count} leads ({percent}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percent, count > 0 ? 5 : 0)}%`, backgroundColor: stage.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Agenda & Urgent Followups */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Today's Agenda</h3>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {todayFollowups.length} Tasks
            </span>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-72 custom-scrollbar">
            {todayFollowups.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center h-48 text-slate-400">
                <CheckCircle2 size={32} className="text-emerald-500 opacity-60 mb-2" />
                <p className="text-xs font-bold text-slate-700">All caught up for today!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No pending follow-ups due today.</p>
              </div>
            ) : (
              todayFollowups.map(f => (
                <div
                  key={f.id}
                  onClick={() => onSelectLead(f.lead_id)}
                  className="p-3 rounded-xl border border-slate-200/80 hover:border-[#2648E7] hover:bg-slate-50/70 cursor-pointer transition-all space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{f.lead?.name || 'Lead'}</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {new Date(f.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 truncate">{f.note || 'Scheduled call'}</p>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => onNavigateTab('followups')}
            className="w-full py-2 text-xs font-bold text-center text-[#2648E7] bg-[#2648E7]/10 hover:bg-[#2648E7]/20 rounded-xl transition-colors"
          >
            View All Follow-ups
          </button>
        </div>
      </div>

      {/* Recent Leads Activity List */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Leads</h3>
            <p className="text-xs text-slate-500">Newly captured prospects</p>
          </div>
          <button
            onClick={() => onNavigateTab('leads')}
            className="text-xs font-bold text-[#2648E7] hover:underline"
          >
            View All Leads ({leads.length})
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentLeads.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-6">No leads recorded yet. Click "Add Lead" to get started.</p>
          ) : (
            recentLeads.map(l => (
              <div
                key={l.id}
                onClick={() => onSelectLead(l.id)}
                className="py-3 flex items-center justify-between hover:bg-slate-50/70 px-2 rounded-xl cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0"
                    style={{ backgroundColor: l.avatar_color || '#2648E7' }}
                  >
                    {l.initials || l.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{l.name}</p>
                    <p className="text-xs text-slate-500 truncate">{l.phone || l.email || l.city || 'No contact specified'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {l.budget && (
                    <span className="hidden sm:inline-block text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {l.budget}
                    </span>
                  )}
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    l.status === 'BOOKED' ? 'bg-emerald-100 text-emerald-800' :
                    l.status === 'SITE_VISIT' ? 'bg-amber-100 text-amber-800' :
                    l.status === 'CONTACTED' ? 'bg-purple-100 text-purple-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {l.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
