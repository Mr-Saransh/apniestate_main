import { useState, useEffect, type FormEvent } from 'react';
import { leavesApi, type Leave } from '@/api/leaves';
import { workersApi, type Worker } from '@/api/workers';
import Modal from '@/components/shared/Modal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { Plus, Search, Calendar, FileText, CheckCircle, XCircle } from 'lucide-react';

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formWorkerId, setFormWorkerId] = useState('');
  const [formType, setFormType] = useState<Leave['type']>('CASUAL');
  const [formFromDate, setFormFromDate] = useState('');
  const [formToDate, setFormToDate] = useState('');
  const [formReason, setFormReason] = useState('');

  const fetchData = async () => {
    try {
      const [leavesRes, workersRes] = await Promise.all([
        leavesApi.getLeaves(),
        workersApi.getWorkers()
      ]);
      if (leavesRes.data) setLeaves(leavesRes.data);
      if (workersRes.data) setWorkers(workersRes.data);
    } catch (err) {
      console.error('Failed to fetch leaves page data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const data = {
        worker_id: formWorkerId,
        type: formType,
        from_date: new Date(formFromDate).toISOString(),
        to_date: new Date(formToDate).toISOString(),
        reason: formReason || null,
        status: 'PENDING' as const
      };

      await leavesApi.createLeave(data);
      setShowApplyModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit leave application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string, approved: boolean) => {
    try {
      await leavesApi.approveLeave(id, approved);
      fetchData();
    } catch (err) {
      console.error('Failed to change leave status', err);
    }
  };

  const resetForm = () => {
    setFormWorkerId('');
    setFormType('CASUAL');
    setFormFromDate('');
    setFormToDate('');
    setFormReason('');
    setFormError('');
  };

  const filtered = leaves.filter(l => 
    l.worker?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const pendingLeaves = leaves.filter(l => l.status === 'PENDING').length;
  const approvedLeaves = leaves.filter(l => l.status === 'APPROVED').length;
  const rejectedLeaves = leaves.filter(l => l.status === 'REJECTED').length;

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">Track worker leaves, manage absence records, and authorize leave applications</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowApplyModal(true); }} id="apply-leave-btn">
          <Plus size={18} />
          Apply Leave
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard
          icon={<Calendar size={20} />}
          label="Pending Applications"
          value={pendingLeaves}
          color="#F59E0B"
          bgColor="rgba(245, 158, 11, 0.1)"
        />
        <StatCard
          icon={<CheckCircle size={20} />}
          label="Approved Leaves"
          value={approvedLeaves}
          color="#10B981"
          bgColor="rgba(16, 185, 129, 0.1)"
        />
        <StatCard
          icon={<XCircle size={20} />}
          label="Rejected / Cancelled"
          value={rejectedLeaves}
          color="#EF4444"
          bgColor="rgba(239, 68, 68, 0.1)"
        />
      </div>

      {/* Search Input */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', maxWidth: '400px' }}>
        <div className="card-body" style={{ padding: 'var(--space-3)' }}>
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search by worker name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="search-leaves"
            />
          </div>
        </div>
      </div>

      {/* Leaves Listing */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Calendar size={36} />}
          title="No leave records"
          description="Submit leave requests to track scheduled absences and auto-reconcile with attendance registers"
          action={
            <button className="btn btn-primary" onClick={() => setShowApplyModal(true)}>
              <Plus size={18} /> Apply Leave
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
                    <th>Worker</th>
                    <th>Leave Type</th>
                    <th>Duration</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Authorized By</th>
                    <th style={{ width: 180, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(leave => (
                    <tr key={leave.id} className="hover-row">
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div className="avatar avatar-sm" style={{ background: '#FEF3C7', color: '#D97706', fontWeight: 'bold' }}>
                            {leave.worker?.name.slice(0, 2).toUpperCase() || 'W'}
                          </div>
                          <div>
                            <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{leave.worker?.name || 'Unknown Worker'}</span>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{leave.worker?.trade || 'Labour'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: '#EEF2FF', color: '#4F46E5', fontWeight: '500' }}>
                          {leave.type}
                        </span>
                      </td>
                      <td style={{ fontSize: 'var(--font-size-sm)' }}>
                        <div style={{ fontWeight: '500' }}>
                          {new Date(leave.from_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(leave.to_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                          {Math.ceil((new Date(leave.to_date).getTime() - new Date(leave.from_date).getTime()) / (1000 * 3600 * 24)) + 1} days
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={leave.reason || ''}>
                        {leave.reason || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No reason given</span>}
                      </td>
                      <td>
                        <StatusBadge status={leave.status} />
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                        {leave.approver?.name || '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {leave.status === 'PENDING' ? (
                          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-sm"
                              style={{ background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }}
                              onClick={() => handleApprove(leave.id, true)}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-sm btn-ghost"
                              style={{ color: '#EF4444' }}
                              onClick={() => handleApprove(leave.id, false)}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => { setShowApplyModal(false); resetForm(); }}
        title="Apply Leave Request"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setShowApplyModal(false); resetForm(); }}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleApply as any}
              disabled={submitting || !formWorkerId || !formFromDate || !formToDate}
              id="submit-apply-leave"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </>
        }
      >
        <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {formError && <div className="login-error"><span>{formError}</span></div>}

          <div className="form-group">
            <label className="form-label" htmlFor="l-worker">Select Worker *</label>
            <select id="l-worker" className="form-input form-select" value={formWorkerId} onChange={(e) => setFormWorkerId(e.target.value)} required>
              <option value="">Select a worker...</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.trade})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="l-type">Leave Category *</label>
            <select id="l-type" className="form-input form-select" value={formType} onChange={(e) => setFormType(e.target.value as Leave['type'])}>
              <option value="CASUAL">Casual Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="EARNED">Earned Leave</option>
              <option value="UNPAID">Loss of Pay (Unpaid)</option>
              <option value="EMERGENCY">Emergency Leave</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="l-from">Start Date *</label>
              <input id="l-from" type="date" className="form-input" value={formFromDate} onChange={(e) => setFormFromDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="l-to">End Date *</label>
              <input id="l-to" type="date" className="form-input" value={formToDate} onChange={(e) => setFormToDate(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="l-reason">Reason for Absence</label>
            <textarea
              id="l-reason"
              className="form-input"
              placeholder="Provide a valid explanation..."
              rows={3}
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
