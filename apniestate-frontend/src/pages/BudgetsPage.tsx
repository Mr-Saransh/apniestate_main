import { useState, useEffect, type FormEvent } from 'react';
import { budgetsApi, type Budget } from '@/api/budgets';
import { projectsApi, type Project } from '@/api/projects';
import Modal from '@/components/shared/Modal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import StatCard from '@/components/shared/StatCard';
import ProgressBar from '@/components/shared/ProgressBar';
import { Plus, Search, BarChart3, Edit2, Trash2, IndianRupee } from 'lucide-react';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

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

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const data = {
        project_id: formProjectId,
        category: formCategory,
        allocated: Number(formAllocated),
        spent: Number(formSpent),
        description: formDescription || null
      };

      await budgetsApi.createBudget(data);
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
      const data = {
        project_id: formProjectId,
        category: formCategory,
        allocated: Number(formAllocated),
        spent: Number(formSpent),
        description: formDescription || null
      };

      await budgetsApi.updateBudget(selectedBudget.id, data);
      setShowEditModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update budget');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget record?')) return;
    try {
      await budgetsApi.deleteBudget(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete budget', err);
    }
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

  const resetForm = () => {
    setSelectedBudget(null);
    setFormProjectId('');
    setFormCategory('MATERIALS');
    setFormAllocated(0);
    setFormSpent(0);
    setFormDescription('');
    setFormError('');
  };

  const filtered = budgets.filter(b => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = 
      b.category.toLowerCase().includes(term) ||
      (b.project?.name && b.project.name.toLowerCase().includes(term));
    const matchesProject = !projectFilter || b.project_id === projectFilter;
    return matchesSearch && matchesProject;
  });

  // Stats
  const totalAllocated = budgets.reduce((acc, b) => acc + b.allocated, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
  const totalVariance = totalAllocated - totalSpent;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Budget Allocation</h1>
          <p className="page-subtitle">Track project budgets by category and check variances against actual expenditures</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }} id="add-budget-btn">
          <Plus size={18} />
          Create Budget
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard
          icon={<IndianRupee size={20} />}
          label="Total Allocated"
          value={`₹${totalAllocated.toLocaleString('en-IN')}`}
          color="#3B82F6"
          bgColor="rgba(59, 130, 246, 0.1)"
        />
        <StatCard
          icon={<IndianRupee size={20} />}
          label="Total Spent"
          value={`₹${totalSpent.toLocaleString('en-IN')}`}
          color="#EC4899"
          bgColor="rgba(236, 72, 153, 0.1)"
        />
        <StatCard
          icon={<IndianRupee size={20} />}
          label="Variance (Remaining)"
          value={`₹${totalVariance.toLocaleString('en-IN')}`}
          color={totalVariance >= 0 ? "#10B981" : "#EF4444"}
          bgColor={totalVariance >= 0 ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)"}
        />
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', maxWidth: '600px' }}>
        <div className="card-body" style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-3)' }}>
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search category or project name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="search-budgets"
            />
          </div>
          <select
            className="form-input form-select"
            style={{ width: '200px' }}
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Budgets List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<BarChart3 size={36} />}
          title="No budgets created"
          description="Allocate categorical budgets to projects to keep cost tracking active"
          action={
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={18} /> Create Budget
            </button>
          }
        />
      ) : (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Category</th>
                    <th>Allocated (₹)</th>
                    <th>Spent (₹)</th>
                    <th style={{ width: 160 }}>Spend Progress</th>
                    <th>Remaining (₹)</th>
                    <th>Creator</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(budget => {
                    const variance = budget.allocated - budget.spent;
                    const percentSpent = budget.allocated > 0 
                      ? Math.min(Math.round((budget.spent / budget.allocated) * 100), 100) 
                      : 0;

                    return (
                      <tr key={budget.id} className="hover-row">
                        <td>
                          <span style={{ fontWeight: '500' }}>{budget.project?.name || 'Unknown Project'}</span>
                        </td>
                        <td>
                          <span className="badge" style={{ background: '#F3F4F6', color: '#111827', fontWeight: '500' }}>
                            {budget.category}
                          </span>
                        </td>
                        <td style={{ fontWeight: '600' }}>₹{budget.allocated.toLocaleString('en-IN')}</td>
                        <td style={{ fontWeight: '600', color: 'var(--color-text-secondary)' }}>₹{budget.spent.toLocaleString('en-IN')}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <ProgressBar value={percentSpent} size="sm" />
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textAlign: 'right' }}>{percentSpent}%</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: '600', color: variance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          ₹{variance.toLocaleString('en-IN')}
                        </td>
                        <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                          {budget.creator?.name || '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => openEditModal(budget)}
                              title="Edit Budget"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              className="btn btn-ghost btn-icon btn-sm text-danger"
                              onClick={() => handleDelete(budget.id)}
                              title="Delete Budget"
                            >
                              <Trash2 size={15} color="#EF4444" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Budget Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        title="Create categorical Budget"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleCreate as any}
              disabled={submitting || !formProjectId || !formCategory || !formAllocated}
              id="submit-create-budget"
            >
              {submitting ? 'Creating...' : 'Create Budget'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {formError && <div className="login-error"><span>{formError}</span></div>}

          <div className="form-group">
            <label className="form-label" htmlFor="b-proj">Select Project *</label>
            <select id="b-proj" className="form-input form-select" value={formProjectId} onChange={(e) => setFormProjectId(e.target.value)} required>
              <option value="">Select project...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="b-cat">Category *</label>
            <select id="b-cat" className="form-input form-select" value={formCategory} onChange={(e) => setFormCategory(e.target.value as Budget['category'])}>
              <option value="MATERIALS">Materials</option>
              <option value="LABOUR">Labour</option>
              <option value="SUBCONTRACT">Subcontracting</option>
              <option value="EQUIPMENT">Equipment Rental / Purchase</option>
              <option value="OVERHEAD">Overhead Costs</option>
              <option value="CONTINGENCY">Contingency Fund</option>
              <option value="OTHER">Other Expense</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="b-alloc">Allocated budget (₹) *</label>
              <input id="b-alloc" type="number" className="form-input" value={formAllocated} onChange={(e) => setFormAllocated(Number(e.target.value))} required min={1} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="b-spent">Actual Spent (₹)</label>
              <input id="b-spent" type="number" className="form-input" value={formSpent} onChange={(e) => setFormSpent(Number(e.target.value))} min={0} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="b-desc">Notes / Description</label>
            <textarea id="b-desc" className="form-input" placeholder="Budget allocation notes..." rows={2} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
          </div>
        </form>
      </Modal>

      {/* Edit Budget Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); resetForm(); }}
        title="Edit Budget"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setShowEditModal(false); resetForm(); }}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleUpdate as any}
              disabled={submitting || !formProjectId || !formCategory || !formAllocated}
              id="submit-edit-budget"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {formError && <div className="login-error"><span>{formError}</span></div>}

          <div className="form-group">
            <label className="form-label" htmlFor="edit-b-proj">Select Project *</label>
            <select id="edit-b-proj" className="form-input form-select" value={formProjectId} onChange={(e) => setFormProjectId(e.target.value)} required>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-b-cat">Category *</label>
            <select id="edit-b-cat" className="form-input form-select" value={formCategory} onChange={(e) => setFormCategory(e.target.value as Budget['category'])}>
              <option value="MATERIALS">Materials</option>
              <option value="LABOUR">Labour</option>
              <option value="SUBCONTRACT">Subcontracting</option>
              <option value="EQUIPMENT">Equipment Rental / Purchase</option>
              <option value="OVERHEAD">Overhead Costs</option>
              <option value="CONTINGENCY">Contingency Fund</option>
              <option value="OTHER">Other Expense</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-b-alloc">Allocated budget (₹) *</label>
              <input id="edit-b-alloc" type="number" className="form-input" value={formAllocated} onChange={(e) => setFormAllocated(Number(e.target.value))} required min={1} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-b-spent">Actual Spent (₹)</label>
              <input id="edit-b-spent" type="number" className="form-input" value={formSpent} onChange={(e) => setFormSpent(Number(e.target.value))} min={0} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-b-desc">Notes / Description</label>
            <textarea id="edit-b-desc" className="form-input" rows={2} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
