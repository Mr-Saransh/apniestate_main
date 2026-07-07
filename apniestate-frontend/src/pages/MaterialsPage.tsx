import React, { useState, useEffect, type FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { apiClient } from '@/api/client';
import { PH, Card, Chip, SrchBar } from '@/components/shared/FigmaComponents';

interface Material {
  id: string;
  name: string;
  unit: string;
  description?: string;
  category?: string;
  rate?: number;
  grade?: string;
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states for Catalog
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('Bags');
  const [category, setCategory] = useState('Structural');
  const [description, setDescription] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const matRes = await apiClient.get<Material[]>('/materials');
      if (matRes.data) setMaterials(matRes.data);
    } catch (err) {
      console.error('Failed to load materials data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateMaterial = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !unit) return;
    setSaving(true);
    try {
      await apiClient.post('/materials', { name, unit, category, description: description || null });
      setShowCatalogModal(false);
      setName(''); setUnit('Bags'); setDescription('');
      loadData();
    } catch (err) {
      console.error('Failed to create material', err);
    } finally {
      setSaving(false);
    }
  };

  const filteredMaterials = materials.filter(m => 
    !search || 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && materials.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PH title="Materials Master" sub={`Approved catalog · ${materials.length} materials`} />
      
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1" onChange={(e: any) => setSearch(e.target.value)}>
          <SrchBar placeholder="Search materials..." />
        </div>
        <button 
          onClick={() => setShowCatalogModal(true)}
          className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>

      <Card noPad>
        <div className="grid grid-cols-[2fr_1fr_1fr] px-4 py-2 text-[10px] font-semibold text-muted-foreground border-b border-border bg-muted/30">
          <span>Material</span>
          <span className="text-right">Rate/Unit</span>
          <span className="text-right">Grade</span>
        </div>
        
        {filteredMaterials.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No materials found</div>
        ) : (
          filteredMaterials.map((m, i) => {
            const rate = m.rate || 0;
            const rateStr = rate > 0 ? `₨${rate.toLocaleString()}` : '-';
            const grade = m.grade || "A";
            
            return (
              <div key={m.id || i} className={`grid grid-cols-[2fr_1fr_1fr] px-4 py-2.5 items-center ${i < filteredMaterials.length - 1 ? "border-b border-border" : ""}`}>
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-medium text-foreground truncate">{m.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{m.category || 'General'} · per {m.unit}</p>
                </div>
                <span className="text-xs text-right font-semibold text-foreground">{rateStr}</span>
                <div className="flex justify-end">
                  <Chip color={grade === "A+" ? "green" : grade === "A" ? "blue" : "yellow"}>{grade}</Chip>
                </div>
              </div>
            );
          })
        )}
      </Card>

      {/* Add Material Modal */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-sm font-bold">New Material</h2>
              <button onClick={() => setShowCatalogModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateMaterial} className="p-4 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Name *</label>
                  <input type="text" required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. OPC Cement (50kg)" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Category *</label>
                    <select className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={category} onChange={(e) => setCategory(e.target.value)}>
                      {['Structural', 'Binding', 'Aggregate', 'Masonry', 'Formwork', 'Electrical', 'Plumbing', 'Misc'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Unit *</label>
                    <input type="text" required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. Bag, Kg, Cft" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                  <input type="text" className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details..." />
                </div>
              </div>
              
              <div className="border-t border-border flex gap-2 -mx-4 -mb-4 pt-4 px-4 bg-muted/30 rounded-b-2xl pb-4">
                <button type="button" onClick={() => setShowCatalogModal(false)} className="flex-1 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium flex justify-center items-center hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {saving ? 'Adding...' : 'Add Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
