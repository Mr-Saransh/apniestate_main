import React, { useState } from 'react';
import { X, Calendar, Clock, CheckSquare, Users, Phone, MapPin, FileText } from 'lucide-react';
import { crmApi, type CrmLead } from '@/api/crm';
import { useProject } from '@/context/ProjectContext';

interface AddActivityModalProps {
  leads?: CrmLead[];
  defaultLeadId?: string;
  defaultType?: 'TASK' | 'SITE_VISIT' | 'MEETING' | 'CALL' | 'NOTE';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddActivityModal({
  leads = [],
  defaultLeadId,
  defaultType = 'TASK',
  isOpen,
  onClose,
  onSuccess,
}: AddActivityModalProps) {
  const { projects, activeProjectId } = useProject();
  const [type, setType] = useState<'TASK' | 'SITE_VISIT' | 'MEETING' | 'CALL' | 'NOTE'>(defaultType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState(defaultLeadId || '');
  const [selectedProjectId, setSelectedProjectId] = useState(activeProjectId || '');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('15:00');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (defaultLeadId) setSelectedLeadId(defaultLeadId);
    if (defaultType) setType(defaultType);
  }, [defaultLeadId, defaultType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Activity title is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const due_at = dueDate ? new Date(`${dueDate}T${dueTime || '00:00'}:00`).toISOString() : undefined;

      const res = await crmApi.createActivity({
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        lead_id: selectedLeadId || undefined,
        project_id: selectedProjectId || undefined,
        due_at,
        priority,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Failed to create activity');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create activity');
    } finally {
      setLoading(false);
    }
  };

  const TYPE_OPTIONS = [
    { id: 'TASK', label: 'Task', icon: CheckSquare },
    { id: 'SITE_VISIT', label: 'Site Visit', icon: MapPin },
    { id: 'MEETING', label: 'Meeting', icon: Users },
    { id: 'CALL', label: 'Call', icon: Phone },
    { id: 'NOTE', label: 'Note', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-[#2648E7] to-[#1e3bbd] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">New Activity / Task</h2>
              <p className="text-xs text-white/80">Schedule site visits, calls, or follow-up tasks</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-3 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          {/* Activity Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Activity Type</label>
            <div className="grid grid-cols-5 gap-2">
              {TYPE_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const active = type === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setType(opt.id as any)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      active
                        ? 'bg-[#2648E7] text-white border-[#2648E7] shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={16} className="mb-1" />
                    <span className="text-[11px]">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={type === 'SITE_VISIT' ? 'e.g. Accompany Rahul to Sector 15 Site' : 'e.g. Send updated brochure'}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2648E7]"
            />
          </div>

          {/* Lead & Project Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Associated Lead</label>
              <select
                value={selectedLeadId}
                onChange={e => setSelectedLeadId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
              >
                <option value="">General (No Lead)</option>
                {leads.map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.phone || 'No phone'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Project</label>
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
              >
                <option value="">General (No Project)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date, Time, Priority */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Time</label>
              <input
                type="time"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
              >
                <option value="HIGH">🔥 High</option>
                <option value="MEDIUM">⚡ Medium</option>
                <option value="LOW">🌱 Low</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description / Location</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Additional details, meeting link, site location..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7] resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-bold text-white bg-[#2648E7] hover:bg-[#1e3bbd] rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckSquare size={16} />
              )}
              Save Activity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
