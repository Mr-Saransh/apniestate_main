import { useState, type FormEvent } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/api/client';
import { AlertCircle, Eye, EyeOff, ShieldCheck, MapPin, TrendingUp, Users, Building2, HardHat, Briefcase, Calculator, Loader2 } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import '@/styles/login.css';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [loggingInRole, setLoggingInRole] = useState<string | null>(null);

  const handleDemoLogin = async (demoEmail: string, roleName: string) => {
    setLoggingInRole(roleName);
    try {
      const response = await login({ email: demoEmail, password: 'admin123' });
      if (!response.memberships || response.memberships.length === 0) {
        navigate('/onboarding', { replace: true });
        return;
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Demo login failed', err);
    } finally {
      setLoggingInRole(null);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-page" style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  // Note: we removed the generic `if (isAuthenticated)` check here because we want
  // to handle the post-login routing explicitly within `handleSubmit` now.

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await login({ email, password });
      
      if (!response.memberships || response.memberships.length === 0) {
        // No memberships -> Must create a company
        navigate('/onboarding', { replace: true });
        return;
      }

      // For now, route directly to the dashboard
      navigate('/dashboard', { replace: true });
      
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to connect to server. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page-premium">
      <div className="login-container">
        <div className="login-card">
          {/* Left Branding Side - Background handled via CSS */}
          <div className="login-left"></div>

          {/* Right Form Side */}
          <div className="login-right">
            <div className="login-form-content">
              <div className="form-logo-wrapper">
                <Logo size="lg" />
              </div>
              <h2>Welcome Back!</h2>
              <p className="login-subtitle">Sign in to continue</p>

              {error && (
                <div className="login-error">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="login-email">Email</label>
                  <input
                    id="login-email"
                    type="email"
                    className="form-input"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="login-password">Password</label>
                  <div className="password-input-wrap">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-actions">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>
                  <a href="#" className="forgot-password">Forgot Password?</a>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full login-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Authenticating...' : 'Login'}
                </button>
              </form>

              <div className="login-footer-links" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <p style={{ margin: 0 }}>Don't have an account? <Link to="/">Sign up</Link></p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.5 }}>
                  <div style={{ flex: 1, height: '1px', background: 'currentColor' }} />
                  <span style={{ fontSize: '12px', textTransform: 'uppercase' }}>or</span>
                  <div style={{ flex: 1, height: '1px', background: 'currentColor' }} />
                </div>
                <button 
                  onClick={() => setShowDemoModal(true)}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', padding: '6px 12px', fontSize: '13px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: '#FFFFFF', transition: 'all 0.2s ease' }}
                >
                  View Demo Accounts
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Trust Badges */}
      <div className="login-footer-badges">
        <div className="badge-item">
          <ShieldCheck size={24} color="var(--color-cta)" />
          <div>
            <h4>Secure & Reliable</h4>
            <p>Your data is safe with us</p>
          </div>
        </div>
        <div className="badge-item">
          <MapPin size={24} color="var(--color-cta)" />
          <div>
            <h4>Project Control</h4>
            <p>Track everything in real time</p>
          </div>
        </div>
        <div className="badge-item">
          <TrendingUp size={24} color="var(--color-cta)" />
          <div>
            <h4>Cost Management</h4>
            <p>Stay on budget, always</p>
          </div>
        </div>
        <div className="badge-item">
          <Users size={24} color="var(--color-cta)" />
          <div>
            <h4>Team Collaboration</h4>
            <p>Work together, efficiently</p>
          </div>
        </div>
      </div>
      
      {/* Demo Accounts Modal */}
      {showDemoModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative' }}>
            <button 
              onClick={() => setShowDemoModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748B' }}
            >
              ×
            </button>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>Select Demo Account</h3>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '24px' }}>Jump straight into the app with a pre-configured role.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', fontSize: '12px', color: '#475569', marginBottom: '8px', border: '1px solid #E2E8F0' }}>
                <p style={{ marginBottom: '4px' }}><strong>Builder:</strong> admin@gmail.com / admin123</p>
                <p style={{ marginBottom: '4px' }}><strong>Supervisor:</strong> sup1@apniestate.com / admin123</p>
                <p style={{ marginBottom: '4px' }}><strong>Manager:</strong> pm1@apniestate.com / admin123</p>
                <p style={{ margin: 0 }}><strong>Accountant:</strong> accounts@apniestate.com / admin123</p>
              </div>
              <button 
                onClick={() => handleDemoLogin('admin@gmail.com', 'Builder')}
                disabled={loggingInRole !== null}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: '#2648E7', color: 'white', fontWeight: 'bold', fontSize: '14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loggingInRole === 'Builder' ? <Loader2 className="animate-spin w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                Builder (Admin)
              </button>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <button 
                  onClick={() => handleDemoLogin('sup1@apniestate.com', 'Supervisor')}
                  disabled={loggingInRole !== null}
                  style={{ padding: '12px 8px', borderRadius: '12px', backgroundColor: '#EFF6FF', color: '#2648E7', fontWeight: 600, fontSize: '12px', border: '1px solid #DBEAFE', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                >
                  {loggingInRole === 'Supervisor' ? <Loader2 className="animate-spin w-4 h-4" /> : <HardHat className="w-4 h-4" />}
                  Supervisor
                </button>
                <button 
                  onClick={() => handleDemoLogin('pm1@apniestate.com', 'Manager')}
                  disabled={loggingInRole !== null}
                  style={{ padding: '12px 8px', borderRadius: '12px', backgroundColor: '#EFF6FF', color: '#2648E7', fontWeight: 600, fontSize: '12px', border: '1px solid #DBEAFE', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                >
                  {loggingInRole === 'Manager' ? <Loader2 className="animate-spin w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                  Manager
                </button>
                <button 
                  onClick={() => handleDemoLogin('accounts@apniestate.com', 'Accountant')}
                  disabled={loggingInRole !== null}
                  style={{ padding: '12px 8px', borderRadius: '12px', backgroundColor: '#EFF6FF', color: '#2648E7', fontWeight: 600, fontSize: '12px', border: '1px solid #DBEAFE', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                >
                  {loggingInRole === 'Accountant' ? <Loader2 className="animate-spin w-4 h-4" /> : <Calculator className="w-4 h-4" />}
                  Accountant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
