import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { subscriptionApi } from '@/api/subscription';
import { AlertCircle, User, Phone, MapPin, Building2 } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import '@/styles/subscription.css';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || '');
  const [state, setState] = useState(user?.state || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If profile already completed, redirect
  if (user?.profile_completed) {
    if (!user.subscription_status || user.subscription_status === 'NONE') {
      navigate('/subscription', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await subscriptionApi.completeProfile({ name, phone, city, state });
      if (res.success && res.data) {
        updateUser({
          ...user!,
          name: res.data.name,
          phone: res.data.phone,
          city: res.data.city,
          state: res.data.state,
          profile_completed: true,
        });
        navigate('/subscription', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="profile-completion-page">
      <div className="profile-completion-card">
        <div className="step-indicator">
          <div className="step-dot active" />
          <div className="step-dot" />
          <div className="step-dot" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <Logo size="lg" />
        </div>

        <h2>Complete Your Profile</h2>
        <p className="subtitle">Tell us a bit about yourself to get started</p>

        {error && (
          <div className="profile-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="profile-form-group">
            <label>
              <User size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              minLength={2}
              autoFocus
            />
          </div>

          <div className="profile-form-group">
            <label>
              <Phone size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              required
              minLength={10}
            />
          </div>

          <div className="profile-form-group">
            <label>
              <MapPin size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter your city"
              required
              minLength={2}
            />
          </div>

          <div className="profile-form-group">
            <label>
              <Building2 size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              State
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
            >
              <option value="">Select your state</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="profile-submit-btn"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Continue →'}
          </button>
        </form>
      </div>
    </div>
  );
}
