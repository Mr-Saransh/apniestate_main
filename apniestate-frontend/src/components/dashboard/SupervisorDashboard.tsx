import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardQuery } from '@/hooks/useDashboardQuery';
import { HardHat, Package, AlertCircle, CheckCircle2 } from 'lucide-react';
import { KPI, Card } from '@/components/shared/FigmaComponents';

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardQuery<any>('/dashboard/supervisor', {
    refetchInterval: 12000
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const activeSite = data.site || { name: 'Assigned Site' };
  
  // Try to use real data or fallback to defaults for demo
  const presentWorkers = data.overview?.workforce?.present || 0;
  const pendingRequests = data.overview?.pendingMRs || 0;
  const openIssues = data.overview?.openSnags || 0;
  const tasksProgress = data.overview?.tasksProgress || 0;

  const name = user?.name ? user.name.split(' ')[0] : 'Supervisor';
  const hr = new Date().getHours();
  const greeting = hr < 12 ? `Good morning, ${name} ☀️` : (hr < 17 ? `Good afternoon, ${name} ☀️` : `Good evening, ${name} 🌙`);

  const formattedDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'SV';

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">{greeting}</h1>
          <p className="text-[11px] text-muted-foreground">{formattedDate} • {activeSite.name}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
          {initials}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Present Workers" value={presentWorkers.toString()} icon={HardHat} trend={{ up: true, v: "+2" }} />
        <KPI label="Pending Requests" value={pendingRequests.toString()} icon={Package} trend={{ up: false, v: "-1" }} />
        <KPI label="Open Issues" value={openIssues.toString()} icon={AlertCircle} trend={{ up: false, v: "-3" }} />
        <KPI label="Tasks Done" value={`${tasksProgress}%`} icon={CheckCircle2} trend={{ up: true, v: "+15%" }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <Card title="Today's Priority Tasks" noPad>
          <div className="p-4 space-y-3">
            {[
              { t: 'Concrete Pouring - Level 2', time: '10:00 AM', status: 'In Progress' },
              { t: 'Material Inspection - Steel', time: '11:30 AM', status: 'Pending' },
              { t: 'Submit DPR', time: '05:00 PM', status: 'Pending' }
            ].map((task, i) => (
              <div key={i} className="flex justify-between items-center pb-2 border-b border-border last:border-0 last:pb-0">
                <div>
                  <p className="text-xs font-bold text-foreground">{task.t}</p>
                  <p className="text-[10px] text-muted-foreground">{task.time}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded ${task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
        
        <Card title="DPR & Reporting Status" noPad>
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div>
                <p className="text-xs font-bold text-gray-900">Today's DPR</p>
                <p className="text-[10px] text-gray-500">Not submitted yet</p>
              </div>
              <a href="/dpr" className="text-[10px] font-bold bg-primary text-white px-3 py-1.5 rounded hover:bg-primary/90">
                Submit Now
              </a>
            </div>
            
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div>
                <p className="text-xs font-bold text-gray-900">Weekly Report (This Week)</p>
                <p className="text-[10px] text-gray-500">Auto-generates on Sunday</p>
              </div>
              <a href="/weekly-reports" className="text-[10px] font-bold bg-blue-100 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-200">
                View Past
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
