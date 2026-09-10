import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { subscriptionApi } from '@/api/subscription';
import {
  CreditCard,
  Gift,
  Check,
  X as CloseIcon,
  AlertTriangle,
  Zap,
  Building2,
  Users,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
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

interface PlanDefinition {
  id: PlanTier;
  name: string;
  badge: string;
  setupCost: number;
  monthlyPrice: number;
  maxProjects: string;
  hasCrm: boolean;
  isRecommended: boolean;
  description: string;
  features: { text: string; included: boolean; highlight?: boolean }[];
}

const PLANS: PlanDefinition[] = [
  {
    id: 'BASIC',
    name: 'Basic',
    badge: '₹1,00,000 Setup',
    setupCost: 100000,
    monthlyPrice: 10000,
    maxProjects: '1 Active Project',
    hasCrm: false,
    isRecommended: false,
    description: 'Essential construction management for single-site builders & individual developers.',
    features: [
      { text: '1 Active Project limit', included: true, highlight: true },
      { text: 'Full Construction Management', included: true },
      { text: 'BOQ, DPR & Site Attendance', included: true },
      { text: 'Finance, Expenses & Cashbook', included: true },
      { text: 'Material Requests & Inventory', included: true },
      { text: 'CRM Sales & Leads Workspace', included: false },
    ],
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    badge: '₹1,50,000 Setup',
    setupCost: 150000,
    monthlyPrice: 20000,
    maxProjects: '3 Active Projects',
    hasCrm: false,
    isRecommended: false,
    description: 'Designed for expanding contractors overseeing up to 3 active construction sites.',
    features: [
      { text: '3 Active Projects limit', included: true, highlight: true },
      { text: 'Full Construction Management', included: true },
      { text: 'BOQ, DPR & Site Attendance', included: true },
      { text: 'Finance, Expenses & Cashbook', included: true },
      { text: 'Material Requests & Inventory', included: true },
      { text: 'Multi-site Supervision', included: true },
      { text: 'CRM Sales & Leads Workspace', included: false },
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    badge: '₹2,00,000 Setup',
    setupCost: 200000,
    monthlyPrice: 40000,
    maxProjects: 'Unlimited Projects',
    hasCrm: true,
    isRecommended: true,
    description: 'Complete Construction ERP + CRM suite for established real estate companies.',
    features: [
      { text: 'Unlimited Active Projects (∞)', included: true, highlight: true },
      { text: 'Full Construction Management', included: true },
      { text: 'Full CRM Suite Included', included: true, highlight: true },
      { text: 'Leads, Pipeline, Followups & Deals', included: true },
      { text: 'BOQ, DPR, Finance & Inventory', included: true },
      { text: 'Priority 24/7 Dedicated Support', included: true },
    ],
  },
];

const DURATION_PACKAGES: Record<DurationOption, { discountRate: number; label: string; badge?: string }> = {
  1: { discountRate: 0, label: '1 Month' },
  4: { discountRate: 0.10, label: '4 Months', badge: '10% OFF' },
  6: { discountRate: 0.20, label: '6 Months', badge: '20% OFF' },
  12: { discountRate: 0.35, label: '12 Months', badge: '35% OFF • Best Value' },
};

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { user, setAuthSession, logout } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('ENTERPRISE');
  const [selectedDuration, setSelectedDuration] = useState<DurationOption>(4);
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

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPlanCalculation = (plan: PlanDefinition, duration: DurationOption) => {
    const pkg = DURATION_PACKAGES[duration];
    const grossSubscription = plan.monthlyPrice * duration;
    const discountAmount = Math.round(grossSubscription * pkg.discountRate);
    const subscriptionAmount = grossSubscription - discountAmount;
    const setupCost = plan.setupCost;
    const totalToday = setupCost + subscriptionAmount;

    return {
      grossSubscription,
      discountRate: pkg.discountRate,
      discountPercent: Math.round(pkg.discountRate * 100),
      discountAmount,
      subscriptionAmount,
      setupCost,
      totalToday,
    };
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

  const handlePayment = async (planId: PlanTier) => {
    setError('');
    setPaying(true);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError('Failed to load Razorpay payment gateway. Please check your internet connection.');
        setPaying(false);
        return;
      }

      // 1. Create order on backend with selected plan and duration
      const orderRes = await subscriptionApi.createOrder(planId, selectedDuration);
      if (!orderRes.success || !orderRes.data) {
        setError(orderRes.error?.message || 'Failed to create payment order. Please try again.');
        setPaying(false);
        return;
      }

      const order = orderRes.data;
      const targetPlan = PLANS.find((p) => p.id === planId)!;

      // 2. Open Razorpay Checkout
      const options = {
        key: RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Apni Estate',
        description: `${targetPlan.name} Plan (Setup + ${selectedDuration} Mo Subscription)`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            const verifyRes = await subscriptionApi.verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              plan_id: planId,
              duration_months: selectedDuration,
            });

            if (verifyRes.success && verifyRes.data) {
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
        alert('Free trial requested successfully! Please wait for admin approval.');
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
    <div className="min-h-screen bg-gradient-to-b from-[#0B132B] via-[#1C2541] to-[#0B132B] text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#2648E7]/20 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FCC300]/10 rounded-full blur-3xl pointer-events-none translate-y-1/2" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Logo size="xl" variant="light" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
            Construction Management Software
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Transparent pricing: One-time setup cost with flexible monthly subscription packages.
          </p>

          {/* Setup Cost Callout Banner */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2648E7]/20 border border-[#2648E7]/40 text-xs font-semibold text-blue-200">
            <Zap size={14} className="text-[#FCC300]" />
            <span>Setup cost is a one-time onboarding fee — subsequent renewals only pay the monthly subscription!</span>
          </div>

          {/* Duration Selector Switcher */}
          <div className="mt-8 flex flex-wrap justify-center gap-2 sm:gap-3 p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl max-w-2xl mx-auto">
            {([1, 4, 6, 12] as DurationOption[]).map((dur) => {
              const pkg = DURATION_PACKAGES[dur];
              const isSelected = selectedDuration === dur;
              return (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setSelectedDuration(dur)}
                  className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex flex-col items-center gap-1 ${
                    isSelected
                      ? 'bg-[#2648E7] text-white shadow-lg shadow-[#2648E7]/40 scale-100'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{pkg.label}</span>
                  {pkg.badge ? (
                    <span className="text-[10px] uppercase tracking-wider bg-[#FCC300] text-black font-extrabold px-1.5 py-0.5 rounded-md">
                      {pkg.badge}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">Standard</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="max-w-xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm font-semibold flex items-center gap-3 backdrop-blur-xl">
            <AlertTriangle size={18} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* 3 Commercial Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-12">
          {PLANS.map((plan) => {
            const calc = getPlanCalculation(plan, selectedDuration);
            const isSelected = selectedPlan === plan.id;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative flex flex-col rounded-3xl p-7 cursor-pointer transition-all duration-300 backdrop-blur-2xl border ${
                  plan.isRecommended
                    ? 'bg-gradient-to-b from-[#2648E7]/20 via-[#1C2541]/80 to-white/5 border-[#2648E7] shadow-2xl shadow-[#2648E7]/25 md:-translate-y-2'
                    : isSelected
                    ? 'bg-white/10 border-white/40 shadow-xl'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
                }`}
              >
                {plan.isRecommended && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#FCC300] to-[#F59E0B] text-black text-xs font-black tracking-wider uppercase shadow-md flex items-center gap-1.5">
                    <Sparkles size={12} />
                    <span>POPULAR & RECOMMENDED</span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-black text-white">{plan.name}</h3>
                    <span className="text-xs font-semibold text-blue-300">{plan.maxProjects}</span>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      plan.isRecommended
                        ? 'bg-[#2648E7] text-white shadow-lg shadow-[#2648E7]/40'
                        : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {plan.id === 'ENTERPRISE' ? (
                      <Sparkles size={22} />
                    ) : plan.id === 'PROFESSIONAL' ? (
                      <Building2 size={22} />
                    ) : (
                      <Layers size={22} />
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-5 min-h-[34px]">{plan.description}</p>

                {/* Pricing Breakdown Box */}
                <div className="mb-6 p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2.5">
                  {/* Setup Cost Row */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Setup Cost (One-Time)</span>
                    <span className="font-bold text-white">{formatINR(calc.setupCost)}</span>
                  </div>

                  {/* Monthly Fee Base */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Monthly Plan Rate</span>
                    <span className="font-bold text-slate-200">{formatINR(plan.monthlyPrice)} / mo</span>
                  </div>

                  {/* Subscription Subtotal */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Subscription ({selectedDuration} Mo)</span>
                    <div className="text-right">
                      {calc.discountAmount > 0 && (
                        <span className="text-[11px] text-slate-500 line-through mr-1.5">
                          {formatINR(calc.grossSubscription)}
                        </span>
                      )}
                      <span className="font-bold text-emerald-400">{formatINR(calc.subscriptionAmount)}</span>
                    </div>
                  </div>

                  {/* Discount notice */}
                  {calc.discountPercent > 0 && (
                    <div className="flex justify-between items-center text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded-lg">
                      <span>Package Discount ({calc.discountPercent}%)</span>
                      <span>Save {formatINR(calc.discountAmount)}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                        Total Due Today
                      </div>
                      <div className="text-[10px] text-slate-400">Setup fee + {selectedDuration} mo plan</div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl sm:text-3xl font-black text-white">
                        {formatINR(calc.totalToday)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features list */}
                <div className="flex-1 space-y-3 mb-6">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Features Included</div>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm">
                      {feat.included ? (
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            feat.highlight
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-white/10 text-emerald-400'
                          }`}
                        >
                          <Check size={12} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-white/5 text-slate-500 flex items-center justify-center shrink-0">
                          <CloseIcon size={12} />
                        </div>
                      )}
                      <span
                        className={`${
                          feat.included
                            ? feat.highlight
                              ? 'text-white font-bold'
                              : 'text-slate-300 font-medium'
                            : 'text-slate-500 line-through'
                        }`}
                      >
                        {feat.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  disabled={paying}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePayment(plan.id);
                  }}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-xl ${
                    plan.isRecommended
                      ? 'bg-gradient-to-r from-[#2648E7] to-[#4F6DFF] hover:from-[#1e3bbd] hover:to-[#2648E7] text-white shadow-[#2648E7]/30 hover:scale-[1.02]'
                      : 'bg-white text-slate-900 hover:bg-slate-100 hover:scale-[1.02]'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {paying && selectedPlan === plan.id ? (
                    <span>Opening Payment...</span>
                  ) : (
                    <>
                      <Zap size={16} />
                      <span>Get Started for {formatINR(calc.totalToday)}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Informative Note on Recurring Renewals */}
        <div className="max-w-2xl mx-auto mb-10 text-center p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-slate-400">
          💡 <strong>Transparent Billing:</strong> Setup cost is a one-time onboarding investment. Subsequent renewals will only charge the monthly subscription package with duration discounts applied.
        </div>

        {/* Free trial footer */}
        <div className="max-w-xl mx-auto text-center p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-center gap-2 text-slate-300 text-sm font-semibold mb-2">
            <Gift size={16} className="text-[#FCC300]" />
            <span>Need to test Apni Estate first?</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Request a 15-day free trial. Approval is reviewed by the Apni Estate onboarding team.
          </p>
          <button
            type="button"
            disabled={requestingTrial}
            onClick={handleRequestTrial}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            {requestingTrial ? 'Requesting Trial...' : 'Request 15-Day Free Trial →'}
          </button>
        </div>
      </div>
    </div>
  );
}
