import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { Fuel, Plus, Search } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';

interface Equipment {
  id: string;
  name: string;
  type: string;
  status: string;
  site?: { name: string };
  vendor?: { name: string };
  cost_per_day?: number;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{children}</p>
  );
}

function fmt(n: number | null | undefined) {
  if (!n) return '₹0';
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
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

  const filtered = equipment.filter(e => 
    !search || 
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.type?.toLowerCase().includes(search.toLowerCase()) ||
    e.site?.name.toLowerCase().includes(search.toLowerCase())
  );

  const running = filtered.filter(e => e.status === 'IN_USE');
  const idle = filtered.filter(e => e.status === 'AVAILABLE');
  const maintenance = filtered.filter(e => e.status === 'UNDER_MAINTENANCE' || e.status === 'BROKEN');

  const renderList = (list: Equipment[], dotColor: string, statusLabel: string) => (
    <div className="space-y-3">
      {list.map((eq) => {
        const mockFuel = eq.status === 'IN_USE' ? Math.floor(Math.random() * 5000) + 1000 : 0;
        const icon = eq.name.toLowerCase().includes("excavator") ? "🚜" 
                   : eq.name.toLowerCase().includes("crane") ? "🏗️" 
                   : eq.name.toLowerCase().includes("mixer") ? "🔄"
                   : "⚙️";

        return (
          <div key={eq.id} className="bg-white rounded-2xl p-4 shadow-sm border border-border flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 pr-3">
              <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">
                {icon}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-foreground text-sm leading-tight truncate">{eq.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`size-1.5 rounded-full ${dotColor}`} />
                  <p className="text-xs text-muted-foreground capitalize truncate">{statusLabel} • {eq.site?.name || 'Unassigned'}</p>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              {mockFuel > 0 && (
                <p className="text-xs font-bold text-emerald-600 flex items-center gap-1 justify-end">
                  <Fuel size={11} /> {fmt(mockFuel)}
                </p>
              )}
              {eq.cost_per_day && (
                <p className="text-[10px] text-muted-foreground mt-0.5">Rental: {fmt(eq.cost_per_day)}/d</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  if (loading && equipment.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-[#2648E7] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Search */}
      <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-xl border border-border shadow-sm">
        <Search size={16} className="text-muted-foreground shrink-0" />
        <input 
          type="text" 
          placeholder="Search equipment..." 
          className="flex-1 text-sm font-medium focus:outline-none bg-transparent min-w-0"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {running.length > 0 && (
        <div>
          <SectionLabel>Running</SectionLabel>
          {renderList(running, "bg-emerald-500", "In Use")}
        </div>
      )}

      {idle.length > 0 && (
        <div>
          <SectionLabel>Idle / Available</SectionLabel>
          {renderList(idle, "bg-amber-500", "Idle")}
        </div>
      )}

      {maintenance.length > 0 && (
        <div>
          <SectionLabel>Maintenance</SectionLabel>
          {renderList(maintenance, "bg-red-500", "In Service")}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="p-8 text-center text-muted-foreground text-sm bg-white rounded-2xl border border-border border-dashed">
          No equipment found matching your criteria.
        </div>
      )}

      <button className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: "#2648E7" }}>
        <Plus size={18} />Request Equipment
      </button>
    </div>
  );
}
