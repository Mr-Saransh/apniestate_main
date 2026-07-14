import { useState, type FormEvent } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/api/client';
import { AlertCircle, Eye, EyeOff, ShieldCheck, MapPin, TrendingUp, Users } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import '@/styles/login.css';

export default function SignupPage() {
  const { signup, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
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

  // We remove the generic isAuthenticated redirect to handle the onboarding explicitly in handleSubmit

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await signup({ email, password });
      // New signups are auto-provisioned a workspace now
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to create account. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page-premium">
      <div className="login-container">
        <div className="login-card">
          {/* Left Branding Side */}
          <div className="login-left">
            <div className="login-left-content">
              <div className="login-image-container">
                <div className="login-image-overlay"></div>
                <div className="login-placeholder-img"></div>
              </div>
              <div className="login-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Logo size="xl" />
                <p className="login-brand-tagline" style={{ marginTop: '12px' }}>BUILDING TOMORROW, TOGETHER</p>
              </div>
            </div>
          </div>

          {/* Right Form Side */}
          <div className="login-right">
            <div className="login-form-content">
              <h2>Create an Account</h2>
              <p className="login-subtitle">Join the future of construction management</p>

              {error && (
                <div className="login-error">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="signup-email">Email</label>
                  <input
                    id="signup-email"
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
                  <label className="form-label" htmlFor="signup-password">Password</label>
                  <div className="password-input-wrap">
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Create a password (min 6 chars)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      minLength={6}
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

                <button
                  type="submit"
                  className="btn btn-primary btn-full login-btn"
                  disabled={submitting}
                  style={{ marginTop: '24px' }}
                >
                  {submitting ? 'Creating account...' : 'Sign Up'}
                </button>
              </form>

              <div className="login-footer-links">
                <p>Already have an account? <Link to="/login">Sign in</Link></p>
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
    </div>
  );
}
