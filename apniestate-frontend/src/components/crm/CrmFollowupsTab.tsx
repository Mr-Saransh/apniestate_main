import React, { useState } from 'react';
import {
  Clock, Plus, CheckCircle2, AlertTriangle, Calendar, Phone,
  MessageCircle, UserCheck, Trash2
} from 'lucide-react';
import { type CrmFollowup, crmApi } from '@/api/crm';

interface CrmFollowupsTabProps {
  followups: CrmFollowup[];
  onOpenAddFollowup: () => void;
  onSelectLead: (leadId: string) => void;
  onFollowupUpdated: () => void;
}

export default function CrmFollowupsTab({
  followups,
  onOpenAddFollowup,
  onSelectLead,
  onFollowupUpdated,
}: CrmFollowupsTabProps) {
  const [filter, setFilter] = useState<'ALL' | 'TODAY' | 'OVERDUE' | 'UPCOMING' | 'COMPLETED'>('ALL');

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + 86400000;

  const filtered = followups.filter(f => {
    const dueTime = new Date(f.due_at).getTime();
    if (filter === 'COMPLETED') return f.status === 'COMPLETED';
    if (f.status !== 'PENDING') return false;
    if (filter === 'TODAY') return dueTime >= todayStart && dueTime < todayEnd;
    if (filter === 'OVERDUE') return dueTime < todayStart;
    if (filter === 'UPCOMING') return dueTime >= todayEnd;
    return true;
  });

  const handleComplete = async (fId: string) => {
    try {
      await crmApi.updateFollowup(fId, { status: 'COMPLETED', outcome: 'Followed up via Apni Estate' });
      onFollowupUpdated();
    } catch (err) {
      console.error('Failed to complete follow-up:', err);
    }
  };

  const handleDelete = async (fId: string) => {
    try {
      await crmApi.deleteFollowup(fId);
      onFollowupUpdated();
    } catch (err) {
      console.error('Failed to delete follow-up:', err);
    }
  };

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const message = encodeURIComponent(`Hello ${name}, following up from Apni Estate regarding your property requirement.`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900">Follow-up Manager</h2>
          <p className="text-xs text-slate-500">Ensure no client or prospect query goes unanswered</p>
        </div>
        <button
          onClick={onOpenAddFollowup}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2648E7] hover:bg-[#1e3bbd] shadow-sm transition-all active:scale-95"
        >
          <Plus size={14} /> Schedule Follow-up
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto hide-scrollbar">
        {[
          { id: 'ALL', label: 'All Pending' },
          { id: 'TODAY', label: "Today's Follow-ups" },
          { id: 'OVERDUE', label: 'Overdue' },
          { id: 'UPCOMING', label: 'Upcoming' },
          { id: 'COMPLETED', label: 'Completed History' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filter === tab.id
                ? 'bg-[#2648E7] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
            <Clock size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No follow-ups found in this section</p>
            <p className="text-xs text-slate-400 mt-0.5">Click "Schedule Follow-up" to create a new reminder.</p>
          </div>
        ) : (
          filtered.map(f => {
            const isOverdue = f.status === 'PENDING' && new Date(f.due_at).getTime() < todayStart;
            return (
              <div
                key={f.id}
                className={`p-4 bg-white rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  isOverdue ? 'border-red-200 bg-red-50/20' : 'border-slate-200/80 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <button
                    type="button"
                    disabled={f.status === 'COMPLETED'}
                    onClick={() => handleComplete(f.id)}
                    className={`mt-1 transition-colors ${
                      f.status === 'COMPLETED' ? 'text-emerald-600' : 'text-slate-300 hover:text-emerald-600'
                    }`}
                  >
                    <CheckCircle2 size={20} />
                  </button>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        onClick={() => onSelectLead(f.lead_id)}
                        className="text-sm font-extrabold text-slate-900 hover:text-[#2648E7] cursor-pointer hover:underline"
                      >
                        {f.lead?.name || 'Lead'}
                      </span>
                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 flex items-center gap-1">
                          <AlertTriangle size={11} /> Overdue
                        </span>
                      )}
                    </div>

                    <p className={`text-xs ${f.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {f.note || 'Scheduled call / check-in'}
                    </p>

                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-semibold">
                      <Calendar size={12} /> Due: {new Date(f.due_at).toLocaleDateString()} at {new Date(f.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {f.lead?.phone && f.status === 'PENDING' && (
                    <>
                      <a
                        href={`tel:${f.lead.phone}`}
                        className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        title="Call"
                      >
                        <Phone size={15} />
                      </a>
                      <button
                        onClick={() => openWhatsApp(f.lead!.phone!, f.lead!.name)}
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle size={15} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(f.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete Follow-up"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
