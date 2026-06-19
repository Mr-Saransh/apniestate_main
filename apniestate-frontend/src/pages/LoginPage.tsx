import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/api/client';
import { Building2, Shield, Award, Sparkles, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="loading-page" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
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
      {/* Left — Brand Panel */}
      <div className="login-brand">
        <div className="login-brand-content">
          <div className="login-brand-logo">
            <Building2 size={36} />
          </div>
          <h1>APNI ESTATE</h1>
          <p>Creative Development Together</p>
          <p style={{ marginTop: 'var(--space-4)', fontSize: 'var(--font-size-sm)', opacity: 0.6 }}>
            Your all-in-one construction ERP platform for managing projects, sites, workforce, and finances — seamlessly.
          </p>
        </div>

        <div className="login-features">
          <div className="login-feature">
            <div className="login-feature-icon">
              <Shield size={22} />
            </div>
            <div className="login-feature-label">Trust &<br />Reliability</div>
          </div>
          <div className="login-feature">
            <div className="login-feature-icon">
              <Award size={22} />
            </div>
            <div className="login-feature-label">Premium &<br />Quality</div>
          </div>
          <div className="login-feature">
            <div className="login-feature-icon">
              <Sparkles size={22} />
            </div>
            <div className="login-feature-label">Clean &<br />Modern</div>
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="login-form-side">
        <div className="login-form-container">
          <h2 className="login-form-title">Welcome Back!</h2>
          <p className="login-form-subtitle">Sign in to continue</p>

          {error && (
            <div className="login-error" style={{ marginBottom: 'var(--space-5)' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
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
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    padding: '0.25rem',
                    display: 'flex',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="login-remember">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className="login-forgot">Forgot Password?</a>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting}
              id="login-submit"
              style={{ width: '100%', marginTop: 'var(--space-2)' }}
            >
              {submitting ? (
                <>
                  <div className="spinner spinner-sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />
                  <span>Signing in...</span>
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <div className="login-signup">
            Don't have an account? <a href="#">Sign up</a>
          </div>
        </div>
      </div>
    </div>
  );
}
