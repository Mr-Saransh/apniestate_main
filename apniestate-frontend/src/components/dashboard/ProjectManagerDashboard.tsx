import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardQuery } from '@/hooks/useDashboardQuery';
import { Briefcase, CalendarClock, Target, Activity } from 'lucide-react';
import { KPI, Card } from '@/components/shared/FigmaComponents';

export default function ProjectManagerDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardQuery<any>('/dashboard/manager', {
    refetchInterval: 12000
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Try to use real data or fallback to defaults for demo
  const activeProjects = data.overview?.activeProjects || 1;
  const milestoneProgress = data.overview?.milestoneProgress || 45;
  const upcomingDeadlines = data.overview?.upcomingDeadlines || 3;
  const budgetBurn = data.overview?.budgetBurn || 32;

  const name = user?.name ? user.name.split(' ')[0] : 'Manager';
  const hr = new Date().getHours();
  const greeting = hr < 12 ? `Good morning, ${name} ☀️` : (hr < 17 ? `Good afternoon, ${name} ☀️` : `Good evening, ${name} 🌙`);

  const formattedDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'PM';

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">{greeting}</h1>
          <p className="text-[11px] text-muted-foreground">{formattedDate} • Assigned Projects</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
          {initials}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="My Projects" value={activeProjects.toString()} icon={Briefcase} trend={{ up: true, v: "Stable" }} />
        <KPI label="Milestones" value={`${milestoneProgress}%`} icon={Target} trend={{ up: true, v: "+5%" }} />
        <KPI label="Deadlines (7d)" value={upcomingDeadlines.toString()} icon={CalendarClock} trend={{ up: false, v: "-1" }} />
        <KPI label="Budget Burn" value={`${budgetBurn}%`} icon={Activity} trend={{ up: true, v: "On Track" }} />
      </div>

      <Card title="Project Timelines" noPad>
        <div className="p-4 space-y-4">
          {[
            { t: 'Phase 1 Foundation', pct: 100, color: '#10B981' },
            { t: 'Phase 2 Superstructure', pct: 65, color: '#2648E7' },
            { t: 'Phase 3 MEP Works', pct: 15, color: '#F59E0B' }
          ].map((p, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>{p.t}</span>
                <span style={{ color: p.color }}>{p.pct}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${p.pct}%`, backgroundColor: p.color }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      <Card title="Pending Approvals">
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-xs font-bold text-foreground">3 Contractor Bills</p>
            <p className="text-[10px] text-muted-foreground">Waiting for technical clearance</p>
          </div>
          <button className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Review</button>
        </div>
      </Card>
    </div>
  );
}
