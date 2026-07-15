import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { subscriptionApi } from '@/api/subscription';
import { Clock, RefreshCw } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import '@/styles/subscription.css';

export default function PendingApprovalPage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [checking, setChecking] = useState(false);

  // Poll for status changes every 30 seconds
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await subscriptionApi.getStatus();
        if (res.success && res.data) {
          const status = res.data.subscription_status;
          if (status === 'TRIAL_ACTIVE' || status === 'ACTIVE') {
            updateUser({ ...user!, subscription_status: status, onboarded: true });
            navigate('/dashboard', { replace: true });
          } else if (status === 'NONE') {
            // Trial was rejected
            updateUser({ ...user!, subscription_status: 'NONE' });
            navigate('/subscription', { replace: true });
          }
        }
      } catch {
        // Silently ignore poll errors
      }
    };

    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [user, navigate, updateUser]);

  const handleCheckNow = async () => {
    setChecking(true);
    try {
      const res = await subscriptionApi.getStatus();
      if (res.success && res.data) {
        const status = res.data.subscription_status;
        if (status === 'TRIAL_ACTIVE' || status === 'ACTIVE') {
          updateUser({ ...user!, subscription_status: status, onboarded: true });
          navigate('/dashboard', { replace: true });
        } else if (status === 'NONE') {
          updateUser({ ...user!, subscription_status: 'NONE' });
          navigate('/subscription', { replace: true });
        }
      }
    } catch {
      // ignore
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="pending-approval-page">
      <div className="pending-card">
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
          <Logo size="lg" />
        </div>

        <div className="pending-icon">
          <Clock size={36} color="#f59e0b" />
        </div>

        <h2>Awaiting Approval</h2>
        <p className="pending-desc">
          Your 15-day free trial request has been submitted successfully.
          The Apni Estate team will review and approve your account shortly.
          You'll get full access once approved.
        </p>

        <div className="status-badge">
          <span className="dot" />
          Pending Admin Approval
        </div>

        <div style={{ marginTop: '16px' }}>
          <button
            onClick={handleCheckNow}
            disabled={checking}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
            {checking ? 'Checking...' : 'Check Status'}
          </button>
        </div>

        <button className="logout-link" onClick={logout}>
          Sign out and use a different account
        </button>
      </div>
    </div>
  );
}
