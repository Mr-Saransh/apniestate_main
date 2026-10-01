import React, { useState, useEffect } from 'react';
import { Flag, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PH, Card, Chip, SrchBar } from '@/components/shared/FigmaComponents';
import { apiClient } from '@/api/client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useProject } from '@/context/ProjectContext';
import { getScheduleStatus } from '@/utils/schedule';

export default function MilestonesPage() {
  const { activeProjectId } = useProject();
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchMilestones() {
      if (!activeProjectId) {
        setMilestones([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await apiClient.get(`/milestones?project_id=${activeProjectId}`);
        if (res.data) setMilestones(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchMilestones();
  }, [activeProjectId]);

  if (loading) return <LoadingSpinner size="lg" />;

  const filtered = milestones.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || (m.project?.name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <PH title="Milestones" sub="Project targets, planned schedules, and actual tracking" />
      
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1" onChange={(e: any) => setSearch(e.target.value)}>
          <SrchBar placeholder="Search milestones..." />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(m => {
          const schedule = getScheduleStatus(m);
          return (
            <Card key={m.id} noPad>
              <div className="p-4 flex flex-col h-full gap-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-foreground leading-snug">{m.name}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{m.project?.name || 'Project Milestone'}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${schedule.badgeClass}`}>
                    {schedule.label}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-muted-foreground">
                  <div className="flex justify-between">
                    <span className="font-medium">Planned:</span>
                    <span className="text-foreground font-semibold">{schedule.plannedStart} &rarr; {schedule.plannedEnd}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Actual:</span>
                    <span className="text-foreground font-semibold">{schedule.actualStart} &rarr; {schedule.actualEnd}</span>
                  </div>
                </div>
                
                <div className="mt-auto pt-3 border-t border-border flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-muted-foreground" />
                    <span>Target: {schedule.plannedEnd}</span>
                  </div>
                  {schedule.status === 'DELAYED' && <span className="text-rose-600 font-bold flex items-center gap-1"><AlertTriangle size={13} /> Delayed</span>}
                  {schedule.status === 'AHEAD' && <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 size={13} /> Ahead</span>}
                  {schedule.status === 'ON_TIME' && <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 size={13} /> On Time</span>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
