import React from 'react';
import { Wallet, TrendingUp, IndianRupee, PieChart, Activity } from 'lucide-react';
import { AreaChartWidget, BarChartWidget, DonutChartWidget } from '@/components/charts/ChartComponents';

interface FinancialIntelligenceWidgetProps {
  data: any;
  revenueTrend: any;
  budgetBurn: any;
}

export const FinancialIntelligenceWidget: React.FC<FinancialIntelligenceWidgetProps> = ({ data, revenueTrend, budgetBurn }) => {
  return (
    <div className="premium-widget animate-in">
      <div className="widget-header">
        <h3 className="widget-title">
          <Wallet size={18} color="var(--color-primary)" />
          Financial Intelligence
        </h3>
      </div>

      {/* Financial KPIs */}
      <div className="project-metric-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '24px' }}>
        <div className="project-metric">
          <span className="project-metric-label">Cashbook Balance</span>
          <span className="project-metric-val" style={{ color: 'var(--color-primary)', fontSize: '20px' }}>
            ₹{(data.creditSum - data.debitSum).toLocaleString()}
          </span>
        </div>
        <div className="project-metric">
          <span className="project-metric-label">Today's Expenses</span>
          <span className="project-metric-val" style={{ color: '#EF4444', fontSize: '20px' }}>
            ₹{data.todayExpenses?.toLocaleString() || 0}
          </span>
        </div>
        <div className="project-metric">
          <span className="project-metric-label">Monthly Burn Rate (Avg)</span>
          <span className="project-metric-val" style={{ color: '#F59E0B', fontSize: '20px' }}>
            ₹{(data.cashBurnRate * 30).toLocaleString()}
          </span>
        </div>
        <div className="project-metric">
          <span className="project-metric-label">Expected Payments</span>
          <span className="project-metric-val" style={{ color: '#10B981', fontSize: '20px' }}>
            ₹{data.expectedPayments?.toLocaleString() || 0}
          </span>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Revenue & Expenses Trend */}
        <div style={{ background: 'var(--color-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} color="#3B82F6" /> Cash Flow Trend
          </h4>
          <AreaChartWidget data={revenueTrend} xKey="month" dataKeys={['revenue', 'expenses']} colors={['#10B981', '#EF4444']} />
        </div>

        {/* Expense Breakdown */}
        <div style={{ background: 'var(--color-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={16} color="#8B5CF6" /> Top Expense Categories
          </h4>
          {data.topExpenseCategories && data.topExpenseCategories.length > 0 ? (
            <DonutChartWidget 
              data={data.topExpenseCategories.map((c: any) => ({ name: c.name, value: c.amount }))} 
              colors={['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6']} 
            />
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No expense data available</div>
          )}
        </div>

        {/* Budget Utilization */}
        <div style={{ background: 'var(--color-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="#F59E0B" /> Budget Burn by Project
          </h4>
          <BarChartWidget data={budgetBurn} xKey="projectName" dataKeys={['allocated', 'spent']} colors={['#3B82F6', '#EF4444']} />
        </div>

      </div>
    </div>
  );
};
