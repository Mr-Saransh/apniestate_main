import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Bell, Building2 } from 'lucide-react';

export default function MobileHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="mobile-header" id="mobile-header">
      <div className="mobile-header-brand">
        <div className="mobile-header-logo">
          <Building2 size={18} />
        </div>
        <span className="mobile-header-title">Apni Estate</span>
      </div>

      <div className="mobile-header-actions">
        <button
          className="mobile-header-btn"
          aria-label="Notifications"
          onClick={() => navigate('/notifications')}
          id="mobile-notification-btn"
        >
          <Bell size={20} />
          <span className="notification-dot" />
        </button>

        <button
          className="mobile-header-btn"
          aria-label="Profile"
          onClick={() => navigate('/settings')}
          id="mobile-profile-btn"
        >
          <div className="avatar-sm" style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}>
            {user ? getInitials(user.name) : '?'}
          </div>
        </button>
      </div>
    </header>
  );
}
