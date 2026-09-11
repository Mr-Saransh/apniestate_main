import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, Layers, Building2, ArrowRight } from 'lucide-react';

/*
  PRICING SECTION:
  Monthly-only pricing on landing page (Setup cost removed per user requirement).
  - Basic: ₹10,000/mo
  - Professional: ₹20,000/mo
  - Enterprise: ₹40,000/mo
  Flexible duration discounts apply to monthly rates.
*/

type PlanTier = 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
type Duration = 1 | 4 | 6 | 12;

interface Plan {
  id: PlanTier;
  name: string;
  monthlyPrice: number;
  maxProjects: string;
  hasCrm: boolean;
  recommended: boolean;
  description: string;
  icon: React.ElementType;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: 'BASIC',
    name: 'Basic',
    monthlyPrice: 10000,
    maxProjects: '1 Active Site',
    hasCrm: false,
    recommended: false,
    description: 'For individual builders and contractors managing a single project site.',
    icon: Layers,
    features: [
      '1 Active Project Site',
      'Site DPR (Daily Progress Reports)',
      'BOQ & Material Tracking',
      'Finance, Cashbook & Invoices',
      'Labour Attendance & Wages',
      'Standard Email & Chat Support',
    ],
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    monthlyPrice: 20000,
    maxProjects: '3 Active Sites',
    hasCrm: false,
    recommended: false,
    description: 'For growing construction firms running up to 3 simultaneous projects.',
    icon: Building2,
    features: [
      '3 Active Project Sites',
      'Full ERP Operations Suite',
      'Vendor & PO Management',
      'Live Cashbook & Expense Audits',
      'Site Photo & Document Vault',
      'Multi-site Supervisor Access',
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    monthlyPrice: 40000,
    maxProjects: 'Unlimited Sites + CRM',
    hasCrm: true,
    recommended: true,
    description: 'Complete ERP + CRM power for established real estate developers.',
    icon: Sparkles,
    features: [
      'Unlimited Project Sites',
      'Full Construction ERP Suite',
      'Complete Real Estate CRM Included',
      'Lead Pipeline & Telecaller Hub',
      'Booking & Deal Management',
      'Dedicated Account Manager & 24/7 SLA',
    ],
  },
];

const DURATIONS: { value: Duration; label: string; discount: number; badge?: string }[] = [
  { value: 1, label: 'Monthly', discount: 0 },
  { value: 4, label: '4 Months', discount: 0.10, badge: '10% OFF' },
  { value: 6, label: '6 Months', discount: 0.20, badge: '20% OFF' },
  { value: 12, label: '12 Months', discount: 0.35, badge: 'Best Value (35% OFF)' },
];

const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

export default function PricingSection() {
  const [dur, setDur] = useState<Duration>(4);
  const durObj = DURATIONS.find((d) => d.value === dur)!;

  return (
    <section id="pricing" className="ae-section" style={{ background: '#F8FAFC' }}>
      <div className="ae-container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div className="ae-label" style={{ color: '#2648E7', marginBottom: 12 }}>
            Transparent Pricing
          </div>
          <h2 className="ae-heading-lg" style={{
            fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
            color: '#0B132B',
            marginBottom: 12,
          }}>
            Predictable Monthly Subscriptions
          </h2>
          <p className="ae-body" style={{ maxWidth: 520, margin: '0 auto', fontSize: 16 }}>
            No hidden fees. Choose the plan that fits your active sites and scale effortlessly.
          </p>
        </div>

        {/* Duration Selector */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex',
            gap: 4,
            padding: 5,
            borderRadius: 16,
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            flexWrap: 'wrap',
          }}>
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDur(d.value)}
                style={{
                  padding: '10px 22px',
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'var(--ae-font-display)',
                  transition: 'all 0.2s ease',
                  background: dur === d.value ? '#2648E7' : 'transparent',
                  color: dur === d.value ? '#FFFFFF' : '#64748B',
                  boxShadow: dur === d.value ? '0 4px 14px rgba(38, 72, 231, 0.35)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>{d.label}</span>
                {d.badge && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 6,
                    background: dur === d.value ? 'rgba(255,255,255,0.22)' : 'rgba(252,195,0,0.2)',
                    color: dur === d.value ? '#FCC300' : '#B45309',
                    textTransform: 'uppercase',
                  }}>
                    {d.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: 28,
          alignItems: 'stretch',
        }}>
          {PLANS.map((plan) => {
            const baseMonthly = plan.monthlyPrice;
            const effectiveMonthly = Math.round(baseMonthly * (1 - durObj.discount));
            const totalPeriodCost = effectiveMonthly * dur;
            const Icon = plan.icon;

            return (
              <div
                key={plan.id}
                style={{
                  position: 'relative',
                  borderRadius: 24,
                  padding: '36px 30px',
                  border: plan.recommended ? '2px solid #2648E7' : '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: plan.recommended
                    ? '0 20px 50px rgba(38, 72, 231, 0.12)'
                    : '0 4px 16px rgba(0,0,0,0.03)',
                  transform: plan.recommended ? 'scale(1.02)' : 'none',
                }}
              >
                {plan.recommended && (
                  <div style={{
                    position: 'absolute',
                    top: -14,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '6px 20px',
                    borderRadius: 100,
                    background: 'linear-gradient(135deg, #FCC300, #F59E0B)',
                    color: '#0B132B',
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontFamily: 'var(--ae-font-display)',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(252,195,0,0.35)',
                  }}>
                    Most Popular & Recommended
                  </div>
                )}

                {/* Plan Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: plan.recommended ? '#2648E7' : '#F1F5F9',
                    color: plan.recommended ? '#FFFFFF' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: '#0F172A',
                      fontFamily: 'var(--ae-font-display)',
                      margin: 0,
                    }}>
                      {plan.name}
                    </h3>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: plan.recommended ? '#2648E7' : '#64748B',
                      fontFamily: 'var(--ae-font-display)',
                    }}>
                      {plan.maxProjects}
                    </span>
                  </div>
                </div>

                <p style={{
                  fontSize: 14,
                  color: '#64748B',
                  marginBottom: 24,
                  lineHeight: 1.6,
                  minHeight: 44,
                }}>
                  {plan.description}
                </p>

                {/* Monthly Pricing Display */}
                <div style={{
                  padding: 20,
                  borderRadius: 16,
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  marginBottom: 28,
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 34,
                      fontWeight: 900,
                      color: '#0F172A',
                      fontFamily: 'var(--ae-font-display)',
                    }}>
                      {fmtINR(effectiveMonthly)}
                    </span>
                    <span style={{ fontSize: 14, color: '#64748B', fontWeight: 600 }}>/ month</span>
                  </div>

                  {durObj.discount > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <span style={{ textDecoration: 'line-through', color: '#94A3B8' }}>
                        {fmtINR(baseMonthly)}/mo
                      </span>
                      <span style={{
                        fontWeight: 800,
                        color: '#059669',
                        background: '#ECFDF5',
                        padding: '2px 8px',
                        borderRadius: 6,
                      }}>
                        Save {Math.round(durObj.discount * 100)}%
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#64748B' }}>
                      Billed monthly
                    </div>
                  )}

                  {dur > 1 && (
                    <div style={{
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: '1px solid #E2E8F0',
                      fontSize: 12,
                      color: '#64748B',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}>
                      <span>Billed upfront for {dur} months:</span>
                      <strong style={{ color: '#0F172A' }}>{fmtINR(totalPeriodCost)}</strong>
                    </div>
                  )}
                </div>

                {/* Feature List */}
                <div style={{ flex: 1, marginBottom: 28 }}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#94A3B8',
                    letterSpacing: '0.08em',
                    marginBottom: 14,
                    fontFamily: 'var(--ae-font-display)',
                  }}>
                    What's included:
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {plan.features.map((feat, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#334155' }}>
                        <div style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: '#ECFDF5',
                          color: '#10B981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <Link
                  to="/signup"
                  className={plan.recommended ? 'ae-btn ae-btn-primary' : 'ae-btn ae-btn-outline'}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '14px 20px',
                    fontSize: 15,
                  }}
                >
                  Get Started with {plan.name} <ArrowRight size={16} />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
