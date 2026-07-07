import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { PH, Card, Chip } from '@/components/shared/FigmaComponents';

interface TimelineProject {
  id: string;
  name: string;
  status: string;
  start_date?: string;
  end_date?: string;
  progress?: number;
  milestones?: Array<{ name: string; target_date: string; status: string }>;
}

export default function TimelinePage() {
  const [projects, setProjects] = useState<TimelineProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<any>('/timeline').then(res => {
      if (res.success && res.data) {
        setProjects(Array.isArray(res.data) ? res.data : res.data.data || []);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Generate Gantt data
  // For the sake of this mock UI, we will use a static timeline of 1 year starting from today's month
  const today = new Date();
  const currentYear = today.getFullYear();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // Calculate today's position line
  const currentMonthIdx = today.getMonth();
  const currentDay = today.getDate();
  const daysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const todayLeftPct = ((currentMonthIdx + (currentDay / daysInMonth)) / 12) * 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '#22c55e';
      case 'ACTIVE': return '#2648E7';
      case 'ON_HOLD': return '#FCC300';
      case 'PLANNING': return '#94a3b8';
      default: return '#94a3b8';
    }
  };

  const getChipColor = (status: string): "green" | "blue" | "yellow" | "gray" => {
    switch (status) {
      case 'COMPLETED': return 'green';
      case 'ACTIVE': return 'blue';
      case 'ON_HOLD': return 'yellow';
      case 'PLANNING': return 'gray';
      default: return 'gray';
    }
  };

  // Prepare dummy phases if milestones don't exist for the Gantt
  const ganttProjects = projects.map(p => {
    const defaultPhases = [
      { name: "Foundation", start: 0, end: 20, color: "#22c55e" },
      { name: "Structure", start: 20, end: 55, color: "#2648E7" },
      { name: "Finishing", start: 55, end: 100, color: "#94a3b8" }
    ];

    let phases = defaultPhases;
    if (p.milestones && p.milestones.length > 0) {
      // Very rough approximation of start/end based on milestone target dates across the year
      phases = p.milestones.map((m, i) => {
        const mDate = new Date(m.target_date);
        const mMonth = mDate.getMonth();
        const startPct = i === 0 ? 0 : (mMonth / 12) * 100 - 10;
        const endPct = Math.max(startPct + 5, (mMonth / 12) * 100);
        return {
          name: m.name,
          start: Math.max(0, startPct),
          end: Math.min(100, endPct),
          color: getStatusColor(m.status)
        };
      });
    }

    return { ...p, phases };
  });

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PH title="Timeline" sub={`Master project schedule — Jan to Dec ${currentYear}`} />
      
      <Card noPad>
        <div className="px-4 py-2.5 border-b border-border bg-muted/30">
          <div className="flex text-[9px] text-muted-foreground font-semibold">
            <div className="w-28 flex-shrink-0" />
            {months.map(m => (
              <div key={m} className="flex-1 text-center">{m}</div>
            ))}
          </div>
        </div>
        
        {ganttProjects.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No active projects</div>
        ) : (
          ganttProjects.map((proj, pi) => (
            <div key={proj.id || pi} className={`px-4 py-3 ${pi < ganttProjects.length - 1 ? "border-b border-border" : ""}`}>
              <p className="text-xs font-semibold text-foreground mb-2 truncate">{proj.name}</p>
              <div className="relative h-7 bg-muted rounded overflow-hidden">
                {proj.phases.map((ph, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full flex items-center px-1 overflow-hidden"
                    style={{ left: `${ph.start}%`, width: `${ph.end - ph.start}%`, backgroundColor: ph.color }}
                  >
                    <span className="text-[8px] text-white font-semibold truncate">{ph.name}</span>
                  </div>
                ))}
                <div className="absolute top-0 bottom-0 w-0.5 bg-red-500/80 z-10" style={{ left: `${todayLeftPct}%` }} />
              </div>
              <p className="text-[9px] text-red-500 mt-0.5" style={{ paddingLeft: `${Math.max(0, todayLeftPct - 2)}%` }}>▲ Today</p>
            </div>
          ))
        )}
      </Card>
      
      <div className="flex flex-wrap gap-3 px-1">
        {[
          ["#22c55e", "Completed"],
          ["#2648E7", "In Progress"],
          ["#FCC300", "At Risk / On Hold"],
          ["#94a3b8", "Planned"]
        ].map(([c, l]) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className="w-3 h-2.5 rounded-sm" style={{ backgroundColor: c }} />
            <span className="text-[10px] text-muted-foreground">{l}</span>
          </div>
        ))}
      </div>

      <div className="pt-4">
        <PH title="Milestones" sub="Contractual phase completion tracker" />
      </div>

      {projects.map((proj, pi) => (
        <Card key={proj.id || pi} title={proj.name} noPad>
          {!proj.milestones || proj.milestones.length === 0 ? (
            <div className="px-4 py-3 text-xs text-muted-foreground">No milestones defined</div>
          ) : (
            proj.milestones.map((ph, i) => {
              const pct = ph.status === 'COMPLETED' ? 100 : ph.status === 'ACTIVE' ? 65 : 0;
              const actual = ph.status === 'COMPLETED' ? new Date(ph.target_date).toLocaleDateString('en-GB') : '–';
              const target = new Date(ph.target_date).toLocaleDateString('en-GB');
              const displayStatus = ph.status === 'COMPLETED' ? 'Done' : ph.status === 'ACTIVE' ? 'Active' : 'Upcoming';
              const sColor = getStatusColor(ph.status);
              const cColor = getChipColor(ph.status);

              return (
                <div key={i} className={`px-4 py-3 ${i < proj.milestones!.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-xs font-medium text-foreground">{ph.name}</p>
                    <Chip color={cColor}>{displayStatus}</Chip>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1.5">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: sColor }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Target: {target}</span>
                    <div className="flex items-center gap-2">
                      {actual !== "–" && <span className="text-emerald-600">Actual: {actual}</span>}
                      <span className="font-semibold text-foreground">{pct}%</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </Card>
      ))}
    </div>
  );
}
