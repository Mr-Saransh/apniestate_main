import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/api/client';
import { HardHat, Briefcase, Calculator, Shield, ArrowRight, AlertCircle } from 'lucide-react';
import '@/styles/login.css'; 

export default function OnboardingPage() {
  const { user, updateUserRole, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const roles = [
    { id: 'SITE_SUPERVISOR', name: 'Site Supervisor', icon: HardHat, description: 'Manage sites, workers, and inventory on the ground.', active: true },
    { id: 'PROJECT_MANAGER', name: 'Project Manager', icon: Briefcase, description: 'Oversee entire projects, budgets, and milestones.', active: false },
    { id: 'ACCOUNTANT', name: 'Accountant', icon: Calculator, description: 'Handle finances, invoices, and expense approvals.', active: false },
    { id: 'ADMIN', name: 'Admin / Owner', icon: Shield, description: 'Full system access and company configuration.', active: false },
  ];

  const handleContinue = async () => {
    if (!selectedRole) return;
    setError('');
    setSubmitting(true);
    try {
      await updateUserRole(selectedRole);
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to update role. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page-premium" style={{ alignItems: 'center', padding: '40px 20px', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: '800px', width: '100%', background: 'var(--color-surface)', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid var(--color-border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', color: 'var(--color-text)', marginBottom: '12px' }}>Welcome, {user?.name || 'Builder'}!</h1>
          <p style={{ fontSize: '18px', color: 'var(--color-text-muted)' }}>What is your primary role at the company?</p>
        </div>

        {error && (
          <div className="login-error" style={{ marginBottom: '24px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            
            return (
              <div 
                key={role.id}
                onClick={() => role.active && setSelectedRole(role.id)}
                style={{
                  border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: '16px',
                  padding: '24px',
                  cursor: role.active ? 'pointer' : 'not-allowed',
                  opacity: role.active ? 1 : 0.5,
                  background: isSelected ? 'rgba(0, 102, 255, 0.05)' : 'transparent',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {!role.active && (
                  <span style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '12px', background: 'var(--color-border)', padding: '4px 8px', borderRadius: '12px', fontWeight: 600 }}>Coming Soon</span>
                )}
                <Icon size={32} color={isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)'} style={{ marginBottom: '16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>{role.name}</h3>
                <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{role.description}</p>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleContinue}
            disabled={!selectedRole || submitting}
            style={{ padding: '12px 32px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {submitting ? 'Saving...' : 'Continue to Dashboard'}
            {!submitting && <ArrowRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
