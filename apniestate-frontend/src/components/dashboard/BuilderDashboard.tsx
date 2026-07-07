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

  return (
    <div className="flex flex-col gap-6 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <UniversalSearchWidget isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} data={data} />
      <BuilderDashboardOverview />
    </div>
  );
}
