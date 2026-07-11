import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Save, AlertCircle, Plus, Users, Calendar } from 'lucide-react';
import { apiClient } from '@/api/client';
import { PH } from '@/components/shared/FigmaComponents';

interface LabourCategory {
  id: string;
  name: string;
  daily_wage: number;
  half_day_multiplier: number;
  ot_multiplier: number;
}

interface AttendanceEntry {
  category_id: string;
  present_count: number;
  half_day_count: number;
  ot_hours: number;
}

export default function LabourRegister() {
  const { activeProject } = useProject();
  // Temporarily use the first site for the MVP register
  const activeSiteId = activeProject?.sites?.[0]?.id;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categories, setCategories] = useState<LabourCategory[]>([]);
  const [entries, setEntries] = useState<Record<string, AttendanceEntry>>({});

  useEffect(() => {
    if (activeSiteId) {
      fetchCategoriesAndLogs();
    }
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
        cats.slice(0, 3).forEach((c: any) => {
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

  const handleEntryChange = (categoryId: string, field: keyof AttendanceEntry, value: string) => {
    const num = parseInt(value) || 0;
    setEntries(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [field]: num < 0 ? 0 : num
      }
    }));
  };

  const handleAddCategory = (categoryId: string) => {
    if (!entries[categoryId]) {
      setEntries(prev => ({ ...prev, [categoryId]: { category_id: categoryId, present_count: 0, half_day_count: 0, ot_hours: 0 } }));
    }
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
      setSuccessMsg('');
      
      const payload = {
        site_id: activeSiteId,
        date: new Date(date).toISOString(),
        entries: Object.values(entries).filter(e => e.present_count > 0 || e.half_day_count > 0 || e.ot_hours > 0)
      };

      await apiClient.post('/labour-logs', payload);
      
      setSuccessMsg('Attendance saved successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeSiteId) {
      return <div className="p-12 text-center text-slate-500">Please select a Site from the dropdown.</div>;
  }

  if (loading) {
      return <div className="p-12 flex justify-center"><PH title="Loading..." /></div>;
  }

  const unaddedCategories = categories.filter(c => !entries[c.id]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Daily Labour Register</h2>
          <p className="text-sm text-slate-500">Log bulk attendance by category for site operations.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
            <Calendar size={16} className="text-slate-400" />
            <input 
              type="date" 
              value={date}
              onChange={e => setDate(e.target.value)}
              className="text-sm font-medium text-slate-700 focus:outline-none bg-transparent"
            />
          </div>
          <div className="h-10 w-px bg-slate-200"></div>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm disabled:opacity-70"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Save Register
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-50 text-green-700 px-6 py-3 border-b border-green-100 text-sm font-medium flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          {successMsg}
        </div>
      )}

      <div className="flex-1 overflow-auto p-6">
        {/* Dashlets */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Manpower</p>
              <p className="text-2xl font-bold text-slate-800">{totalMen} <span className="text-sm font-normal text-slate-500">workers</span></p>
            </div>
          </div>
          
          <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
              <span className="text-xl font-bold">Rs</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Today's Estimated Cost</p>
              <p className="text-2xl font-bold text-slate-800">PKR {Math.round(totalCost).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4 font-semibold w-[25%]">Labour Category</th>
                <th className="px-6 py-4 font-semibold w-[15%]">Daily Wage</th>
                <th className="px-6 py-4 font-semibold w-[15%]">Present</th>
                <th className="px-6 py-4 font-semibold w-[15%]">Half Day</th>
                <th className="px-6 py-4 font-semibold w-[15%]">OT Hours</th>
                <th className="px-6 py-4 font-semibold text-right w-[15%]">Row Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.values(entries).map(entry => {
                const cat = categories.find(c => c.id === entry.category_id);
                if (!cat) return null;
                
                return (
                  <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{cat.name}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      PKR {cat.daily_wage}
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        type="number" 
                        min="0"
                        value={entry.present_count || ''}
                        onChange={(e) => handleEntryChange(cat.id, 'present_count', e.target.value)}
                        className="w-20 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        type="number" 
                        min="0"
                        value={entry.half_day_count || ''}
                        onChange={(e) => handleEntryChange(cat.id, 'half_day_count', e.target.value)}
                        className="w-20 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        type="number" 
                        min="0"
                        value={entry.ot_hours || ''}
                        onChange={(e) => handleEntryChange(cat.id, 'ot_hours', e.target.value)}
                        className="w-20 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">
                      PKR {Math.round(calculateRowTotal(cat.id)).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              
              {/* Add Category Row */}
              {unaddedCategories.length > 0 && (
                <tr className="bg-slate-50/30">
                  <td colSpan={6} className="px-6 py-4">
                    <div className="flex gap-2">
                      {unaddedCategories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => handleAddCategory(cat.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 text-slate-600 text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                          <Plus size={14} />
                          Add {cat.name}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
