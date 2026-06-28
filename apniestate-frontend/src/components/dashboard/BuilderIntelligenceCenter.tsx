import React, { useState } from 'react';
import {
  Boxes,
  CloudLightning,
  ClipboardList,
  ArrowUpRight
} from 'lucide-react';
import {
  CalendarWidget,
  RecentActivityWidget,
  TimelineWidget,
  ProgressRingCard,
  EmptyStateWidget
} from './widgets';
import { ExecutiveDecisionWidget } from './builder/ExecutiveDecisionWidget';
import { CostEstimationEngine } from './builder/CostEstimationEngine';
import { FinancialIntelligenceWidget } from './builder/FinancialIntelligenceWidget';
import { WorkforceIntelligenceWidget } from './builder/WorkforceIntelligenceWidget';
import { VendorIntelligenceWidget } from './builder/VendorIntelligenceWidget';
import { RiskCenterWidget } from './builder/RiskCenterWidget';
import '@/styles/builder-dashboard.css';

interface BuilderIntelligenceCenterProps {
  data: any;
}

export const BuilderIntelligenceCenter: React.FC<BuilderIntelligenceCenterProps> = ({ data }) => {
  const [activeSection, setActiveSection] = useState('decision-center');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 130;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const sections = [
    { id: 'decision-center', label: 'Decision Center' },
    { id: 'financial-intel', label: 'Financials' },
    { id: 'cost-estimation', label: 'Estimation Engine' },
    { id: 'workforce-intel', label: 'Workforce' },
    { id: 'vendor-intel', label: 'Vendors' },
    { id: 'risk-center', label: 'Risk Center' },
    { id: 'material-intel', label: 'Materials' },
    { id: 'approvals', label: 'Approvals' }
  ];

  return (
    <div className="builder-command-center">
      {/* Sticky Section Navigation */}
      <div className="builder-section-nav" style={{ top: '60px' }}>
        {sections.map(s => (
          <button 
            key={s.id} 
            className={`section-nav-item ${activeSection === s.id ? 'active' : ''}`}
            onClick={() => scrollToSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div id="decision-center" className="dashboard-section">
        <ExecutiveDecisionWidget cards={data.decisionCards} />
      </div>

      <div id="financial-intel" className="dashboard-section">
        <FinancialIntelligenceWidget data={data.financialIntelligence} revenueTrend={data.revenueTrend} budgetBurn={data.budgetBurn} />
      </div>

      <div id="cost-estimation" className="dashboard-section">
        <CostEstimationEngine />
      </div>

      <div id="workforce-intel" className="dashboard-section">
        <WorkforceIntelligenceWidget data={data.workforceIntelligence} trend={data.labourTrend} />
      </div>

      <div id="vendor-intel" className="dashboard-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        <VendorIntelligenceWidget vendors={data.vendorPerformance} />
      </div>

      <div id="risk-center" className="dashboard-section">
        <RiskCenterWidget projects={data.projectIntelligence} />
      </div>

      <div id="material-intel" className="dashboard-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        <div className="premium-widget animate-in">
          <div className="widget-header">
            <h3 className="widget-title">
              <Boxes size={18} color="#EF4444" />
              Material Intelligence & Shortages
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {data.materialShortages.length === 0 ? (
              <EmptyStateWidget title="No Shortages" message="All active sites have adequate material stock levels." />
            ) : (
              data.materialShortages.map((item: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-bg)' }}>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>{item.name}</span>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Site: {item.siteName}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#EF4444' }}>
                      {item.quantity} / {item.minQuantity} {item.unit}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, marginTop: '4px' }}>Auto-Reorder</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Construction Calendar & Weather */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
           <div className="premium-widget animate-in" style={{ padding: '20px' }}>
             <h3 className="widget-title" style={{ marginBottom: '12px' }}><CloudLightning size={18} color="#F59E0B" /> Weather Intelligence</h3>
             <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', display: 'flex', gap: '12px', flexDirection: 'column' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px' }}>
                 <span style={{ fontWeight: 600, color: '#EF4444' }}>Heavy Rain Expected Tomorrow</span>
                 <span style={{ fontSize: '11px' }}>Halt Concrete Pouring</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px' }}>
                 <span style={{ fontWeight: 600, color: '#10B981' }}>Clear Skies Today</span>
                 <span style={{ fontSize: '11px' }}>Optimal for Exterior Work</span>
               </div>
             </div>
           </div>
           <CalendarWidget events={data.calendarEvents} />
        </div>
      </div>

      <div id="approvals" className="dashboard-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        {/* Approval Center */}
        <div className="premium-widget animate-in" style={{ gap: '16px' }}>
          <h3 className="widget-title">
            <ClipboardList size={18} color="#EF4444" />
            Universal Approval Center
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '8px' }}>
            <ProgressRingCard title="Expense Vouchers" percentage={data.approvalsPending.expenses > 0 ? 35 : 100} color="#F59E0B" subtitle={`${data.approvalsPending.expenses} pending`} />
            <ProgressRingCard title="Leave Requests" percentage={data.approvalsPending.leaves > 0 ? 50 : 100} color="#3B82F6" subtitle={`${data.approvalsPending.leaves} pending`} />
            <ProgressRingCard title="Purchase Orders" percentage={data.approvalsPending.purchaseOrders > 0 ? 20 : 100} color="#8B5CF6" subtitle={`${data.approvalsPending.purchaseOrders} pending`} />
            <ProgressRingCard title="Material Requests" percentage={data.approvalsPending.materialRequests > 0 ? 60 : 100} color="#10B981" subtitle={`${data.approvalsPending.materialRequests} pending`} />
          </div>
          <a
            href="/approvals"
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: 'var(--color-primary)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '14px',
              textAlign: 'center',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '8px'
            }}
          >
            Review All Pending Approvals <ArrowUpRight size={16} />
          </a>
        </div>

        <RecentActivityWidget activities={data.financialIntelligence?.recentExpenses.map((e: any) => ({
          id: e.id,
          details: `${e.category} voucher for ₹${e.amount.toLocaleString()} was ${e.status.toLowerCase()}`,
          timestamp: e.date,
          userName: 'Finance'
        }))} />
      </div>
    </div>
  );
};
