import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, UserCheck, Shield, Clock, Search, MoreVertical,
  UserX, RefreshCw, ArrowRightLeft, Check, AlertCircle, Sparkles,
  Phone, Mail, X, CheckCircle2, AlertTriangle, ShieldCheck, KeyRound
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserCrmRole } from '@/config/crm-permissions';
import { crmApi, type CrmTeamMember, type CrmTeamResponse } from '@/api/crm';

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
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-gradient-to-tr from-[#2648E7] to-[#4F6DFF] text-white font-bold flex items-center justify-center text-xs shadow-sm">
                            {m.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{m.name}</span>
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

                      <td className="py-3.5 px-4 text-right">
                        {canManage ? (
                          <div className="inline-flex items-center gap-1.5">
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
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-300 italic">Protected</span>
                        )}
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
    </div>
  );
}
