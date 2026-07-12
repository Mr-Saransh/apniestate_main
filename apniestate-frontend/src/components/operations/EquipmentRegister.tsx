import { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Plus, Wrench, Fuel, Edit2, Trash2 } from 'lucide-react';
import { apiClient } from '@/api/client';

export interface Equipment {
  id: string;
  name: string;
  type: string;
  site_id?: string | null;
  project_id?: string | null;
  rental_cost: number;
  fuel_cost: number;
  status: 'AVAILABLE' | 'IN_USE' | 'UNDER_MAINTENANCE' | 'RETIRED';
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-border ${className}`}>{children}</div>
  );
}

const EQ_ICONS: Record<string, React.ReactNode> = {
  excavator: <span>🚜</span>,
  crane: <span>🏗️</span>,
  mixer: <span>🔄</span>,
  pump: <span>⛽</span>,
  generator: <span>⚡</span>,
  truck: <span>🚛</span>,
};

function getEquipmentIcon(name: string, type: string) {
  const keyword = `${name} ${type}`.toLowerCase();
  for (const [key, icon] of Object.entries(EQ_ICONS)) {
    if (keyword.includes(key)) return icon;
  }
  return <Wrench size={20} className="text-muted-foreground" />;
}

export default function EquipmentRegister() {
  const { activeProject } = useProject();
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEq, setEditingEq] = useState<Equipment | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('Heavy Machinery');
  const [rentalCost, setRentalCost] = useState('0');
  const [fuelCost, setFuelCost] = useState('0');
  const [status, setStatus] = useState<Equipment['status']>('AVAILABLE');

  const eqMap = {
    'IN_USE': { label: "Running", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    'AVAILABLE': { label: "Idle", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    'UNDER_MAINTENANCE': { label: "Maintenance", bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
    'RETIRED': { label: "Retired", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  };

  useEffect(() => {
    if (activeProject) {
      fetchEquipment();
    }
  }, [activeProject]);

  const fetchEquipment = async () => {
    try {
      const res = await apiClient.get<Equipment[]>(`/equipment?project_id=${activeProject?.id}`);
      setEquipmentList(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    setEditingEq(null);
    setName('');
    setType('Heavy Machinery');
    setRentalCost('0');
    setFuelCost('0');
    setStatus('AVAILABLE');
    setShowModal(true);
  };

  const openEditModal = (eq: Equipment) => {
    setEditingEq(eq);
    setName(eq.name);
    setType(eq.type);
    setRentalCost(eq.rental_cost.toString());
    setFuelCost(eq.fuel_cost.toString());
    setStatus(eq.status);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;

    const payload = {
      name,
      type,
      rental_cost: Number(rentalCost),
      fuel_cost: Number(fuelCost),
      status,
      project_id: activeProject.id
    };

    try {
      if (editingEq) {
        await apiClient.put(`/equipment?id=${editingEq.id}`, payload);
      } else {
        await apiClient.post('/equipment', payload);
      }
      setShowModal(false);
      fetchEquipment();
    } catch (err) {
      alert("Failed to save equipment");
    }
  };

  const handleDelete = async () => {
    if (!editingEq) return;
    if (confirm('Are you sure you want to delete this equipment?')) {
      try {
        await apiClient.delete(`/equipment?id=${editingEq.id}`);
        setShowModal(false);
        fetchEquipment();
      } catch (err) {
        alert("Failed to delete equipment");
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        
        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Running", val: equipmentList.filter(e => e.status === 'IN_USE').length, bg: "bg-emerald-50", text: "text-emerald-700" },
            { label: "Idle", val: equipmentList.filter(e => e.status === 'AVAILABLE').length, bg: "bg-amber-50", text: "text-amber-700" },
            { label: "Maintenance", val: equipmentList.filter(e => e.status === 'UNDER_MAINTENANCE').length, bg: "bg-red-50", text: "text-red-600" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${s.text}`}>{s.val}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Equipment List */}
        {equipmentList.map((eq) => {
          const s = eqMap[eq.status] || eqMap['AVAILABLE'];
          return (
            <Card key={eq.id} className="p-4 relative">
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${s.bg} ${s.text}`}>
                  <span className={`size-1.5 rounded-full ${s.dot}`} />{s.label}
                </span>
                <button onClick={() => openEditModal(eq)} className="p-1.5 rounded-full bg-gray-50 text-gray-400 hover:text-[#2648E7] hover:bg-[#2648E7]/10 transition-colors">
                  <Edit2 size={14} />
                </button>
              </div>

              <div className="flex items-start mb-4 pr-32">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 text-xl">
                    {getEquipmentIcon(eq.name, eq.type)}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{eq.name}</p>
                    <p className="text-sm text-muted-foreground">{activeProject?.name}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-muted rounded-xl px-3 py-2">
                  <p className="text-xs text-muted-foreground">Rental / day</p>
                  <p className="font-bold text-foreground">Rs. {eq.rental_cost.toLocaleString()}</p>
                </div>
                <div className="bg-muted rounded-xl px-3 py-2">
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-bold text-foreground truncate">{eq.type}</p>
                </div>
                
                {eq.fuel_cost > 0 && (
                  <div className="col-span-2 bg-muted rounded-xl px-3 py-2 flex items-center gap-2">
                    <Fuel size={13} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Fuel today</span>
                    <span className="font-bold text-foreground ml-auto">Rs. {eq.fuel_cost.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        <button onClick={openAddModal} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white mt-6 shadow-sm transition-opacity hover:opacity-90" style={{ backgroundColor: "#2648E7" }}>
          <Plus size={16} />Add Equipment
        </button>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Wrench className="text-[#2648E7]" size={20} />
                {editingEq ? 'Edit Equipment' : 'Add New Equipment'}
              </h3>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <form id="eq-form" onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5 relative">
                  <label className="text-sm font-bold text-foreground">Equipment Name</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7] transition-all text-gray-900" 
                    placeholder="e.g. JCB Excavator" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    onFocus={(e) => {
                      const div = e.target.nextElementSibling as HTMLElement;
                      if (div) div.style.display = 'block';
                    }}
                    onBlur={(e) => {
                      const div = e.target.nextElementSibling as HTMLElement;
                      setTimeout(() => { if (div) div.style.display = 'none'; }, 200);
                    }}
                  />
                  <div className="hidden absolute z-50 w-full mt-1 bg-white border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {["JCB Excavator", "Concrete Mixer", "Tower Crane", "Concrete Pump", "Generator", "Dump Truck"]
                      .filter(s => s.toLowerCase().includes(name.toLowerCase()))
                      .map(s => (
                        <div 
                          key={s} 
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-foreground border-b border-border last:border-0"
                          onClick={() => setName(s)}
                        >
                          {s}
                        </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-1.5 relative">
                  <label className="text-sm font-bold text-foreground">Equipment Type</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7] transition-all text-gray-900" 
                    placeholder="e.g. Heavy Machinery, Tool" 
                    value={type} 
                    onChange={e => setType(e.target.value)} 
                    onFocus={(e) => {
                      const div = e.target.nextElementSibling as HTMLElement;
                      if (div) div.style.display = 'block';
                    }}
                    onBlur={(e) => {
                      const div = e.target.nextElementSibling as HTMLElement;
                      setTimeout(() => { if (div) div.style.display = 'none'; }, 200);
                    }}
                  />
                  <div className="hidden absolute z-50 w-full mt-1 bg-white border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {["Heavy Machinery", "Power Tool", "Vehicle", "Pump", "Generator"]
                      .filter(s => s.toLowerCase().includes(type.toLowerCase()))
                      .map(s => (
                        <div 
                          key={s} 
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-foreground border-b border-border last:border-0"
                          onClick={() => setType(s)}
                        >
                          {s}
                        </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">Daily Rental (Rs)</label>
                    <input required type="number" className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7] text-gray-900" placeholder="0" value={rentalCost} onChange={e => setRentalCost(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">Fuel Cost (Rs)</label>
                    <input required type="number" className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7] text-gray-900" placeholder="0" value={fuelCost} onChange={e => setFuelCost(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Status</label>
                  <select className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7] text-gray-900" value={status} onChange={e => setStatus(e.target.value as any)}>
                    <option value="AVAILABLE">Idle (Available)</option>
                    <option value="IN_USE">Running (In Use)</option>
                    <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                    <option value="RETIRED">Retired</option>
                  </select>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-border bg-gray-50 flex gap-3">
              {editingEq && (
                <button 
                  type="button" 
                  onClick={handleDelete}
                  className="px-4 py-3 rounded-2xl font-bold text-sm text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                  title="Delete Equipment"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-2xl font-bold text-sm text-foreground bg-white border border-border shadow-sm hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" form="eq-form" className="flex-1 py-3 rounded-2xl font-bold text-sm text-white shadow-sm transition-opacity hover:opacity-90" style={{ backgroundColor: "#2648E7" }}>
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
