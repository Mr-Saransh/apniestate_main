import { useState, type FormEvent } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/api/auth';
import { ApiError } from '@/api/client';
import { AlertCircle, Eye, EyeOff, ShieldCheck, MapPin, TrendingUp, Users, Building2, HardHat, Briefcase, Calculator, Loader2 } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import '@/styles/login.css';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!identifier) {
      setError('Please enter your email to receive an OTP.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.sendOtp(identifier);
      setOtpSent(true);
      setError('OTP sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
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
    setLoading(true);

    try {
      const credentials = loginMethod === 'password' 
        ? { identifier, password } 
        : { identifier, otp };
      
      const response = await login(credentials);
      
      const { user } = response;
      if (!user.profile_completed) {
        navigate('/complete-profile', { replace: true });
        return;
      }
      if (user.subscription_status === 'NONE') {
        navigate('/subscription', { replace: true });
        return;
      }
      if (user.subscription_status === 'PENDING_TRIAL') {
        navigate('/pending-approval', { replace: true });
        return;
      }
      if (user.subscription_status === 'EXPIRED' || user.subscription_status === 'TRIAL_EXPIRED') {
        navigate('/renew', { replace: true });
        return;
      }

      navigate('/dashboard', { replace: true });
      
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to connect to server. Please try again.');
      }
    } finally {
      setLoading(false);
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
                <div 
                  style={{ 
                    marginBottom: '24px', 
                    position: 'relative', 
                    display: 'flex', 
                    flexDirection: 'row',
                    background: 'rgba(255, 255, 255, 0.15)', 
                    borderRadius: '8px',
                    padding: '4px',
                    overflow: 'hidden'
                  }}
                >
                  <div 
                    style={{
                      position: 'absolute',
                      top: '4px',
                      bottom: '4px',
                      left: '4px',
                      width: 'calc(50% - 4px)',
                      background: '#2648E7',
                      borderRadius: '6px',
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: loginMethod === 'password' ? 'translateX(0)' : 'translateX(100%)',
                      zIndex: 0
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => { setLoginMethod('password'); setOtpSent(false); setError(''); }}
                    style={{ 
                      flex: 1, 
                      padding: '10px 0', 
                      background: 'transparent', 
                      border: 'none', 
                      color: loginMethod === 'password' ? '#FFFFFF' : 'rgba(255,255,255,0.7)', 
                      fontWeight: 'bold', 
                      cursor: 'pointer',
                      position: 'relative',
                      zIndex: 1,
                      transition: 'color 0.3s ease'
                    }}
                  >
                    Password
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginMethod('otp'); setOtpSent(false); setError(''); }}
                    style={{ 
                      flex: 1, 
                      padding: '10px 0', 
                      background: 'transparent', 
                      border: 'none', 
                      color: loginMethod === 'otp' ? '#FFFFFF' : 'rgba(255,255,255,0.7)', 
                      fontWeight: 'bold', 
                      cursor: 'pointer',
                      position: 'relative',
                      zIndex: 1,
                      transition: 'color 0.3s ease'
                    }}
                  >
                    OTP
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="login-identifier">Email or Username</label>
                  <input
                    id="login-identifier"
                    type="text"
                    className="form-input"
                    placeholder="Enter your email or username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoComplete="username"
                    autoFocus
                  />
                </div>

                {loginMethod === 'password' ? (
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
                        required={loginMethod === 'password'}
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
                ) : (
                  <div className="form-group">
                    {!otpSent ? (
                      <button
                        type="button"
                        className="btn btn-outline btn-full"
                        onClick={handleSendOtp}
                        disabled={loading || !identifier}
                        style={{ marginBottom: '16px' }}
                      >
                        {loading ? 'Sending...' : 'Send OTP to Email'}
                      </button>
                    ) : (
                      <>
                        <label className="form-label" htmlFor="login-otp">OTP Code</label>
                        <input
                          id="login-otp"
                          type="text"
                          className="form-input"
                          placeholder="Enter 6-digit OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          required={loginMethod === 'otp'}
                          maxLength={6}
                        />
                      </>
                    )}
                  </div>
                )}

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
                  disabled={loading}
                >
                  {loading ? 'Authenticating...' : 'Login'}
                </button>
              </form>

              <div className="login-footer-links" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <p style={{ margin: 0 }}>Don't have an account? <Link to="/signup">Sign up</Link></p>
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
