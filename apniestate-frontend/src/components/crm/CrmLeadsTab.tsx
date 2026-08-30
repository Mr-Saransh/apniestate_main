import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Plus, UploadCloud, Phone, MessageCircle, Mail,
  MapPin, IndianRupee, Tag, Building2, MoreHorizontal, Edit3, Trash2,
  CheckCircle2, LayoutGrid, List, UserCheck, Clock, ArrowUpDown,
  Sparkles, CheckSquare, Square, UserPlus, ArrowRightLeft, UserX,
  ChevronDown, AlertCircle, X, ShieldCheck, Flame, Zap, Sprout, Star,
  User as UserIcon, Users
} from 'lucide-react';
import { type CrmLead, type CrmTeamMember, crmApi } from '@/api/crm';
import { useProject } from '@/context/ProjectContext';
import { useAuth } from '@/context/AuthContext';
import { getUserCrmRole } from '@/config/crm-permissions';
import DistributeLeadsModal from './DistributeLeadsModal';

interface CrmLeadsTabProps {
  leads: CrmLead[];
  loading: boolean;
  onOpenAddLead: () => void;
  onOpenImportLeads: () => void;
  onSelectLead: (leadId: string) => void;
  onOpenEditLead: (lead: CrmLead) => void;
  onDeleteLead: (leadId: string) => void;
  onRefreshLeads?: () => void;
}

export default function CrmLeadsTab({
  leads,
  loading,
  onOpenAddLead,
  onOpenImportLeads,
  onSelectLead,
  onOpenEditLead,
  onDeleteLead,
  onRefreshLeads,
}: CrmLeadsTabProps) {
  const { projects } = useProject();
  const { user } = useAuth();
  const crmRole = getUserCrmRole(user);
  const isManagerOrBuilder =
    crmRole === 'BUILDER' || crmRole === 'CRM_MANAGER' || user?.role === 'BUILDER' || user?.role === 'ADMIN';

  // Workspace Segmented View (for Managers/Builders)
  // 'ALL' = All company leads
  // 'MINE' = Only leads assigned to the current user (CRM Manager personal leads)
  // 'UNASSIGNED' = Unassigned pool
  const [workspaceFilter, setWorkspaceFilter] = useState<'ALL' | 'MINE' | 'UNASSIGNED'>('ALL');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Selection state
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isDistributeModalOpen, setIsDistributeModalOpen] = useState(false);

  // Team state for quick inline assignments
  const [teamMembers, setTeamMembers] = useState<CrmTeamMember[]>([]);
  const [quickAssignLeadId, setQuickAssignLeadId] = useState<string | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Fetch active team members
  const fetchTeamMembers = async () => {
    try {
      const res = await crmApi.getTeam();
      if (res.success && res.data) {
        setTeamMembers(res.data.members.filter((m) => m.status === 'ACTIVE' && m.crm_role !== 'BUILDER'));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isManagerOrBuilder) {
      fetchTeamMembers();
    }
  }, [isManagerOrBuilder]);

  // Counts for Segmented Tabs
  const myLeadsCount = leads.filter(
    (l) => l.assigned_to === user?.id || (user as any)?.sub === l.assigned_to
  ).length;
  const unassignedCount = leads.filter((l) => !l.assigned_to).length;

  // Filtering
  const filteredLeads = leads.filter((lead) => {
    // Workspace Scope
    if (workspaceFilter === 'MINE') {
      const isMine = lead.assigned_to === user?.id || (user as any)?.sub === lead.assigned_to;
      if (!isMine) return false;
    } else if (workspaceFilter === 'UNASSIGNED') {
      if (lead.assigned_to) return false;
    }

    if (statusFilter !== 'ALL' && lead.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && lead.priority !== priorityFilter) return false;
    if (projectFilter !== 'ALL' && lead.project_id !== projectFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = lead.name.toLowerCase().includes(q);
      const matchPhone = lead.phone?.toLowerCase().includes(q);
      const matchEmail = lead.email?.toLowerCase().includes(q);
      const matchCity = lead.city?.toLowerCase().includes(q);
      const matchTags = lead.tags?.some((t) => t.toLowerCase().includes(q));
      const matchAssignee = lead.assignee?.name.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchEmail && !matchCity && !matchTags && !matchAssignee) return false;
    }

    return true;
  });

  // Multi-select handlers
  const handleToggleSelect = (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedLeadIds.includes(leadId)) {
      setSelectedLeadIds(selectedLeadIds.filter((id) => id !== leadId));
    } else {
      setSelectedLeadIds([...selectedLeadIds, leadId]);
    }
  };

  const handleSelectAllFiltered = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  };

  const handleClearSelection = () => setSelectedLeadIds([]);

  // Direct 1-tap quick priority toggle from row
  const handleCyclePriority = async (lead: CrmLead, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextPriority: Record<string, 'LOW' | 'MEDIUM' | 'HIGH'> = {
      LOW: 'MEDIUM',
      MEDIUM: 'HIGH',
      HIGH: 'LOW',
    };
    const newPriority = nextPriority[lead.priority || 'MEDIUM'] || 'HIGH';
    try {
      await crmApi.updateLead(lead.id, { priority: newPriority });
      if (onRefreshLeads) onRefreshLeads();
    } catch {
      // ignore
    }
  };

  // Quick single assign
  const handleQuickAssignSingle = async (leadId: string, targetUserId: string | null) => {
    try {
      if (targetUserId) {
        await crmApi.bulkUpdateLeads({
          lead_ids: [leadId],
          action: 'ASSIGN',
          assigned_to: targetUserId,
        });
      } else {
        await crmApi.bulkUpdateLeads({
          lead_ids: [leadId],
          action: 'UNASSIGN',
        });
      }
      setQuickAssignLeadId(null);
      if (onRefreshLeads) onRefreshLeads();
    } catch (err: any) {
      alert(err.message || 'Failed to update lead assignee');
    }
  };

  // Bulk operations
  const handleBulkAssign = async (targetUserId: string) => {
    if (!targetUserId || selectedLeadIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      const res = await crmApi.bulkUpdateLeads({
        lead_ids: selectedLeadIds,
        action: 'ASSIGN',
        assigned_to: targetUserId,
      });
      if (res.success) {
        setActionSuccessMsg(res.data?.message || `Assigned ${selectedLeadIds.length} leads successfully!`);
        setSelectedLeadIds([]);
        if (onRefreshLeads) onRefreshLeads();
        setTimeout(() => setActionSuccessMsg(''), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to assign leads');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkUnassign = async () => {
    if (selectedLeadIds.length === 0) return;
    if (!confirm(`Are you sure you want to unassign ${selectedLeadIds.length} leads?`)) return;
    setBulkActionLoading(true);
    try {
      const res = await crmApi.bulkUpdateLeads({
        lead_ids: selectedLeadIds,
        action: 'UNASSIGN',
      });
      if (res.success) {
        setActionSuccessMsg(`Moved ${selectedLeadIds.length} leads to Unassigned Pool`);
        setSelectedLeadIds([]);
        if (onRefreshLeads) onRefreshLeads();
        setTimeout(() => setActionSuccessMsg(''), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to unassign leads');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    if (!status || selectedLeadIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      const res = await crmApi.bulkUpdateLeads({
        lead_ids: selectedLeadIds,
        action: 'STATUS_CHANGE',
        status,
      });
      if (res.success) {
        setActionSuccessMsg(`Updated status for ${selectedLeadIds.length} leads`);
        setSelectedLeadIds([]);
        if (onRefreshLeads) onRefreshLeads();
        setTimeout(() => setActionSuccessMsg(''), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeadIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedLeadIds.length} leads?`)) return;
    setBulkActionLoading(true);
    try {
      const res = await crmApi.bulkUpdateLeads({
        lead_ids: selectedLeadIds,
        action: 'DELETE',
      });
      if (res.success) {
        setActionSuccessMsg(`Deleted ${selectedLeadIds.length} leads`);
        setSelectedLeadIds([]);
        if (onRefreshLeads) onRefreshLeads();
        setTimeout(() => setActionSuccessMsg(''), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete leads');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const message = encodeURIComponent(
      `Hello ${name}, thank you for your interest with Apni Estate. How can I assist you today?`
    );
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
    <div className="space-y-4 relative">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-top-4 duration-200">
          <div className="size-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
            <CheckCircle2 size={18} />
          </div>
          <p className="text-xs font-bold">{actionSuccessMsg}</p>
        </div>
      )}

      {/* ─── 1. TOP HEADER & UNIFIED ACTION BAR ───────────────────── */}
      <div className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Leads & Prospects
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {filteredLeads.length} of {leads.length} leads in current view
          </p>
        </div>

        {/* Clean, perfectly aligned Action Buttons */}
        <div className="flex items-center gap-2">
          {isManagerOrBuilder && (
            <>
              <button
                type="button"
                onClick={() => setIsDistributeModalOpen(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-bold text-[#2648E7] bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 transition-all active:scale-95"
                title="Smart Lead Distribution"
              >
                <Sparkles size={14} className="text-[#2648E7] shrink-0" />
                <span>Distribute</span>
                {unassignedCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-[#2648E7] text-white">
                    {unassignedCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenImportLeads}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/60 transition-all active:scale-95"
              >
                <UploadCloud size={14} className="shrink-0" />
                <span>Import</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onOpenAddLead}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-[#2648E7] to-[#4F6DFF] hover:opacity-95 shadow-md shadow-[#2648E7]/25 transition-all active:scale-95 shrink-0"
          >
            <Plus size={15} strokeWidth={2.5} className="shrink-0" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* ─── 2. DEDICATED WORKSPACE SEGMENTED SWITCHER (Manager / Builder) ─ */}
      {isManagerOrBuilder && (
        <div className="flex bg-slate-200/70 p-1 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => setWorkspaceFilter('ALL')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              workspaceFilter === 'ALL'
                ? 'bg-white text-[#2648E7] shadow-sm scale-100 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={14} />
            <span>All Team Leads</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
              {leads.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceFilter('MINE')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              workspaceFilter === 'MINE'
                ? 'bg-white text-[#2648E7] shadow-sm scale-100 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserIcon size={14} />
            <span>My Assigned Leads</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                myLeadsCount > 0 ? 'bg-blue-100 text-[#2648E7] font-black' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {myLeadsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceFilter('UNASSIGNED')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              workspaceFilter === 'UNASSIGNED'
                ? 'bg-white text-amber-700 shadow-sm scale-100 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertCircle size={14} />
            <span>Unassigned Pool</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                unassignedCount > 0 ? 'bg-amber-100 text-amber-800 font-black' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {unassignedCount}
            </span>
          </button>
        </div>
      )}

      {/* ─── 3. SEARCH & STREAMLINED FILTER BAR ───────────────────── */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          {/* Full-width clean Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads by name, phone, city, tag..."
              className="w-full pl-9 pr-8 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7] transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Secondary Dropdown Controls (Clean Grid) */}
          <div className="grid grid-cols-3 gap-2 shrink-0">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-[#2648E7] truncate"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">🔥 Hot</option>
              <option value="MEDIUM">⚡ Warm</option>
              <option value="LOW">🌱 Cold</option>
            </select>

            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-2.5 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-[#2648E7] truncate"
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Layout Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl justify-center">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex-1 py-1 rounded-xl transition-all flex items-center justify-center ${
                  viewMode === 'table' ? 'bg-white text-[#2648E7] shadow-sm' : 'text-slate-500'
                }`}
                title="Table View"
              >
                <List size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex-1 py-1 rounded-xl transition-all flex items-center justify-center ${
                  viewMode === 'grid' ? 'bg-white text-[#2648E7] shadow-sm' : 'text-slate-500'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Status Funnel Horizontal Scroll Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
          {STATUS_PILLS.map((p) => {
            const count = p.id === 'ALL' ? leads.length : leads.filter((l) => l.status === p.id).length;
            const active = statusFilter === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setStatusFilter(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  active ? 'bg-[#2648E7] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <span>{p.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selection Helper Checkbox */}
        {isManagerOrBuilder && filteredLeads.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="flex items-center gap-2 font-bold text-slate-700 hover:text-[#2648E7]"
            >
              <div
                className={`size-4 rounded border flex items-center justify-center transition-all ${
                  selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0
                    ? 'bg-[#2648E7] border-[#2648E7] text-white'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0 && (
                  <CheckSquare size={13} className="text-white" />
                )}
              </div>
              <span>
                {selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0
                  ? 'Deselect All'
                  : `Select All (${filteredLeads.length})`}
              </span>
            </button>

            {selectedLeadIds.length > 0 && (
              <span className="font-black text-[#2648E7]">
                {selectedLeadIds.length} lead{selectedLeadIds.length > 1 ? 's' : ''} selected
              </span>
            )}
          </div>
        )}
      </div>

      {/* ─── 4. FLOATING BULK ACTIONS BAR (When 1+ leads selected) ──────── */}
      {selectedLeadIds.length > 0 && isManagerOrBuilder && (
        <div className="sticky top-4 z-40 p-3.5 rounded-3xl bg-slate-900 text-white shadow-2xl border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-[#2648E7] text-white font-black text-xs flex items-center justify-center shrink-0">
              {selectedLeadIds.length}
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {selectedLeadIds.length} Lead{selectedLeadIds.length > 1 ? 's' : ''} Selected
              </p>
              <p className="text-[10px] text-slate-400">Choose a bulk action or smart distribution</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Assign Dropdown */}
            <select
              disabled={bulkActionLoading}
              onChange={(e) => {
                if (e.target.value) handleBulkAssign(e.target.value);
                e.target.value = '';
              }}
              className="px-3 py-1.5 text-xs font-bold bg-slate-800 text-white border border-slate-700 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="">👤 Assign to Member...</option>
              {user && <option value={user.id}>⭐ Assign to Myself ({user.name})</option>}
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.assigned_leads_count} leads)
                </option>
              ))}
            </select>

            {/* Smart Distribute Modal Button */}
            <button
              disabled={bulkActionLoading}
              onClick={() => setIsDistributeModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#2648E7] to-[#4F6DFF] text-white hover:opacity-95 shadow-md shadow-[#2648E7]/30 transition-all"
            >
              <Sparkles size={13} />
              <span>Smart Distribute</span>
            </button>

            {/* Move to Unassigned Pool */}
            <button
              disabled={bulkActionLoading}
              onClick={handleBulkUnassign}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
              title="Remove assignee from selected leads"
            >
              <UserX size={13} />
              <span>Unassign</span>
            </button>

            {/* Bulk Delete */}
            <button
              disabled={bulkActionLoading}
              onClick={handleBulkDelete}
              className="p-1.5 rounded-xl text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-colors"
              title="Delete Selected Leads"
            >
              <Trash2 size={14} />
            </button>

            {/* Clear Selection */}
            <button
              onClick={handleClearSelection}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              title="Deselect All"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ─── 5. LEADS DIRECTORY CONTENT ──────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-3xl border border-slate-200">
          <div className="w-8 h-8 rounded-full border-4 border-[#2648E7] border-t-transparent animate-spin" />
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 text-center">
          <UserCheck size={40} className="text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No leads found in this view</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            {workspaceFilter === 'MINE'
              ? 'You currently have no leads assigned directly to you.'
              : workspaceFilter === 'UNASSIGNED'
              ? 'There are no unassigned leads in the pool.'
              : 'No leads match your current search or filter criteria.'}
          </p>
          <button
            onClick={onOpenAddLead}
            className="mt-4 px-4 py-2 text-xs font-bold text-white bg-[#2648E7] rounded-xl hover:bg-[#1e3bbd] shadow-sm"
          >
            Add New Lead
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* ─── TABLE VIEW ─────────────────────────── */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80">
                <tr>
                  {isManagerOrBuilder && <th className="py-4 pl-4 pr-1 w-10"></th>}
                  <th className="p-4">Lead Name</th>
                  <th className="p-4 text-center">Priority Flag</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Assigned Telecaller</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Type / Budget</th>
                  <th className="p-4">Project</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => {
                  const isSelected = selectedLeadIds.includes(lead.id);

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-slate-50/80 transition-colors group cursor-pointer ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                      onClick={() => onSelectLead(lead.id)}
                    >
                      {/* Checkbox */}
                      {isManagerOrBuilder && (
                        <td className="py-4 pl-4 pr-1" onClick={(e) => handleToggleSelect(lead.id, e)}>
                          <div
                            className={`size-4 rounded border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-[#2648E7] border-[#2648E7] text-white'
                                : 'border-slate-300 hover:border-slate-400 bg-white'
                            }`}
                          >
                            {isSelected && <CheckSquare size={13} className="text-white" />}
                          </div>
                        </td>
                      )}

                      {/* Lead Name + Avatar */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-2xl flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm"
                            style={{ backgroundColor: lead.avatar_color || '#2648E7' }}
                          >
                            {lead.initials || lead.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-slate-900 group-hover:text-[#2648E7] transition-colors truncate">
                              {lead.name}
                            </p>
                            {lead.city && <p className="text-[11px] text-slate-400">{lead.city}</p>}
                          </div>
                        </div>
                      </td>

                      {/* 1-Tap Priority Flag Badge */}
                      <td className="p-4 text-center" onClick={(e) => handleCyclePriority(lead, e)}>
                        <button
                          type="button"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black transition-all hover:scale-105 active:scale-95 ${
                            lead.priority === 'HIGH'
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : lead.priority === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                          title="Tap to cycle Priority Flag (Hot -> Warm -> Cold)"
                        >
                          {lead.priority === 'HIGH' ? (
                            <>
                              <Flame size={12} className="text-red-500" />
                              <span>Hot</span>
                            </>
                          ) : lead.priority === 'MEDIUM' ? (
                            <>
                              <Zap size={12} className="text-amber-500" />
                              <span>Warm</span>
                            </>
                          ) : (
                            <>
                              <Sprout size={12} className="text-emerald-500" />
                              <span>Cold</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Quick Call & WA */}
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {lead.phone ? (
                            <>
                              <a
                                href={`tel:${lead.phone}`}
                                className="p-1.5 rounded-xl bg-blue-50 text-[#2648E7] hover:bg-blue-100 transition-colors"
                                title={`Call ${lead.phone}`}
                              >
                                <Phone size={14} />
                              </a>
                              <button
                                onClick={() => openWhatsApp(lead.phone!, lead.name)}
                                className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                title={`WhatsApp ${lead.phone}`}
                              >
                                <MessageCircle size={14} />
                              </button>
                              <span className="text-slate-700 font-semibold">{lead.phone}</span>
                            </>
                          ) : (
                            <span className="text-slate-400 italic">No phone</span>
                          )}
                        </div>
                      </td>

                      {/* Assigned Telecaller */}
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        {isManagerOrBuilder ? (
                          <div className="relative inline-block">
                            {quickAssignLeadId === lead.id ? (
                              <div className="flex items-center gap-1.5 bg-white border border-[#2648E7] rounded-xl p-1 shadow-lg z-30">
                                <select
                                  autoFocus
                                  defaultValue={lead.assigned_to || ''}
                                  onChange={(e) => handleQuickAssignSingle(lead.id, e.target.value || null)}
                                  className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none pr-2"
                                >
                                  <option value="">⚠️ Move to Unassigned</option>
                                  {user && <option value={user.id}>⭐ Myself ({user.name})</option>}
                                  {teamMembers.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.name} ({m.assigned_leads_count} leads)
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => setQuickAssignLeadId(null)}
                                  className="p-1 text-slate-400 hover:text-slate-600"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : lead.assignee ? (
                              <button
                                onClick={() => setQuickAssignLeadId(lead.id)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#2648E7] transition-colors border border-slate-200/60"
                                title="Click to reassign"
                              >
                                <span className="size-2 rounded-full bg-emerald-500" />
                                <span className="font-bold text-xs">{lead.assignee.name}</span>
                                <ChevronDown size={11} className="text-slate-400" />
                              </button>
                            ) : (
                              <button
                                onClick={() => setQuickAssignLeadId(lead.id)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold border border-amber-200 transition-colors text-xs"
                                title="Click to assign a telecaller"
                              >
                                <UserPlus size={12} className="text-amber-600" />
                                <span>Assign Telecaller</span>
                              </button>
                            )}
                          </div>
                        ) : lead.assignee ? (
                          <span className="font-bold text-slate-800">{lead.assignee.name}</span>
                        ) : (
                          <span className="text-amber-600 font-bold italic">Unassigned</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            lead.status === 'BOOKED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : lead.status === 'SITE_VISIT'
                              ? 'bg-amber-100 text-amber-800'
                              : lead.status === 'CONTACTED'
                              ? 'bg-purple-100 text-purple-800'
                              : lead.status === 'QUALIFIED'
                              ? 'bg-indigo-100 text-indigo-800'
                              : lead.status === 'NEGOTIATION'
                              ? 'bg-orange-100 text-orange-800'
                              : lead.status === 'LOST'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {lead.status}
                        </span>
                      </td>

                      {/* Budget */}
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{lead.budget || '—'}</p>
                        <span className="text-[10px] text-slate-400 font-semibold">{lead.type}</span>
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

                      {/* Actions */}
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenEditLead(lead)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-[#2648E7] hover:bg-slate-100 transition-colors"
                            title="Edit Lead"
                          >
                            <Edit3 size={15} />
                          </button>
                          {isManagerOrBuilder && (
                            <button
                              onClick={() => onDeleteLead(lead.id)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete Lead"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ─── GRID CARD VIEW ─────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredLeads.map((lead) => {
            const isSelected = selectedLeadIds.includes(lead.id);

            return (
              <div
                key={lead.id}
                onClick={() => onSelectLead(lead.id)}
                className={`p-4 rounded-3xl bg-white border shadow-sm hover:shadow-md cursor-pointer transition-all space-y-3 flex flex-col justify-between relative ${
                  isSelected
                    ? 'border-[#2648E7] ring-2 ring-[#2648E7]/20 bg-blue-50/20'
                    : 'border-slate-200/80 hover:border-[#2648E7]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {isManagerOrBuilder && (
                        <div
                          className={`size-5 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                            isSelected
                              ? 'bg-[#2648E7] border-[#2648E7] text-white'
                              : 'border-slate-300 bg-white hover:border-slate-400'
                          }`}
                          onClick={(e) => handleToggleSelect(lead.id, e)}
                        >
                          {isSelected && <CheckSquare size={13} className="text-white" />}
                        </div>
                      )}

                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm"
                        style={{ backgroundColor: lead.avatar_color || '#2648E7' }}
                      >
                        {lead.initials || lead.name.slice(0, 2).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="font-black text-slate-900 text-sm hover:text-[#2648E7] transition-colors truncate">
                          {lead.name}
                        </p>
                        {lead.city && <p className="text-[11px] text-slate-400">{lead.city}</p>}
                      </div>
                    </div>

                    {/* Priority Flag Button in Grid */}
                    <button
                      type="button"
                      onClick={(e) => handleCyclePriority(lead, e)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        lead.priority === 'HIGH'
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : lead.priority === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {lead.priority === 'HIGH' ? '🔥 Hot' : lead.priority === 'MEDIUM' ? '⚡ Warm' : '🌱 Cold'}
                    </button>
                  </div>

                  {/* Assignee Badge in Grid */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Assigned:</span>
                    {lead.assignee ? (
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        {lead.assignee.name}
                      </span>
                    ) : (
                      <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                        Unassigned Pool
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {lead.phone && (
                      <>
                        <a
                          href={`tel:${lead.phone}`}
                          className="p-1.5 rounded-xl bg-blue-50 text-[#2648E7] hover:bg-blue-100 transition-colors"
                        >
                          <Phone size={13} />
                        </a>
                        <button
                          onClick={() => openWhatsApp(lead.phone!, lead.name)}
                          className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        >
                          <MessageCircle size={13} />
                        </button>
                      </>
                    )}
                  </div>

                  <span className="text-xs font-bold text-[#2648E7] hover:underline flex items-center gap-0.5">
                    Manage →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── SMART LEAD DISTRIBUTION WIZARD MODAL ─────────────────────── */}
      <DistributeLeadsModal
        isOpen={isDistributeModalOpen}
        onClose={() => setIsDistributeModalOpen(false)}
        onSuccess={() => {
          setSelectedLeadIds([]);
          if (onRefreshLeads) onRefreshLeads();
          setActionSuccessMsg('Leads distributed successfully across the sales team!');
          setTimeout(() => setActionSuccessMsg(''), 3000);
        }}
        selectedLeadIds={selectedLeadIds}
        allLeads={filteredLeads}
        unassignedCount={unassignedCount}
      />
    </div>
  );
}
