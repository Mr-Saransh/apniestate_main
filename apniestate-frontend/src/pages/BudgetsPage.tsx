import React, { useState, useEffect, type FormEvent } from 'react';
import { Plus, X, AlertTriangle, Edit2 } from 'lucide-react';
import { budgetsApi, type Budget } from '@/api/budgets';
import { projectsApi, type Project } from '@/api/projects';
import { PH, Card, Chip, SrchBar } from '@/components/shared/FigmaComponents';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formProjectId, setFormProjectId] = useState('');
  const [formCategory, setFormCategory] = useState<Budget['category']>('MATERIALS');
  const [formAllocated, setFormAllocated] = useState(0);
  const [formSpent, setFormSpent] = useState(0);
  const [formDescription, setFormDescription] = useState('');

  const fetchData = async () => {
    try {
      const [budgetsRes, projectsRes] = await Promise.all([
        budgetsApi.getBudgets(),
        projectsApi.getAll()
      ]);
      if (budgetsRes.data) setBudgets(budgetsRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
    } catch (err) {
      console.error('Failed to fetch budget page data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setFormProjectId('');
    setFormCategory('MATERIALS');
    setFormAllocated(0);
    setFormSpent(0);
    setFormDescription('');
    setFormError('');
    setSelectedBudget(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (budget: Budget) => {
    setSelectedBudget(budget);
    setFormProjectId(budget.project_id);
    setFormCategory(budget.category);
    setFormAllocated(budget.allocated);
    setFormSpent(budget.spent);
    setFormDescription(budget.description || '');
    setShowEditModal(true);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await budgetsApi.createBudget({
        project_id: formProjectId,
        category: formCategory,
        allocated: Number(formAllocated),
        spent: Number(formSpent),
        description: formDescription || null
      });
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to allocate budget');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedBudget) return;
    setFormError('');
    setSubmitting(true);
    try {
      await budgetsApi.updateBudget(selectedBudget.id, {
        project_id: formProjectId,
        category: formCategory,
        allocated: Number(formAllocated),
        spent: Number(formSpent),
        description: formDescription || null
      });
      setShowEditModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update budget');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBudgets = budgets.filter(b => 
    !search || 
    b.project?.name.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase())
  );

  // Group budgets by project for the chart
  const projectBudgetsMap: Record<string, { name: string, budget: number, actual: number, pct: number }> = {};
  budgets.forEach(b => {
    const projName = b.project?.name || 'Unknown';
    if (!projectBudgetsMap[projName]) {
      projectBudgetsMap[projName] = { name: projName, budget: 0, actual: 0, pct: 0 };
    }
    projectBudgetsMap[projName].budget += b.allocated;
    projectBudgetsMap[projName].actual += b.spent;
  });

  const chartData = Object.values(projectBudgetsMap).map(p => ({
    ...p,
    pct: p.budget > 0 ? Math.round((p.actual / p.budget) * 100) : 0,
    budgetStr: (p.budget / 10000000).toFixed(1), // Crores
    actualStr: (p.actual / 10000000).toFixed(1),
  }));

  const overruns = chartData.filter(d => d.pct > 100);

  if (loading && budgets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const formatMoney = (val: number) => {
    if (val >= 10000000) return `₨${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₨${(val / 100000).toFixed(2)}L`;
    if (val >= 1000) return `₨${(val / 1000).toFixed(1)}K`;
    return `₨${val}`;
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start">
        <PH title="Budgets" sub="Cost-overrun alerts and spend tracking" />
        <button 
          onClick={openCreateModal}
          className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-3 h-3" /> Allocate
        </button>
      </div>

      {overruns.map((o, i) => (
        <div key={i} className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-700">Budget overrun: {o.name}</p>
            <p className="text-[10px] text-red-500 mt-0.5">Actual {formatMoney(o.actual)} vs budget {formatMoney(o.budget)} (+{(o.pct - 100).toFixed(1)}%)</p>
          </div>
        </div>
      ))}

      <Card title="Budget vs Actual (₨ Crore)">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
            <Bar dataKey="budgetStr" fill="#EBF0FF" stroke="var(--color-primary)" strokeWidth={1} radius={[3, 3, 0, 0]} name="Budget (Cr)" />
            <Bar dataKey="actualStr" fill="var(--color-primary)" radius={[3, 3, 0, 0]} name="Actual (Cr)" />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 justify-center mt-1">
          <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded border border-primary bg-secondary" /><span className="text-[10px] text-muted-foreground">Budget</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded bg-primary" /><span className="text-[10px] text-muted-foreground">Actual</span></div>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1" onChange={(e: any) => setSearch(e.target.value)}>
          <SrchBar placeholder="Search allocations..." />
        </div>
      </div>

      <Card title="Detailed Allocations" noPad>
        <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 px-4 py-2 text-[10px] font-semibold text-muted-foreground border-b border-border bg-muted/30">
          <span>Project & Category</span><span className="text-right">Budget</span><span className="text-right">Spent</span><span className="text-right">%</span>
        </div>
        {filteredBudgets.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No budgets allocated</div>
        ) : (
          filteredBudgets.map((d, i) => {
            const pct = d.allocated > 0 ? Math.round((d.spent / d.allocated) * 100) : 0;
            return (
              <div key={d.id || i} onClick={() => openEditModal(d)} className={`grid grid-cols-[2fr_1fr_1fr_auto] gap-2 px-4 py-2.5 items-center cursor-pointer hover:bg-muted/30 transition-colors ${i < filteredBudgets.length - 1 ? "border-b border-border" : ""}`}>
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-medium text-foreground truncate">{d.project?.name || 'Unknown'}</p>
                  <p className="text-[10px] text-muted-foreground">{d.category}</p>
                </div>
                <span className="text-xs text-right text-muted-foreground truncate">{formatMoney(d.allocated)}</span>
                <span className="text-xs text-right font-semibold text-foreground truncate">{formatMoney(d.spent)}</span>
                <div className="flex items-center justify-end gap-2">
                  <span className={`text-[10px] text-right font-bold w-8 ${pct > 100 ? "text-red-500" : pct > 85 ? "text-amber-600" : "text-emerald-600"}`}>{pct}%</span>
                  <Edit2 className="w-3 h-3 text-muted-foreground opacity-50" />
                </div>
              </div>
            );
          })
        )}
      </Card>

      {/* Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-sm font-bold">{showEditModal ? 'Edit Budget' : 'Allocate Budget'}</h2>
              <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={showEditModal ? handleUpdate : handleCreate} className="p-4 space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs">{formError}</div>}
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Project *</label>
                  <select required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formProjectId} onChange={e => setFormProjectId(e.target.value)}>
                    <option value="">Select Project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Category *</label>
                  <select required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formCategory} onChange={e => setFormCategory(e.target.value as any)}>
                    <option value="MATERIALS">Materials</option>
                    <option value="LABOR">Labor & Wages</option>
                    <option value="EQUIPMENT">Equipment & Machinery</option>
                    <option value="MISC">Miscellaneous</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Allocated (₨) *</label>
                    <input type="number" required min="0" step="0.01" className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary font-medium" value={formAllocated || ''} onChange={e => setFormAllocated(Number(e.target.value))} placeholder="0.00" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Spent (₨) *</label>
                    <input type="number" required min="0" step="0.01" className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary font-medium" value={formSpent || ''} onChange={e => setFormSpent(Number(e.target.value))} placeholder="0.00" />
                  </div>
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description (Optional)</label>
                  <textarea className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" rows={2} value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Additional notes..." />
                </div>
              </div>
              
              <div className="border-t border-border flex gap-2 -mx-4 -mb-4 pt-4 px-4 bg-muted/30 rounded-b-2xl pb-4 mt-4">
                <button type="button" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} className="flex-1 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium flex justify-center items-center hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
