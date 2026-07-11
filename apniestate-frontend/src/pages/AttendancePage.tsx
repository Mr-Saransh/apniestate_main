import React, { useState, useEffect, type FormEvent } from 'react';
import { Download, ChevronLeft, Calendar } from 'lucide-react';
import { apiClient } from '@/api/client';
import { PH, Card, Chip, SrchBar } from '@/components/shared/FigmaComponents';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';

interface WorkerRecord {
  id: string;
  name: string;
  trade: string;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE' | 'LATE' | 'UNMARKED';
  check_in: string | null;
  check_out: string | null;
  overtime_hours: number;
  is_half_day: boolean;
  is_late: boolean;
  notes: string | null;
  site_id: string | null;
  site_name: string | null;
  contractor_name: string | null;
  daily_rate: number;
}

interface Site {
  id: string;
  name: string;
  location: string;
  project_id: string;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const { activeProjectId } = useProject();
  const [date, setDate] = useState(new Date());
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [workers, setWorkers] = useState<WorkerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSitesAndWorkers = async () => {
    if (!activeProjectId) {
      setWorkers([]);
      setSites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const sitesRes = await apiClient.get<Site[]>(`/sites?project_id=${activeProjectId}`);
      if (sitesRes.data) setSites(sitesRes.data);

      const dateStr = date.toISOString().split('T')[0];
      const params = new URLSearchParams();
      params.append('date', dateStr);
      params.append('project_id', activeProjectId);
      if (selectedSiteId) params.append('site_id', selectedSiteId);

      const workersRes = await apiClient.get<WorkerRecord[]>(`/attendance?${params.toString()}`);
      if (workersRes.data) {
        setWorkers(workersRes.data.map(w => ({ ...w, daily_rate: w.daily_rate || 0 })));
      }
    } catch (err) {
      console.error('Failed to load attendance', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchSitesAndWorkers();
  }, [date, selectedSiteId]);

  const handleStatusChange = async (workerId: string, status: WorkerRecord['status']) => {
    setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, status } : w));
    try {
      await apiClient.post('/attendance', {
        worker_id: workerId,
        status,
        date: date.toISOString().split('T')[0],
        site_id: selectedSiteId || undefined
      });
    } catch (err) {
      console.error('Failed to mark worker attendance', err);
    }
  };

  // Metrics
  const presentCount = workers.filter(w => ['PRESENT', 'LATE'].includes(w.status)).length;
  const absentCount = workers.filter(w => w.status === 'ABSENT').length;
  const leaveCount = workers.filter(w => w.status === 'ON_LEAVE').length;

  const trend = [
    { day: "Mon", present: 310, absent: 32 }, { day: "Tue", present: 325, absent: 17 },
    { day: "Wed", present: 298, absent: 44 }, { day: "Thu", present: 318, absent: 24 },
    { day: "Fri", present: 287, absent: 55 }, { day: "Sat", present: presentCount || 203, absent: absentCount || 139 },
    { day: "Sun", present: 87, absent: 255 },
  ];

  const filteredWorkers = workers.filter(w => w.name.toLowerCase().includes(search.toLowerCase()));

  if (loading && workers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start">
        <PH title="Attendance" sub={`Daily labor turnout — ${format(date, 'dd MMM yyyy')}`} />
        <select 
          className="bg-card border border-border text-xs rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
          value={selectedSiteId}
          onChange={(e) => setSelectedSiteId(e.target.value)}
        >
          <option value="">All Sites</option>
          {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          [presentCount.toString(), "Present", "text-emerald-600"], 
          [absentCount.toString(), "Absent", "text-red-500"], 
          [leaveCount.toString(), "On Leave", "text-amber-600"]
        ].map(([v, l, cls]) => (
          <div key={l} className="bg-card border border-border rounded-xl p-3 text-center shadow-sm">
            <p className={`text-xl font-bold ${cls}`}>{v}</p>
            <p className="text-[10px] text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>

      <Card title="7-Day Attendance Trend">
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={trend} margin={{ top: 0, right: 5, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
            <Bar dataKey="present" fill="var(--color-primary)" radius={[3, 3, 0, 0]} name="Present" />
            <Bar dataKey="absent" fill="var(--color-accent)" radius={[3, 3, 0, 0]} name="Absent" />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 justify-center mt-1">
          <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded bg-primary" /><span className="text-[10px] text-muted-foreground">Present</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded bg-accent" /><span className="text-[10px] text-muted-foreground">Absent</span></div>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1" onChange={(e: any) => setSearch(e.target.value)}>
          <SrchBar placeholder="Search workers..." />
        </div>
        <button 
          onClick={() => {
            const csv = workers.map(w => `${w.name},${w.trade},${w.status}`).join('\n');
            const blob = new Blob([`Name,Trade,Status\n${csv}`], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `attendance-${date.toISOString().split('T')[0]}.csv`;
            a.click();
          }}
          className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Download className="w-3 h-3" /> CSV
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredWorkers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm w-full col-span-full">No workers found</div>
        ) : (
          filteredWorkers.map((w) => (
            <Card key={w.id} noPad>
              <div className="p-4 flex flex-col h-full gap-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-foreground leading-snug">{w.name}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{w.trade} • {w.site_name}</p>
                  </div>
                  <Chip color={w.status === "PRESENT" ? "green" : w.status === "ABSENT" ? "red" : w.status === "UNMARKED" ? "gray" : "yellow"}>
                    {w.status === 'UNMARKED' ? 'NO STATUS' : w.status}
                  </Chip>
                </div>

                <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                  <div className="text-[10px] text-muted-foreground font-medium">
                    {w.check_in ? `In: ${format(new Date(w.check_in), 'HH:mm')}` : 'No Check-in'}
                  </div>
                  {user?.role === 'SITE_SUPERVISOR' && (
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => handleStatusChange(w.id, 'PRESENT')}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${w.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500 ring-offset-1' : 'bg-muted text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600'}`}
                      >
                        P
                      </button>
                      <button 
                        onClick={() => handleStatusChange(w.id, 'ABSENT')}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${w.status === 'ABSENT' ? 'bg-red-100 text-red-700 ring-2 ring-red-500 ring-offset-1' : 'bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-600'}`}
                      >
                        A
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
