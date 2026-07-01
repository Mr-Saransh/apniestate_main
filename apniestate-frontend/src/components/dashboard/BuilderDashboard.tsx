import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardQuery } from '@/hooks/useDashboardQuery';
import { ClipboardList, CloudSun } from 'lucide-react';
import { BuilderDashboardOverview } from './BuilderDashboardOverview';
import { BuilderIntelligenceCenter } from './BuilderIntelligenceCenter';
import { PortfolioOverview } from './builder/PortfolioOverview';
import { UniversalSearchWidget } from './builder/UniversalSearchWidget';
import { KpiGridSkeleton } from './DashboardSkeletons';

export default function BuilderDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardQuery<any>('/dashboard/builder', {
    refetchInterval: 30000
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'intelligence' | 'portfolio'>('overview');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const formattedDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <KpiGridSkeleton />
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as const, label: 'Dashboard Overview' },
    { id: 'portfolio' as const, label: 'Portfolio' },
    { id: 'intelligence' as const, label: 'Intelligence Center' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', paddingBottom: '60px' }}>
      <UniversalSearchWidget isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} data={data} />
      
      {/* 1. DYNAMIC LARGE HERO CONTROL CARD (PRESERVED) */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary, #0A3D91) 0%, #1E40AF 100%)',
        borderRadius: '20px',
        padding: '28px',
        color: '#FFFFFF',
        boxShadow: '0 8px 30px rgba(10, 61, 145, 0.12)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#F4B400', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Executive Dashboard
          </span>
          <h1 style={{ color: '#FFFFFF', fontSize: '26px', fontWeight: 800, margin: '6px 0 2px 0', letterSpacing: '-0.02em' }}>
            Welcome back, {user?.name || 'Lead Builder'}
          </h1>
          <p style={{ opacity: 0.85, fontSize: '13px', fontWeight: 500 }}>
            Workspace: <strong style={{ color: '#F4B400' }}>Apni Estate Enterprise</strong> • {formattedDate}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => window.location.href = '/approvals'}
            style={{ padding: '10px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, backdropFilter: 'blur(10px)', transition: 'all 0.2s ease' }}
          >
            <ClipboardList size={16} /> Pending Approvals
            {(data.approvalsPending?.expenses > 0 || data.approvalsPending?.leaves > 0) && (
              <span style={{ background: '#EF4444', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>
                {data.approvalsPending.expenses + data.approvalsPending.leaves}
              </span>
            )}
          </button>
          <div 
            style={{ padding: '8px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', gap: '12px', backdropFilter: 'blur(10px)' }}
          >
            <CloudSun size={24} color="#F4B400" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, lineHeight: 1 }}>28°C • Mostly Sunny</span>
              <span style={{ fontSize: '11px', opacity: 0.85, lineHeight: 1 }}>Optimal for concrete works</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', marginBottom: '8px' }}>
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              background: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
              color: activeTab === tab.id ? '#FFF' : 'var(--color-text-muted)',
              border: 'none',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Render Active View */}
      {activeTab === 'overview' ? (
        <BuilderDashboardOverview />
      ) : activeTab === 'portfolio' ? (
        <PortfolioOverview data={data} />
      ) : (
        <BuilderIntelligenceCenter data={data} />
      )}

    </div>
  );
}
