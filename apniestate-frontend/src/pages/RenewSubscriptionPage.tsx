import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { subscriptionApi } from '@/api/subscription';
import { AlertCircle, CreditCard, RefreshCw, AlertTriangle, Check, Zap } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import '@/styles/subscription.css';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_S5I6BaqdNg0Tjk';

type PlanTier = 'PLAN_30K' | 'PLAN_50K' | 'PLAN_100K';
type DurationOption = 4 | 6 | 12;

const PLANS = [
  { id: 'PLAN_30K' as PlanTier, name: 'Starter (₹30K)', basePrice: 30000, desc: '1 Active Project' },
  { id: 'PLAN_50K' as PlanTier, name: 'Growth (₹50K)', basePrice: 50000, desc: '3 Active Projects' },
  { id: 'PLAN_100K' as PlanTier, name: 'Enterprise (₹1L)', basePrice: 100000, desc: 'Unlimited Projects + Full CRM' },
];

export default function RenewSubscriptionPage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('PLAN_100K');
  const [selectedDuration, setSelectedDuration] = useState<DurationOption>(4);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const currentPlan = PLANS.find((p) => p.id === selectedPlan) || PLANS[2];
  const totalPrice = currentPlan.basePrice * selectedDuration;

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

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

      const orderRes = await subscriptionApi.createRenewOrder(selectedPlan, selectedDuration);
      if (!orderRes.success || !orderRes.data) {
        setError(orderRes.error?.message || 'Failed to create payment order. Please try again.');
        setPaying(false);
        return;
      }

      const order = orderRes.data;

      const options = {
        key: RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Apni Estate',
        description: `Subscription Renewal - ${currentPlan.name} (${selectedDuration} Months)`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            const verifyRes = await subscriptionApi.verifyRenewal({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              plan_id: selectedPlan,
              duration_months: selectedDuration,
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
    <div className="renew-page min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-[#0B132B] via-[#1C2541] to-[#0B132B]">
      <div className="renew-card w-full max-w-xl bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-8 text-center shadow-2xl">
        <div className="mb-6 flex justify-center">
          <Logo size="lg" variant="light" />
        </div>

        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-400">
          <AlertCircle size={32} />
        </div>

        <h2 className="text-2xl font-black text-white mb-2">Subscription Renewal Required</h2>
        <p className="text-sm text-slate-400 mb-6">
          Your workspace access has ended. Choose your commercial plan and duration to reactivate seamlessly. Your data remains fully safe and intact.
        </p>

        {error && (
          <div className="p-3.5 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2 text-left">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Plan Selector Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {PLANS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPlan(p.id)}
              className={`p-3 rounded-2xl border text-left transition-all ${
                selectedPlan === p.id
                  ? 'bg-[#2648E7]/20 border-[#2648E7] text-white'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <div className="text-xs font-bold truncate">{p.name}</div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">{p.desc}</div>
            </button>
          ))}
        </div>

        {/* Duration selector */}
        <div className="flex items-center justify-center p-1 rounded-xl bg-black/20 border border-white/10 mb-6">
          {([4, 6, 12] as DurationOption[]).map((dur) => (
            <button
              key={dur}
              type="button"
              onClick={() => setSelectedDuration(dur)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                selectedDuration === dur
                  ? 'bg-[#2648E7] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {dur} Months
            </button>
          ))}
        </div>

        {/* Total Price summary */}
        <div className="p-4 rounded-2xl bg-black/30 border border-white/5 mb-6">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
            Total Renewal Fee ({selectedDuration} Months)
          </div>
          <div className="text-3xl font-black text-white">
            {formatINR(totalPrice)}
          </div>
        </div>

        <button
          className="w-full py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-[#2648E7] to-[#4F6DFF] hover:from-[#1e3bbd] hover:to-[#2648E7] text-white shadow-lg shadow-[#2648E7]/30 transition-all flex items-center justify-center gap-2"
          onClick={handleRenew}
          disabled={paying}
        >
          {paying ? (
            <span className="flex items-center gap-2">
              <RefreshCw size={18} className="animate-spin" />
              Processing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CreditCard size={18} />
              Renew Now for {formatINR(totalPrice)}
            </span>
          )}
        </button>

        <button
          onClick={logout}
          className="mt-4 text-xs text-slate-400 hover:text-white underline cursor-pointer bg-transparent border-none"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
