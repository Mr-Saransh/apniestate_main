import { useEffect, useState } from 'react';
import { resignationsApi, Resignation } from '@/api/resignations';
import { useAuth } from '@/context/AuthContext';
import { UserMinus, Check, X, Loader2 } from 'lucide-react';

export default function CompanyResignationsPage() {
  const { user } = useAuth();
  const [resignations, setResignations] = useState<Resignation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchResignations();
  }, [user]);

  const fetchResignations = async () => {
    try {
      setLoading(true);
      const res = await resignationsApi.getAll();
      if (res.success && res.data) {
        setResignations(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      setActionLoading(id);
      await resignationsApi.review(id, status);
      await fetchResignations();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && resignations.length === 0) {
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
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Resignations</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Review resignation requests from members of {user?.company.name}</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {resignations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>No resignation requests found.</p>
          </div>
        ) : (
          resignations.map(resig => (
            <div key={resig.id} style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserMinus size={20} color="var(--color-text-muted)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{resig.user?.name}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{resig.user?.email} • {resig.user?.role.replace('_', ' ')}</p>
                  </div>
                </div>
                
                <div style={{ background: 'var(--color-bg)', padding: '16px', borderRadius: '8px', marginBottom: '16px', maxWidth: '600px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Reason for resignation:</p>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>"{resig.reason}"</p>
                  
                  {resig.last_working_day && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600 }}>Requested Last Working Day:</p>
                      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{new Date(resig.last_working_day).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Submitted on {new Date(resig.created_at).toLocaleDateString()}
                </div>
              </div>

              <div>
                {resig.status === 'PENDING' ? (
                  <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                    <button 
                      onClick={() => handleAction(resig.id, 'APPROVED')}
                      disabled={actionLoading === resig.id}
                      className="btn btn-primary"
                      style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                    >
                      {actionLoading === resig.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Approve & Revoke Access
                    </button>
                    <button 
                      onClick={() => handleAction(resig.id, 'REJECTED')}
                      disabled={actionLoading === resig.id}
                      className="btn btn-outline"
                      style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <X size={16} /> Reject Request
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, display: 'inline-block', marginBottom: '8px',
                      background: resig.status === 'APPROVED' ? 'var(--color-danger-light)' : 'var(--color-bg)',
                      color: resig.status === 'APPROVED' ? 'var(--color-danger)' : 'var(--color-text-muted)'
                    }}>
                      {resig.status}
                    </span>
                    {resig.reviewer && (
                      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        Reviewed by {resig.reviewer.name}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
