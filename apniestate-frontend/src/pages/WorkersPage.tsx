import { useState, useEffect, type FormEvent } from 'react';
import { workersApi, type Worker } from '@/api/workers';
import { contractorsApi, type Contractor } from '@/api/contractors';
import { apiClient } from '@/api/client';
import Modal from '@/components/shared/Modal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { Plus, Users, Search, MoreVertical, Trash2, Edit2, ShieldAlert, Award } from 'lucide-react';
import { projectsApi, type Project } from '@/api/projects';

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [tradeFilter, setTradeFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formTrade, setFormTrade] = useState('MASON');
  const [formDailyRate, setFormDailyRate] = useState(500);
  const [formStatus, setFormStatus] = useState<Worker['status']>('ACTIVE');
  const [formSiteId, setFormSiteId] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formContractorId, setFormContractorId] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formAadhaar, setFormAadhaar] = useState('');
  const [formBankAccount, setFormBankAccount] = useState('');

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

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const data = {
        name: formName,
        phone: formPhone || null,
        trade: formTrade,
        daily_rate: Number(formDailyRate),
        status: formStatus,
        site_id: formSiteId || null,
        project_id: formProjectId || null,
        contractor_id: formContractorId || null,
        address: formAddress || null,
        aadhaar_number: formAadhaar || null,
        bank_account: formBankAccount || null,
      };

      await workersApi.createWorker(data);
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create worker');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;
    setFormError('');
    setSubmitting(true);

    try {
      const data = {
        name: formName,
        phone: formPhone || null,
        trade: formTrade,
        daily_rate: Number(formDailyRate),
        status: formStatus,
        site_id: formSiteId || null,
        project_id: formProjectId || null,
        contractor_id: formContractorId || null,
        address: formAddress || null,
        aadhaar_number: formAadhaar || null,
        bank_account: formBankAccount || null,
      };

      await workersApi.updateWorker(selectedWorker.id, data);
      setShowEditModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update worker');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this worker?')) return;
    try {
      await workersApi.deleteWorker(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete worker', err);
    }
  };

  const openEditModal = (worker: Worker) => {
    setSelectedWorker(worker);
    setFormName(worker.name);
    setFormPhone(worker.phone || '');
    setFormTrade(worker.trade);
    setFormDailyRate(worker.daily_rate);
    setFormStatus(worker.status);
    setFormSiteId(worker.site_id || '');
    setFormProjectId(worker.project_id || '');
    setFormContractorId(worker.contractor_id || '');
    setFormAddress(worker.address || '');
    setFormAadhaar(worker.aadhaar_number || '');
    setFormBankAccount(worker.bank_account || '');
    setShowEditModal(true);
  };

  const resetForm = () => {
    setSelectedWorker(null);
    setFormName('');
    setFormPhone('');
    setFormTrade('MASON');
    setFormDailyRate(500);
    setFormStatus('ACTIVE');
    setFormSiteId('');
    setFormProjectId('');
    setFormContractorId('');
    setFormAddress('');
    setFormAadhaar('');
    setFormBankAccount('');
    setFormError('');
  };

  // Filtered Workers
  const filtered = workers.filter((w) => {
    const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          w.trade.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || w.status === statusFilter;
    const matchesSite = !siteFilter || w.site_id === siteFilter;
    const matchesTrade = !tradeFilter || w.trade === tradeFilter;
    return matchesSearch && matchesStatus && matchesSite && matchesTrade;
  });

  // Stats
  const totalWorkers = workers.length;
  const activeWorkers = workers.filter(w => w.status === 'ACTIVE').length;
  const onLeaveWorkers = workers.filter(w => w.status === 'ON_LEAVE').length;
  const avgDailyRate = workers.length > 0 
    ? Math.round(workers.reduce((acc, w) => acc + w.daily_rate, 0) / workers.length)
    : 0;

  // Extract unique trades
  const uniqueTrades = Array.from(new Set(workers.map(w => w.trade)));

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Workers Management</h1>
          <p className="page-subtitle">Manage workforce, assignments, emergency details, and daily wage rates</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }} id="add-worker-btn">
          <Plus size={18} />
          Add Worker
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard
          icon={<Users size={20} />}
          label="Total Workforce"
          value={totalWorkers}
          color="#3B82F6"
          bgColor="rgba(59, 130, 246, 0.1)"
        />
        <StatCard
          icon={<Award size={20} />}
          label="Active on Sites"
          value={activeWorkers}
          color="#10B981"
          bgColor="rgba(16, 185, 129, 0.1)"
        />
        <StatCard
          icon={<ShieldAlert size={20} />}
          label="On Leave"
          value={onLeaveWorkers}
          color="#F59E0B"
          bgColor="rgba(245, 158, 11, 0.1)"
        />
        <StatCard
          icon={<Users size={20} />}
          label="Avg. Daily Rate"
          value={`₹${avgDailyRate}`}
          color="#8B5CF6"
          bgColor="rgba(139, 92, 246, 0.1)"
        />
      </div>

      {/* Filters & Search */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'center' }}>
          <div className="search-input-wrapper" style={{ flex: '1 1 300px' }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search by worker name or trade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="search-workers"
            />
          </div>
          
          <select
            className="form-input form-select"
            style={{ width: '160px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="TERMINATED">Terminated</option>
          </select>

          <select
            className="form-input form-select"
            style={{ width: '180px' }}
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
          >
            <option value="">All Sites</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>

          <select
            className="form-input form-select"
            style={{ width: '160px' }}
            value={tradeFilter}
            onChange={(e) => setTradeFilter(e.target.value)}
          >
            <option value="">All Trades</option>
            {uniqueTrades.map(trade => (
              <option key={trade} value={trade}>{trade}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Workers List Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={36} />}
          title="No workers found"
          description="Try modifying search query or filters, or add a new worker"
          action={
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={18} /> Add Worker
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
                    <th>Worker Name</th>
                    <th>Trade / Skill</th>
                    <th>Status</th>
                    <th>Daily Rate</th>
                    <th>Current Site</th>
                    <th>Contractor</th>
                    <th>Phone</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((worker) => (
                    <tr key={worker.id} style={{ transition: 'background-color 0.2s' }} className="hover-row">
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div className="avatar avatar-sm" style={{ background: '#E0E7FF', color: '#4F46E5', fontWeight: 'bold' }}>
                            {worker.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 'var(--font-weight-medium)' }}>{worker.name}</div>
                            {worker.aadhaar_number && (
                              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                Aadhaar: {worker.aadhaar_number}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: '#F3F4F6', color: '#374151', textTransform: 'uppercase' }}>
                          {worker.trade}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={worker.status} />
                      </td>
                      <td style={{ fontWeight: '600' }}>₹{worker.daily_rate}</td>
                      <td>{worker.site?.name || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Unassigned</span>}</td>
                      <td>{worker.contractor?.name || <span style={{ color: 'var(--color-text-muted)' }}>Direct Hire</span>}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{worker.phone || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => openEditModal(worker)}
                            title="Edit Worker"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon btn-sm text-danger"
                            onClick={() => handleDelete(worker.id)}
                            title="Delete Worker"
                          >
                            <Trash2 size={15} color="#EF4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Worker Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        title="Add New Worker"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleCreate as any}
              disabled={submitting || !formName || !formTrade || !formDailyRate}
              id="submit-add-worker"
            >
              {submitting ? 'Adding...' : 'Add Worker'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {formError && <div className="login-error"><span>{formError}</span></div>}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="w-name">Worker Name *</label>
              <input id="w-name" type="text" className="form-input" placeholder="Full Name" value={formName} onChange={(e) => setFormName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="w-phone">Phone Number</label>
              <input id="w-phone" type="tel" className="form-input" placeholder="10-digit number" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="w-trade">Trade / Skill Type *</label>
              <select id="w-trade" className="form-input form-select" value={formTrade} onChange={(e) => setFormTrade(e.target.value)}>
                <option value="MASON">Mason (Rajmistri)</option>
                <option value="LABOUR">General Labour (Mazdoor)</option>
                <option value="CARPENTER">Carpenter</option>
                <option value="PLUMBER">Plumber</option>
                <option value="ELECTRICIAN">Electrician</option>
                <option value="PAINTER">Painter</option>
                <option value="SUPERVISOR">Labour Supervisor</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="w-rate">Daily Wage Rate (₹) *</label>
              <input id="w-rate" type="number" className="form-input" value={formDailyRate} onChange={(e) => setFormDailyRate(Number(e.target.value))} required min={100} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="w-status">Status</label>
              <select id="w-status" className="form-input form-select" value={formStatus} onChange={(e) => setFormStatus(e.target.value as Worker['status'])}>
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="INACTIVE">Inactive</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="w-contractor">Contractor / Subcontractor</label>
              <select id="w-contractor" className="form-input form-select" value={formContractorId} onChange={(e) => setFormContractorId(e.target.value)}>
                <option value="">Direct Hire (No Contractor)</option>
                {contractors.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="w-project">Project Assignment</label>
              <select id="w-project" className="form-input form-select" value={formProjectId} onChange={(e) => setFormProjectId(e.target.value)}>
                <option value="">Select Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="w-site">Site Assignment</label>
              <select id="w-site" className="form-input form-select" value={formSiteId} onChange={(e) => setFormSiteId(e.target.value)}>
                <option value="">Select Site</option>
                {sites.filter(s => !formProjectId || s.project_id === formProjectId).map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.location})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="w-address">Home Address</label>
            <input id="w-address" type="text" className="form-input" placeholder="Complete resident address" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="w-aadhaar">Aadhaar Number (12-digit)</label>
              <input id="w-aadhaar" type="text" className="form-input" placeholder="0000 0000 0000" value={formAadhaar} onChange={(e) => setFormAadhaar(e.target.value)} maxLength={12} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="w-bank">Bank Account (IFSC / Account No)</label>
              <input id="w-bank" type="text" className="form-input" placeholder="Bank Detail String" value={formBankAccount} onChange={(e) => setFormBankAccount(e.target.value)} />
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Worker Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); resetForm(); }}
        title="Edit Worker Details"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setShowEditModal(false); resetForm(); }}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleUpdate as any}
              disabled={submitting || !formName || !formTrade || !formDailyRate}
              id="submit-edit-worker"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {formError && <div className="login-error"><span>{formError}</span></div>}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-w-name">Worker Name *</label>
              <input id="edit-w-name" type="text" className="form-input" value={formName} onChange={(e) => setFormName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-w-phone">Phone Number</label>
              <input id="edit-w-phone" type="tel" className="form-input" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-w-trade">Trade / Skill Type *</label>
              <select id="edit-w-trade" className="form-input form-select" value={formTrade} onChange={(e) => setFormTrade(e.target.value)}>
                <option value="MASON">Mason (Rajmistri)</option>
                <option value="LABOUR">General Labour (Mazdoor)</option>
                <option value="CARPENTER">Carpenter</option>
                <option value="PLUMBER">Plumber</option>
                <option value="ELECTRICIAN">Electrician</option>
                <option value="PAINTER">Painter</option>
                <option value="SUPERVISOR">Labour Supervisor</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-w-rate">Daily Wage Rate (₹) *</label>
              <input id="edit-w-rate" type="number" className="form-input" value={formDailyRate} onChange={(e) => setFormDailyRate(Number(e.target.value))} required min={100} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-w-status">Status</label>
              <select id="edit-w-status" className="form-input form-select" value={formStatus} onChange={(e) => setFormStatus(e.target.value as Worker['status'])}>
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="INACTIVE">Inactive</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-w-contractor">Contractor</label>
              <select id="edit-w-contractor" className="form-input form-select" value={formContractorId} onChange={(e) => setFormContractorId(e.target.value)}>
                <option value="">Direct Hire (No Contractor)</option>
                {contractors.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-w-project">Project Assignment</label>
              <select id="edit-w-project" className="form-input form-select" value={formProjectId} onChange={(e) => setFormProjectId(e.target.value)}>
                <option value="">Select Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-w-site">Site Assignment</label>
              <select id="edit-w-site" className="form-input form-select" value={formSiteId} onChange={(e) => setFormSiteId(e.target.value)}>
                <option value="">Select Site</option>
                {sites.filter(s => !formProjectId || s.project_id === formProjectId).map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.location})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-w-address">Home Address</label>
            <input id="edit-w-address" type="text" className="form-input" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-w-aadhaar">Aadhaar Number (12-digit)</label>
              <input id="edit-w-aadhaar" type="text" className="form-input" value={formAadhaar} onChange={(e) => setFormAadhaar(e.target.value)} maxLength={12} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-w-bank">Bank Account</label>
              <input id="edit-w-bank" type="text" className="form-input" value={formBankAccount} onChange={(e) => setFormBankAccount(e.target.value)} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
