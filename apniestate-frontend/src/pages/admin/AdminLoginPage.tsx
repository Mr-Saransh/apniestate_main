import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminPanelApi } from '@/api/adminPanel';
import { Shield, AlertCircle, KeyRound, User } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import '@/styles/admin-panel.css';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await adminPanelApi.login(username, password);
      if (res.success && res.data) {
        localStorage.setItem('admin_panel_token', res.data.token);
        navigate('/apni-admin/dashboard', { replace: true });
      } else {
        setError('Invalid credentials');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-badge">
          <div className="shield-icon">
            <Shield size={20} />
          </div>
          <span>Secure Admin Access</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <Logo size="lg" />
        </div>

        <h2>Admin Panel</h2>

        {error && (
          <div className="admin-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="admin-form-group">
            <label>
              <User size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin@apniestate.in"
              required
              autoFocus
            />
          </div>

          <div className="admin-form-group">
            <label>
              <KeyRound size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="admin-login-btn"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
