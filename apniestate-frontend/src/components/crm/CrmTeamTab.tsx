import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, UserCheck, Shield, Clock, Search, MoreVertical,
  UserX, RefreshCw, ArrowRightLeft, Check, AlertCircle, Sparkles,
  Phone, Mail, X, CheckCircle2, AlertTriangle, ShieldCheck, KeyRound,
  Activity, ArrowRight, MessageCircle, FileText, Calendar
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserCrmRole } from '@/config/crm-permissions';
import { crmApi, type CrmTeamMember, type CrmTeamResponse, type CrmMemberActivityResponse } from '@/api/crm';

interface CrmTeamTabProps {
  onNavigateToLeads?: (assignedToId?: string) => void;
}

export default function CrmTeamTab({ onNavigateToLeads }: CrmTeamTabProps) {
  const { user } = useAuth();
  const crmRole = getUserCrmRole(user);
  const isBuilder = crmRole === 'BUILDER' || user?.role === 'BUILDER' || user?.role === 'ADMIN';

  const [teamData, setTeamData] = useState<CrmTeamResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CRM_MANAGER' | 'TELECALLER'>('ALL');

  // Create Member Modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState<'CRM_MANAGER' | 'TELECALLER'>(
    isBuilder ? 'CRM_MANAGER' : 'TELECALLER'
  );
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // Reassign Modal
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [reassignFromUser, setReassignFromUser] = useState<CrmTeamMember | null>(null);
  const [reassignToUserId, setReassignToUserId] = useState('');
  const [reassigning, setReassigning] = useState(false);
  const [reassignMsg, setReassignMsg] = useState('');

  // Member Activity & Work Log Modal State
  const [selectedMember, setSelectedMember] = useState<CrmTeamMember | null>(null);
  const [memberActivityData, setMemberActivityData] = useState<CrmMemberActivityResponse | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activityModalTab, setActivityModalTab] = useState<'ACTIONS' | 'TIME' | 'LEADS'>('ACTIONS');
  const [actionFilter, setActionFilter] = useState<'ALL' | 'CALLS' | 'WHATSAPP' | 'STATUS' | 'NOTES'>('ALL');

  const handleOpenMemberDetail = async (member: CrmTeamMember) => {
    setSelectedMember(member);
    setActivityModalTab('ACTIONS');
    setActionFilter('ALL');
    setLoadingActivity(true);
    try {
      const res = await crmApi.getMemberActivity(member.id);
      if (res.success && res.data) {
        setMemberActivityData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load member activity:', err);
    } finally {
      setLoadingActivity(false);
    }
  };

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await crmApi.getTeam();
      if (res.success && res.data) {
        setTeamData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load CRM team:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');

    if (!inviteName.trim() || !inviteEmail.trim() || !invitePassword.trim()) {
      setInviteError('Name, Email ID, and Password are required');
      return;
    }

    if (invitePassword.length < 6) {
      setInviteError('Password must be at least 6 characters long');
      return;
    }

    setInviting(true);

    try {
      const res = await crmApi.createTeamMember({
        name: inviteName.trim(),
        email: inviteEmail.trim().toLowerCase(),
        password: invitePassword.trim(),
        role: inviteRole,
        phone: invitePhone.trim() || undefined,
      });

      if (res.success) {
        setInviteSuccess(`User account created for ${inviteEmail}! They can now log in immediately.`);
        setInviteName('');
        setInviteEmail('');
        setInvitePassword('');
        setInvitePhone('');
        fetchTeam();
        setTimeout(() => {
          setIsInviteOpen(false);
          setInviteSuccess('');
        }, 1800);
      } else {
        const errMsg = typeof res.error === 'string' ? res.error : res.error?.message || 'Failed to create user account';
        setInviteError(errMsg);
      }
    } catch (err: any) {
      setInviteError(err.message || 'Failed to create user account');
    } finally {
      setInviting(false);
    }
  };

  const handleMemberAction = async (member: CrmTeamMember, action: 'suspend' | 'activate' | 'remove') => {
    const actionLabel = action === 'suspend' ? 'suspend' : action === 'activate' ? 'reactivate' : 'remove';
    if (!confirm(`Are you sure you want to ${actionLabel} ${member.name}?`)) {
      return;
    }

    try {
      await crmApi.updateTeamMember(member.id, { action });
      fetchTeam();
    } catch (err: any) {
      alert(err.message || `Failed to ${action} member`);
    }
  };

  const handleExecuteReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignToUserId) {
      alert('Please select a target team member');
      return;
    }

    setReassigning(true);
    setReassignMsg('');
    try {
      const res = await crmApi.reassignLeads({
        from_user_id: reassignFromUser ? reassignFromUser.id : undefined,
        to_user_id: reassignToUserId,
      });

      if (res.success) {
        setReassignMsg(res.message || 'Leads reassigned successfully');
        fetchTeam();
        setTimeout(() => {
          setIsReassignOpen(false);
          setReassignFromUser(null);
          setReassignToUserId('');
          setReassignMsg('');
        }, 1500);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reassign leads');
    } finally {
      setReassigning(false);
    }
  };

  const members = teamData?.members || [];

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.email && m.email.toLowerCase().includes(search.toLowerCase())) ||
      (m.phone && m.phone.includes(search));

    if (!matchesSearch) return false;
    if (roleFilter === 'ALL') return true;
    return m.crm_role === roleFilter;
  });

  const managersCount = members.filter((m) => m.crm_role === 'CRM_MANAGER').length;
  const telecallersCount = members.filter((m) => m.crm_role === 'TELECALLER').length;
  const totalAssignedLeads = members.reduce((acc, m) => acc + (m.assigned_leads_count || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/20 border border-slate-200/80 shadow-md shadow-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#2648E7] text-white flex items-center justify-center shadow-md shadow-[#2648E7]/30 shrink-0">
            <Users size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                CRM Team & Access Control
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#2648E7]/10 text-[#2648E7]">
                {isBuilder ? 'Builder Administration' : 'Manager Team View'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isBuilder
                ? 'Directly create CRM Managers, add Telecallers, and assign lead ownership'
                : 'Create sales executives / telecallers with immediate login access'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setInviteRole(isBuilder ? 'CRM_MANAGER' : 'TELECALLER');
              setIsInviteOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#2648E7] to-[#4F6DFF] hover:opacity-95 shadow-md shadow-[#2648E7]/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <UserPlus size={15} strokeWidth={2.5} />
            <span>{isBuilder ? 'Create CRM Member' : 'Add Telecaller'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total CRM Members</span>
            <div className="size-8 rounded-xl bg-blue-50 text-[#2648E7] flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{members.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active team count</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">CRM Managers</span>
            <div className="size-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-600 mt-2">{managersCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Team supervisors</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Sales Executives</span>
            <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{telecallersCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Telecallers & Executives</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Assigned Leads</span>
            <div className="size-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">{totalAssignedLeads}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Distributed to team</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search team member by name, email, or phone..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7]"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              roleFilter === 'ALL'
                ? 'bg-[#2648E7] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({members.length})
          </button>
          <button
            onClick={() => setRoleFilter('CRM_MANAGER')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              roleFilter === 'CRM_MANAGER'
                ? 'bg-[#2648E7] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Managers ({managersCount})
          </button>
          <button
            onClick={() => setRoleFilter('TELECALLER')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              roleFilter === 'TELECALLER'
                ? 'bg-[#2648E7] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Executives ({telecallersCount})
          </button>
        </div>
      </div>

      {/* Members Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users size={16} className="text-[#2648E7]" />
            <span>Active Team Directory</span>
          </h3>
          <button
            onClick={fetchTeam}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block size-6 border-2 border-[#2648E7] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 mt-2">Loading team members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={36} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No matching members found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">CRM Role</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Assigned Leads</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((m) => {
                  const isSelf = m.id === user?.id;
                  const isMemberBuilder = m.crm_role === 'BUILDER';
                  const isMemberManager = m.crm_role === 'CRM_MANAGER';
                  const canManage = isBuilder ? !isMemberBuilder : !isMemberBuilder && !isMemberManager;

                  return (
                    <tr
                      key={m.id}
                      onClick={() => handleOpenMemberDetail(m)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                      title="Click to view work log, actions on leads, and time spent on CRM"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-gradient-to-tr from-[#2648E7] to-[#4F6DFF] text-white font-bold flex items-center justify-center text-xs shadow-sm">
                            {m.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 group-hover:text-[#2648E7] transition-colors">{m.name}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-100 text-[#2648E7]">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              {m.email && <span className="flex items-center gap-1"><Mail size={10} />{m.email}</span>}
                              {m.phone && <span className="flex items-center gap-1"><Phone size={10} />{m.phone}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            m.crm_role === 'BUILDER'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : m.crm_role === 'CRM_MANAGER'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-blue-50 text-[#2648E7] border border-blue-200'
                          }`}
                        >
                          {m.crm_role === 'BUILDER'
                            ? 'Builder / Owner'
                            : m.crm_role === 'CRM_MANAGER'
                            ? 'CRM Manager'
                            : 'Sales Executive'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          <span className={`size-1.5 rounded-full ${m.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {m.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <span className="font-bold text-slate-800">{m.assigned_leads_count}</span>
                          {onNavigateToLeads && m.assigned_leads_count > 0 && (
                            <button
                              onClick={() => onNavigateToLeads(m.id)}
                              className="text-[10px] font-bold text-[#2648E7] hover:underline"
                            >
                              View
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {m.last_active_at ? new Date(m.last_active_at).toLocaleDateString() : 'Recent'}
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenMemberDetail(m)}
                            className="px-2 py-1 rounded-lg text-[11px] font-bold text-[#2648E7] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1"
                            title="View member work log & session times"
                          >
                            <Activity size={12} />
                            <span>Work Log</span>
                          </button>

                          {canManage && (
                            <>
                              <button
                                onClick={() => {
                                  setReassignFromUser(m);
                                  setIsReassignOpen(true);
                                }}
                                className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                                title="Reassign leads"
                              >
                                Reassign
                              </button>

                              {m.status === 'ACTIVE' ? (
                                <button
                                  onClick={() => handleMemberAction(m, 'suspend')}
                                  className="px-2 py-1 rounded-lg text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                                  title="Suspend access"
                                >
                                  Suspend
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleMemberAction(m, 'activate')}
                                  className="px-2 py-1 rounded-lg text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                  title="Reactivate access"
                                >
                                  Activate
                                </button>
                              )}

                              {isBuilder && (
                                <button
                                  onClick={() => handleMemberAction(m, 'remove')}
                                  className="px-2 py-1 rounded-lg text-[11px] font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                                  title="Remove member from company"
                                >
                                  Remove
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODAL: Create CRM Member Account ───────────────── */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-[#2648E7] text-white flex items-center justify-center shadow-sm">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isBuilder ? 'Create CRM Team Member' : 'Add Telecaller'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Create login credentials with immediate CRM access</p>
                </div>
              </div>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="p-5 space-y-3.5">
              {inviteError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{inviteError}</span>
                </div>
              )}
              {inviteSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>{inviteSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Priya Patel"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email ID (Login Username) *</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. priya.sales@company.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    placeholder="Enter login password"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7]"
                  />
                  <KeyRound size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CRM Role Assigned *</label>
                  {isBuilder ? (
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7]"
                    >
                      <option value="CRM_MANAGER">CRM Manager (Team Leads & Reports)</option>
                      <option value="TELECALLER">Sales Executive / Telecaller (Own Leads)</option>
                    </select>
                  ) : (
                    <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 font-bold">
                      Sales Executive (Own Leads)
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone (Optional)</label>
                  <input
                    type="tel"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    placeholder="+91..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#2648E7] hover:bg-[#1e3bbd] shadow-md shadow-[#2648E7]/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {inviting ? (
                    <>
                      <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create User Account</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Reassign Leads ─────────────────────────── */}
      {isReassignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                  <ArrowRightLeft size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Reassign CRM Leads</h3>
                  <p className="text-[11px] text-slate-500">
                    {reassignFromUser ? `Transfer leads from ${reassignFromUser.name}` : 'Reassign leads'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReassignOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleExecuteReassign} className="p-5 space-y-4">
              {reassignMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>{reassignMsg}</span>
                </div>
              )}

              {reassignFromUser && (
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1">
                  <p className="text-xs font-bold text-amber-900">Current Lead Owner</p>
                  <p className="text-xs text-amber-800">
                    <strong>{reassignFromUser.name}</strong> has{' '}
                    <strong>{reassignFromUser.assigned_leads_count}</strong> assigned leads.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transfer Leads To</label>
                <select
                  required
                  value={reassignToUserId}
                  onChange={(e) => setReassignToUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7]"
                >
                  <option value="">Select recipient member...</option>
                  {members
                    .filter((m) => m.id !== reassignFromUser?.id && m.status === 'ACTIVE')
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.crm_role === 'CRM_MANAGER' ? 'Manager' : 'Executive'}) — {m.assigned_leads_count} leads currently
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReassignOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reassigning || !reassignToUserId}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {reassigning ? (
                    <>
                      <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Reassigning...</span>
                    </>
                  ) : (
                    <span>Execute Reassign</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Member Work Log, Lead Actions & Time Tracking ─── */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-white flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="size-12 rounded-2xl bg-gradient-to-tr from-[#2648E7] to-[#4F6DFF] text-white font-black text-sm flex items-center justify-center shadow-md shadow-[#2648E7]/25 shrink-0">
                  {selectedMember.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {selectedMember.name}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        selectedMember.crm_role === 'BUILDER'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : selectedMember.crm_role === 'CRM_MANAGER'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-blue-50 text-[#2648E7] border border-blue-200'
                      }`}
                    >
                      {selectedMember.crm_role === 'BUILDER'
                        ? 'Builder / Owner'
                        : selectedMember.crm_role === 'CRM_MANAGER'
                        ? 'CRM Manager'
                        : 'Sales Executive'}
                    </span>
                    {memberActivityData?.timeTracking.isCurrentlyOnline ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1.5 border border-emerald-200">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        Online Now
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                        Offline
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                    {selectedMember.email && (
                      <span className="flex items-center gap-1">
                        <Mail size={12} className="text-slate-400" />
                        {selectedMember.email}
                      </span>
                    )}
                    {selectedMember.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} className="text-slate-400" />
                        {selectedMember.phone}
                      </span>
                    )}
                    <span className="text-slate-400">•</span>
                    <span>
                      Last Active:{' '}
                      {selectedMember.last_active_at
                        ? new Date(selectedMember.last_active_at).toLocaleString([], {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : 'Recent'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedMember(null);
                  setMemberActivityData(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {loadingActivity ? (
              <div className="p-16 text-center flex-1 flex flex-col items-center justify-center">
                <div className="size-8 border-2 border-[#2648E7] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-600 mt-3">Loading member activity & time records...</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Fetching desktop actions and session logs</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border border-blue-100">
                    <div className="flex items-center justify-between text-[#2648E7]">
                      <span className="text-xs font-bold text-slate-600">Time on CRM</span>
                      <Clock size={16} />
                    </div>
                    <p className="text-2xl font-black text-slate-900 mt-2">
                      {memberActivityData?.timeTracking.totalActiveHours || '0.0'} hrs
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {memberActivityData?.timeTracking.totalActiveMinutes || 0} active minutes
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/60 to-pink-50/40 border border-purple-100">
                    <div className="flex items-center justify-between text-purple-600">
                      <span className="text-xs font-bold text-slate-600">Actions on Leads</span>
                      <Activity size={16} />
                    </div>
                    <p className="text-2xl font-black text-slate-900 mt-2">
                      {memberActivityData?.actionSummary.totalActions || 0}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Calls, WhatsApp, Updates
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-teal-50/40 border border-emerald-100">
                    <div className="flex items-center justify-between text-emerald-600">
                      <span className="text-xs font-bold text-slate-600">Calls & WhatsApp</span>
                      <Phone size={16} />
                    </div>
                    <p className="text-2xl font-black text-slate-900 mt-2">
                      {(memberActivityData?.actionSummary.callAttempts || 0) +
                        (memberActivityData?.actionSummary.whatsappMessages || 0)}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {memberActivityData?.actionSummary.callAttempts || 0} calls •{' '}
                      {memberActivityData?.actionSummary.whatsappMessages || 0} WA
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/60 to-orange-50/40 border border-amber-100">
                    <div className="flex items-center justify-between text-amber-600">
                      <span className="text-xs font-bold text-slate-600">Assigned Pipeline</span>
                      <Users size={16} />
                    </div>
                    <p className="text-2xl font-black text-slate-900 mt-2">
                      {memberActivityData?.actionSummary.assignedLeads || 0}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {memberActivityData?.actionSummary.pipelineBreakdown.BOOKED || 0} booked deals
                    </p>
                  </div>
                </div>

                {/* Sub Tab Navigation */}
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <button
                    onClick={() => setActivityModalTab('ACTIONS')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      activityModalTab === 'ACTIONS'
                        ? 'bg-[#2648E7] text-white shadow-md shadow-[#2648E7]/20'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Activity size={14} />
                    <span>Actions on Leads ({memberActivityData?.activities.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setActivityModalTab('TIME')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      activityModalTab === 'TIME'
                        ? 'bg-[#2648E7] text-white shadow-md shadow-[#2648E7]/20'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Clock size={14} />
                    <span>Login & Session Times</span>
                  </button>

                  <button
                    onClick={() => setActivityModalTab('LEADS')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      activityModalTab === 'LEADS'
                        ? 'bg-[#2648E7] text-white shadow-md shadow-[#2648E7]/20'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Users size={14} />
                    <span>Pipeline Breakdown</span>
                  </button>
                </div>

                {/* TAB 1: ACTIONS ON LEADS */}
                {activityModalTab === 'ACTIONS' && (
                  <div className="space-y-3">
                    {/* Action Category Filters */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                      {(['ALL', 'CALLS', 'WHATSAPP', 'STATUS', 'NOTES'] as const).map((filterKey) => (
                        <button
                          key={filterKey}
                          onClick={() => setActionFilter(filterKey)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 ${
                            actionFilter === filterKey
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {filterKey === 'ALL'
                            ? `All (${memberActivityData?.activities.length || 0})`
                            : filterKey === 'CALLS'
                            ? `Calls (${memberActivityData?.actionSummary.callAttempts || 0})`
                            : filterKey === 'WHATSAPP'
                            ? `WhatsApp (${memberActivityData?.actionSummary.whatsappMessages || 0})`
                            : filterKey === 'STATUS'
                            ? `Status Updates (${memberActivityData?.actionSummary.statusChanges || 0})`
                            : `Notes (${memberActivityData?.actionSummary.notesAdded || 0})`}
                        </button>
                      ))}
                    </div>

                    {/* Filtered Activity List */}
                    {(() => {
                      const acts = (memberActivityData?.activities || []).filter((a) => {
                        if (actionFilter === 'CALLS') {
                          return a.type === 'CALL' || (a.title || '').toLowerCase().includes('call');
                        }
                        if (actionFilter === 'WHATSAPP') {
                          return (a.title || '').toLowerCase().includes('whatsapp');
                        }
                        if (actionFilter === 'STATUS') {
                          return (
                            (a.title || '').toLowerCase().includes('status') ||
                            (a.title || '').toLowerCase().includes('interested')
                          );
                        }
                        if (actionFilter === 'NOTES') {
                          return a.type === 'NOTE';
                        }
                        return true;
                      });

                      if (acts.length === 0) {
                        return (
                          <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <Activity size={32} className="text-slate-300 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-700">No actions recorded for this filter</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              When telecaller takes action on desktop (calls, WhatsApp, status changes), they appear here.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                          {acts.map((act) => {
                            const isCall = act.type === 'CALL' || (act.title || '').toLowerCase().includes('call');
                            const isWA = (act.title || '').toLowerCase().includes('whatsapp');
                            const isStatus = (act.title || '').toLowerCase().includes('status') || (act.title || '').toLowerCase().includes('interested');

                            return (
                              <div
                                key={act.id}
                                className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-200 shadow-sm transition-all flex items-start gap-3.5"
                              >
                                <div
                                  className={`size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                    isWA
                                      ? 'bg-emerald-50 text-emerald-600'
                                      : isCall
                                      ? 'bg-blue-50 text-[#2648E7]'
                                      : isStatus
                                      ? 'bg-purple-50 text-purple-600'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {isWA ? (
                                    <MessageCircle size={16} />
                                  ) : isCall ? (
                                    <Phone size={16} />
                                  ) : isStatus ? (
                                    <ArrowRightLeft size={16} />
                                  ) : (
                                    <Clock size={16} />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs font-bold text-slate-900 leading-tight">
                                      {act.title}
                                    </p>
                                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                                      {new Date(act.created_at).toLocaleString([], {
                                        dateStyle: 'short',
                                        timeStyle: 'short',
                                      })}
                                    </span>
                                  </div>

                                  {act.lead && (
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                      <span className="text-[11px] font-bold text-[#2648E7]">
                                        Lead: {act.lead.name}
                                      </span>
                                      {act.lead.phone && (
                                        <span className="text-[11px] text-slate-500">
                                          ({act.lead.phone})
                                        </span>
                                      )}
                                      {act.lead.status && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-slate-100 text-slate-700">
                                          {act.lead.status}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {act.description && (
                                    <p className="text-[11px] text-slate-500 mt-1 italic">
                                      "{act.description}"
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* TAB 2: LOGIN & TIME TRACKING */}
                {activityModalTab === 'TIME' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium">Last Login Recorded:</span>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {memberActivityData?.timeTracking.lastLoginAt
                            ? new Date(memberActivityData.timeTracking.lastLoginAt).toLocaleString([], {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })
                            : 'No recent login logged'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Last Logout / Ended:</span>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {memberActivityData?.timeTracking.lastLogoutAt
                            ? new Date(memberActivityData.timeTracking.lastLogoutAt).toLocaleString([], {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })
                            : memberActivityData?.timeTracking.isCurrentlyOnline
                            ? 'Currently in active session'
                            : 'Closed window (timed out)'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Total Recorded Time:</span>
                        <p className="font-bold text-[#2648E7] mt-0.5">
                          {memberActivityData?.timeTracking.totalActiveHours || '0.0'} Hours (
                          {memberActivityData?.timeTracking.totalActiveMinutes || 0} minutes)
                        </p>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock size={14} className="text-[#2648E7]" />
                      <span>Recent Login & Usage Sessions</span>
                    </h4>

                    {(memberActivityData?.timeTracking.sessions || []).length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Clock size={28} className="text-slate-300 mx-auto mb-1.5" />
                        <p className="text-xs font-bold text-slate-700">No session logs recorded yet</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          New logins and heartbeats from this telecaller will automatically be logged.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                              <th className="py-2.5 px-3.5">Session Date</th>
                              <th className="py-2.5 px-3.5">Login Time</th>
                              <th className="py-2.5 px-3.5">Logout / Last Active</th>
                              <th className="py-2.5 px-3.5">Duration</th>
                              <th className="py-2.5 px-3.5 text-right">Session State</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {memberActivityData?.timeTracking.sessions.map((sess, idx) => (
                              <tr key={sess.id || idx} className="hover:bg-slate-50/60">
                                <td className="py-2.5 px-3.5 font-bold text-slate-900">
                                  {new Date(sess.login_at).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </td>
                                <td className="py-2.5 px-3.5 text-slate-600">
                                  {new Date(sess.login_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </td>
                                <td className="py-2.5 px-3.5 text-slate-600">
                                  {sess.logout_at
                                    ? new Date(sess.logout_at).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : sess.is_current
                                    ? 'Active Now'
                                    : 'Session Ended'}
                                </td>
                                <td className="py-2.5 px-3.5 font-bold text-slate-900">
                                  {sess.duration_minutes >= 60
                                    ? `${Math.floor(sess.duration_minutes / 60)}h ${sess.duration_minutes % 60}m`
                                    : `${sess.duration_minutes}m`}
                                </td>
                                <td className="py-2.5 px-3.5 text-right">
                                  {sess.is_current ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      Active
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                                      Completed
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: PIPELINE BREAKDOWN */}
                {activityModalTab === 'LEADS' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          Total Leads Assigned: {memberActivityData?.actionSummary.assignedLeads || 0}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Follow-ups: {memberActivityData?.actionSummary.completedFollowups || 0} of{' '}
                          {memberActivityData?.actionSummary.followupsCount || 0} completed
                        </p>
                      </div>
                      {onNavigateToLeads && (
                        <button
                          onClick={() => {
                            onNavigateToLeads(selectedMember.id);
                            setSelectedMember(null);
                          }}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#2648E7] hover:bg-[#1f3bbd] shadow-sm transition-all"
                        >
                          View Leads in Leads Tab →
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.entries(memberActivityData?.actionSummary.pipelineBreakdown || {}).map(
                        ([stage, count]) => (
                          <div
                            key={stage}
                            className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm"
                          >
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {stage}
                            </span>
                            <p className="text-xl font-black text-slate-900 mt-1">{count}</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
