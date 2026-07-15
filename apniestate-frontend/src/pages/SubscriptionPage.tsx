import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { subscriptionApi } from '@/api/subscription';
import { CreditCard, Gift, Check, AlertTriangle, Zap, Shield, BarChart3, Users, Clock, Building2 } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import '@/styles/subscription.css';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_S5I6BaqdNg0Tjk';

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { user, updateUser, setAuthSession, logout } = useAuth();
  const [paying, setPaying] = useState(false);
  const [requestingTrial, setRequestingTrial] = useState(false);
  const [error, setError] = useState('');

  // If already subscribed, redirect
  if (user?.subscription_status === 'ACTIVE' || user?.subscription_status === 'TRIAL_ACTIVE') {
    navigate('/dashboard', { replace: true });
    return null;
  }

  if (user?.subscription_status === 'PENDING_TRIAL') {
    navigate('/pending-approval', { replace: true });
    return null;
  }

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

  const handlePayment = async () => {
    setError('');
    setPaying(true);

    try {
      // Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError('Failed to load payment gateway. Please check your internet connection.');
        setPaying(false);
        return;
      }

      // Create order on backend
      const orderRes = await subscriptionApi.createOrder();
      if (!orderRes.success || !orderRes.data) {
        setError('Failed to create payment order. Please try again.');
        setPaying(false);
        return;
      }

      const order = orderRes.data;

      // Open Razorpay checkout
      const options = {
        key: RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Apni Estate',
        description: 'Monthly Subscription — ₹31,999',
        order_id: order.id,
        handler: async (response: any) => {
          try {
            const verifyRes = await subscriptionApi.verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.success && verifyRes.data) {
              // Update auth context with new token and user data
              if (verifyRes.data.accessToken && verifyRes.data.user) {
                setAuthSession(verifyRes.data.accessToken, verifyRes.data.user);
              }
              navigate('/projects?create=true', { replace: true });
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

  const handleRequestTrial = async () => {
    setError('');
    setRequestingTrial(true);

    try {
      const res = await subscriptionApi.requestTrial();
      if (res.success) {
        alert("Free trial requested successfully! Please wait for admin approval.");
        await logout();
        navigate('/login', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request trial');
    } finally {
      setRequestingTrial(false);
    }
  };

  return (
    <div className="subscription-page">
      <div className="subscription-header">
        <div className="logo-wrapper">
          <Logo size="xl" />
        </div>
        <h1>Choose Your Plan</h1>
        <p>Start managing your construction projects with Apni Estate</p>
      </div>

      {error && (
        <div style={{
          maxWidth: 600,
          margin: '0 auto 24px',
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px',
          color: '#f87171',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          position: 'relative',
          zIndex: 1,
        }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="subscription-cards">
        {/* PAID SUBSCRIPTION */}
        <div className="sub-card premium">
          <div className="popular-badge">RECOMMENDED</div>

          <div className="sub-card-icon">
            <CreditCard size={28} />
          </div>

          <h3>Monthly Pro</h3>
          <p className="card-desc">Full access to all features. Start building today.</p>

          <div className="price">
            <span className="currency">₹</span>
            <span className="amount">31,999</span>
            <span className="period">/month</span>
          </div>

          <ul className="features">
            <li>
              <Check size={16} className="check-icon" />
              Unlimited projects & sites
            </li>
            <li>
              <Check size={16} className="check-icon" />
              Full team management
            </li>
            <li>
              <Check size={16} className="check-icon" />
              Finance, BOQ & purchase tracking
            </li>
            <li>
              <Check size={16} className="check-icon" />
              DPR, attendance & reports
            </li>
            <li>
              <Check size={16} className="check-icon" />
              Priority support
            </li>
            <li>
              <Check size={16} className="check-icon" />
              Instant activation
            </li>
          </ul>

          <button
            className="sub-card-btn pay-btn"
            onClick={handlePayment}
            disabled={paying}
          >
            {paying ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Zap size={18} className="animate-pulse" />
                Processing...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Zap size={18} />
                Pay ₹31,999 & Start Now
              </span>
            )}
          </button>
        </div>

        {/* FREE TRIAL */}
        <div className="sub-card trial">
          <div className="sub-card-icon">
            <Gift size={28} />
          </div>

          <h3>15-Day Free Trial</h3>
          <p className="card-desc">Try before you buy. No payment required upfront.</p>

          <div className="price">
            <span className="currency">₹</span>
            <span className="amount">0</span>
            <span className="period">/15 days</span>
          </div>

          <div className="trial-note">
            <AlertTriangle size={16} className="note-icon" />
            <p>
              <strong>Admin approval required.</strong> Your trial request will be reviewed
              by the Apni Estate team. You'll get access once approved.
            </p>
          </div>

          <ul className="features">
            <li>
              <Check size={16} className="check-icon" />
              All features included
            </li>
            <li>
              <Check size={16} className="check-icon" />
              15 days full access
            </li>
            <li>
              <Clock size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
              Requires admin approval
            </li>
          </ul>

          <button
            className="sub-card-btn trial-btn"
            onClick={handleRequestTrial}
            disabled={requestingTrial}
          >
            {requestingTrial ? 'Requesting...' : 'Request Free Trial'}
          </button>
        </div>
      </div>
    </div>
  );
}
