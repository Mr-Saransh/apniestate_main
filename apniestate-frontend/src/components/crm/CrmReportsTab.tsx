import React from 'react';
import {
  FileBarChart, TrendingUp, Users, IndianRupee, PieChart,
  Calendar, ArrowUpRight, Award, CheckCircle2, Download, Filter
} from 'lucide-react';
import { type CrmAnalytics, type CrmLead } from '@/api/crm';

interface CrmReportsTabProps {
  analytics: CrmAnalytics | null;
  leads: CrmLead[];
}

export default function CrmReportsTab({ analytics, leads }: CrmReportsTabProps) {
  const teamPerformance = analytics?.teamPerformance || [];
  const sources = analytics?.sources || [];
  const pipeline = analytics?.pipeline || [];
  const totalLeads = analytics?.totalLeads || leads.length;
  const totalDeals = analytics?.totalDeals || leads.filter((l) => l.status === 'BOOKED').length;
  const totalRevenue = analytics?.totalRevenue || 0;
  const totalCommission = analytics?.totalCommission || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-indigo-50/20 to-blue-50/20 border border-slate-200/80 shadow-md shadow-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#2648E7] text-white flex items-center justify-center shadow-md shadow-[#2648E7]/30 shrink-0">
            <FileBarChart size={22} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              CRM Sales & Performance Reports
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Analytics on lead conversion, team efficiency, and transaction volume
            </p>
          </div>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500">Total Pipeline Leads</span>
          <p className="text-2xl font-black text-slate-900">{totalLeads}</p>
          <p className="text-[11px] text-slate-400">Captured in CRM</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500">Overall Conversion Rate</span>
          <p className="text-2xl font-black text-emerald-600">{analytics?.conversionRate || 0}%</p>
          <p className="text-[11px] text-emerald-600 font-semibold">Inquiry to Booking</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500">Total Bookings Recorded</span>
          <p className="text-2xl font-black text-[#2648E7]">{totalDeals}</p>
          <p className="text-[11px] text-slate-400">Closed deals</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500">Gross Transaction Value</span>
          <p className="text-2xl font-black text-slate-900">
            ₹{totalRevenue >= 10000000 ? `${(totalRevenue / 10000000).toFixed(2)} Cr` : totalRevenue >= 100000 ? `${(totalRevenue / 100000).toFixed(2)} L` : totalRevenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400">Total property value</p>
        </div>
      </div>

      {/* Charts & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Sources Distribution */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PieChart size={16} className="text-[#2648E7]" />
            <span>Lead Acquisition Sources</span>
          </h3>

          {sources.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No source data recorded yet</p>
          ) : (
            <div className="space-y-3">
              {sources.map((src) => {
                const pct = totalLeads > 0 ? Math.round((src.value / totalLeads) * 100) : 0;
                return (
                  <div key={src.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700">{src.name}</span>
                      <span className="text-slate-500">{src.value} leads ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: src.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pipeline Stage Distribution */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp size={16} className="text-[#2648E7]" />
            <span>Pipeline Stage Funnel</span>
          </h3>

          <div className="space-y-2.5">
            {pipeline.map((item) => {
              const pct = totalLeads > 0 ? Math.round((item.count / totalLeads) * 100) : 0;
              return (
                <div key={item.stage} className="p-3 rounded-2xl bg-slate-50 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800 capitalize">
                      {item.stage.replace('_', ' ').toLowerCase()}
                    </p>
                    <p className="text-[11px] text-slate-400">{pct}% of pipeline</p>
                  </div>
                  <span className="px-3 py-1 rounded-xl text-xs font-black bg-white border border-slate-200 text-[#2648E7]">
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team Performance Breakdown */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Award size={16} className="text-[#FCC300]" />
          <span>Team Sales Performance Matrix</span>
        </h3>

        {teamPerformance.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Users size={32} className="text-slate-400 mx-auto mb-2 opacity-60" />
            <p className="text-xs font-bold text-slate-700">No telecaller activity logged yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 px-3">Sales Agent</th>
                  <th className="pb-3 px-3">Role</th>
                  <th className="pb-3 px-3 text-center">Assigned Leads</th>
                  <th className="pb-3 px-3 text-center">Bookings Closed</th>
                  <th className="pb-3 px-3 text-right">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamPerformance.map((m) => (
                  <tr key={m.userId} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 font-bold text-slate-900">{m.name}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#2648E7]">
                        {m.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">{m.assignedLeads}</td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-600">{m.bookedLeads}</td>
                    <td className="py-3 px-3 text-right font-black text-slate-900">{m.conversionRate}%</td>
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
