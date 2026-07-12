import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { boqApi, type BOQ, type BOQCategory } from '@/api/boq';
import { useProject } from '@/context/ProjectContext';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{children}</p>
  );
}

export default function BOQPage() {
  const { activeProject, activeProjectId } = useProject();
  const [loading, setLoading] = useState(false);
  const [boq, setBoq] = useState<BOQ | null>(null);

  // Form State
  const [categories, setCategories] = useState<BOQCategory[]>([{ name: 'Civil Works', items: [] }]);

  useEffect(() => {
    if (activeProjectId) {
      fetchData(activeProjectId);
    } else {
      setBoq(null);
      setCategories([{ name: 'Civil Works', items: [] }]);
    }
  }, [activeProjectId]);

  const fetchData = async (id: string) => {
    try {
      setLoading(true);
      const res = await boqApi.getBOQForProject(id);
      if (res.data) {
        setBoq(res.data);
        if (res.data.categories && res.data.categories.length > 0) {
          setCategories(res.data.categories);
        } else {
          setCategories([{ name: 'Civil Works', items: [] }]);
        }
      } else {
        setBoq(null);
        setCategories([{ name: 'Civil Works', items: [] }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    setCategories([...categories, { name: '', items: [] }]);
  };

  const handleCategoryChange = (index: number, name: string) => {
    const newCats = [...categories];
    newCats[index].name = name;
    setCategories(newCats);
  };

  const handleAddItem = (catIndex: number) => {
    const newCats = [...categories];
    if (!newCats[catIndex].items) newCats[catIndex].items = [];
    newCats[catIndex].items!.push({
      description: '',
      quantity: 1,
      unit: 'kg',
      total_rate: 0,
      material_rate: 0,
      labour_rate: 0,
      equipment_rate: 0,
      other_rate: 0,
    });
    setCategories(newCats);
  };

  const handleRemoveCategory = (catIndex: number) => {
    const newCats = [...categories];
    newCats.splice(catIndex, 1);
    setCategories(newCats);
  };

  const handleRemoveItem = (catIndex: number, itemIndex: number) => {
    const newCats = [...categories];
    newCats[catIndex].items!.splice(itemIndex, 1);
    setCategories(newCats);
  };

  const handleItemChange = (catIndex: number, itemIndex: number, field: string, value: any) => {
    const newCats = [...categories];
    const item = newCats[catIndex].items![itemIndex] as any;
    item[field] = value;
    setCategories(newCats);
  };

  const handleSaveDraft = async () => {
    if (!activeProjectId) return;
    try {
      setLoading(true);
      await boqApi.createBOQ({ project_id: activeProjectId, categories });
      await fetchData(activeProjectId);
      alert("BOQ saved successfully!");
    } catch (err: any) {
      console.error("Failed to save BOQ:", err);
      alert(err.message || "Failed to save BOQ. Please ensure all values are correct.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-[#2648E7] border-t-transparent animate-spin" />
      </div>
    );
  }

  const isApproved = boq?.status === 'APPROVED';

  return (
    <div className="space-y-4 pb-12">
      <SectionLabel>Bill of Quantities — {activeProject?.name}</SectionLabel>

      {!boq || !isApproved ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-foreground">Create / Edit BOQ</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleAddCategory} className="px-4 py-2 bg-white border border-border text-foreground rounded-xl text-xs font-bold hover:bg-muted shadow-sm transition-colors">
                + Add Category
              </button>
              <button onClick={handleSaveDraft} className="px-5 py-2 bg-[#2648E7] text-white rounded-xl text-xs font-bold hover:bg-[#2648E7]/90 shadow-sm transition-colors">
                Save Draft
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {categories.map((cat, catIdx) => (
              <div key={catIdx} className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-muted px-4 py-3 flex gap-3 items-center border-b border-border">
                  <input
                    type="text"
                    value={cat.name}
                    onChange={e => handleCategoryChange(catIdx, e.target.value)}
                    placeholder="Category Name"
                    className="flex-1 bg-white border border-border rounded-lg px-3 py-1.5 text-sm font-bold text-foreground focus:outline-none focus:border-[#2648E7]"
                  />
                  <button onClick={() => handleAddItem(catIdx)} className="text-xs font-bold text-[#2648E7] hover:underline whitespace-nowrap">
                    + Add Item
                  </button>
                  <button onClick={() => handleRemoveCategory(catIdx)} className="text-muted-foreground hover:text-red-600 ml-1 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <div className="min-w-[600px] grid grid-cols-[1fr_80px_100px_120px_120px_50px] gap-0">
                    <div className="contents text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {["Description", "Qty", "Unit", "Rate (₹)", "Amount (₹)", ""].map((h, i) => (
                        <div key={i} className="px-4 py-2.5 bg-muted/30 border-b border-border">{h}</div>
                      ))}
                    </div>
                    {(cat.items || []).map((item, itemIdx) => {
                      const rate = Number(item.total_rate || item.material_rate || 0); // use total_rate as the main rate field
                      const amount = rate * Number(item.quantity || 0);
                      const b = "border-b border-border";
                      return (
                        <div key={itemIdx} className="contents text-sm font-semibold text-foreground group">
                          <div className={`px-4 py-3 ${b}`}><input type="text" value={item.description} onChange={e => handleItemChange(catIdx, itemIdx, 'description', e.target.value)} className="w-full bg-transparent border-b border-dashed border-border px-1 py-1 focus:border-[#2648E7] outline-none" placeholder="Item description..." /></div>
                          <div className={`px-4 py-3 ${b}`}><input type="number" min="0" value={item.quantity} onChange={e => handleItemChange(catIdx, itemIdx, 'quantity', Number(e.target.value))} className="w-full bg-transparent border-b border-dashed border-border px-1 py-1 outline-none text-center" /></div>
                          <div className={`px-4 py-3 ${b}`}>
                            <select value={item.unit} onChange={e => handleItemChange(catIdx, itemIdx, 'unit', e.target.value)} className="w-full bg-transparent border-b border-dashed border-border py-1 outline-none cursor-pointer">
                              <option value="kg">kg</option><option value="bags">bags</option><option value="cum">cum</option><option value="cft">cft</option><option value="m">m</option><option value="nos">nos</option><option value="lumpsum">lumpsum</option><option value="sqft">sqft</option>
                            </select>
                          </div>
                          <div className={`px-4 py-3 ${b}`}><input type="number" min="0" value={item.total_rate || item.material_rate || ''} onChange={e => handleItemChange(catIdx, itemIdx, 'total_rate', Number(e.target.value))} className="w-full bg-transparent border-b border-dashed border-border px-1 py-1 outline-none text-right" placeholder="0" /></div>
                          <div className={`px-4 py-3 text-right font-bold ${b}`}>₹{amount.toLocaleString('en-IN')}</div>
                          <div className={`px-4 py-3 text-center ${b}`}>
                            <button onClick={() => handleRemoveItem(catIdx, itemIdx)} className="text-muted-foreground hover:text-red-600 transition-colors opacity-50 group-hover:opacity-100 p-1">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {(!cat.items || cat.items.length === 0) && (
                      <div className="col-span-6 px-4 py-6 text-center text-xs text-muted-foreground font-semibold">No items added to this category yet.</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-emerald-50 px-5 py-4 border-b border-border flex justify-between items-center">
            <h3 className="font-bold text-emerald-900">Approved BOQ (v{boq.version})</h3>
            <div className="font-bold text-emerald-700 text-lg">
              Total: ₹ {boq.total_estimated_cost.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="overflow-x-auto">
             {(!boq.categories || boq.categories.length === 0) && (
               <div className="p-8 text-center text-muted-foreground">Empty Approved BOQ.</div>
             )}
             {boq.categories.map((cat, i) => (
                <div key={i} className="border-b border-border last:border-0 min-w-max">
                  <div className="bg-muted px-5 py-2.5 font-bold text-sm text-foreground">
                    {cat.name}
                  </div>
                  <div className="grid grid-cols-[1fr_100px_120px_120px] gap-0">
                    {cat.items?.map((item, idx) => (
                      <div key={idx} className="contents text-sm border-t border-border/50 hover:bg-muted/30 transition-colors">
                        <div className="px-5 py-3 border-b border-border/50">
                          <span className="font-bold text-foreground">{item.description}</span>
                          {item.code && <span className="ml-2 text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{item.code}</span>}
                        </div>
                        <div className="px-5 py-3 border-b border-border/50 font-bold text-muted-foreground">{item.quantity} {item.unit}</div>
                        <div className="px-5 py-3 border-b border-border/50 text-xs text-muted-foreground text-right">Rate: ₹{(item.total_rate || item.material_rate || 0).toLocaleString('en-IN')}</div>
                        <div className="px-5 py-3 border-b border-border/50 text-right font-bold text-foreground">₹{(item.total_amount || 0).toLocaleString('en-IN')}</div>
                      </div>
                    ))}
                  </div>
                </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
}
