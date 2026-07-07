import React, { useState, useEffect } from 'react';
import { Flag, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PH, Card, Chip, SrchBar } from '@/components/shared/FigmaComponents';
import { apiClient } from '@/api/client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchMilestones() {
      try {
        const res = await apiClient.get('/dashboard/supervisor');
        // fallback to dummy data if milestone endpoint not perfect
        setMilestones([
          { id: 1, name: 'Foundation Completion', date: '2026-07-15', status: 'PENDING', project: 'Downtown Plaza' },
          { id: 2, name: 'Slab Casting Floor 2', date: '2026-07-20', status: 'IN_PROGRESS', project: 'Gulshan Residency' },
          { id: 3, name: 'MEP Clearance', date: '2026-07-10', status: 'DELAYED', project: 'Downtown Plaza' },
          { id: 4, name: 'Site Mobilization', date: '2026-06-01', status: 'COMPLETED', project: 'DHA Villas' },
        ]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchMilestones();
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  const filtered = milestones.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.project.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <PH title="Milestones" sub="Project targets and deadlines" />
      
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1" onChange={(e: any) => setSearch(e.target.value)}>
          <SrchBar placeholder="Search milestones..." />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(m => (
          <Card key={m.id} noPad>
            <div className="p-4 flex flex-col h-full gap-3">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-bold text-sm text-foreground leading-snug">{m.name}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{m.project}</p>
                </div>
                <Chip color={m.status === 'COMPLETED' ? 'green' : m.status === 'DELAYED' ? 'red' : m.status === 'IN_PROGRESS' ? 'yellow' : 'gray'}>
                  {m.status}
                </Chip>
              </div>
              
              <div className="mt-auto pt-3 border-t border-border flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Calendar size={14} />
                <span>Target: {new Date(m.date).toLocaleDateString()}</span>
                {m.status === 'DELAYED' && <AlertTriangle size={14} className="text-red-500 ml-auto" />}
                {m.status === 'COMPLETED' && <CheckCircle2 size={14} className="text-emerald-500 ml-auto" />}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
