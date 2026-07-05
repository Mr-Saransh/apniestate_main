import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiClient, ApiError } from '@/api/client';
import { ArrowRight, AlertCircle, Building2, UserPlus } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import '@/styles/login.css'; 

export default function OnboardingPage() {
  const { user, updateUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleComplete = async () => {
    if (!companyName.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      // 1. Create company. Backend automatically assigns BUILDER role, updates last_workspace_id, marks onboarded.
      const res = await apiClient.post<{ company: any, membership: any }>('/companies/create', { name: companyName.trim() });
      
      if (res.success && res.data) {
        // 2. Fetch updated user profile since role and onboarded status changed
        const userRes = await apiClient.get<any>('/users/me');
        if (userRes.success && userRes.data) {
          updateUser(userRes.data);
          // Redirect to dashboard (will trigger full reload in typical flow to restore workspace)
          window.location.href = '/dashboard';
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        throw new Error('Failed to create company.');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to complete onboarding. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page-premium" style={{ alignItems: 'center', padding: '40px 20px', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: '600px', width: '100%', background: 'var(--color-surface)', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <Logo size="lg" />
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', color: 'var(--color-text)', marginBottom: '12px' }}>Welcome, {user?.name || 'User'}!</h1>
          <p style={{ fontSize: '18px', color: 'var(--color-text-muted)' }}>Create your company workspace to get started.</p>
        </div>

        {error && (
          <div className="login-error" style={{ marginBottom: '24px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ marginBottom: '32px' }}>
          <label 
            htmlFor="company-name-input" 
            style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}
          >
            Company Name
          </label>
          <div className="search-input-wrapper">
            <Building2 size={18} className="search-icon" style={{ left: 16 }} />
            <input
              id="company-name-input"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Construction Ltd."
              className="form-control"
              style={{ 
                width: '100%', 
                padding: '16px 16px 16px 48px', 
                borderRadius: '12px', 
                border: '1px solid var(--color-border)', 
                background: 'var(--color-input-bg)',
                color: 'var(--color-text)',
                fontSize: '16px' 
              }}
            />
          </div>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={handleComplete}
          disabled={!companyName.trim() || submitting}
          style={{ width: '100%', padding: '14px', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          {submitting ? 'Setting up...' : 'Create Company'}
          {!submitting && <ArrowRight size={20} />}
        </button>

        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>Were you invited to an existing company?</p>
          <Link to="/my-invitations" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={18} />
            Check Invitations
          </Link>
        </div>
      </div>
    </div>
  );
}
