import { useState, useEffect, type FormEvent } from 'react';
import { usersApi, type User, type CreateUserData } from '@/api/users';
import { invitationsApi, type Invitation } from '@/api/invitations';
import Modal from '@/components/shared/Modal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { Plus, Users, Search, MoreVertical, UserCheck, UserX, Mail, UserMinus, ChevronRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import '@/styles/users-page.css';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
      const [usersRes, invRes] = await Promise.all([
        usersApi.getAll(),
        invitationsApi.getCompanyInvitations().catch(() => ({ data: [] as Invitation[] })) // graceful fallback
      ]);
      if (usersRes.data) setUsers(usersRes.data);
      if (invRes.data) setInvitations(invRes.data);
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

  const formatRole = (role: string) =>
    role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const pendingInvitations = invitations.filter(inv => inv.status === 'PENDING');

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage team members and their roles</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} id="create-user-btn">
          <Plus size={18} />
          Add User
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <Link to="/users/invitations" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', color: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={24} color="var(--color-primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Invitations ({pendingInvitations.length})</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Manage pending invites to your workspace</p>
            </div>
          </div>
          <ChevronRight size={20} color="var(--color-text-muted)" />
        </Link>
        <Link to="/users/resignations" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', color: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserMinus size={24} color="var(--color-danger)" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Resignations</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Review employee resignation requests</p>
            </div>
          </div>
          <ChevronRight size={20} color="var(--color-text-muted)" />
        </Link>
      </div>
      
      {/* Pending Invitations Section (Visible if any exist) */}
      {pendingInvitations.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div className="section-title">Pending Invitations</div>
          <div className="card">
            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-responsive" style={{ border: 'none' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Invited By</th>
                      <th>Status</th>
                      <th>Sent Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingInvitations.map((inv) => (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 500 }}>{inv.email}</td>
                        <td>
                          <span className="badge badge-role">{formatRole(inv.role)}</span>
                        </td>
                        <td style={{ color: 'var(--color-text-secondary)' }}>{inv.inviter?.name || 'Unknown'}</td>
                        <td>
                          <span className="invitation-badge invitation-pending">
                            <Clock size={12} style={{ marginRight: 4 }} /> Pending
                          </span>
                        </td>
                        <td style={{ color: 'var(--color-text-muted)' }}>
                          {new Date(inv.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {(users.length > 0 || searchQuery) && (
        <div style={{ marginBottom: 'var(--space-5)', maxWidth: 400 }}>
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search active users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="search-users"
            />
          </div>
        </div>
      )}

      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={<Users size={36} />}
          title={searchQuery ? 'No users found' : 'No users yet'}
          description={searchQuery ? 'Try adjusting your search terms' : 'Add your first team member'}
          action={
            !searchQuery ? (
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                <Plus size={18} /> Add User
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="section-title">Active Team Members</div>
          
          {/* Desktop Table */}
          <div className="card users-desktop-table">
            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-responsive" style={{ border: 'none' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th style={{ width: 48 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <div className="avatar avatar-sm">
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{user.name}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--color-text-secondary)' }}>{user.email}</td>
                        <td>
                          <span className="badge badge-role">{formatRole(user.role)}</span>
                        </td>
                        <td style={{ color: 'var(--color-text-muted)' }}>{user.phone || '—'}</td>
                        <td>
                          {user.is_active ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-success)', fontSize: 'var(--font-size-sm)' }}>
                              <UserCheck size={14} /> Active
                            </span>
                          ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                              <UserX size={14} /> Inactive
                            </span>
                          )}
                        </td>
                        <td style={{ color: 'var(--color-text-muted)' }}>
                          {new Date(user.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-icon">
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Mobile List View */}
          <div className="users-mobile-list">
            {filteredUsers.map(user => (
              <div key={user.id} className="user-mobile-card">
                <div className="user-mobile-header">
                  <div className="avatar avatar-md">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="user-mobile-info">
                    <div className="user-mobile-name">{user.name}</div>
                    <div className="user-mobile-email">{user.email}</div>
                  </div>
                  <button className="btn btn-ghost btn-icon" style={{ padding: 4 }}>
                    <MoreVertical size={20} />
                  </button>
                </div>
                <div className="user-mobile-details">
                  <div className="user-mobile-row">
                    <span>Role:</span>
                    <span className="badge badge-role">{formatRole(user.role)}</span>
                  </div>
                  <div className="user-mobile-row">
                    <span>Phone:</span>
                    <span>{user.phone || '—'}</span>
                  </div>
                  <div className="user-mobile-row">
                    <span>Status:</span>
                    {user.is_active ? (
                      <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <UserCheck size={14} /> Active
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <UserX size={14} /> Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        title="Add New User"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleCreate as any}
              disabled={creating || !formName || !formEmail || !formPassword}
              id="submit-create-user"
            >
              {creating ? 'Creating...' : 'Add User'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {formError && <div className="login-error"><span>{formError}</span></div>}
          <div className="form-group">
            <label className="form-label" htmlFor="user-name">Full Name *</label>
            <input id="user-name" type="text" className="form-input" placeholder="Enter full name" value={formName} onChange={(e) => setFormName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="user-email">Email *</label>
            <input id="user-email" type="email" className="form-input" placeholder="Enter email address" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="user-password">Password *</label>
            <input id="user-password" type="password" className="form-input" placeholder="Minimum 8 characters" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} required minLength={8} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="user-role">Role</label>
              <select id="user-role" className="form-input form-select" value={formRole} onChange={(e) => setFormRole(e.target.value as User['role'])}>
                <option value="SITE_SUPERVISOR">Site Supervisor</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="INVENTORY_MANAGER">Inventory Manager</option>
                <option value="BUILDER">Builder</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="user-phone">Phone</label>
              <input id="user-phone" type="tel" className="form-input" placeholder="Phone number" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
