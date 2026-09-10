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

type PlanTier = 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
type DurationOption = 1 | 4 | 6 | 12;

const PLANS = [
  { id: 'BASIC' as PlanTier, name: 'Basic (₹10K/mo)', monthlyPrice: 10000, desc: '1 Active Project' },
  { id: 'PROFESSIONAL' as PlanTier, name: 'Professional (₹20K/mo)', monthlyPrice: 20000, desc: '3 Active Projects' },
  { id: 'ENTERPRISE' as PlanTier, name: 'Enterprise (₹40K/mo)', monthlyPrice: 40000, desc: 'Unlimited Projects + CRM' },
];

const DURATION_DISCOUNTS: Record<DurationOption, { rate: number; label: string; badge?: string }> = {
  1: { rate: 0, label: '1 Mo' },
  4: { rate: 0.10, label: '4 Mo', badge: '10% OFF' },
  6: { rate: 0.20, label: '6 Mo', badge: '20% OFF' },
  12: { rate: 0.35, label: '12 Mo', badge: '35% OFF' },
};

export default function RenewSubscriptionPage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('ENTERPRISE');
  const [selectedDuration, setSelectedDuration] = useState<DurationOption>(4);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const currentPlan = PLANS.find((p) => p.id === selectedPlan) || PLANS[2];
  const discountInfo = DURATION_DISCOUNTS[selectedDuration];
  const grossAmount = currentPlan.monthlyPrice * selectedDuration;
  const discountAmount = Math.round(grossAmount * discountInfo.rate);
  const totalPrice = grossAmount - discountAmount;

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

        <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4 text-blue-400">
          <RefreshCw size={30} />
        </div>

        <h2 className="text-2xl font-black text-white mb-2">Renew Your Subscription</h2>
        <p className="text-sm text-slate-400 mb-6">
          Reactivate your workspace instantly. Your existing projects, budgets, and team data remain 100% intact.
        </p>

        {/* Setup Cost Reassurance Banner */}
        <div className="mb-6 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-semibold flex items-center justify-center gap-2">
          <Check size={16} className="text-emerald-400 shrink-0" />
          <span>One-time setup fee is already paid! You only pay the monthly subscription plan.</span>
        </div>

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
                  ? 'bg-[#2648E7]/25 border-[#2648E7] text-white shadow-lg'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <div className="text-xs font-bold truncate">{p.name}</div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">{p.desc}</div>
            </button>
          ))}
        </div>

        {/* Duration selector */}
        <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-black/20 border border-white/10 mb-6">
          {([1, 4, 6, 12] as DurationOption[]).map((dur) => {
            const d = DURATION_DISCOUNTS[dur];
            const isSelected = selectedDuration === dur;
            return (
              <button
                key={dur}
                type="button"
                onClick={() => setSelectedDuration(dur)}
                className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl transition-all flex flex-col items-center gap-0.5 ${
                  isSelected
                    ? 'bg-[#2648E7] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{d.label}</span>
                {d.badge && (
                  <span className="text-[9px] font-black uppercase text-[#FCC300]">
                    {d.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Total Price summary */}
        <div className="p-4 rounded-2xl bg-black/30 border border-white/10 mb-6 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Setup Fee</span>
            <span className="text-emerald-400 font-bold uppercase tracking-wider">₹0 (Waived)</span>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Subscription ({selectedDuration} Mo @ {formatINR(currentPlan.monthlyPrice)}/mo)</span>
            <span className="text-white font-medium">{formatINR(grossAmount)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between items-center text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg">
              <span>Duration Package Discount ({Math.round(discountInfo.rate * 100)}%)</span>
              <span>- {formatINR(discountAmount)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Total Renewal Fee</span>
            <span className="text-3xl font-black text-white">{formatINR(totalPrice)}</span>
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
              Renew Subscription for {formatINR(totalPrice)}
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
