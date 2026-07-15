import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { subscriptionApi } from '@/api/subscription';
import { AlertCircle, CreditCard, RefreshCw, AlertTriangle } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import '@/styles/subscription.css';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_S5I6BaqdNg0Tjk';

export default function RenewSubscriptionPage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRenew = async () => {
    setError('');
    setPaying(true);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError('Failed to load payment gateway. Please check your internet connection.');
        setPaying(false);
        return;
      }

      const orderRes = await subscriptionApi.createRenewOrder();
      if (!orderRes.success || !orderRes.data) {
        setError('Failed to create payment order. Please try again.');
        setPaying(false);
        return;
      }

      const order = orderRes.data;

      const options = {
        key: RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Apni Estate',
        description: 'Monthly Subscription Renewal — ₹31,999',
        order_id: order.id,
        handler: async (response: any) => {
          try {
            const verifyRes = await subscriptionApi.verifyRenewal({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              updateUser({ ...user!, subscription_status: 'ACTIVE' });
              navigate('/dashboard', { replace: true });
            } else {
              setError('Payment verification failed. Please contact support.');
            }
          } catch (err: any) {
            setError(err.message || 'Payment verification failed');
          }
          setPaying(false);
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#2648E7',
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response: any) => {
        setError(`Payment failed: ${response.error.description}`);
        setPaying(false);
      });
      razorpay.open();
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment');
      setPaying(false);
    }
  };

  return (
    <div className="renew-page">
      <div className="renew-card">
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
          <Logo size="lg" />
        </div>

        <div className="expired-icon">
          <AlertCircle size={36} color="#ef4444" />
        </div>

        <h2>Subscription Expired</h2>
        <p className="renew-desc">
          Your access to Apni Estate has expired. Renew your subscription now to
          continue managing your projects, team, and finances without interruption.
        </p>

        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            color: '#f87171',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="renew-price">
          <span className="currency">₹</span>
          <span className="amount">31,999</span>
          <span className="period">/month</span>
        </div>

        <button
          className="renew-btn"
          onClick={handleRenew}
          disabled={paying}
        >
          {paying ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <RefreshCw size={18} className="animate-spin" />
              Processing...
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <CreditCard size={18} />
              Renew Subscription
            </span>
          )}
        </button>

        <button 
          onClick={logout}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '13px',
            textDecoration: 'underline',
            cursor: 'pointer',
            marginTop: '16px'
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
