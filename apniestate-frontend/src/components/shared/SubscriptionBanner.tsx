import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AlertTriangle, X } from 'lucide-react';
import '@/styles/subscription.css';

export default function SubscriptionBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);

  if (!visible || !user || user.subscription_status !== 'EXPIRING_SOON') {
    return null;
  }

  return (
    <div className="subscription-banner">
      <div className="banner-content">
        <AlertTriangle size={16} />
        <span>
          Your subscription is expiring soon. Renew now to avoid interruption to your projects and data.
        </span>
        <button 
          className="renew-link" 
          onClick={() => navigate('/renew')}
        >
          Renew Subscription →
        </button>
      </div>
      <button className="close-banner" onClick={() => setVisible(false)}>
        <X size={14} />
      </button>
    </div>
  );
}
