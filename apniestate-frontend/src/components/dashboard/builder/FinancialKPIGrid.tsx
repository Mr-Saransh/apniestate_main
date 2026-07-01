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
      bg: 'rgba(239, 68, 68, 0.06)',
      change: overview.spendChange,
      sparkline: sparklines.dailySpend
    },
    {
      title: 'Pending Payments',
      value: overview.pendingPayments || 0,
      prefix: '₹',
      icon: HandCoins,
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.06)',
      change: undefined,
      sparkline: undefined
    },
    {
      title: 'Budget Utilized',
      value: overview.budgetUtilization || 0,
      suffix: '%',
      icon: PiggyBank,
      color: overview.budgetUtilization > 85 ? '#EF4444' : '#3B82F6',
      bg: overview.budgetUtilization > 85 ? 'rgba(239, 68, 68, 0.06)' : 'rgba(59, 130, 246, 0.06)',
      change: undefined,
      sparkline: sparklines.budgetUtil
    },
    {
      title: 'Available Cash',
      value: overview.currentCashBalance || 0,
      prefix: '₹',
      icon: Wallet,
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.06)',
      change: undefined,
      sparkline: sparklines.cashBalance
    },
    {
      title: "Today's Labour Cost",
      value: overview.todayLabourCost || 0,
      prefix: '₹',
      icon: Users,
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.06)',
      change: overview.labourCostChange,
      sparkline: sparklines.labourCost
    },
    {
      title: 'Monthly Labour Cost',
      value: overview.monthlyLabourCost || 0,
      prefix: '₹',
      icon: Users,
      color: '#6366F1',
      bg: 'rgba(99, 102, 241, 0.06)',
      change: undefined,
      sparkline: undefined
    },
    {
      title: 'Pending Invoices',
      value: overview.pendingInvoiceCount || data.approvalsPending?.total || 0,
      suffix: '',
      icon: FileText,
      color: '#EC4899',
      bg: 'rgba(236, 72, 153, 0.06)',
      change: undefined,
      sparkline: undefined
    },
    {
      title: 'POs Awaiting Approval',
      value: data.approvalsPending?.purchaseOrders || 0,
      suffix: '',
      icon: ShoppingCart,
      color: '#14B8A6',
      bg: 'rgba(20, 184, 166, 0.06)',
      change: undefined,
      sparkline: undefined
    },
    {
      title: 'Outstanding Vendor Payments',
      value: overview.outstandingPayments || 0,
      prefix: '₹',
      icon: Building2,
      color: '#F97316',
      bg: 'rgba(249, 115, 22, 0.06)',
      change: undefined,
      sparkline: undefined
    },
    {
      title: 'Cashbook Balance',
      value: financial.creditSum - financial.debitSum || 0,
      prefix: '₹',
      icon: BadgeIndianRupee,
      color: '#0EA5E9',
      bg: 'rgba(14, 165, 233, 0.06)',
      change: undefined,
      sparkline: sparklines.cashBalance
    },
    {
      title: 'Receivables',
      value: overview.receivables || financial.creditSum * 0.12 || 0,
      prefix: '₹',
      icon: TrendingUp,
      color: '#22C55E',
      bg: 'rgba(34, 197, 94, 0.06)',
      change: undefined,
      sparkline: undefined
    },
    {
      title: 'Payables',
      value: overview.payables || financial.debitSum * 0.08 || 0,
      prefix: '₹',
      icon: Receipt,
      color: '#E11D48',
      bg: 'rgba(225, 29, 72, 0.06)',
      change: undefined,
      sparkline: undefined
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <h3 style={{
        fontSize: '15px',
        fontWeight: 700,
        color: 'var(--color-text)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <BadgeIndianRupee size={18} color="#3B82F6" />
        Executive Financial Snapshot
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-3)',
        width: '100%'
      }}>
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.025 }}
              whileHover={{ y: -3, boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                cursor: 'default',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 550, lineHeight: 1.3 }}>
                  {kpi.title}
                </span>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: kpi.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={16} color={kpi.color} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
                  <AnimatedNumber value={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix} />
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <TrendBadge change={kpi.change} />
                <MiniSparkline data={kpi.sparkline || []} color={kpi.color} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
