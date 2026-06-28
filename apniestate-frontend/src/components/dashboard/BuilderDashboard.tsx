import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardQuery } from '@/hooks/useDashboardQuery';
import { Search } from 'lucide-react';
import { BuilderDashboardOverview } from './BuilderDashboardOverview';
import { BuilderIntelligenceCenter } from './BuilderIntelligenceCenter';
import { UniversalSearchWidget } from './builder/UniversalSearchWidget';
import { KpiGridSkeleton } from './DashboardSkeletons';

export default function BuilderDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardQuery<any>('/dashboard/builder', {
    refetchInterval: 30000
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'intelligence'>('overview');
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
            onClick={() => setIsSearchOpen(true)}
            style={{ padding: '10px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            <Search size={16} /> Search (Cmd+K)
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', marginBottom: '8px' }}>
        <button 
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            background: activeTab === 'overview' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'overview' ? '#FFF' : 'var(--color-text-muted)',
            border: 'none',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Dashboard Overview
        </button>
        <button 
          onClick={() => setActiveTab('intelligence')}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            background: activeTab === 'intelligence' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'intelligence' ? '#FFF' : 'var(--color-text-muted)',
            border: 'none',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          More (Intelligence Center)
        </button>
      </div>

      {/* Render Active View */}
      {activeTab === 'overview' ? (
        <BuilderDashboardOverview />
      ) : (
        <BuilderIntelligenceCenter data={data} />
      )}

    </div>
  );
}
