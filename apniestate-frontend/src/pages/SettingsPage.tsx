import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usersApi } from '@/api/users';
import Modal from '@/components/shared/Modal';
import {
  User,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Building2,
  Phone,
  Mail,
  CheckCircle,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();

  // Modal control
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Fields
  const [formName, setFormName] = useState(user?.name || '');
  const [formEmail, setFormEmail] = useState(user?.email || '');
  const [formPhone, setFormPhone] = useState(user?.phone || '');

  // Mock states for other settings
  const [companyName, setCompanyName] = useState('Apni Estate Builders Ltd.');
  const [gstin, setGstin] = useState('07AAAAA0000A1Z0');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);

  const formatRole = (role: string) => {
    if (role === 'BUILDER' || role === 'ADMIN') return 'Builder (Owner)';
    return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const res = await usersApi.update(user.id, {
        name: formName,
        email: formEmail,
        phone: formPhone || undefined
      });

      if (res.success && res.data) {
        // Update user context state
        updateUser({
          ...user,
          name: formName,
          email: formEmail,
          phone: formPhone || null
        });
        setSuccessMsg('Profile updated successfully!');
        setTimeout(() => setShowEditModal(false), 800);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to update profile details');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Account configuration, user preferences, and business entity details</p>
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
        <div className="section-title">Account Settings</div>
        <div className="card" style={{ overflow: 'hidden', marginBottom: 'var(--space-5)' }}>
          <div onClick={() => setShowEditModal(true)}>
            <SettingsItem icon={User} label="Edit Profile Information" />
          </div>
          <div onClick={() => setShowEditModal(true)}>
            <SettingsItem icon={Mail} label="Update Email Address" />
          </div>
          <div onClick={() => setShowEditModal(true)}>
            <SettingsItem icon={Phone} label="Update Mobile Number" />
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Preferences & Entity</div>
        <div className="card" style={{ overflow: 'hidden', marginBottom: 'var(--space-5)' }}>
          <div onClick={() => setShowNotificationsModal(true)}>
            <SettingsItem icon={Bell} label="Alert Notifications" />
          </div>
          <div onClick={() => setShowCompanyModal(true)}>
            <SettingsItem icon={Building2} label="Company & GST Info" />
          </div>
          <div onClick={() => setShowSecurityModal(true)}>
            <SettingsItem icon={Shield} label="Privacy & Encryption Security" />
          </div>
        </div>
      </div>

      <div className="section">
        <div className="card" style={{ overflow: 'hidden' }}>
          <div
            className="list-card"
            onClick={logout}
            style={{ color: 'var(--color-danger)', cursor: 'pointer' }}
            id="logout-settings"
          >
            <div className="list-card-icon" style={{
              background: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
            }}>
              <LogOut size={20} />
            </div>
            <div className="list-card-content">
              <div className="list-card-title" style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>
                Sign Out (Logout Session)
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        textAlign: 'center',
        padding: 'var(--space-6)',
        color: 'var(--color-text-muted)',
        fontSize: 'var(--font-size-sm)',
      }}>
        Apni Estate ERP v1.0.0
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Profile Information"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleUpdateProfile as any}
              disabled={submitting || !formName || !formEmail}
              id="submit-settings-profile"
            >
              {submitting ? 'Saving...' : 'Save Details'}
            </button>
          </>
        }
      >
        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {formError && <div className="login-error"><span>{formError}</span></div>}
          {successMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)', background: 'rgba(16,185,129,0.1)', padding: '10px', borderRadius: '4px' }}>
              <CheckCircle size={16} /> <span>{successMsg}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="s-name">Full Name *</label>
            <input id="s-name" type="text" className="form-input" value={formName} onChange={(e) => setFormName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="s-email">Email Address *</label>
            <input id="s-email" type="email" className="form-input" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="s-phone">Phone Number</label>
            <input id="s-phone" type="tel" className="form-input" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
          </div>
        </form>
      </Modal>

      {/* Company Info Modal */}
      <Modal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        title="Company & GST Information"
        footer={<button className="btn btn-primary" onClick={() => setShowCompanyModal(false)}>Done</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="s-company">Registered Company Name</label>
            <input id="s-company" type="text" className="form-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="s-gstin">GSTIN registration number</label>
            <input id="s-gstin" type="text" className="form-input" value={gstin} onChange={(e) => setGstin(e.target.value)} />
          </div>
        </div>
      </Modal>

      {/* Security Privacy Modal */}
      <Modal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        title="Privacy & Encryption Security"
        footer={<button className="btn btn-primary" onClick={() => setShowSecurityModal(false)}>Close</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>
          <p>🔒 <strong>End-to-End Encryption:</strong> All uploaded contract documents, worker emergency contacts, and invoice files are encrypted in transit and at rest.</p>
          <p>🔑 <strong>Role-Based Access Control:</strong> Fine-grained permissions are checked dynamically on both frontend views and backend API controllers.</p>
          <p>🔄 <strong>Session Policy:</strong> Access tokens automatically expire after 1 hour. Refresh tokens are hashed and stored securely to ensure authorization longevity.</p>
        </div>
      </Modal>

      {/* Notifications Preferences Modal */}
      <Modal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        title="Alert Notifications"
        footer={<button className="btn btn-primary" onClick={() => setShowNotificationsModal(false)}>Save Preferences</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-sm)' }}>Email Alert Digests</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Get summary of budget variances and invoice due dates</div>
            </div>
            <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-sm)' }}>Push Notifications</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Realtime alerts on attendance updates & material approvals</div>
            </div>
            <input type="checkbox" checked={pushAlerts} onChange={(e) => setPushAlerts(e.target.checked)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SettingsItem({ icon: Icon, label }: { icon: React.ComponentType<{ size: number }>; label: string }) {
  return (
    <div className="list-card" id={`settings-${label.toLowerCase().replace(/\s+/g, '-')}`} style={{ cursor: 'pointer' }}>
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
