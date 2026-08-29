import React, { useState, useEffect } from 'react';
import {
  X, Phone, MessageCircle, Mail, MapPin, IndianRupee, Tag,
  Building2, Calendar, Clock, Plus, CheckCircle2, AlertCircle,
  FileText, ArrowRight, UserCheck, Trash2, Edit3, Share2
} from 'lucide-react';
import { crmApi, type CrmLead, type CrmFollowup, type CrmActivity, type CrmDeal } from '@/api/crm';

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
  const [lead, setLead] = useState<CrmLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'followups' | 'deals' | 'notes'>('timeline');
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

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
    }
  }, [isOpen, leadId]);

  if (!isOpen || !leadId) return null;

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

  const handleCompleteFollowup = async (fId: string) => {
    try {
      await crmApi.updateFollowup(fId, { status: 'COMPLETED', outcome: 'Followed up successfully' });
      await fetchLeadDetails();
      onLeadUpdated();
    } catch (err) {
      console.error('Failed to complete followup:', err);
    }
  };

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const message = encodeURIComponent(`Hello ${name}, thank you for your interest with Apni Estate. How can I assist you today?`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
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

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm"
              style={{ backgroundColor: lead?.avatar_color || '#2648E7' }}
            >
              {lead?.initials || lead?.name?.slice(0, 2)?.toUpperCase() || 'LD'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 leading-tight">{lead?.name || 'Loading Lead...'}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-200/80 text-slate-700">
                  {lead?.type || 'BUYER'}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                {lead?.city && <span>{lead.city} •</span>}
                <span>Added {lead ? new Date(lead.created_at).toLocaleDateString() : ''}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lead && (
              <button
                onClick={() => onOpenEdit(lead)}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-200/70 transition-colors"
                title="Edit Lead"
              >
                <Edit3 size={17} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-[#2648E7] border-t-transparent animate-spin" />
          </div>
        ) : lead ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            {/* Quick Action Shortcuts Bar */}
            <div className="grid grid-cols-4 gap-2.5">
              {lead.phone ? (
                <a
                  href={`tel:${lead.phone}`}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all font-semibold text-xs gap-1.5 shadow-sm active:scale-95"
                >
                  <Phone size={18} />
                  <span>Call</span>
                </a>
              ) : (
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 text-slate-400 opacity-60 text-xs gap-1.5">
                  <Phone size={18} />
                  <span>No Phone</span>
                </div>
              )}

              {lead.phone ? (
                <button
                  type="button"
                  onClick={() => openWhatsApp(lead.phone!, lead.name)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all font-semibold text-xs gap-1.5 shadow-sm active:scale-95"
                >
                  <MessageCircle size={18} />
                  <span>WhatsApp</span>
                </button>
              ) : (
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 text-slate-400 opacity-60 text-xs gap-1.5">
                  <MessageCircle size={18} />
                  <span>No WA</span>
                </div>
              )}

              {lead.email ? (
                <a
                  href={`mailto:${lead.email}`}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all font-semibold text-xs gap-1.5 shadow-sm active:scale-95"
                >
                  <Mail size={18} />
                  <span>Email</span>
                </a>
              ) : (
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 text-slate-400 opacity-60 text-xs gap-1.5">
                  <Mail size={18} />
                  <span>No Email</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => onOpenAddDeal(lead)}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all font-semibold text-xs gap-1.5 shadow-sm active:scale-95"
              >
                <IndianRupee size={18} />
                <span>Won Deal</span>
              </button>
            </div>

            {/* Pipeline Stage Selector */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Pipeline Stage
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(['NEW', 'CONTACTED', 'QUALIFIED', 'SITE_VISIT', 'NEGOTIATION', 'BOOKED', 'LOST'] as const).map(
                  stageKey => {
                    const cfg = STAGE_CONFIG[stageKey];
                    const isCurrent = lead.status === stageKey;
                    return (
                      <button
                        key={stageKey}
                        type="button"
                        onClick={() => handleStatusChange(stageKey)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isCurrent
                            ? 'bg-[#2648E7] text-white shadow-sm ring-2 ring-[#2648E7]/30 scale-105'
                            : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200/80'
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Key Information Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
                <span className="text-[11px] text-slate-400 font-bold uppercase">Budget</span>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5">{lead.budget || 'Not specified'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
                <span className="text-[11px] text-slate-400 font-bold uppercase">Priority</span>
                <p className={`text-sm font-extrabold mt-0.5 ${
                  lead.priority === 'HIGH' ? 'text-red-600' : lead.priority === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {lead.priority === 'HIGH' ? '🔥 High' : lead.priority === 'MEDIUM' ? '⚡ Medium' : '🌱 Low'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
                <span className="text-[11px] text-slate-400 font-bold uppercase">Source</span>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5">{lead.source || 'Direct'}</p>
              </div>

              {lead.project && (
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 col-span-2">
                  <span className="text-[11px] text-slate-400 font-bold uppercase">Target Project</span>
                  <p className="text-sm font-extrabold text-[#2648E7] mt-0.5 flex items-center gap-1">
                    <Building2 size={14} /> {lead.project.name}
                  </p>
                </div>
              )}

              {lead.phone && (
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
                  <span className="text-[11px] text-slate-400 font-bold uppercase">Phone</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">{lead.phone}</p>
                </div>
              )}
            </div>

            {/* Tags */}
            {lead.tags && lead.tags.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {lead.tags.map(t => (
                    <span key={t} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#2648E7]/10 text-[#2648E7]">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs for Timeline, Follow-ups, Deals, Notes */}
            <div>
              <div className="flex border-b border-slate-200 mb-4">
                {[
                  { id: 'timeline', label: 'Activity Log' },
                  { id: 'followups', label: `Follow-ups (${lead.followups?.length || 0})` },
                  { id: 'deals', label: `Deals (${lead.deals?.length || 0})` },
                  { id: 'notes', label: 'Notes' },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                      activeTab === t.id
                        ? 'border-[#2648E7] text-[#2648E7]'
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: Timeline */}
              {activeTab === 'timeline' && (
                <div className="space-y-3">
                  {(!lead.activities || lead.activities.length === 0) ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">No recorded activity logs yet.</p>
                  ) : (
                    lead.activities.map(act => (
                      <div key={act.id} className="flex gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Clock size={16} />
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

              {/* Tab 2: Follow-ups */}
              {activeTab === 'followups' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Pending & Scheduled Follow-ups</span>
                    <button
                      type="button"
                      onClick={() => onOpenAddFollowup(lead.id)}
                      className="px-3 py-1 text-xs font-bold text-white bg-[#2648E7] rounded-lg hover:bg-[#1e3bbd] flex items-center gap-1"
                    >
                      <Plus size={13} /> Add Follow-up
                    </button>
                  </div>

                  {(!lead.followups || lead.followups.length === 0) ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">No follow-ups scheduled for this lead.</p>
                  ) : (
                    lead.followups.map(f => (
                      <div
                        key={f.id}
                        className={`flex items-start justify-between p-3.5 rounded-xl border ${
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
                            <p className={`text-xs font-bold ${f.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              {f.note || 'Scheduled Follow-up'}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <Calendar size={11} /> Due: {new Date(f.due_at).toLocaleDateString()} {new Date(f.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

              {/* Tab 3: Deals */}
              {activeTab === 'deals' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Won Property Deals</span>
                    <button
                      type="button"
                      onClick={() => onOpenAddDeal(lead)}
                      className="px-3 py-1 text-xs font-bold text-white bg-amber-600 rounded-lg hover:bg-amber-700 flex items-center gap-1"
                    >
                      <Plus size={13} /> Record Deal
                    </button>
                  </div>

                  {(!lead.deals || lead.deals.length === 0) ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">No closed deals registered for this lead yet.</p>
                  ) : (
                    lead.deals.map(d => (
                      <div key={d.id} className="p-4 rounded-xl bg-gradient-to-br from-amber-50/50 to-orange-50/30 border border-amber-200/60 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold text-slate-900">{d.property_name || 'Property Deal'}</h4>
                          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                            ₹{d.deal_value?.toLocaleString('en-IN') || 0}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                          <div>
                            <span className="text-slate-400">Commission Earned:</span>{' '}
                            <span className="font-bold text-slate-800">₹{d.commission?.toLocaleString('en-IN') || 0}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Received:</span>{' '}
                            <span className="font-bold text-emerald-600">₹{d.amount_received?.toLocaleString('en-IN') || 0} ({d.payment_mode || 'UPI'})</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 4: Notes */}
              {activeTab === 'notes' && (
                <div className="space-y-3">
                  <textarea
                    rows={5}
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Write detailed notes about client preferences, site visit feedback, negotiations..."
                    className="w-full p-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2648E7] resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={savingNote}
                      onClick={handleSaveNotes}
                      className="px-4 py-2 text-xs font-bold text-white bg-[#2648E7] hover:bg-[#1e3bbd] rounded-xl shadow-sm transition-all"
                    >
                      {savingNote ? 'Saving...' : 'Save Notes'}
                    </button>
                  </div>
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
