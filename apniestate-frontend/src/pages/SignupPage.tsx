import { useState, type FormEvent } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/api/auth';
import { ApiError } from '@/api/client';
import { AlertCircle, Eye, EyeOff, ShieldCheck, MapPin, TrendingUp, Users } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import '@/styles/login.css';

export default function SignupPage() {
  const { signup, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const handleSendOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email to receive an OTP.');
      setInfoMessage('');
      return;
    }
    setError('');
    setInfoMessage('');
    setSendingOtp(true);
    try {
      await authApi.sendOtp(cleanEmail, 'signup');
      setOtpSent(true);
      setInfoMessage('OTP sent to your email. Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

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
    setInfoMessage('');
    setSubmitting(true);

    try {
      if (!otpSent) {
        setError('Please request and enter the OTP first.');
        setSubmitting(false);
        return;
      }
      
      const cleanEmail = email.trim().toLowerCase();
      const res = await signup({ email: cleanEmail, password, otp: otp.trim() });
      
      // Navigate based on profile/subscription status
      if (!res.user.profile_completed) {
        navigate('/complete-profile', { replace: true });
      } else if (res.user.subscription_status === 'NONE') {
        navigate('/subscription', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
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

  const isExistingAccount = error.toLowerCase().includes('already exists');

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

              {infoMessage && (
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10B981',
                    fontSize: '13px',
                    marginBottom: '16px',
                  }}
                >
                  <ShieldCheck size={18} />
                  <span>{infoMessage}</span>
                </div>
              )}

              {error && (
                <div className="login-error" style={{ marginBottom: '16px' }}>
                  <AlertCircle size={18} />
                  <div>
                    <span>{error}</span>
                    {isExistingAccount && (
                      <div style={{ marginTop: '6px' }}>
                        <Link 
                          to="/login" 
                          style={{ color: '#2648E7', fontWeight: 600, textDecoration: 'underline', fontSize: '13px' }}
                        >
                          Sign in to your account &rarr;
                        </Link>
                      </div>
                    )}
                  </div>
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

                {otpSent && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="signup-otp">OTP Code</label>
                    <input
                      id="signup-otp"
                      type="text"
                      className="form-input"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      maxLength={6}
                    />
                  </div>
                )}

                {!otpSent ? (
                  <button
                    type="button"
                    className="btn btn-outline btn-full"
                    onClick={handleSendOtp}
                    disabled={sendingOtp || !email}
                    style={{ marginTop: '24px' }}
                  >
                    {sendingOtp ? 'Sending...' : 'Send OTP to Email'}
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn btn-primary btn-full login-btn"
                    disabled={submitting}
                    style={{ marginTop: '24px' }}
                  >
                    {submitting ? 'Creating account...' : 'Sign Up'}
                  </button>
                )}
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
