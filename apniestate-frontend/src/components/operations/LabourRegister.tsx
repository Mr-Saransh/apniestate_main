import { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Save, Plus, Minus, Calendar, AlertTriangle, Edit2, RotateCcw, Trash2 } from 'lucide-react';
import { apiClient } from '@/api/client';

interface LabourCategory {
  id: string;
  name: string;
  daily_wage: number;
  half_day_multiplier: number;
  ot_multiplier: number;
  status: 'ACTIVE' | 'INACTIVE';
}

interface AttendanceEntry {
  category_id: string;
  present_count: number;
  half_day_count: number;
  ot_hours: number;
}

const EMOJI_MAP: Record<string, string> = {
  "Mistri": "🧱",
  "Carpenter": "🪚",
  "Helper": "👷",
  "Electrician": "⚡",
  "Painter": "🖌️",
  "Plumber": "🚰",
  "Welder": "🔥",
  "Bar Bender": "🏗️",
};

export default function LabourRegister() {
  const { activeProject } = useProject();
  const activeSiteId = activeProject?.sites?.[0]?.id;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categories, setCategories] = useState<LabourCategory[]>([]);
  const [entries, setEntries] = useState<Record<string, AttendanceEntry>>({});
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState<LabourCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catWage, setCatWage] = useState('');

  useEffect(() => {
    if (activeSiteId) fetchCategoriesAndLogs();
  }, [activeSiteId, date]);

  const fetchCategoriesAndLogs = async () => {
    try {
      setLoading(true);
      const catRes = await apiClient.get<LabourCategory[]>('/labour-categories');
      const cats = catRes.data || [];
      setCategories(cats);

      const logRes = await apiClient.get<any[]>(`/labour-logs?site_id=${activeSiteId}&date=${date}`);
      const newEntries: Record<string, AttendanceEntry> = {};
      
      if (logRes.data && logRes.data.length > 0) {
        logRes.data.forEach((log: any) => {
          newEntries[log.category_id] = {
            category_id: log.category_id,
            present_count: log.present_count,
            half_day_count: log.half_day_count,
            ot_hours: log.ot_hours
          };
        });
      } else {
        cats.slice(0, 5).forEach((c: any) => {
          newEntries[c.id] = { category_id: c.id, present_count: 0, half_day_count: 0, ot_hours: 0 };
        });
      }
      setEntries(newEntries);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const change = (categoryId: string, field: keyof AttendanceEntry, delta: number) => {
    setEntries(prev => {
      const current = prev[categoryId] || { category_id: categoryId, present_count: 0, half_day_count: 0, ot_hours: 0 };
      const val = typeof current[field] === 'number' ? current[field] as number : 0;
      const newVal = Math.max(0, val + delta);
      return { ...prev, [categoryId]: { ...current, [field]: newVal } };
    });
  };

  const calculateRowTotal = (categoryId: string) => {
    const entry = entries[categoryId];
    const cat = categories.find(c => c.id === categoryId);
    if (!entry || !cat) return 0;
    const regularCost = entry.present_count * cat.daily_wage;
    const halfCost = entry.half_day_count * (cat.daily_wage * cat.half_day_multiplier);
    const otCost = entry.ot_hours * ((cat.daily_wage / 8) * cat.ot_multiplier);
    return regularCost + halfCost + otCost;
  };

  const totalMen = Object.values(entries).reduce((sum, e) => sum + e.present_count + e.half_day_count, 0);
  const totalCost = Object.keys(entries).reduce((sum, catId) => sum + calculateRowTotal(catId), 0);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const payload = {
        site_id: activeSiteId,
        date: new Date(date).toISOString(),
        entries: Object.values(entries).filter(e => e.present_count > 0 || e.half_day_count > 0 || e.ot_hours > 0)
      };
      await apiClient.post('/labour-logs', payload);
      alert('Attendance saved successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to save attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCatModal = (cat: LabourCategory | null) => {
    setEditingCat(cat);
    if (cat) {
      setCatName(cat.name);
      setCatWage(cat.daily_wage.toString());
    } else {
      setCatName('');
      setCatWage('');
    }
    setShowModal(true);
  };

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: catName,
        daily_wage: Number(catWage),
        half_day_multiplier: 0.5,
        ot_multiplier: 1.5,
        status: 'ACTIVE'
      };
      if (editingCat) {
        await apiClient.put(`/labour-categories?id=${editingCat.id}`, payload);
      } else {
        await apiClient.post('/labour-categories', payload);
      }
      setShowModal(false);
      fetchCategoriesAndLogs();
    } catch (err) {
      console.error(err);
      alert('Failed to save category');
    }
  };

  const handleCreateSite = async () => {
    if (!activeProject) return;
    try {
      setIsSubmitting(true);
      await apiClient.post('/sites', {
        project_id: activeProject.id,
        name: "Main Site",
        location: "Main Location",
        status: "IN_PROGRESS"
      });
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to create default site');
      setIsSubmitting(false);
    }
  };

  if (!activeSiteId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
        <AlertTriangle size={48} className="text-muted-foreground opacity-40 mb-4" />
        <h2 className="text-base font-bold text-foreground">No Site Selected</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mb-6">You need to add a site to this project before you can manage labour.</p>
        <button 
          onClick={handleCreateSite}
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-[#2648E7] hover:bg-[#2648E7]/90 text-white text-sm font-bold rounded-xl transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          Create Default Site
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#2648E7] border-t-transparent animate-spin" />
      </div>
    );
  }

  const unaddedCategories = categories.filter(c => !entries[c.id] && c.status !== 'INACTIVE');

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-border shadow-sm">
          <Calendar size={15} className="text-[#2648E7]" />
          <input 
            type="date" 
            value={date}
            onChange={e => setDate(e.target.value)}
            className="text-sm font-bold text-foreground focus:outline-none bg-transparent"
          />
        </div>
        <p className="text-xs font-bold text-muted-foreground">Total: {totalMen} workers</p>
      </div>

      <div className="space-y-3">
        {Object.values(entries).map(entry => {
          const cat = categories.find(c => c.id === entry.category_id);
          if (!cat) return null;
          const cost = calculateRowTotal(cat.id);
          const emoji = Object.entries(EMOJI_MAP).find(([key]) => key.toLowerCase() === cat.name.toLowerCase())?.[1] || "👷";

          return (
            <div key={cat.id} className="bg-white rounded-2xl p-4 shadow-sm border border-border">
              {/* Category header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{emoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground leading-tight text-sm">{cat.name}</p>
                      <button onClick={() => handleOpenCatModal(cat)} className="text-muted-foreground hover:text-[#2648E7] transition-colors p-1 rounded-md hover:bg-muted">
                        <Edit2 size={12} />
                      </button>
                    </div>
                    {cat.daily_wage > 0 ? (
                      <p className="text-xs font-semibold text-muted-foreground mt-0.5">₨{cat.daily_wage} per day</p>
                    ) : (
                      <button onClick={() => handleOpenCatModal(cat)} className="text-xs font-bold text-[#2648E7] mt-0.5">Set daily wage →</button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {cost > 0 && (
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground leading-tight">₨{Math.round(cost).toLocaleString()}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">Cost</p>
                    </div>
                  )}
                  <button 
                    onClick={() => {
                      setEntries(prev => ({ ...prev, [cat.id]: { category_id: cat.id, present_count: 0, half_day_count: 0, ot_hours: 0 } }));
                    }}
                    className="size-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Reset Counters"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { field: "present_count" as const, label: "Present" },
                  { field: "half_day_count" as const, label: "Half Day" },
                  { field: "ot_hours" as const, label: "OT Hrs" },
                ].map(({ field, label }) => (
                  <div key={field} className="flex flex-col items-center gap-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
                    <div className="flex items-center justify-between bg-muted rounded-xl px-1.5 py-1.5 w-full">
                      <button
                        onClick={() => change(cat.id, field, -1)}
                        className="size-8 rounded-lg bg-white shadow-sm flex items-center justify-center active:scale-90 transition-transform shrink-0"
                      >
                        <Minus size={14} className="text-foreground" />
                      </button>
                      <span className="text-base font-bold text-foreground min-w-[24px] text-center select-none">
                        {entry[field]}
                      </span>
                      <button
                        onClick={() => change(cat.id, field, 1)}
                        className="size-8 rounded-lg text-white shadow-sm flex items-center justify-center active:scale-90 transition-transform shrink-0"
                        style={{ backgroundColor: "#2648E7" }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {unaddedCategories.length > 0 ? (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Add more categories</p>
              <button onClick={() => handleOpenCatModal(null)} className="text-[10px] font-bold text-[#2648E7] uppercase tracking-widest flex items-center gap-1"><Plus size={12}/> New Type</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {unaddedCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setEntries(prev => ({ ...prev, [cat.id]: { category_id: cat.id, present_count: 0, half_day_count: 0, ot_hours: 0 } }));
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border hover:border-[#2648E7] hover:text-[#2648E7] text-foreground text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  <Plus size={14} />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="pt-2 flex justify-end">
            <button onClick={() => handleOpenCatModal(null)} className="text-[10px] font-bold text-[#2648E7] uppercase tracking-widest flex items-center gap-1"><Plus size={12}/> New Type</button>
          </div>
        )}
      </div>

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-border lg:left-64 lg:bottom-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Est. Today Cost</p>
            <p className="text-lg font-black text-foreground">₨{Math.round(totalCost).toLocaleString()}</p>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3.5 bg-[#2648E7] hover:bg-[#2648E7]/90 text-white text-sm font-bold rounded-xl transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Log
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-background w-full max-w-md rounded-[32px] sm:rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-border">
              <h2 className="text-xl font-bold text-foreground">{editingCat ? 'Edit Labour Type' : 'New Labour Type'}</h2>
              <button onClick={() => setShowModal(false)} className="size-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-gray-200 transition-colors">
                <Minus size={16} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="cat-form" onSubmit={handleSaveCat} className="space-y-4">
                <div className="space-y-1.5 relative">
                  <label className="text-sm font-bold text-foreground">Labour Name</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7] transition-all text-gray-900" 
                    placeholder="e.g. Mason, Welder" 
                    value={catName} 
                    onChange={e => setCatName(e.target.value)} 
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
                    {["Mistri", "Carpenter", "Helper", "Electrician", "Painter", "Plumber", "Welder", "Steel Fixer", "Mason"]
                      .filter(s => s.toLowerCase().includes(catName.toLowerCase()))
                      .map(s => (
                        <div 
                          key={s} 
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-foreground border-b border-border last:border-0"
                          onClick={() => setCatName(s)}
                        >
                          {s}
                        </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Daily Wage (PKR)</label>
                  <input required type="number" className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7] text-gray-900" placeholder="0" value={catWage} onChange={e => setCatWage(e.target.value)} />
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-border bg-gray-50 flex gap-3">
              {editingCat && (
                <button 
                  type="button" 
                  onClick={async () => {
                    if (confirm('Are you sure you want to delete this category?')) {
                      try {
                        await apiClient.delete(`/labour-categories?id=${editingCat.id}`);
                        setShowModal(false);
                        fetchCategoriesAndLogs();
                      } catch (err) {
                        alert('Failed to delete');
                      }
                    }
                  }}
                  className="px-4 py-3 rounded-2xl font-bold text-sm text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                  title="Delete Category"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-2xl font-bold text-sm text-foreground bg-white border border-border shadow-sm hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" form="cat-form" className="flex-1 py-3 rounded-2xl font-bold text-sm text-white shadow-sm transition-opacity hover:opacity-90" style={{ backgroundColor: "#2648E7" }}>
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
