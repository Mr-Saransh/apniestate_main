import React from 'react';
import {
  Plus, Phone, MessageCircle, MoreVertical, IndianRupee,
  Building2, ArrowRight, UserCheck, CheckCircle2
} from 'lucide-react';
import { crmApi, type CrmLead } from '@/api/crm';

interface CrmPipelineTabProps {
  leads: CrmLead[];
  onSelectLead: (leadId: string) => void;
  onOpenAddLead: () => void;
  onLeadUpdated: () => void;
}

const PIPELINE_COLUMNS: { key: CrmLead['status']; label: string; headerColor: string; badgeColor: string }[] = [
  { key: 'NEW', label: 'New Inquiry', headerColor: 'border-blue-500', badgeColor: 'bg-blue-50 text-blue-700' },
  { key: 'CONTACTED', label: 'Contacted', headerColor: 'border-purple-500', badgeColor: 'bg-purple-50 text-purple-700' },
  { key: 'QUALIFIED', label: 'Qualified', headerColor: 'border-indigo-500', badgeColor: 'bg-indigo-50 text-indigo-700' },
  { key: 'SITE_VISIT', label: 'Site Visit', headerColor: 'border-amber-500', badgeColor: 'bg-amber-50 text-amber-700' },
  { key: 'NEGOTIATION', label: 'Negotiation', headerColor: 'border-orange-500', badgeColor: 'bg-orange-50 text-orange-700' },
  { key: 'BOOKED', label: 'Booked / Won', headerColor: 'border-emerald-500', badgeColor: 'bg-emerald-50 text-emerald-700' },
];

export default function CrmPipelineTab({
  leads,
  onSelectLead,
  onOpenAddLead,
  onLeadUpdated,
}: CrmPipelineTabProps) {
  const handleQuickMove = async (e: React.MouseEvent, leadId: string, nextStatus: CrmLead['status']) => {
    e.stopPropagation();
    try {
      await crmApi.updateLead(leadId, { status: nextStatus });
      onLeadUpdated();
    } catch (err) {
      console.error('Failed to move stage:', err);
    }
  };

  const openWhatsApp = (e: React.MouseEvent, phone: string, name: string) => {
    e.stopPropagation();
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const message = encodeURIComponent(`Hello ${name}, following up regarding your property requirement with Apni Estate.`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900">Sales Pipeline (Kanban)</h2>
          <p className="text-xs text-slate-500">Track and advance prospects through your deal stages</p>
        </div>
        <button
          onClick={onOpenAddLead}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2648E7] hover:bg-[#1e3bbd] shadow-sm transition-all active:scale-95"
        >
          <Plus size={14} /> Add Lead
        </button>
      </div>

      {/* Kanban Board Container */}
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar min-h-[70vh]">
        {PIPELINE_COLUMNS.map((col, colIdx) => {
          const colLeads = leads.filter(l => l.status === col.key);
          const nextCol = PIPELINE_COLUMNS[colIdx + 1];

          return (
            <div
              key={col.key}
              className="w-72 shrink-0 bg-slate-100/70 rounded-2xl p-3 border border-slate-200/70 flex flex-col"
            >
              {/* Column Header */}
              <div className={`flex items-center justify-between pb-3 mb-3 border-b-2 ${col.headerColor}`}>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-xs text-slate-800 tracking-tight">{col.label}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${col.badgeColor}`}>
                    {colLeads.length}
                  </span>
                </div>
              </div>

              {/* Cards List */}
              <div className="flex-1 space-y-2.5 overflow-y-auto custom-scrollbar pr-0.5">
                {colLeads.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs italic bg-white/40 rounded-xl border border-dashed border-slate-200">
                    No leads in this stage
                  </div>
                ) : (
                  colLeads.map(lead => (
                    <div
                      key={lead.id}
                      onClick={() => onSelectLead(lead.id)}
                      className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#2648E7] transition-all cursor-pointer space-y-2.5 group"
                    >
                      {/* Top Lead Info */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-extrabold text-xs shrink-0"
                            style={{ backgroundColor: lead.avatar_color || '#2648E7' }}
                          >
                            {lead.initials || lead.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-[#2648E7] transition-colors">
                              {lead.name}
                            </h4>
                            <p className="text-[10px] text-slate-400 truncate">{lead.city || lead.type}</p>
                          </div>
                        </div>

                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                          lead.priority === 'HIGH' ? 'bg-red-50 text-red-600' :
                          lead.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600' :
                          'bg-emerald-50 text-emerald-600'
                        }`}>
                          {lead.priority}
                        </span>
                      </div>

                      {/* Budget & Project info */}
                      {(lead.budget || lead.project) && (
                        <div className="text-[11px] text-slate-600 font-semibold space-y-0.5">
                          {lead.budget && <p className="font-bold text-slate-800">💰 {lead.budget}</p>}
                          {lead.project && (
                            <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                              <Building2 size={11} /> {lead.project.name}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Quick Contact & Next Stage Trigger */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {lead.phone && (
                            <>
                              <a
                                href={`tel:${lead.phone}`}
                                onClick={e => e.stopPropagation()}
                                className="p-1 rounded-md text-blue-600 hover:bg-blue-50"
                                title="Call"
                              >
                                <Phone size={13} />
                              </a>
                              <button
                                onClick={e => openWhatsApp(e, lead.phone!, lead.name)}
                                className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50"
                                title="WhatsApp"
                              >
                                <MessageCircle size={13} />
                              </button>
                            </>
                          )}
                        </div>

                        {nextCol && (
                          <button
                            type="button"
                            onClick={e => handleQuickMove(e, lead.id, nextCol.key)}
                            className="text-[10px] font-bold text-slate-600 hover:text-[#2648E7] hover:bg-slate-100 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                            title={`Advance to ${nextCol.label}`}
                          >
                            <span>Advance</span>
                            <ArrowRight size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
