import React, { useState, useEffect, type FormEvent } from 'react';
import { usersApi, type User, type CreateUserData } from '@/api/users';
import { Plus, X, Trash2 } from 'lucide-react';
import { PH, Card, Chip, SrchBar } from '@/components/shared/FigmaComponents';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<User['role']>('SITE_SUPERVISOR');
  const [formPhone, setFormPhone] = useState('');
  const [formError, setFormError] = useState('');

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
      const data: CreateUserData = {
        name: formName,
        email: formEmail,
        password: formPassword,
        role: formRole,
        phone: formPhone || undefined,
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

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('SITE_SUPERVISOR');
    setFormPhone('');
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

  const formatRole = (role: string) => role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const filteredUsers = users.filter(
    (u) =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-5 mr-5 ml-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PH title="Users" sub="Role-based access management" />

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1" onChange={(e: any) => setSearch(e.target.value)}>
          <SrchBar placeholder="Search users..." />
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-3 h-3" /> Invite
        </button>
      </div>

      <Card noPad>
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No users found</div>
        ) : (
          filteredUsers.map((u, i) => (
            <div key={u.id || i} className={`flex items-center gap-3 px-4 py-3 ${i < filteredUsers.length - 1 ? "border-b border-border" : ""}`}>
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                {u.name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{u.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{formatRole(u.role)} · {u.email}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Chip color="green">Active</Chip>
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

      {/* Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-sm font-bold">Invite New User</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-4 overflow-y-auto space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs">{formError}</div>}

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Full Name *</label>
                  <input type="text" required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formName} onChange={e => setFormName(e.target.value)} placeholder="John Doe" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address *</label>
                  <input type="email" required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="john@example.com" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Temporary Password *</label>
                  <input type="password" required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="••••••••" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Role *</label>
                    <select required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formRole} onChange={e => setFormRole(e.target.value as any)}>
                      <option value="BUILDER">Builder (Admin)</option>
                      <option value="SITE_SUPERVISOR">Site Supervisor</option>
                      <option value="PROJECT_MANAGER">Project Manager</option>
                      <option value="ACCOUNTANT">Accountant</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone (Optional)</label>
                    <input type="tel" className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="+91..." />
                  </div>
                </div>
              </div>

              <div className="border-t border-border flex gap-2 -mx-4 -mb-4 pt-4 px-4 bg-muted/30 rounded-b-2xl pb-4 mt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium flex justify-center items-center hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {creating ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
