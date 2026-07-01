import React from 'react';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Users,
  Package,
  Building2,
  Truck,
  ArrowRight
} from 'lucide-react';

interface Insight {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  icon: any;
  ctaText?: string;
  ctaLink?: string;
}

interface ConstructionInsightsProps {
  data: any;
}

function generateInsights(data: any): Insight[] {
  const insights: Insight[] = [];
  const overview = data?.overview || {};
  const financial = data?.financialIntelligence || {};
  const workforce = data?.workforceIntelligence || {};
  const projects = data?.projectIntelligence || [];
  const vendors = data?.vendorPerformance || [];
  const materials = data?.materialShortages || [];
  const approvals = data?.approvalsPending || {};

  // 1. Labour cost comparison
  if (overview.labourCostChange !== undefined && overview.labourCostChange !== 0) {
    const direction = overview.labourCostChange > 0 ? 'higher' : 'lower';
    const absChange = Math.abs(overview.labourCostChange).toFixed(0);
    insights.push({
      id: 'labour-cost',
      message: `Labour cost is ${absChange}% ${direction} than last week.`,
      severity: overview.labourCostChange > 15 ? 'warning' : 'info',
      icon: Users,
      ctaText: 'View Attendance',
      ctaLink: '/attendance'
    });
  }

  // 2. Material consumption anomalies
  if (materials.length > 0) {
    const criticalMaterials = materials.filter((m: any) => m.quantity <= m.minQuantity * 0.3);
    if (criticalMaterials.length > 0) {
      insights.push({
        id: 'material-critical',
        message: `${criticalMaterials.length} material(s) at critically low stock levels across sites.`,
        severity: 'critical',
        icon: Package,
        ctaText: 'Check Inventory',
        ctaLink: '/inventory'
      });
    }
  }

  // 3. Vendor delivery delay
  const delayedVendors = vendors.filter((v: any) => v.lateDeliveries > 1);
  if (delayedVendors.length > 0) {
    const worstVendor = delayedVendors.sort((a: any, b: any) => b.lateDeliveries - a.lateDeliveries)[0];
    insights.push({
      id: 'vendor-delay',
      message: `Vendor "${worstVendor.name}" has the highest delivery delays (${worstVendor.lateDeliveries} late).`,
      severity: 'warning',
      icon: Truck,
      ctaText: 'Manage Vendors',
      ctaLink: '/vendors'
    });
  }

  // 4. Budget utilization on track
  const onTrackCount = projects.filter((p: any) => p.budgetStatus === 'ON_TRACK').length;
  const totalProjects = projects.length;
  if (totalProjects > 0) {
    insights.push({
      id: 'budget-track',
      message: `Budget utilization is on track for ${onTrackCount} of ${totalProjects} project(s).`,
      severity: onTrackCount === totalProjects ? 'success' : 'info',
      icon: CheckCircle2,
      ctaText: 'View Budgets',
      ctaLink: '/budgets'
    });
  }

  // 5. Sites requiring attention
  const delayedSites = projects.filter((p: any) => p.timelineStatus === 'DELAYED');
  if (delayedSites.length > 0) {
    insights.push({
      id: 'sites-attention',
      message: `${delayedSites.length} site(s) require attention today due to delays.`,
      severity: delayedSites.length >= 3 ? 'critical' : 'warning',
      icon: AlertTriangle,
      ctaText: 'View Projects',
      ctaLink: '/projects'
    });
  }

  // 6. Pending approvals
  if (approvals.total > 5) {
    insights.push({
      id: 'pending-approvals',
      message: `${approvals.total} items are pending your approval. Clear them to avoid workflow blocks.`,
      severity: 'warning',
      icon: Building2,
      ctaText: 'Review Approvals',
      ctaLink: '/settings'
    });
  }

  // 7. Over-budget projects
  const overBudget = projects.filter((p: any) => p.budgetStatus === 'OVER_BUDGET');
  if (overBudget.length > 0) {
    insights.push({
      id: 'over-budget',
      message: `${overBudget.length} project(s) have exceeded their allocated budget.`,
      severity: 'critical',
      icon: TrendingUp,
      ctaText: 'View Financials',
      ctaLink: '/finance'
    });
  }

  // 8. Workforce absenteeism
  if (workforce.absent > 0 && workforce.present > 0) {
    const absentRate = Math.round((workforce.absent / (workforce.present + workforce.absent)) * 100);
    if (absentRate > 20) {
      insights.push({
        id: 'absenteeism',
        message: `Workforce absenteeism is at ${absentRate}%. Consider reassigning workers to critical tasks.`,
        severity: 'warning',
        icon: Users,
        ctaText: 'View Workers',
        ctaLink: '/workers'
      });
    }
  }

  return insights;
}

const severityConfig = {
  info: { border: '#3B82F6', bg: 'rgba(59, 130, 246, 0.04)', iconColor: '#3B82F6' },
  warning: { border: '#F59E0B', bg: 'rgba(245, 158, 11, 0.04)', iconColor: '#F59E0B' },
  critical: { border: '#EF4444', bg: 'rgba(239, 68, 68, 0.04)', iconColor: '#EF4444' },
  success: { border: '#10B981', bg: 'rgba(16, 185, 129, 0.04)', iconColor: '#10B981' }
};

export const ConstructionInsights: React.FC<ConstructionInsightsProps> = ({ data }) => {
  const insights = generateInsights(data);

  if (insights.length === 0) return null;

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '20px',
      padding: '24px',
    }}>
      <h3 style={{
        fontSize: '15px',
        fontWeight: 700,
        color: 'var(--color-text)',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Lightbulb size={18} color="#F59E0B" />
        Construction Insights
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {insights.map((insight, idx) => {
          const config = severityConfig[insight.severity];
          const Icon = insight.icon;
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                background: config.bg,
                borderLeft: `3px solid ${config.border}`,
              }}
            >
              <Icon size={18} color={config.iconColor} style={{ flexShrink: 0 }} />
              <span style={{
                flex: 1,
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--color-text)',
                lineHeight: 1.4
              }}>
                {insight.message}
              </span>
              {insight.ctaText && insight.ctaLink && (
                <a
                  href={insight.ctaLink}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: config.iconColor,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  {insight.ctaText}
                  <ArrowRight size={12} />
                </a>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
