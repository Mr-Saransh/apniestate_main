import React, { useState, useEffect, type FormEvent } from 'react';
import { FileCheck, Plus, Trash2, CheckCircle, IndianRupee } from 'lucide-react';
import { PH, Card, Chip } from '@/components/shared/FigmaComponents';
import { boqApi, type BOQ, type BOQCategory, type BOQItem } from '@/api/boq';
import Modal from '@/components/shared/Modal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';

export default function BOQPage() {
  const { user } = useAuth();
  const { activeProjectId, loading: projectLoading } = useProject();
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
      await boqApi.createBOQ({ project_id: activeProjectId, categories });
      fetchData(activeProjectId);
    } catch (err) {
      console.error("Failed to save BOQ:", err);
    }
  };

  const handleDelete = async () => {
    if (!boq) return;
    if (confirm("Are you sure you want to completely delete this BOQ?")) {
      await boqApi.deleteBOQ(boq.id);
      setBoq(null);
      setCategories([{ name: 'Civil Works', items: [] }]);
    }
  };

  if (projectLoading || loading) return <LoadingSpinner size="lg" />;

  if (!activeProjectId) {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
        <PH title="Bill of Quantities" sub="Manage Project BOQ" />
        <Card noPad>
          <div className="p-8 text-center text-gray-500">
            Please select a project from the top navigation menu to view its Bill of Quantities.
          </div>
        </Card>
      </div>
    );
  }

  const isApproved = boq?.status === 'APPROVED';

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex justify-between items-center">
        <PH title="Bill of Quantities" sub="Manage Project BOQ" />
        {boq && (
          <Chip color={isApproved ? 'green' : 'yellow'}>{boq.status}</Chip>
        )}
      </div>

      {!boq || !isApproved ? (
        <Card noPad>
          <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3">
            <h3 className="font-bold text-gray-900">Create / Edit BOQ</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleAddCategory} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-semibold hover:bg-gray-200">
                + Add Category
              </button>
              <button onClick={handleSaveDraft} className="px-3 py-1.5 bg-[#2648E7] text-white rounded text-xs font-semibold hover:bg-[#2648E7]/90">
                Save Draft
              </button>
              {boq && (
                <button onClick={handleDelete} className="px-3 py-1.5 bg-red-50 text-red-600 rounded text-xs font-semibold hover:bg-red-100 flex gap-1 items-center ml-2" title="Delete Draft">
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
          </div>
          
          <div className="p-4 space-y-6">
            {categories.map((cat, catIdx) => (
              <div key={catIdx} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-3 flex gap-3 items-center border-b border-gray-200">
                  <input
                    type="text"
                    value={cat.name}
                    onChange={e => handleCategoryChange(catIdx, e.target.value)}
                    placeholder="Category Name (e.g. Foundation)"
                    className="flex-1 bg-white border border-gray-300 rounded px-3 py-1.5 text-sm font-bold text-gray-900"
                  />
                  <button onClick={() => handleAddItem(catIdx)} className="text-xs font-semibold text-blue-600 hover:underline whitespace-nowrap">
                    + Add Item
                  </button>
                  <button onClick={() => handleRemoveCategory(catIdx)} className="text-red-400 hover:text-red-600 ml-1" title="Remove Category">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full min-w-[800px] text-left text-sm text-gray-700">
                    <thead className="bg-gray-50/50 text-xs text-gray-500 font-medium">
                      <tr>
                        <th className="px-4 py-2 w-1/4">Description</th>
                        <th className="px-4 py-2">Qty</th>
                        <th className="px-4 py-2">Unit</th>
                        <th className="px-4 py-2">Material</th>
                        <th className="px-4 py-2">Labour</th>
                        <th className="px-4 py-2">Total Rate</th>
                        <th className="px-4 py-2">Amount</th>
                        <th className="px-4 py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(cat.items || []).map((item, itemIdx) => {
                        const rate = Number(item.material_rate) + Number(item.labour_rate) + Number(item.equipment_rate) + Number(item.other_rate);
                        const amount = rate * Number(item.quantity);
                        return (
                          <tr key={itemIdx} className="hover:bg-gray-50/50">
                            <td className="px-4 py-2">
                              <input type="text" value={item.description} onChange={e => handleItemChange(catIdx, itemIdx, 'description', e.target.value)} className="w-full bg-transparent border-b border-dashed border-gray-300 px-1 py-1 focus:border-blue-500 outline-none" placeholder="Item desc..." />
                            </td>
                            <td className="px-4 py-2">
                              <input type="number" value={item.quantity} onChange={e => handleItemChange(catIdx, itemIdx, 'quantity', Number(e.target.value))} className="w-16 bg-transparent border-b border-dashed border-gray-300 px-1 py-1 outline-none" />
                            </td>
                            <td className="px-4 py-2">
                              <select value={item.unit} onChange={e => handleItemChange(catIdx, itemIdx, 'unit', e.target.value)} className="bg-transparent border-b border-dashed border-gray-300 py-1 outline-none">
                                <option value="kg">kg</option>
                                <option value="bags">bags</option>
                                <option value="cum">cum</option>
                                <option value="cft">cft</option>
                                <option value="m">m</option>
                                <option value="nos">nos</option>
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <input type="number" value={item.material_rate} onChange={e => handleItemChange(catIdx, itemIdx, 'material_rate', Number(e.target.value))} className="w-16 bg-transparent border-b border-dashed border-gray-300 px-1 py-1 outline-none" />
                            </td>
                            <td className="px-4 py-2">
                              <input type="number" value={item.labour_rate} onChange={e => handleItemChange(catIdx, itemIdx, 'labour_rate', Number(e.target.value))} className="w-16 bg-transparent border-b border-dashed border-gray-300 px-1 py-1 outline-none" />
                            </td>
                            <td className="px-4 py-2 font-mono text-gray-500">₹{rate.toLocaleString()}</td>
                            <td className="px-4 py-2 font-mono font-bold text-gray-900">₹{amount.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right">
                              <button onClick={() => handleRemoveItem(catIdx, itemIdx)} className="text-red-400 hover:text-red-600" title="Remove Item">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {(!cat.items || cat.items.length === 0) && (
                        <tr><td colSpan={7} className="px-4 py-6 text-center text-xs text-gray-400">No items added to this category yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card noPad>
          <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-2 bg-gray-50/50 rounded-t-xl">
            <h3 className="font-bold text-gray-900">Approved BOQ (Version {boq.version})</h3>
            <div className="flex gap-4 items-center">
              <div className="font-mono text-lg font-black text-[#2648E7]">
                ₹ {boq.total_estimated_cost.toLocaleString()}
              </div>
              <button onClick={handleDelete} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100" title="Delete BOQ">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div className="p-0 overflow-x-auto">
             {(!boq.categories || boq.categories.length === 0) && (
               <div className="p-8 text-center text-gray-500">
                 This Approved BOQ is empty. You may delete it and start over.
               </div>
             )}
             {boq.categories.map((cat, i) => (
                <div key={i} className="border-b border-gray-100 last:border-0 min-w-max">
                  <div className="bg-gray-50 px-4 py-2 font-semibold text-sm text-gray-800 border-y border-gray-200">
                    {cat.name}
                  </div>
                  <table className="w-full min-w-[800px] text-left text-sm text-gray-700">
                    <tbody className="divide-y divide-gray-100">
                      {cat.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 w-1/3">
                            <span className="font-medium text-gray-900">{item.description}</span>
                            {item.code && <span className="ml-2 text-xs text-gray-500">{item.code}</span>}
                          </td>
                          <td className="px-4 py-3 w-32 font-mono text-xs">{item.quantity} {item.unit}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">Mat: ₹{item.material_rate} | Lab: ₹{item.labour_rate}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">₹{(item.total_amount || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             ))}
          </div>
        </Card>
      )}

    </div>
  );
}
