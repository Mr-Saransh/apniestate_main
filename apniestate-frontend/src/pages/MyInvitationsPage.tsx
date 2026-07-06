import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { invitationsApi, Invitation } from '@/api/invitations';
import { Mail, Check, X, Loader2, Building2 } from 'lucide-react';
import '@/styles/my-invitations.css';

export default function MyInvitationsPage() {
  const { switchWorkspace } = useAuth();
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
    <div className="invitations-page">
      <div className="invitations-header">
        <Mail size={32} color="var(--color-primary)" />
        <h1 className="invitations-title">My Invitations</h1>
      </div>

      {invitations.length === 0 ? (
        <div className="invitations-empty">
          <Building2 size={48} className="invitations-empty-icon" />
          <h2>No Pending Invitations</h2>
          <p>You haven't received any invitations to join a workspace yet.</p>
        </div>
      ) : (
        <div className="invitations-list">
          {invitations.map(inv => (
            <div key={inv.id} className="invitation-card">
              <div className="invitation-info">
                <h3>{inv.company?.name}</h3>
                <p className="invitation-meta">
                  Invited by: {inv.inviter?.name} ({inv.inviter?.email})
                </p>
                <div className="invitation-role-badge">
                  Role: {inv.role.replace('_', ' ')}
                </div>
              </div>
              
              <div className="invitation-actions">
                {inv.status === 'PENDING' ? (
                  <>
                    <button 
                      onClick={() => handleAction(inv.id, 'reject')}
                      disabled={actionLoading === inv.id}
                      className="btn-reject"
                    >
                      <X size={16} /> Reject
                    </button>
                    <button 
                      onClick={() => handleAction(inv.id, 'accept', inv.company_id, inv.role)}
                      disabled={actionLoading === inv.id}
                      className="btn-accept"
                    >
                      {actionLoading === inv.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} 
                      Accept & Join
                    </button>
                  </>
                ) : (
                  <span className={`status-badge ${inv.status === 'ACCEPTED' ? 'status-accepted' : 'status-default'}`}>
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
