import React, { useState, useEffect, type FormEvent } from 'react';
import { usersApi, type User, type CreateUserData } from '@/api/users';
import { Plus, X, Trash2, Settings2, Filter, Sparkles, ShieldCheck } from 'lucide-react';
import { PH, Card, Chip, SrchBar } from '@/components/shared/FigmaComponents';
import { useProject } from '@/context/ProjectContext';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'active'>('active');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Manage Access Modal
  const [manageUser, setManageUser] = useState<User | null>(null);
  const [manageProjectIds, setManageProjectIds] = useState<string[]>([]);
  const [manageCrmAccess, setManageCrmAccess] = useState(false);
  const [manageCrmRole, setManageCrmRole] = useState<'CRM_MANAGER' | 'TELECALLER'>('TELECALLER');
  const [managing, setManaging] = useState(false);

  // Form
  const [formName, setFormName] = useState('');
  const [formIdentifier, setFormIdentifier] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<User['role']>('SITE_SUPERVISOR');
  const [formCrmAccess, setFormCrmAccess] = useState(false);
  const [formCrmRole, setFormCrmRole] = useState<'CRM_MANAGER' | 'TELECALLER'>('TELECALLER');
  const [formPhone, setFormPhone] = useState('');
  const [formProjectIds, setFormProjectIds] = useState<string[]>([]);
  const [formError, setFormError] = useState('');

  const { projects, activeProjectId } = useProject();

  if (user?.role !== 'BUILDER') {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await usersApi.getAll();
      if (res.data) setUsers(res.data);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setCreating(true);

    try {
      const isEmail = formIdentifier.includes('@');
      const data: CreateUserData = {
        name: formName,
        email: isEmail ? formIdentifier : undefined,
        username: !isEmail ? formIdentifier : undefined,
        password: formPassword,
        role: formRole,
        crm_role: formCrmAccess ? formCrmRole : 'NONE',
        phone: formPhone || undefined,
        project_ids: formRole !== 'BUILDER' ? formProjectIds : undefined,
      };
      await usersApi.create(data);
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleManageSave = async () => {
    if (!manageUser) return;
    setManaging(true);
    try {
      await Promise.all([
        usersApi.updateAssignments(manageUser.id, manageProjectIds),
        usersApi.update(manageUser.id, {
          crm_role: manageCrmAccess ? manageCrmRole : 'NONE',
        }),
      ]);
      setManageUser(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update access');
    } finally {
      setManaging(false);
    }
  };

  const openManageModal = (u: User) => {
    setManageUser(u);
    setManageProjectIds(u.project_assignments?.map((pa) => pa.project_id) || []);
    const hasCrm = Boolean(u.crm_role);
    setManageCrmAccess(hasCrm);
    setManageCrmRole(u.crm_role || 'TELECALLER');
  };

  const resetForm = () => {
    setFormName('');
    setFormIdentifier('');
    setFormPassword('');
    setFormRole('SITE_SUPERVISOR');
    setFormCrmAccess(false);
    setFormCrmRole('TELECALLER');
    setFormPhone('');
    setFormProjectIds([]);
    setFormError('');
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName}? This cannot be undone.`)) return;
    try {
      await usersApi.delete(userId);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const formatRole = (role: string) => role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(search.toLowerCase())) ||
      u.role.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === 'active' && activeProjectId) {
      if (u.role === 'BUILDER' || u.role === 'ADMIN') return true;
      const assigned = u.project_assignments?.some((pa) => pa.project_id === activeProjectId);
      return assigned;
    }

    return true;
  });

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-5 mr-5 ml-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PH title="Users & Access Management" sub="Direct user account creation, project assignments, and CRM access control" />

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1" onChange={(e: any) => setSearch(e.target.value)}>
          <SrchBar placeholder="Search users..." />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as 'all' | 'active')}
            className="px-3 py-2 bg-card border border-border rounded-lg text-xs font-medium outline-none focus:ring-1 focus:ring-primary shadow-sm"
          >
            <option value="active">Active Project Only</option>
            <option value="all">All Users</option>
          </select>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-3 h-3" /> Create User
          </button>
        </div>
      </div>

      <Card noPad>
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No users found for the current filters.</div>
        ) : (
          filteredUsers.map((u, i) => (
            <div
              key={u.id || i}
              className={`flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 ${
                i < filteredUsers.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                {u.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{u.name}</p>
                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                  <p className="text-[10px] text-muted-foreground truncate">
                    {formatRole(u.role)} • {u.email || u.username}
                  </p>
                  {u.crm_role && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-blue-50 text-[#2648E7] border border-blue-200">
                      + {u.crm_role === 'CRM_MANAGER' ? 'CRM Manager' : 'Sales Executive'}
                    </span>
                  )}
                </div>

                {/* Project Assignment Display */}
                <div className="mt-1">
                  {u.role === 'BUILDER' || u.role === 'ADMIN' ? (
                    <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-medium">
                      All Projects (Admin/Builder)
                    </span>
                  ) : u.project_assignments && u.project_assignments.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {u.project_assignments.map((pa) => (
                        <span
                          key={pa.project_id}
                          className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border"
                        >
                          {pa.project.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-red-500 font-medium flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      Not assigned to any projects
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto mt-2 sm:mt-0">
                <Chip color="green">Active</Chip>
                {u.role !== 'BUILDER' && u.role !== 'ADMIN' && (
                  <button
                    onClick={() => openManageModal(u)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-[11px] font-medium"
                    title="Manage Access & CRM"
                  >
                    <Settings2 size={14} />
                    <span>Manage Access</span>
                  </button>
                )}
                <button
                  onClick={() => handleDelete(u.id, u.name)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                  title="Remove user"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-sm font-bold">Create User Account</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-4 overflow-y-auto space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs">{formError}</div>}

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Email ID (Login Username) *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
                    value={formIdentifier}
                    onChange={(e) => setFormIdentifier(e.target.value)}
                    placeholder="user@company.com or username"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Password *</label>
                  <input
                    type="password"
                    required
                    className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">ERP Role *</label>
                    <select
                      required
                      className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as any)}
                    >
                      <option value="BUILDER">Builder</option>
                      <option value="PROJECT_MANAGER">Project Manager</option>
                      <option value="SITE_SUPERVISOR">Site Supervisor</option>
                      <option value="ACCOUNTANT">Accountant</option>
                      <option value="INVENTORY_MANAGER">Inventory Manager</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+91..."
                    />
                  </div>
                </div>

                {/* CRM Access Checkbox (Dual Role) */}
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formCrmAccess}
                      onChange={(e) => setFormCrmAccess(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary accent-primary"
                    />
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-[#2648E7]" />
                      <span className="text-xs font-bold text-slate-800">Grant CRM Access (Dual Role)</span>
                    </div>
                  </label>

                  {formCrmAccess && (
                    <div className="pl-6 space-y-1.5 animate-in fade-in">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">Select CRM Role</label>
                      <select
                        value={formCrmRole}
                        onChange={(e) => setFormCrmRole(e.target.value as any)}
                        className="w-full p-2 bg-white border border-border rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="CRM_MANAGER">CRM Manager (Team Leads, Leaderboard & Reports)</option>
                        <option value="TELECALLER">Sales Executive / Telecaller (Own Leads Only)</option>
                      </select>
                      <p className="text-[10px] text-slate-500">
                        This user will have access to both ERP and CRM, with the ERP/CRM switcher in the sidebar.
                      </p>
                    </div>
                  )}
                </div>

                {formRole !== 'BUILDER' && projects.length > 0 && (
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                      Assign to Projects (Optional)
                    </label>
                    <div className="bg-muted border border-border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                      {projects.map((p) => (
                        <label key={p.id} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            className="rounded border-border text-primary focus:ring-primary accent-primary"
                            checked={formProjectIds.includes(p.id)}
                            onChange={(e) => {
                              if (e.target.checked) setFormProjectIds([...formProjectIds, p.id]);
                              else setFormProjectIds(formProjectIds.filter((id) => id !== p.id));
                            }}
                          />
                          <span className="text-xs text-foreground group-hover:text-primary transition-colors">
                            {p.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border flex gap-2 -mx-4 -mb-4 pt-4 px-4 bg-muted/30 rounded-b-2xl pb-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium flex justify-center items-center hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Access Modal */}
      {manageUser && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <div>
                <h2 className="text-sm font-bold">Manage User Access</h2>
                <p className="text-[10px] text-muted-foreground">
                  {manageUser.name} ({formatRole(manageUser.role)})
                </p>
              </div>
              <button onClick={() => setManageUser(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              {/* CRM Access Section */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={manageCrmAccess}
                    onChange={(e) => setManageCrmAccess(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary accent-primary"
                  />
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#2648E7]" />
                    <span className="text-xs font-bold text-slate-800">Enable CRM Access for this User</span>
                  </div>
                </label>

                {manageCrmAccess && (
                  <div className="pl-6 space-y-1.5 animate-in fade-in">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">CRM Role</label>
                    <select
                      value={manageCrmRole}
                      onChange={(e) => setManageCrmRole(e.target.value as any)}
                      className="w-full p-2 bg-white border border-border rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="CRM_MANAGER">CRM Manager (Team Leads, Leaderboard & Reports)</option>
                      <option value="TELECALLER">Sales Executive / Telecaller (Own Leads Only)</option>
                    </select>
                    <p className="text-[10px] text-slate-500">
                      User can now switch between ERP and CRM from their sidebar.
                    </p>
                  </div>
                )}
              </div>

              {/* Project Assignments */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Assigned Projects
                </label>

                <div className="bg-muted border border-border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                  {projects.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">No projects available</p>
                  ) : (
                    projects.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="rounded border-border text-primary focus:ring-primary accent-primary"
                          checked={manageProjectIds.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) setManageProjectIds([...manageProjectIds, p.id]);
                            else setManageProjectIds(manageProjectIds.filter((id) => id !== p.id));
                          }}
                        />
                        <span className="text-xs text-foreground group-hover:text-primary transition-colors">
                          {p.name}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-border flex gap-2 p-4 bg-muted/30 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setManageUser(null)}
                className="flex-1 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleManageSave}
                disabled={managing}
                className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium flex justify-center items-center hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {managing ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
