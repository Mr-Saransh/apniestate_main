import React from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  CreditCard,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  ShoppingCart,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Receipt,
  HandCoins,
  BadgeIndianRupee
} from 'lucide-react';
import { AnimatedNumber } from '../shared';

interface FinancialKPI {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: any;
  color: string;
  bg: string;
  change?: number; // percentage change from previous period
  sparkline?: number[];
}

interface FinancialKPIGridProps {
  data: any;
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 24;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrendBadge({ change }: { change?: number }) {
  if (change === undefined || change === null) return null;
  const isPositive = change > 0;
  const isZero = change === 0;
  const color = isZero ? '#6B7280' : isPositive ? '#10B981' : '#EF4444';
  const Icon = isZero ? Minus : isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '2px',
      fontSize: '11px',
      fontWeight: 600,
      color,
      background: isZero ? 'rgba(107, 114, 128, 0.08)' : isPositive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
      padding: '2px 6px',
      borderRadius: '6px'
    }}>
      <Icon size={12} />
      {Math.abs(change).toFixed(1)}%
    </span>
  );
}

export const FinancialKPIGrid: React.FC<FinancialKPIGridProps> = ({ data }) => {
  if (!data) return null;

  const overview = data.overview || {};
  const financial = data.financialIntelligence || {};
  const sparklines = data.sparklines || {};

  const kpis: FinancialKPI[] = [
    {
      title: "This Month's Spend",
      value: overview.thisMonthSpend || financial.debitSum || 0,
      prefix: '₹',
      icon: CreditCard,
      color: '#EF4444',
      bg: 'rgba(239, 68, 68, 0.06)'
    },
    {
      title: 'Pending Payments',
      value: overview.pendingPayments || 0,
      prefix: '₹',
      icon: HandCoins,
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.06)'
    },
    {
      title: 'Budget Utilized',
      value: overview.budgetUtilization || 0,
      suffix: '%',
      icon: PiggyBank,
      color: '#3B82F6',
      bg: 'rgba(59, 130, 246, 0.06)'
    },
    {
      title: 'Available Cash',
      value: overview.currentCashBalance || 0,
      prefix: '₹',
      icon: Wallet,
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.06)'
    },
    {
      title: "Today's Labour Cost",
      value: overview.todayLabourCost || 0,
      prefix: '₹',
      icon: Users,
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.06)'
    },
    {
      title: 'Monthly Labour Cost',
      value: overview.monthlyLabourCost || 0,
      prefix: '₹',
      icon: Users,
      color: '#6366F1',
      bg: 'rgba(99, 102, 241, 0.06)'
    }
  ];

  return (
    <section style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '20px',
      padding: '20px',
      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02)',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <BadgeIndianRupee size={18} color="#2648E7" />
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
          Executive Financial Snapshot
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderTop: idx > 0 ? '1px solid #F1F5F9' : 'none'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 550, letterSpacing: '-0.01em' }}>
                  {kpi.title}
                </span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  <AnimatedNumber value={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix} />
                </span>
              </div>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: kpi.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Icon size={18} color={kpi.color} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
