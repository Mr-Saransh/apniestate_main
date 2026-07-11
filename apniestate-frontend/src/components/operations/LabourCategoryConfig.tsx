import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { Card, PH } from '@/components/shared/FigmaComponents';
import { apiClient } from '@/api/client';

interface LabourCategory {
  id: string;
  name: string;
  daily_wage: number;
  half_day_multiplier: number;
  ot_multiplier: number;
  status: string;
}

export default function LabourCategoryConfig() {
  const [categories, setCategories] = useState<LabourCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [dailyWage, setDailyWage] = useState('');
  const [halfDay, setHalfDay] = useState('0.5');
  const [ot, setOt] = useState('1.5');
  const [status, setStatus] = useState('ACTIVE');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<LabourCategory[]>('/labour-categories');
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cat: LabourCategory) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDailyWage(cat.daily_wage.toString());
    setHalfDay(cat.half_day_multiplier.toString());
    setOt(cat.ot_multiplier.toString());
    setStatus(cat.status);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setName('');
    setDailyWage('');
    setHalfDay('0.5');
    setOt('1.5');
    setStatus('ACTIVE');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        daily_wage: Number(dailyWage),
        half_day_multiplier: Number(halfDay),
        ot_multiplier: Number(ot),
        status
      };

      if (editingId) {
        await apiClient.put(`/labour-categories?id=${editingId}`, payload);
      } else {
        await apiClient.post('/labour-categories', payload);
      }
      
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert('Failed to save category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Labour Categories</h2>
          <p className="text-sm text-slate-500">Configure standard wages and multipliers for your workforce.</p>
        </div>
        <button onClick={handleAddNew} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><PH title="Loading categories..." /></div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No labour categories configured. Add your first category to start logging attendance.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Category Name</th>
                  <th className="p-4">Daily Wage</th>
                  <th className="p-4">Half Day Multiplier</th>
                  <th className="p-4">OT Multiplier</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-medium text-slate-800">{cat.name}</td>
                    <td className="p-4 text-slate-600">PKR {cat.daily_wage.toLocaleString()}</td>
                    <td className="p-4 text-slate-600">{cat.half_day_multiplier}x</td>
                    <td className="p-4 text-slate-600">{cat.ot_multiplier}x</td>
                    <td className="p-4">
                      {cat.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          <XCircle size={12} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleEdit(cat)} className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">{editingId ? 'Edit Category' : 'New Category'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category Name</label>
                <input required value={name} onChange={(e: any) => setName(e.target.value)} placeholder="e.g. Carpenter, Plumber" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Daily Wage (PKR)</label>
                <input required type="number" value={dailyWage} onChange={(e: any) => setDailyWage(e.target.value)} placeholder="e.g. 1500" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Half Day Multiplier</label>
                  <input required type="number" step="0.1" value={halfDay} onChange={(e: any) => setHalfDay(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">OT Multiplier</label>
                  <input required type="number" step="0.1" value={ot} onChange={(e: any) => setOt(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={status} 
                  onChange={(e: any) => setStatus(e.target.value)}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
