import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardQuery } from '@/hooks/useDashboardQuery';
import { Building2, HardHat, TrendingUp, Activity, ArrowUp, ArrowDown } from 'lucide-react';
import { KPI, Card } from '@/components/shared/FigmaComponents';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

export const BuilderDashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardQuery<any>('/dashboard/builder', {
    refetchInterval: 12000
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const activeProjects = data.overview.activeSites || data.overview.totalProjects || 0;
  const totalWorkers = (data.workforceIntelligence?.present + data.workforceIntelligence?.absent) || 0;
  const revenueStr = data.financialIntelligence?.creditSum 
    ? (data.financialIntelligence.creditSum >= 10000000 ? 'Rs' + (data.financialIntelligence.creditSum / 10000000).toFixed(1) + 'Cr' : '₹' + data.financialIntelligence.creditSum.toLocaleString()) 
    : 'Rs0';
  const budgetUtilized = data.overview.budgetUtilization || 0;

  const revData = data.revenueTrend || [];

  const projects = data.projectIntelligence?.map((p: any) => ({
    name: p.name,
    pct: p.progress_percentage || 0,
    color: p.status === 'COMPLETED' ? '#22c55e' : (p.status === 'ACTIVE' ? '#2648E7' : '#FCC300'),
    status: p.status
  })) || [];

  const alerts = data.alerts || [];

  const name = user?.name ? user.name.split(' ')[0] : 'Asim';
  const hr = new Date().getHours();
  const greeting = hr < 12 ? `Good morning, ${name} ☀️` : (hr < 17 ? `Good afternoon, ${name} ☀️` : `Good evening, ${name} 🌙`);

  const formattedDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'AR';

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">{greeting}</h1>
          <p className="text-[11px] text-muted-foreground">{formattedDate}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shadow-sm">
          {initials}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Active Projects" value={activeProjects.toString()} icon={Building2} trend={{ up: true, v: "+1 mo." }} />
        <KPI label="Total Workers" value={totalWorkers.toString()} icon={HardHat} trend={{ up: true, v: "+18" }} />
        <KPI label="Revenue (Jul)" value={revenueStr} icon={TrendingUp} trend={{ up: true, v: "8.5%" }} />
        <KPI label="Budget Utilized" value={`${budgetUtilized}%`} icon={Activity} trend={{ up: false, v: "+3%" }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-4 lg:col-span-1">
          <Card title="Active Alerts" right={<span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{alerts.length} new</span>} noPad>
            <div className="max-h-[220px] overflow-y-auto custom-scrollbar">
              {alerts.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No active alerts</div>
              ) : (
                alerts.map((a: any, i: number) => (
                  <div key={i} className={`flex items-start gap-3 px-4 py-3 ${i < alerts.length - 1 ? "border-b border-border" : ""} hover:bg-muted/30 transition-colors`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.severity === "error" || a.type === "CRITICAL" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" : a.severity === "success" ? "bg-emerald-500" : "bg-[#FCC300]"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground leading-snug">{a.title}</p>
                      {a.description && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{a.description}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card title="Project Progress" noPad>
            <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
              {projects.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No active projects</div>
              ) : (
                projects.map((p: any, i: number) => (
                  <div key={i} className={`px-4 py-3 ${i < projects.length - 1 ? "border-b border-border" : ""} hover:bg-muted/30 transition-colors`}>
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="font-semibold text-foreground truncate pr-2">{p.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0 bg-background border border-border px-1.5 py-0.5 rounded text-[10px]">
                        <span className="text-muted-foreground">{p.status}</span>
                        <span className="font-bold" style={{ color: p.color }}>{p.pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${p.pct}%`, backgroundColor: p.color }}>
                        <div className="absolute inset-0 bg-white/20" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card title="Revenue vs Expenses (Monthly)">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2648E7" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2648E7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FCC300" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#FCC300" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(v) => `Rs${v >= 100000 ? (v/100000).toFixed(0)+'L' : v}`} />
                <Tooltip 
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} 
                  formatter={(value: any) => [`Rs ${value.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2648E7" strokeWidth={2.5} fill="url(#rg)" name="Revenue" activeDot={{ r: 6, fill: '#2648E7', stroke: '#fff', strokeWidth: 2 }} />
                <Area type="monotone" dataKey="expenses" stroke="#FCC300" strokeWidth={2.5} fill="url(#eg)" name="Expenses" activeDot={{ r: 6, fill: '#FCC300', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex gap-4 justify-center mt-4">
              <div className="flex items-center gap-1.5"><div className="w-3 h-1 bg-[#2648E7] rounded-full" /><span className="text-xs text-muted-foreground font-medium">Revenue</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-1 bg-[#FCC300] rounded-full" /><span className="text-xs text-muted-foreground font-medium">Expenses</span></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
