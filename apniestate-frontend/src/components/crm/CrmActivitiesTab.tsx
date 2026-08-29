import React, { useState, useEffect } from 'react';
import {
  Calendar, CheckSquare, Plus, CheckCircle2, Clock, MapPin,
  Users, Phone, FileText, Trash2
} from 'lucide-react';
import { crmApi, type CrmActivity, type CrmLead } from '@/api/crm';

interface CrmActivitiesTabProps {
  leads: CrmLead[];
  onOpenAddActivity: () => void;
  onSelectLead: (leadId: string) => void;
}

export default function CrmActivitiesTab({
  leads,
  onOpenAddActivity,
  onSelectLead,
}: CrmActivitiesTabProps) {
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await crmApi.getActivities();
      if (res.success && res.data) {
        setActivities(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleToggleCompleted = async (act: CrmActivity) => {
    try {
      const nextCompleted = !act.completed;
      await crmApi.updateActivity(act.id, { completed: nextCompleted });
      await fetchActivities();
    } catch (err) {
      console.error('Failed to toggle activity:', err);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    try {
      await crmApi.deleteActivity(id);
      await fetchActivities();
    } catch (err) {
      console.error('Failed to delete activity:', err);
    }
  };

  const filtered = activities.filter(a => {
    if (typeFilter !== 'ALL' && a.type !== typeFilter) return false;
    return true;
  });

  const TYPE_ICONS: Record<string, any> = {
    TASK: CheckSquare,
    SITE_VISIT: MapPin,
    MEETING: Users,
    CALL: Phone,
    NOTE: FileText,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900">Activities & Tasks</h2>
          <p className="text-xs text-slate-500">Site visits, client calls, meetings, and follow-up checklists</p>
        </div>
        <button
          onClick={onOpenAddActivity}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2648E7] hover:bg-[#1e3bbd] shadow-sm transition-all active:scale-95"
        >
          <Plus size={14} /> New Activity
        </button>
      </div>

      {/* Type Filter Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {[
          { id: 'ALL', label: 'All Activities' },
          { id: 'SITE_VISIT', label: 'Site Visits' },
          { id: 'TASK', label: 'Tasks' },
          { id: 'MEETING', label: 'Meetings' },
          { id: 'CALL', label: 'Calls' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTypeFilter(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              typeFilter === t.id
                ? 'bg-[#2648E7] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 flex justify-center bg-white rounded-2xl border border-slate-200">
            <div className="w-8 h-8 rounded-full border-4 border-[#2648E7] border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
            <Calendar size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No activities scheduled</p>
            <p className="text-xs text-slate-400 mt-0.5">Click "New Activity" to add site visits or tasks.</p>
          </div>
        ) : (
          filtered.map(act => {
            const Icon = TYPE_ICONS[act.type] || CheckSquare;
            return (
              <div
                key={act.id}
                className={`p-4 bg-white rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  act.completed ? 'border-slate-200 opacity-60' : 'border-slate-200/80 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleCompleted(act)}
                    className={`mt-1 transition-colors ${
                      act.completed ? 'text-emerald-600' : 'text-slate-300 hover:text-emerald-600'
                    }`}
                  >
                    <CheckCircle2 size={20} />
                  </button>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                        act.type === 'SITE_VISIT' ? 'bg-amber-100 text-amber-800' :
                        act.type === 'MEETING' ? 'bg-purple-100 text-purple-800' :
                        act.type === 'CALL' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {act.type.replace(/_/g, ' ')}
                      </span>
                      <h4 className={`text-sm font-bold ${act.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {act.title}
                      </h4>
                    </div>

                    {act.description && (
                      <p className="text-xs text-slate-600">{act.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-semibold flex-wrap">
                      {act.due_at && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {new Date(act.due_at).toLocaleDateString()} at {new Date(act.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {act.lead && (
                        <span
                          onClick={() => onSelectLead(act.lead_id!)}
                          className="text-[#2648E7] hover:underline cursor-pointer font-bold"
                        >
                          Lead: {act.lead.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteActivity(act.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Activity"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
