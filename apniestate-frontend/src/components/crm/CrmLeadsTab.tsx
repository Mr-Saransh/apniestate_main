import React, { useState } from 'react';
import {
  Search, Filter, Plus, UploadCloud, Phone, MessageCircle, Mail,
  MapPin, IndianRupee, Tag, Building2, MoreHorizontal, Edit3, Trash2,
  CheckCircle2, LayoutGrid, List, UserCheck, Clock, ArrowUpDown
} from 'lucide-react';
import { type CrmLead } from '@/api/crm';
import { useProject } from '@/context/ProjectContext';

interface CrmLeadsTabProps {
  leads: CrmLead[];
  loading: boolean;
  onOpenAddLead: () => void;
  onOpenImportLeads: () => void;
  onSelectLead: (leadId: string) => void;
  onOpenEditLead: (lead: CrmLead) => void;
  onDeleteLead: (leadId: string) => void;
}

export default function CrmLeadsTab({
  leads,
  loading,
  onOpenAddLead,
  onOpenImportLeads,
  onSelectLead,
  onOpenEditLead,
  onDeleteLead,
}: CrmLeadsTabProps) {
  const { projects } = useProject();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const filteredLeads = leads.filter(lead => {
    if (statusFilter !== 'ALL' && lead.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && lead.priority !== priorityFilter) return false;
    if (projectFilter !== 'ALL' && lead.project_id !== projectFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = lead.name.toLowerCase().includes(q);
      const matchPhone = lead.phone?.toLowerCase().includes(q);
      const matchEmail = lead.email?.toLowerCase().includes(q);
      const matchCity = lead.city?.toLowerCase().includes(q);
      const matchTags = lead.tags?.some(t => t.toLowerCase().includes(q));
      if (!matchName && !matchPhone && !matchEmail && !matchCity && !matchTags) return false;
    }

    return true;
  });

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const message = encodeURIComponent(`Hello ${name}, thank you for your interest with Apni Estate. How can I assist you today?`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const STATUS_PILLS = [
    { id: 'ALL', label: 'All Leads' },
    { id: 'NEW', label: 'New' },
    { id: 'CONTACTED', label: 'Contacted' },
    { id: 'QUALIFIED', label: 'Qualified' },
    { id: 'SITE_VISIT', label: 'Site Visit' },
    { id: 'NEGOTIATION', label: 'Negotiation' },
    { id: 'BOOKED', label: 'Booked' },
    { id: 'LOST', label: 'Lost' },
  ];

  return (
    <div className="space-y-4">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900">Lead Directory</h2>
          <p className="text-xs text-slate-500">{filteredLeads.length} of {leads.length} total leads matching criteria</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenImportLeads}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <UploadCloud size={14} /> Import Leads
          </button>
          <button
            onClick={onOpenAddLead}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2648E7] hover:bg-[#1e3bbd] shadow-sm transition-all active:scale-95"
          >
            <Plus size={14} /> Add Lead
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, phone, email, city, tag..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2648E7] transition-all"
            />
          </div>

          {/* Secondary Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">🔥 High Priority</option>
              <option value="MEDIUM">⚡ Medium</option>
              <option value="LOW">🌱 Low</option>
            </select>

            <select
              value={projectFilter}
              onChange={e => setProjectFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
            >
              <option value="ALL">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Layout Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white text-[#2648E7] shadow-sm' : 'text-slate-500'}`}
                title="Table View"
              >
                <List size={15} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white text-[#2648E7] shadow-sm' : 'text-slate-500'}`}
                title="Grid Cards View"
              >
                <LayoutGrid size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
          {STATUS_PILLS.map(p => {
            const count = p.id === 'ALL' ? leads.length : leads.filter(l => l.status === p.id).length;
            const active = statusFilter === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setStatusFilter(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  active
                    ? 'bg-[#2648E7] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <span>{p.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Leads Content */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 rounded-full border-4 border-[#2648E7] border-t-transparent animate-spin" />
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 text-center">
          <UserCheck size={40} className="text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No leads found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">No leads match your current search or filter criteria. Try adjusting filters or create a new lead.</p>
          <button
            onClick={onOpenAddLead}
            className="mt-4 px-4 py-2 text-xs font-bold text-white bg-[#2648E7] rounded-xl hover:bg-[#1e3bbd] shadow-sm"
          >
            Add New Lead
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Table Layout */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80">
                <tr>
                  <th className="p-4">Lead Name</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Type / Budget</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Project</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map(lead => (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectLead(lead.id)}
                  >
                    {/* Name + Avatar */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0"
                          style={{ backgroundColor: lead.avatar_color || '#2648E7' }}
                        >
                          {lead.initials || lead.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 group-hover:text-[#2648E7] transition-colors">{lead.name}</p>
                          {lead.city && <p className="text-[11px] text-slate-400">{lead.city}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Quick Call & WA buttons */}
                    <td className="p-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        {lead.phone ? (
                          <>
                            <a
                              href={`tel:${lead.phone}`}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              title={`Call ${lead.phone}`}
                            >
                              <Phone size={14} />
                            </a>
                            <button
                              onClick={() => openWhatsApp(lead.phone!, lead.name)}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                              title={`WhatsApp ${lead.phone}`}
                            >
                              <MessageCircle size={14} />
                            </button>
                            <span className="text-slate-600 font-semibold">{lead.phone}</span>
                          </>
                        ) : (
                          <span className="text-slate-400 italic">No phone</span>
                        )}
                      </div>
                    </td>

                    {/* Type & Budget */}
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{lead.budget || '—'}</p>
                      <span className="text-[10px] text-slate-400 font-semibold">{lead.type}</span>
                    </td>

                    {/* Status Pill */}
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        lead.status === 'BOOKED' ? 'bg-emerald-100 text-emerald-800' :
                        lead.status === 'SITE_VISIT' ? 'bg-amber-100 text-amber-800' :
                        lead.status === 'CONTACTED' ? 'bg-purple-100 text-purple-800' :
                        lead.status === 'QUALIFIED' ? 'bg-indigo-100 text-indigo-800' :
                        lead.status === 'NEGOTIATION' ? 'bg-orange-100 text-orange-800' :
                        lead.status === 'LOST' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {lead.status}
                      </span>
                    </td>

                    {/* Project */}
                    <td className="p-4 text-slate-700">
                      {lead.project ? (
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <Building2 size={13} className="text-slate-400" /> {lead.project.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="p-4 font-bold">
                      <span className={lead.priority === 'HIGH' ? 'text-red-600' : lead.priority === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'}>
                        {lead.priority === 'HIGH' ? '🔥 High' : lead.priority === 'MEDIUM' ? '⚡ Medium' : '🌱 Low'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenEditLead(lead)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#2648E7] hover:bg-slate-100 transition-colors"
                          title="Edit Lead"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => onDeleteLead(lead.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Card Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map(lead => (
            <div
              key={lead.id}
              onClick={() => onSelectLead(lead.id)}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-[#2648E7] hover:shadow-md cursor-pointer transition-all space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-sm"
                      style={{ backgroundColor: lead.avatar_color || '#2648E7' }}
                    >
                      {lead.initials || lead.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 leading-tight">{lead.name}</h4>
                      <p className="text-xs text-slate-500">{lead.city || 'Location not specified'}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    lead.status === 'BOOKED' ? 'bg-emerald-100 text-emerald-800' :
                    lead.status === 'SITE_VISIT' ? 'bg-amber-100 text-amber-800' :
                    lead.status === 'CONTACTED' ? 'bg-purple-100 text-purple-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {lead.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Budget</span>
                    <p className="font-extrabold text-slate-800 mt-0.5">{lead.budget || '—'}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Priority</span>
                    <p className={`font-extrabold mt-0.5 ${
                      lead.priority === 'HIGH' ? 'text-red-600' : lead.priority === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {lead.priority}
                    </p>
                  </div>
                </div>

                {lead.project && (
                  <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mt-2.5">
                    <Building2 size={13} className="text-slate-400" /> {lead.project.name}
                  </p>
                )}
              </div>

              {/* Bottom Quick Contact Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  {lead.phone && (
                    <>
                      <a
                        href={`tel:${lead.phone}`}
                        className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        title="Call"
                      >
                        <Phone size={15} />
                      </a>
                      <button
                        onClick={() => openWhatsApp(lead.phone!, lead.name)}
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle size={15} />
                      </button>
                    </>
                  )}
                  {lead.email && (
                    <a
                      href={`mailto:${lead.email}`}
                      className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                      title="Email"
                    >
                      <Mail size={15} />
                    </a>
                  )}
                </div>

                <button
                  onClick={() => onOpenEditLead(lead)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1"
                >
                  <Edit3 size={13} /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
