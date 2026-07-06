import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDashboardQuery } from '@/hooks/useDashboardQuery';
import { ClipboardList, Wallet, Briefcase, Users, Boxes, AlertTriangle, ArrowRight, ThumbsUp, CheckCircle2 } from 'lucide-react';
import { BuilderDashboardOverview } from './BuilderDashboardOverview';
import { BuilderIntelligenceCenter } from './BuilderIntelligenceCenter';
import { PortfolioOverview } from './builder/PortfolioOverview';
import { UniversalSearchWidget } from './builder/UniversalSearchWidget';
import { KpiGridSkeleton } from './DashboardSkeletons';

export default function BuilderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    { id: 'overview' as const, label: 'Overview' },
    { id: 'portfolio' as const, label: 'Portfolio' },
    { id: 'intelligence' as const, label: 'Insights' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', paddingBottom: '60px' }}>
      <UniversalSearchWidget isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} data={data} />
      
      {/* Redesigned Mockup Greeting Area (Replaces bulking AI card) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 4px 4px 4px',
        width: '100%'
      }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
            {(() => {
              const hr = new Date().getHours();
              const name = user?.name ? user.name.split(' ')[0] : 'Asim';
              if (hr < 12) return `Good morning, ${name} ☀️`;
              if (hr < 17) return `Good afternoon, ${name} ☀️`;
              return `Good evening, ${name} 🌙`;
            })()}
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0', fontWeight: 500 }}>
            {formattedDate}
          </p>
        </div>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          backgroundColor: '#1D4ED8',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '14px',
          boxShadow: '0 2px 8px rgba(29, 78, 216, 0.15)'
        }}>
          {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AR'}
        </div>
      </div>

      {/* iOS-Style Segmented Tab Capsule Controls */}
      <div className="segmented-control">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`segmented-item ${activeTab === tab.id ? 'active' : ''}`}
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
