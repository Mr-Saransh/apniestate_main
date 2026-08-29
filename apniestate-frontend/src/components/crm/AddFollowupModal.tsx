import React, { useState } from 'react';
import { X, Calendar, Clock, MessageSquare } from 'lucide-react';
import { crmApi, type CrmLead } from '@/api/crm';

interface AddFollowupModalProps {
  leadId: string | null;
  leads?: CrmLead[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddFollowupModal({
  leadId,
  leads = [],
  isOpen,
  onClose,
  onSuccess,
}: AddFollowupModalProps) {
  const [selectedLeadId, setSelectedLeadId] = useState(leadId || '');
  const [date, setDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('11:00');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (leadId) setSelectedLeadId(leadId);
    else if (leads.length > 0 && !selectedLeadId) setSelectedLeadId(leads[0].id);
  }, [leadId, leads]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId) {
      setError('Please select a lead');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const due_at = new Date(`${date}T${time}:00`).toISOString();
      const res = await crmApi.createFollowup({
        lead_id: selectedLeadId,
        due_at,
        note: note.trim() || 'Scheduled Follow-up',
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Failed to schedule follow-up');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to schedule follow-up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-[#2648E7] to-[#1e3bbd] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Schedule Follow-up</h2>
              <p className="text-xs text-white/80">Set reminder date and note</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          {!leadId && leads.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Lead</label>
              <select
                value={selectedLeadId}
                onChange={e => setSelectedLeadId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
              >
                {leads.map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.phone || 'No phone'})</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Time</label>
              <input
                type="time"
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Follow-up Note / Goal</label>
            <textarea
              rows={3}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Call back regarding revised pricing for 3BHK unit..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7] resize-none"
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
                <Clock size={16} />
              )}
              Schedule Follow-up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
