import { useAuth } from '@/context/AuthContext';
import {
  User,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Building2,
  Phone,
  Mail,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();

  const formatRole = (role: string) =>
    role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Account and preferences</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-body" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-5)',
          padding: 'var(--space-6) var(--space-5)',
        }}>
          <div className="avatar avatar-lg">
            {user ? getInitials(user.name) : '?'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
            }}>
              {user?.name || 'User'}
            </div>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              marginTop: 2,
            }}>
              {user ? formatRole(user.role) : ''}
            </div>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)',
              marginTop: 2,
            }}>
              {user?.email}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="section">
        <div className="section-title">Account</div>
        <div className="card" style={{ overflow: 'hidden' }}>
          <SettingsItem icon={User} label="Edit Profile" />
          <SettingsItem icon={Mail} label="Email & Password" />
          <SettingsItem icon={Phone} label="Phone Number" />
        </div>
      </div>

      <div className="section">
        <div className="section-title">Preferences</div>
        <div className="card" style={{ overflow: 'hidden' }}>
          <SettingsItem icon={Bell} label="Notifications" />
          <SettingsItem icon={Building2} label="Company Info" />
          <SettingsItem icon={Shield} label="Privacy & Security" />
        </div>
      </div>

      <div className="section">
        <div className="card" style={{ overflow: 'hidden' }}>
          <div
            className="list-card"
            onClick={logout}
            style={{ color: 'var(--color-danger)' }}
            id="logout-settings"
          >
            <div className="list-card-icon" style={{
              background: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
            }}>
              <LogOut size={20} />
            </div>
            <div className="list-card-content">
              <div className="list-card-title" style={{ color: 'var(--color-danger)' }}>
                Sign Out
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* App Version */}
      <div style={{
        textAlign: 'center',
        padding: 'var(--space-6)',
        color: 'var(--color-text-muted)',
        fontSize: 'var(--font-size-sm)',
      }}>
        Apni Estate v1.0.0
      </div>
    </div>
  );
}

function SettingsItem({ icon: Icon, label }: { icon: React.ComponentType<{ size: number }>; label: string }) {
  return (
    <div className="list-card" id={`settings-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="list-card-icon" style={{
        background: 'var(--color-bg-warm)',
        color: 'var(--color-text-secondary)',
      }}>
        <Icon size={20} />
      </div>
      <div className="list-card-content">
        <div className="list-card-title">{label}</div>
      </div>
      <ChevronRight size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
    </div>
  );
}
