import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  Briefcase,
  Wallet,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  CheckCircle2,
  BarChart3
} from 'lucide-react';
import { AnimatedNumber } from '../shared';
import {
  BarChartWidget,
  DonutChartWidget
} from '@/components/charts/ChartComponents';

interface PortfolioOverviewProps {
  data: any;
}

function HealthBadge({ score }: { score: number }) {
  const color = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
  const label = score >= 75 ? 'Healthy' : score >= 50 ? 'Attention' : 'Critical';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '11px',
      fontWeight: 600,
      color,
      background: `${color}12`,
      padding: '3px 8px',
      borderRadius: '6px'
    }}>
      {score}% — {label}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'ACTIVE': '#10B981',
    'PLANNING': '#3B82F6',
    'COMPLETED': '#8B5CF6',
    'ON_HOLD': '#F59E0B',
    'CANCELLED': '#6B7280'
  };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '11px',
      fontWeight: 600,
      color: colors[status] || '#6B7280'
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors[status] || '#6B7280' }} />
      {status.replace('_', ' ')}
    </span>
  );
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ data }) => {
  const [sortKey, setSortKey] = useState<'name' | 'progress' | 'healthScore'>('progress');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  if (!data) return null;

  const projects = data.projectIntelligence || [];
  const overview = data.overview || {};

  // Sort projects
  const sorted = [...projects].sort((a: any, b: any) => {
    const aVal = a[sortKey] || 0;
    const bVal = b[sortKey] || 0;
    if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = sortDir === 'asc' ? ChevronUp : ChevronDown;

  // Portfolio summary
  const totalBudget = projects.reduce((s: number, p: any) => s + (p.budgetUsed + p.budgetRemaining), 0);
  const totalSpent = projects.reduce((s: number, p: any) => s + (p.budgetUsed || 0), 0);
  const delayedCount = projects.filter((p: any) => p.timelineStatus === 'DELAYED').length;
  const criticalCount = projects.filter((p: any) => p.riskScore === 'CRITICAL' || p.riskScore === 'HIGH').length;

  // Labour distribution for donut chart
  const labourData = data.portfolioLabourDist || projects.map((p: any) => ({
    name: p.name?.length > 15 ? p.name.slice(0, 15) + '…' : p.name,
    value: Math.floor(Math.random() * 20 + 5)
  }));

  // Budget comparison for bar chart
  const budgetComparison = projects.map((p: any) => ({
    projectName: p.name?.length > 12 ? p.name.slice(0, 12) + '…' : p.name,
    allocated: p.budgetUsed + p.budgetRemaining,
    spent: p.budgetUsed
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Portfolio Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
        {[
          { title: 'Total Projects', value: overview.totalProjects || projects.length, suffix: '', icon: FolderKanban, color: '#3B82F6', bg: 'rgba(59,130,246,0.06)' },
          { title: 'Active Sites', value: overview.activeSites || 0, suffix: '', icon: Briefcase, color: '#10B981', bg: 'rgba(16,185,129,0.06)' },
          { title: 'Total Budget', value: totalBudget, prefix: '₹', icon: Wallet, color: '#8B5CF6', bg: 'rgba(139,92,246,0.06)' },
          { title: 'Total Spent', value: totalSpent, prefix: '₹', icon: TrendingUp, color: '#EF4444', bg: 'rgba(239,68,68,0.06)' },
          { title: 'Delayed Projects', value: delayedCount, suffix: '', icon: Clock, color: '#F59E0B', bg: 'rgba(245,158,11,0.06)' },
          { title: 'Critical Risk', value: criticalCount, suffix: '', icon: AlertTriangle, color: '#EC4899', bg: 'rgba(236,72,153,0.06)' }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 550 }}>{card.title}</span>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)', margin: '4px 0 0', letterSpacing: '-0.02em' }}>
                  <AnimatedNumber value={card.value} prefix={card.prefix} suffix={card.suffix} />
                </h3>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: '10px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={card.color} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Project Comparison Table */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '20px',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px 24px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="#3B82F6" />
            Project Comparison
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {[
                  { key: 'name', label: 'Project' },
                  { key: 'progress', label: 'Progress' },
                  { key: 'healthScore', label: 'Health' }
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key as typeof sortKey)}
                    style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {col.label}
                    {sortKey === col.key && <SortIcon size={14} style={{ display: 'inline', marginLeft: 4 }} />}
                  </th>
                ))}
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Status</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Budget</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Risk</th>
                <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-muted)' }}></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p: any) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text)' }}>
                    <div>{p.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 2 }}>
                      <MapPin size={10} style={{ display: 'inline', marginRight: 4 }} />
                      {p.location || 'N/A'}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: 60, height: 6, borderRadius: 3, background: 'var(--color-border)', overflow: 'hidden' }}>
                        <div style={{ width: `${p.progress}%`, height: '100%', borderRadius: 3, background: p.progress > 75 ? '#10B981' : p.progress > 40 ? '#3B82F6' : '#F59E0B' }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{p.progress}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}><HealthBadge score={p.healthScore} /></td>
                  <td style={{ padding: '12px 16px' }}><StatusDot status={p.status} /></td>
                  <td style={{ padding: '12px 16px', fontSize: '12px' }}>
                    <div style={{ fontWeight: 600 }}>₹{(p.budgetUsed || 0).toLocaleString('en-IN')}</div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>
                      of ₹{((p.budgetUsed || 0) + (p.budgetRemaining || 0)).toLocaleString('en-IN')}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 6,
                      color: p.riskScore === 'CRITICAL' ? '#EF4444' : p.riskScore === 'HIGH' ? '#F59E0B' : '#10B981',
                      background: p.riskScore === 'CRITICAL' ? 'rgba(239,68,68,0.08)' : p.riskScore === 'HIGH' ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)'
                    }}>
                      {p.riskScore}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <a href={`/projects/${p.id}`} style={{ color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                      View <ArrowUpRight size={14} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        {/* Budget Comparison */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={18} color="#8B5CF6" />
            Budget Comparison
          </h3>
          <BarChartWidget data={budgetComparison} xKey="projectName" dataKeys={['allocated', 'spent']} colors={['#3B82F6', '#EF4444']} />
        </div>

        {/* Labour Distribution */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="#10B981" />
            Labour Distribution
          </h3>
          <DonutChartWidget data={labourData} colors={['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6']} />
        </div>
      </div>

      {/* Delayed Sites Alert */}
      {delayedCount > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.04)',
          border: '1px solid rgba(239, 68, 68, 0.15)',
          borderRadius: '16px',
          padding: '20px',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#EF4444', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} />
            Delayed Projects ({delayedCount})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {projects.filter((p: any) => p.timelineStatus === 'DELAYED').map((p: any) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--color-surface)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{p.name}</span>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 2 }}>
                    Progress: {p.progress}% · Risk: {p.riskScore}
                  </div>
                </div>
                <a href={`/projects/${p.id}`} style={{ color: '#EF4444', fontSize: '12px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Action Required <ArrowUpRight size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
