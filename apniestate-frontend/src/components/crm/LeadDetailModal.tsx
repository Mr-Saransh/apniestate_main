import React, { useState, useEffect } from 'react';
import {
  X, Phone, MessageCircle, Mail, MapPin, IndianRupee, Tag,
  Building2, Calendar, Clock, Plus, CheckCircle2, AlertCircle,
  FileText, ArrowRight, UserCheck, Trash2, Edit3, Share2,
  Flame, Zap, Sprout, AlertTriangle, Ban, User, Sparkles, Check, ChevronDown
} from 'lucide-react';
import { crmApi, type CrmLead, type CrmFollowup, type CrmActivity, type CrmDeal, type CrmTeamMember } from '@/api/crm';
import { useAuth } from '@/context/AuthContext';
import { getUserCrmRole } from '@/config/crm-permissions';

interface LeadDetailModalProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: () => void;
  onOpenEdit: (lead: CrmLead) => void;
  onOpenAddFollowup: (leadId: string) => void;
  onOpenAddDeal: (lead: CrmLead) => void;
}

export default function LeadDetailModal({
  leadId,
  isOpen,
  onClose,
  onLeadUpdated,
  onOpenEdit,
  onOpenAddFollowup,
  onOpenAddDeal,
}: LeadDetailModalProps) {
  const { user } = useAuth();
  const crmRole = getUserCrmRole(user);
  const isManagerOrBuilder = crmRole === 'BUILDER' || crmRole === 'CRM_MANAGER' || user?.role === 'BUILDER' || user?.role === 'ADMIN';

  const [lead, setLead] = useState<CrmLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'quick_actions' | 'timeline' | 'followups' | 'deals' | 'notes'>('quick_actions');
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [updatingFlag, setUpdatingFlag] = useState(false);
  const [teamMembers, setTeamMembers] = useState<CrmTeamMember[]>([]);

  const fetchLeadDetails = async () => {
    if (!leadId) return;
    try {
      setLoading(true);
      const res = await crmApi.getLead(leadId);
      if (res.success && res.data) {
        setLead(res.data);
        setNoteText(res.data.notes || '');
      }
    } catch (err) {
      console.error('Failed to fetch lead details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && leadId) {
      fetchLeadDetails();
      if (isManagerOrBuilder) {
        crmApi.getTeam().then((res) => {
          if (res.success && res.data) {
            setTeamMembers(res.data.members.filter((m) => m.status === 'ACTIVE' && m.crm_role !== 'BUILDER'));
          }
        }).catch(() => {});
      }
    }
  }, [isOpen, leadId, isManagerOrBuilder]);

  if (!isOpen || !leadId) return null;

  // 1-Tap Priority & Flag Changing
  const handlePriorityFlagChange = async (priority: 'LOW' | 'MEDIUM' | 'HIGH') => {
    if (!lead) return;
    try {
      setUpdatingFlag(true);
      await crmApi.updateLead(lead.id, { priority });
      await fetchLeadDetails();
      onLeadUpdated();
    } catch (err) {
      console.error('Failed to change priority:', err);
    } finally {
      setUpdatingFlag(false);
    }
  };

  // 1-Tap Quick Tag Toggle
  const handleToggleTag = async (tag: string) => {
    if (!lead) return;
    try {
      setUpdatingFlag(true);
      const currentTags = lead.tags || [];
      const updatedTags = currentTags.includes(tag)
        ? currentTags.filter((t) => t !== tag)
        : [...currentTags, tag];
      await crmApi.updateLead(lead.id, { tags: updatedTags });
      await fetchLeadDetails();
      onLeadUpdated();
    } catch (err) {
      console.error('Failed to toggle tag:', err);
    } finally {
      setUpdatingFlag(false);
    }
  };

  // 1-Tap Status / Stage Progression
  const handleStatusChange = async (newStatus: string) => {
    if (!lead) return;
    try {
      await crmApi.updateLead(lead.id, { status: newStatus as any });
      await fetchLeadDetails();
      onLeadUpdated();
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  // Quick Reassign from Sidebar
  const handleReassign = async (targetUserId: string | null) => {
    if (!lead) return;
    try {
      if (targetUserId) {
        await crmApi.bulkUpdateLeads({
          lead_ids: [lead.id],
          action: 'ASSIGN',
          assigned_to: targetUserId,
        });
      } else {
        await crmApi.bulkUpdateLeads({
          lead_ids: [lead.id],
          action: 'UNASSIGN',
        });
      }
      await fetchLeadDetails();
      onLeadUpdated();
    } catch (err) {
      console.error('Failed to reassign lead:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!lead) return;
    try {
      setSavingNote(true);
      await crmApi.updateLead(lead.id, { notes: noteText });
      await fetchLeadDetails();
      onLeadUpdated();
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleAppendPresetNote = (preset: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formatted = `[${timestamp}] ${preset}`;
    const newNote = noteText ? `${noteText}\n${formatted}` : formatted;
    setNoteText(newNote);
  };

  const handleCompleteFollowup = async (fId: string) => {
    try {
      await crmApi.updateFollowup(fId, { status: 'COMPLETED', outcome: 'Followed up successfully' });
      await fetchLeadDetails();
      onLeadUpdated();
    } catch (err) {
      console.error('Failed to complete followup:', err);
    }
  };

  const openWhatsAppTemplate = (phone: string, name: string, templateType: 'GREETING' | 'VISIT' | 'BROCHURE') => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    let msg = `Hello ${name}, thank you for connecting with Apni Estate. How can we assist you with your property inquiry?`;
    if (templateType === 'VISIT') {
      msg = `Hi ${name}, would you like to schedule a site visit for our property this week? Let us know what time works best for you!`;
    } else if (templateType === 'BROCHURE') {
      msg = `Hello ${name}, here are the project brochure details and pricing breakdown for your review. Please let us know if you have any questions!`;
    }
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const STAGE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
    NEW: { label: 'New', bg: 'bg-blue-50', text: 'text-blue-700' },
    CONTACTED: { label: 'Contacted', bg: 'bg-purple-50', text: 'text-purple-700' },
    QUALIFIED: { label: 'Qualified', bg: 'bg-indigo-50', text: 'text-indigo-700' },
    SITE_VISIT: { label: 'Site Visit', bg: 'bg-amber-50', text: 'text-amber-700' },
    NEGOTIATION: { label: 'Negotiation', bg: 'bg-orange-50', text: 'text-orange-700' },
    BOOKED: { label: 'Booked (Won)', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    LOST: { label: 'Lost', bg: 'bg-red-50', text: 'text-red-700' },
  };

  const QUICK_FLAGS = [
    { label: 'Followup Needed', tag: 'Followup_Needed', icon: Clock, color: 'bg-blue-50 text-[#2648E7] border-blue-200' },
    { label: 'Site Visit Requested', tag: 'Site_Visit_Req', icon: MapPin, color: 'bg-amber-50 text-amber-800 border-amber-200' },
    { label: 'High Budget', tag: 'High_Budget', icon: IndianRupee, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    { label: 'Urgent Decision', tag: 'Urgent', icon: AlertTriangle, color: 'bg-red-50 text-red-800 border-red-200' },
    { label: 'Do Not Call', tag: 'DNC', icon: Ban, color: 'bg-slate-100 text-slate-700 border-slate-300' },
  ];

  const PRESET_CALL_NOTES = [
    'Callback requested tomorrow',
    'Interested in 3BHK unit',
    'Price quotation sent on WhatsApp',
    'Site visit completed - very interested',
    'Budget is lower than expected',
    'No answer / Busy - will retry later',
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg md:max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200 overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-blue-50/40 via-indigo-50/20 to-white">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="size-11 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-md shrink-0"
              style={{ backgroundColor: lead?.avatar_color || '#2648E7' }}
            >
              {lead?.initials || lead?.name?.slice(0, 2)?.toUpperCase() || 'LD'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 leading-tight truncate">
                  {lead?.name || 'Loading Lead...'}
                </h2>
                <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                  {lead?.type || 'BUYER'}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                {lead?.city && <span>{lead.city} •</span>}
                <span>Added {lead ? new Date(lead.created_at).toLocaleDateString() : ''}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {lead && (
              <button
                onClick={() => onOpenEdit(lead)}
                className="p-2 rounded-xl text-slate-500 hover:text-[#2648E7] hover:bg-slate-100 transition-colors"
                title="Full Edit Form"
              >
                <Edit3 size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-[#2648E7] border-t-transparent animate-spin" />
          </div>
        ) : lead ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
            {/* Quick Action Shortcuts Bar */}
            <div className="grid grid-cols-4 gap-2">
              {lead.phone ? (
                <a
                  href={`tel:${lead.phone}`}
                  className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-blue-50 text-[#2648E7] hover:bg-blue-100 transition-all font-bold text-xs gap-1 border border-blue-200/60 shadow-sm active:scale-95"
                >
                  <Phone size={16} />
                  <span>Call</span>
                </a>
              ) : (
                <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50 text-slate-400 opacity-60 text-xs gap-1">
                  <Phone size={16} />
                  <span>No Phone</span>
                </div>
              )}

              {lead.phone ? (
                <button
                  type="button"
                  onClick={() => openWhatsAppTemplate(lead.phone!, lead.name, 'GREETING')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all font-bold text-xs gap-1 border border-emerald-200/60 shadow-sm active:scale-95"
                >
                  <MessageCircle size={16} />
                  <span>WhatsApp</span>
                </button>
              ) : (
                <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50 text-slate-400 opacity-60 text-xs gap-1">
                  <MessageCircle size={16} />
                  <span>No WA</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => onOpenAddFollowup(lead.id)}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all font-bold text-xs gap-1 border border-indigo-200/60 shadow-sm active:scale-95"
              >
                <Calendar size={16} />
                <span>Follow-up</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenAddDeal(lead)}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-amber-50 text-amber-800 hover:bg-amber-100 transition-all font-bold text-xs gap-1 border border-amber-200/60 shadow-sm active:scale-95"
              >
                <IndianRupee size={16} />
                <span>Won Deal</span>
              </button>
            </div>

            {/* ─── 1-TAP LEAD PRIORITY & FLAG MATRIX ───────────────────── */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Flame size={14} className="text-red-500" />
                  <span>1-Tap Lead Priority Flag</span>
                </label>
                <span className="text-[10px] text-slate-400 font-bold">Auto-saves immediately</span>
              </div>

              {/* Priority Selectors */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={updatingFlag}
                  onClick={() => handlePriorityFlagChange('HIGH')}
                  className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    lead.priority === 'HIGH'
                      ? 'bg-red-500 text-white border-red-600 shadow-md shadow-red-500/20 scale-[1.02]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-red-300 hover:bg-red-50/30'
                  }`}
                >
                  <Flame size={14} />
                  <span>🔥 Hot Lead</span>
                </button>

                <button
                  type="button"
                  disabled={updatingFlag}
                  onClick={() => handlePriorityFlagChange('MEDIUM')}
                  className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    lead.priority === 'MEDIUM'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20 scale-[1.02]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/30'
                  }`}
                >
                  <Zap size={14} />
                  <span>⚡ Warm</span>
                </button>

                <button
                  type="button"
                  disabled={updatingFlag}
                  onClick={() => handlePriorityFlagChange('LOW')}
                  className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    lead.priority === 'LOW'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-600/20 scale-[1.02]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                  }`}
                >
                  <Sprout size={14} />
                  <span>🌱 Cold</span>
                </button>
              </div>

              {/* Quick Tags / Flags */}
              <div className="pt-2 border-t border-slate-200/60">
                <p className="text-[11px] font-bold text-slate-500 mb-1.5">Quick Tags & Flags (Tap to toggle):</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_FLAGS.map((qf) => {
                    const isTagged = lead.tags?.includes(qf.tag);
                    const Icon = qf.icon;
                    return (
                      <button
                        key={qf.tag}
                        type="button"
                        onClick={() => handleToggleTag(qf.tag)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                          isTagged
                            ? `${qf.color} ring-2 ring-blue-500/20 font-black`
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 opacity-75'
                        }`}
                      >
                        <Icon size={12} />
                        <span>{qf.label}</span>
                        {isTagged && <Check size={11} strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pipeline Stage Selector */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                Pipeline Stage Progression
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(['NEW', 'CONTACTED', 'QUALIFIED', 'SITE_VISIT', 'NEGOTIATION', 'BOOKED', 'LOST'] as const).map(
                  (stageKey) => {
                    const cfg = STAGE_CONFIG[stageKey];
                    const isCurrent = lead.status === stageKey;
                    return (
                      <button
                        key={stageKey}
                        type="button"
                        onClick={() => handleStatusChange(stageKey)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isCurrent
                            ? 'bg-[#2648E7] text-white shadow-md shadow-[#2648E7]/25 ring-2 ring-[#2648E7]/30 scale-105'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Telecaller Assignment (Manager / Builder) */}
            {isManagerOrBuilder && (
              <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-xl bg-[#2648E7] text-white flex items-center justify-center shrink-0">
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Lead Assignee</p>
                    <p className="text-[10px] text-slate-500">
                      {lead.assignee ? `Currently: ${lead.assignee.name}` : 'Currently Unassigned'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={lead.assigned_to || ''}
                    onChange={(e) => handleReassign(e.target.value || null)}
                    className="px-3 py-1.5 text-xs font-bold bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#2648E7]"
                  >
                    <option value="">⚠️ Move to Unassigned</option>
                    {user && (
                      <option value={user.id}>⭐ Assign to Myself ({user.name})</option>
                    )}
                    {teamMembers
                      .filter((m) => m.id !== user?.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.crm_role === 'CRM_MANAGER' ? 'Manager' : 'Executive'})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            {/* Tabs for Timeline, Follow-ups, Deals, Quick Call Notes */}
            <div>
              <div className="flex border-b border-slate-200 mb-4 overflow-x-auto hide-scrollbar">
                {[
                  { id: 'quick_actions', label: 'Call Log & Notes' },
                  { id: 'timeline', label: 'Activity Log' },
                  { id: 'followups', label: `Follow-ups (${lead.followups?.length || 0})` },
                  { id: 'deals', label: `Deals (${lead.deals?.length || 0})` },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-3.5 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                      activeTab === t.id
                        ? 'border-[#2648E7] text-[#2648E7]'
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: Call Log & Quick Notes */}
              {activeTab === 'quick_actions' && (
                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 mb-1.5 block">
                      Quick Preset Call Outcomes (Tap to append):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_CALL_NOTES.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handleAppendPresetNote(p)}
                          className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#2648E7] rounded-xl border border-slate-200 transition-colors"
                        >
                          + {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Log call outcome, buyer budget details, property requirements, next steps..."
                    className="w-full p-3.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7] resize-none"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Notes are visible to the assigned agent & managers</span>
                    <button
                      type="button"
                      disabled={savingNote}
                      onClick={handleSaveNotes}
                      className="px-4 py-2 text-xs font-bold text-white bg-[#2648E7] hover:bg-[#1e3bbd] rounded-xl shadow-sm transition-all"
                    >
                      {savingNote ? 'Saving...' : 'Save Note / Log'}
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Timeline */}
              {activeTab === 'timeline' && (
                <div className="space-y-2.5">
                  {!lead.activities || lead.activities.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">No recorded activity logs yet.</p>
                  ) : (
                    lead.activities.map((act) => (
                      <div key={act.id} className="flex gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
                        <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Clock size={15} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800">{act.title}</p>
                          {act.description && <p className="text-xs text-slate-500 mt-0.5">{act.description}</p>}
                          <p className="text-[10px] text-slate-400 mt-1">{new Date(act.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: Follow-ups */}
              {activeTab === 'followups' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Pending & Scheduled Follow-ups</span>
                    <button
                      type="button"
                      onClick={() => onOpenAddFollowup(lead.id)}
                      className="px-3 py-1 text-xs font-bold text-white bg-[#2648E7] rounded-xl hover:bg-[#1e3bbd] flex items-center gap-1"
                    >
                      <Plus size={13} /> Add Follow-up
                    </button>
                  </div>

                  {!lead.followups || lead.followups.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">
                      No follow-ups scheduled for this lead.
                    </p>
                  ) : (
                    lead.followups.map((f) => (
                      <div
                        key={f.id}
                        className={`flex items-start justify-between p-3.5 rounded-2xl border ${
                          f.status === 'COMPLETED'
                            ? 'bg-emerald-50/50 border-emerald-100 text-slate-500'
                            : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            disabled={f.status === 'COMPLETED'}
                            onClick={() => handleCompleteFollowup(f.id)}
                            className={`mt-0.5 transition-colors ${
                              f.status === 'COMPLETED' ? 'text-emerald-600' : 'text-slate-300 hover:text-emerald-600'
                            }`}
                          >
                            <CheckCircle2 size={18} />
                          </button>
                          <div>
                            <p
                              className={`text-xs font-bold ${
                                f.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-800'
                              }`}
                            >
                              {f.note || 'Scheduled Follow-up'}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <Calendar size={11} /> Due: {new Date(f.due_at).toLocaleDateString()}{' '}
                              {new Date(f.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        {f.status === 'COMPLETED' && (
                          <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 rounded-full">
                            Done
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 4: Deals */}
              {activeTab === 'deals' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Won Property Deals</span>
                    <button
                      type="button"
                      onClick={() => onOpenAddDeal(lead)}
                      className="px-3 py-1 text-xs font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 flex items-center gap-1"
                    >
                      <Plus size={13} /> Record Deal
                    </button>
                  </div>

                  {!lead.deals || lead.deals.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">
                      No closed deals registered for this lead yet.
                    </p>
                  ) : (
                    lead.deals.map((d) => (
                      <div
                        key={d.id}
                        className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/50 to-orange-50/30 border border-amber-200/60 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold text-slate-900">{d.property_name || 'Property Deal'}</h4>
                          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                            ₹{d.deal_value?.toLocaleString('en-IN') || 0}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                          <div>
                            <span className="text-slate-400">Commission:</span>{' '}
                            <span className="font-bold text-slate-800">
                              ₹{d.commission?.toLocaleString('en-IN') || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Received:</span>{' '}
                            <span className="font-bold text-emerald-600">
                              ₹{d.amount_received?.toLocaleString('en-IN') || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center text-slate-400">
            Lead not found
          </div>
        )}
      </div>
    </div>
  );
}
