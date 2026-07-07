import { useState, useEffect, type FormEvent } from 'react';
import { workersApi, type Worker } from '@/api/workers';
import { contractorsApi, type Contractor } from '@/api/contractors';
import { apiClient } from '@/api/client';
import { projectsApi, type Project } from '@/api/projects';
import { Plus, Search } from 'lucide-react';
import { PH, Card, Chip, type ChipColor } from '@/components/shared/FigmaComponents';

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals and form state would go here...
  
  const fetchData = async () => {
    try {
      const [workersRes, contractorsRes, projectsRes, sitesRes] = await Promise.all([
        workersApi.getWorkers(),
        contractorsApi.getContractors(),
        projectsApi.getAll(),
        apiClient.get<any[]>('/sites')
      ]);

      if (workersRes.data) setWorkers(workersRes.data);
      if (contractorsRes.data) setContractors(contractorsRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
      if (sitesRes.data) setSites(sitesRes.data);
    } catch (err) {
      console.error('Failed to fetch workers page data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    w.trade.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = workers.filter(w => w.status === 'ACTIVE').length;
  const skilledCount = workers.filter(w => w.trade !== 'Labour' && w.trade !== 'Helper').length;
  const subcontractorCount = workers.filter(w => w.contractor_id).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const getStatusColor = (status: string): ChipColor => {
    switch (status) {
      case 'ACTIVE': return 'green';
      case 'ON_LEAVE': return 'yellow';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PH 
        title="Workers" 
        sub={`${activeCount} active · ${subcontractorCount} subcontractors · ${skilledCount} skilled`} 
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 lg:gap-4">
        {[
          [activeCount.toString(), "Total Active", "text-primary"], 
          [skilledCount.toString(), "Skilled", "text-emerald-600"], 
          [subcontractorCount.toString(), "Subcontract", "text-amber-600"]
        ].map(([v, l, colorClass]) => (
          <div key={l} className="bg-card border border-border rounded-xl p-3 lg:p-4 text-center shadow-sm">
            <p className={`text-xl lg:text-2xl font-bold ${colorClass}`}>{v}</p>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Search workers by name or trade..."
          />
        </div>
        <button className="px-4 py-2 bg-primary hover:bg-primary/90 transition-colors text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 shadow-sm">
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredWorkers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm w-full col-span-full">No workers found</div>
        ) : (
          filteredWorkers.map((w) => (
            <Card key={w.id} noPad>
              <div className="p-4 flex flex-col h-full gap-3 cursor-pointer hover:bg-muted/10 transition-colors">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-primary flex-shrink-0 shadow-sm">
                      {w.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground leading-snug">{w.name}</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{w.trade}</p>
                    </div>
                  </div>
                  <Chip color={getStatusColor(w.status)}>{w.status.replace('_', ' ')}</Chip>
                </div>
                
                <div className="mt-auto pt-3 border-t border-border flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                  <span>{w.site_id ? sites.find(s => s.id === w.site_id)?.name || 'Assigned' : 'Unassigned'}</span>
                  <span className={w.contractor_id ? 'text-amber-600' : 'text-emerald-600'}>
                    {w.contractor_id ? 'Subcontractor' : 'Direct Hire'}
                  </span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
