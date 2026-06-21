import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/api/client';
import { Building2, AlertCircle, Eye, EyeOff, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="loading-page" style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login({ email, password });
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
    <div className="login-page">
      {/* Hero / Brand Section */}
      <div className="login-brand-premium">
        <div className="login-brand-content">
          <div>
            <div className="login-brand-logo-wrap">
              <Building2 size={32} color="#ffffff" />
              <span className="login-brand-name">Apni Estate</span>
            </div>
            
            <h1 className="login-hero-title">
              Build your dreams <br/><span className="text-gradient">together.</span>
            </h1>
            <p className="login-hero-subtitle">
              The easy-to-use construction manager built for builders, supervisors, and field teams.
            </p>

            <div className="login-features">
              <div className="feature-item">
                <CheckCircle2 size={18} className="feature-icon" />
                <span>Easy daily updates from the site</span>
              </div>
              <div className="feature-item">
                <CheckCircle2 size={18} className="feature-icon" />
                <span>Simple workforce attendance logging</span>
              </div>
              <div className="feature-item">
                <CheckCircle2 size={18} className="feature-icon" />
                <span>Track materials and costs in one tap</span>
              </div>
            </div>
          </div>

          <div className="trust-badge">
            <ShieldCheck size={18} color="var(--color-success)" />
            <span>Enterprise-grade security and reliability</span>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="login-form-wrapper">
        <div className="login-form-container animate-fade-in">
          <div className="login-mobile-hero">
            <img src="/images/premium_login_bg.png" alt="Premium Construction Management" className="login-mobile-hero-img" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-2)' }}>
            <Building2 size={24} color="var(--color-primary)" />
            <span style={{ fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-md)' }}>Apni Estate</span>
          </div>

          <h2 className="login-form-title">Sign in to your account</h2>
          <p className="login-form-subtitle">Enter your credentials to access your dashboard</p>

          {error && (
            <div className="login-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                className="form-input premium-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="login-password">Password</label>
                <a href="#" className="login-forgot">Forgot password?</a>
              </div>
              <div className="password-input-wrap">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input premium-input"
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
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-full premium-submit"
              disabled={submitting}
              id="login-submit"
            >
              {submitting ? (
                <>
                  <div className="spinner spinner-sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />
                  <span>Authenticating...</span>
                </>
              ) : (
                'Continue to Dashboard'
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>Don't have an account? <a href="#">Contact Support</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
