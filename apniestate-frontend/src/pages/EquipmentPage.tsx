import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { Truck } from 'lucide-react';
import { PH, Card, Chip, SrchBar } from '@/components/shared/FigmaComponents';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useProject } from '@/context/ProjectContext';

interface Equipment {
  id: string;
  name: string;
  type: string;
  status: string;
  site?: { name: string };
  vendor?: { name: string };
}

export default function EquipmentPage() {
  const { activeProjectId } = useProject();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!activeProjectId) {
      setEquipment([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    apiClient.get<any>(`/equipment?project_id=${activeProjectId}`).then(res => {
      if (res.success && res.data) {
        setEquipment(Array.isArray(res.data) ? res.data : res.data.data || []);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [activeProjectId]);

  const running = equipment.filter(e => e.status === 'IN_USE').length;
  const idle = equipment.filter(e => e.status === 'AVAILABLE').length;
  const maintenance = equipment.filter(e => e.status === 'UNDER_MAINTENANCE').length;

  // Mock hours data since runtime tracking isn't implemented yet
  const usageData = equipment.slice(0, 6).map(e => ({
    name: e.name.split(' ')[0],
    hours: Math.floor(Math.random() * 200) + 50
  }));

  const filtered = equipment.filter(e => 
    !search || 
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.type?.toLowerCase().includes(search.toLowerCase()) ||
    e.site?.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string): "green"|"yellow"|"red"|"gray" => {
    switch(status) {
      case 'IN_USE': return 'green';
      case 'AVAILABLE': return 'yellow';
      case 'UNDER_MAINTENANCE': return 'red';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch(status) {
      case 'IN_USE': return 'Running';
      case 'AVAILABLE': return 'Idle';
      case 'UNDER_MAINTENANCE': return 'Maintenance';
      case 'RETIRED': return 'Retired';
      default: return status;
    }
  };

  if (loading && equipment.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PH title="Equipment Usage" sub="Machinery runtime and fuel consumption" />
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[
          [running.toString(), "Running", "text-primary"], 
          [idle.toString(), "Idle", "text-primary"], 
          [maintenance.toString(), "In Service", "text-primary"]
        ].map(([v, l, c]) => (
          <div key={l} className="bg-card border border-border rounded-xl p-3 text-center shadow-sm">
            <p className={`text-lg font-bold ${c}`}>{v}</p>
            <p className="text-[10px] text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>

      <Card title="Monthly Runtime Hours (This Month)">
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={usageData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
            <Bar dataKey="hours" fill="var(--color-primary)" radius={[3, 3, 0, 0]} name="Hours Used" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1" onChange={(e: any) => setSearch(e.target.value)}>
          <SrchBar placeholder="Search equipment..." />
        </div>
      </div>

      <Card noPad>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No equipment found</div>
        ) : (
          filtered.map((eq, i) => {
            const mockFuel = eq.status === 'IN_USE' ? Math.floor(Math.random() * 500) + 100 : 0;
            const mockHours = eq.status === 'AVAILABLE' ? 0 : Math.floor(Math.random() * 200) + 10;
            
            return (
              <div key={eq.id || i} className={`flex items-center gap-3 px-4 py-3 ${i < filtered.length - 1 ? "border-b border-border" : ""}`}>
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <Truck className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{eq.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{eq.type} · {eq.site?.name || 'Unassigned'}</p>
                </div>
                <div className="text-right mr-2 flex-shrink-0">
                  <p className="text-xs font-bold text-foreground">{mockHours}h</p>
                  {mockFuel > 0 && <p className="text-[10px] text-muted-foreground">{mockFuel}L</p>}
                </div>
                <Chip color={getStatusColor(eq.status)}>{getStatusLabel(eq.status)}</Chip>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
