import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { invitationsApi, Invitation } from '@/api/invitations';
import { Mail, Check, X, Loader2, Building2 } from 'lucide-react';

export default function MyInvitationsPage() {
  const { user, switchWorkspace } = useAuth();
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const res = await invitationsApi.getMyInvitations();
      if (res.success && res.data) {
        setInvitations(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'accept' | 'reject', companyId?: string, role?: string) => {
    try {
      setActionLoading(id);
      await invitationsApi.action(id, action);
      
      if (action === 'accept' && companyId && role) {
        // Automatically switch workspace after accepting
        await switchWorkspace(companyId, role);
        navigate('/dashboard');
      } else {
        await fetchInvitations();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <Mail size={32} color="var(--color-primary)" />
        <h1 style={{ fontSize: '28px', fontWeight: 700 }}>My Invitations</h1>
      </div>

      {invitations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 20px', background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
          <Building2 size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>No Pending Invitations</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>You haven't received any invitations to join a workspace yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {invitations.map(inv => (
            <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>{inv.company?.name}</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '8px' }}>
                  Invited by: {inv.inviter?.name} ({inv.inviter?.email})
                </p>
                <div style={{ display: 'inline-flex', padding: '4px 8px', background: 'var(--color-bg)', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                  Role: {inv.role.replace('_', ' ')}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                {inv.status === 'PENDING' ? (
                  <>
                    <button 
                      onClick={() => handleAction(inv.id, 'reject')}
                      disabled={actionLoading === inv.id}
                      style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
                    >
                      <X size={16} /> Reject
                    </button>
                    <button 
                      onClick={() => handleAction(inv.id, 'accept', inv.company_id, inv.role)}
                      disabled={actionLoading === inv.id}
                      style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-success)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
                    >
                      {actionLoading === inv.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} 
                      Accept & Join
                    </button>
                  </>
                ) : (
                  <span style={{ 
                    padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    background: inv.status === 'ACCEPTED' ? 'var(--color-success-light)' : 'var(--color-bg)',
                    color: inv.status === 'ACCEPTED' ? 'var(--color-success)' : 'var(--color-text-muted)'
                  }}>
                    {inv.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
