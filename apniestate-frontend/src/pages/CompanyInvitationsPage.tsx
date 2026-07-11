import { useEffect, useState } from 'react';
import { invitationsApi, Invitation } from '@/api/invitations';
import { Mail, Check, X, Loader2, Plus, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/api/auth';

export default function CompanyInvitationsPage() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Create Modal
  const [showCreate, setShowCreate] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('WORKER');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchInvitations();
  }, [user]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const res = await invitationsApi.getCompanyInvitations();
      if (res.success && res.data) {
        setInvitations(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'cancel' | 'resend') => {
    try {
      setActionLoading(id);
      await invitationsApi.action(id, action);
      await fetchInvitations();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      setCreating(true);
      await invitationsApi.create({ email, role });
      setShowCreate(false);
      setEmail('');
      setRole('WORKER');
      await fetchInvitations();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  if (loading && invitations.length === 0) {
    return (
      <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Company Invitations</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Manage invites sent to join {user?.company.name}</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} /> Invite User
        </button>
      </div>

      <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '13px', textTransform: 'uppercase' }}>User Email</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '13px', textTransform: 'uppercase' }}>Role</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '13px', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '13px', textTransform: 'uppercase' }}>Invited On</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '13px', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invitations.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No invitations found.
                </td>
              </tr>
            ) : (
              invitations.map(inv => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '16px', fontWeight: 500 }}>{inv.email}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ padding: '4px 8px', background: 'var(--color-bg)', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                      {inv.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600,
                      background: inv.status === 'ACCEPTED' ? 'var(--color-warning-light)' : inv.status === 'APPROVED' ? 'var(--color-success-light)' : 'var(--color-bg)',
                      color: inv.status === 'ACCEPTED' ? 'var(--color-warning)' : inv.status === 'APPROVED' ? 'var(--color-success)' : 'var(--color-text-muted)'
                    }}>
                      {inv.status === 'ACCEPTED' ? 'NEEDS APPROVAL' : inv.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--color-text-muted)', fontSize: '14px' }}>
                    {new Date(inv.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {inv.status === 'ACCEPTED' && (
                        <button 
                          onClick={() => handleAction(inv.id, 'approve')}
                          disabled={actionLoading === inv.id}
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '13px' }}
                        >
                          {actionLoading === inv.id ? <Loader2 size={14} className="animate-spin" /> : 'Approve'}
                        </button>
                      )}
                      {(inv.status === 'PENDING' || inv.status === 'EXPIRED') && (
                        <button 
                          onClick={() => handleAction(inv.id, 'resend')}
                          disabled={actionLoading === inv.id}
                          className="btn btn-outline"
                          style={{ padding: '6px 12px', fontSize: '13px' }}
                        >
                          Resend
                        </button>
                      )}
                      {(inv.status === 'PENDING' || inv.status === 'ACCEPTED') && (
                        <button 
                          onClick={() => handleAction(inv.id, 'cancel')}
                          disabled={actionLoading === inv.id}
                          className="btn btn-outline"
                          style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--color-surface)', width: '100%', maxWidth: '400px', borderRadius: '16px', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Invite User</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-control"
                  placeholder="user@example.com"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Role</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="form-control"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                >
                  <option value="PROJECT_MANAGER">Project Manager</option>
                  <option value="SITE_SUPERVISOR">Site Supervisor</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="INVENTORY_MANAGER">Inventory Manager</option>
                  <option value="WORKER">Worker</option>
                </select>
              </div>
              <button 
                type="submit" 
                disabled={creating}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center' }}
              >
                {creating ? <Loader2 size={20} className="animate-spin" /> : 'Send Invitation'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
