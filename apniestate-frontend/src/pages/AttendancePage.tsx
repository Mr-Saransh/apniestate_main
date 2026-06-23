import { useState, useEffect, type FormEvent } from 'react';
import {
  UserCheck,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  ClipboardList,
  Edit3
} from 'lucide-react';
import { apiClient } from '@/api/client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Modal from '@/components/shared/Modal';

interface WorkerRecord {
  id: string;
  name: string;
  trade: string;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE' | 'LATE' | 'UNMARKED';
  check_in: string | null;
  check_out: string | null;
  overtime_hours: number;
  is_half_day: boolean;
  is_late: boolean;
  notes: string | null;
  site_id: string | null;
  site_name: string | null;
  contractor_name: string | null;
  daily_rate?: number;
}

interface Site {
  id: string;
  name: string;
  location: string;
  project_id: string;
}

export default function AttendancePage() {
  const [date, setDate] = useState(new Date());
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [workers, setWorkers] = useState<WorkerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingBulk, setSavingBulk] = useState(false);

  // Edit Single Worker Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerRecord | null>(null);
  const [editStatus, setEditStatus] = useState<WorkerRecord['status']>('PRESENT');
  const [editShift, setEditShift] = useState<'DAY' | 'NIGHT' | 'GENERAL'>('GENERAL');
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');
  const [editOT, setEditOT] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const fetchSitesAndWorkers = async () => {
    try {
      const sitesRes = await apiClient.get<Site[]>('/sites');
      if (sitesRes.data) {
        setSites(sitesRes.data);
      }

      const dateStr = date.toISOString().split('T')[0];
      const params = new URLSearchParams();
      params.append('date', dateStr);
      if (selectedSiteId) {
        params.append('site_id', selectedSiteId);
      }

      const workersRes = await apiClient.get<WorkerRecord[]>(`/attendance?${params.toString()}`);
      if (workersRes.data) {
        setWorkers(workersRes.data);
      }
    } catch (err) {
      console.error('Failed to load attendance page data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchSitesAndWorkers();
  }, [date, selectedSiteId]);

  const changeDate = (delta: number) => {
    setDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta);
      return d;
    });
  };

  const handleStatusChange = async (workerId: string, status: WorkerRecord['status']) => {
    setWorkers(prev =>
      prev.map(w =>
        w.id === workerId
          ? {
              ...w,
              status,
              check_in: ['PRESENT', 'LATE', 'HALF_DAY'].includes(status) ? new Date().toISOString() : null
            }
          : w
      )
    );

    try {
      await apiClient.post('/attendance', {
        worker_id: workerId,
        status,
        date: date.toISOString().split('T')[0],
        site_id: selectedSiteId || undefined
      });
    } catch (err) {
      console.error('Failed to mark worker attendance', err);
      fetchSitesAndWorkers();
    }
  };

  const handleBulkMark = async (status: 'PRESENT' | 'ABSENT') => {
    if (!selectedSiteId) {
      alert('Please select a specific site to bulk mark attendance.');
      return;
    }

    setSavingBulk(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const records = workers.map(w => ({
        worker_id: w.id,
        status,
        shift: 'GENERAL' as const,
        overtime_hours: 0,
        notes: null
      }));

      await apiClient.post('/attendance/bulk', {
        site_id: selectedSiteId,
        date: dateStr,
        records
      });

      fetchSitesAndWorkers();
    } catch (err) {
      console.error('Bulk attendance marking failed', err);
      alert('Bulk action failed. Try again.');
    } finally {
      setSavingBulk(false);
    }
  };

  const openEditModal = (worker: WorkerRecord) => {
    setSelectedWorker(worker);
    setEditStatus(worker.status);
    setEditCheckIn(worker.check_in ? worker.check_in.slice(11, 16) : '09:00');
    setEditCheckOut(worker.check_out ? worker.check_out.slice(11, 16) : '18:00');
    setEditOT(worker.overtime_hours || 0);
    setEditNotes(worker.notes || '');
    setEditShift('GENERAL');
    setShowEditModal(true);
  };

  const handleSaveSingleWorker = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;
    setEditSaving(true);
    setEditError('');

    try {
      const dateStr = date.toISOString().split('T')[0];
      let checkInIso = null;
      let checkOutIso = null;

      if (['PRESENT', 'LATE', 'HALF_DAY'].includes(editStatus)) {
        checkInIso = new Date(`${dateStr}T${editCheckIn}:00`).toISOString();
        if (editCheckOut) {
          checkOutIso = new Date(`${dateStr}T${editCheckOut}:00`).toISOString();
        }
      }

      await apiClient.post('/attendance', {
        worker_id: selectedWorker.id,
        status: editStatus,
        date: dateStr,
        shift: editShift,
        check_in: checkInIso,
        check_out: checkOutIso,
        overtime_hours: Number(editOT),
        notes: editNotes || null,
        site_id: selectedSiteId || undefined
      });

      setShowEditModal(false);
      fetchSitesAndWorkers();
    } catch (err: any) {
      setEditError(err.message || 'Failed to save attendance correction');
    } finally {
      setEditSaving(false);
    }
  };

  // Metrics Formulas
  const totalMarked = workers.filter(w => w.status !== 'UNMARKED').length;
  const presentCount = workers.filter(w => ['PRESENT', 'LATE', 'HALF_DAY'].includes(w.status)).length;
  const absentCount = workers.filter(w => w.status === 'ABSENT').length;
  const leaveCount = workers.filter(w => w.status === 'ON_LEAVE').length;
  const totalOTHours = workers.reduce((sum, w) => sum + (w.overtime_hours || 0), 0);
  const attendanceRate = totalMarked > 0 ? Math.round((presentCount / workers.length) * 100) : 0;
  const laborUtilization = workers.length > 0 ? Math.round((presentCount / workers.length) * 100) : 0;

  const isToday = date.toDateString() === new Date().toDateString();

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fade-in texture-grain" style={{ paddingBottom: 'var(--space-12)' }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <h1 className="page-title">Daily Attendance Logs</h1>
            <p className="page-subtitle">Record labor utilization, overtime hours, and check-in times</p>
          </div>
          {selectedSiteId && workers.length > 0 && (
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => handleBulkMark('PRESENT')} disabled={savingBulk}>
                Mark All Present
              </button>
              <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleBulkMark('ABSENT')} disabled={savingBulk} style={{ color: 'var(--color-danger)' }}>
                Mark All Absent
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Date Selector & Site Filter */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-5)'
      }}>
        {/* Date Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-3) var(--space-4)',
          boxShadow: 'var(--shadow-card)',
        }}>
          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => changeDate(-1)} aria-label="Previous day">
            <ChevronLeft size={18} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)' }}>
              {isToday ? 'Today' : date.toLocaleDateString('en-GB', { weekday: 'short' })}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => changeDate(1)} aria-label="Next day">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Site Dropdown */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-2) var(--space-4)',
          boxShadow: 'var(--shadow-card)',
        }}>
          <Filter size={16} color="var(--color-text-secondary)" />
          <select
            className="form-input form-select"
            style={{ border: 'none', background: 'transparent', padding: 'var(--space-2)', fontSize: 'var(--font-size-sm)', width: '100%' }}
            value={selectedSiteId}
            onChange={e => setSelectedSiteId(e.target.value)}
          >
            <option value="">All Company Workforce</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.name} ({site.location})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{ background: 'var(--color-success-bg)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-success)' }}>{presentCount}</div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success)', fontWeight: 'var(--font-weight-medium)' }}>Present Days</div>
        </div>
        <div style={{ background: 'var(--color-danger-bg)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-danger)' }}>{absentCount}</div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)', fontWeight: 'var(--font-weight-medium)' }}>Absent Days</div>
        </div>
        <div style={{ background: 'var(--color-info-bg)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-info)' }}>{totalOTHours} hrs</div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-info)', fontWeight: 'var(--font-weight-medium)' }}>OT Hours</div>
        </div>
        <div style={{ background: 'var(--color-primary-50)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)' }}>{laborUtilization}%</div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: 'var(--font-weight-medium)' }}>Workforce Utilization</div>
        </div>
      </div>

      {/* Workforce Table/Card Grid */}
      {workers.length === 0 ? (
        <EmptyState
          icon={<Users size={40} />}
          title="No workers assigned"
          description="Ensure you have workers active and assigned to this site in the Workers directory."
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {workers.map((worker) => (
            <div
              key={worker.id}
              className="list-card hover-row"
              style={{ padding: 'var(--space-3) var(--space-4)', alignItems: 'center' }}
            >
              <div className="list-card-content" style={{ minWidth: '150px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="list-card-title">{worker.name}</span>
                  {worker.contractor_name && (
                    <span className="badge" style={{ background: '#F3F4F6', color: '#6B7280', fontSize: '9px', padding: '1px 6px' }}>
                      {worker.contractor_name}
                    </span>
                  )}
                </div>
                <div className="list-card-subtitle" style={{ fontSize: 'var(--font-size-xs)' }}>
                  {worker.trade} · {worker.site_name || 'No assigned site'}
                </div>
              </div>

              {/* Status Action Row */}
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', flex: 1, justifyContent: 'center' }}>
                <StatusButton active={worker.status === 'PRESENT'} color="var(--color-success)" onClick={() => handleStatusChange(worker.id, 'PRESENT')}>Present</StatusButton>
                <StatusButton active={worker.status === 'LATE'} color="var(--color-warning)" onClick={() => handleStatusChange(worker.id, 'LATE')}>Late</StatusButton>
                <StatusButton active={worker.status === 'HALF_DAY'} color="#D97706" onClick={() => handleStatusChange(worker.id, 'HALF_DAY')}>Half Day</StatusButton>
                <StatusButton active={worker.status === 'ABSENT'} color="var(--color-danger)" onClick={() => handleStatusChange(worker.id, 'ABSENT')}>Absent</StatusButton>
                <StatusButton active={worker.status === 'ON_LEAVE'} color="var(--color-info)" onClick={() => handleStatusChange(worker.id, 'ON_LEAVE')}>Leave</StatusButton>
              </div>

              {/* OT and Corrections actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', minWidth: '120px', justifyContent: 'flex-end' }}>
                <div style={{ textAlign: 'right' }}>
                  {worker.overtime_hours > 0 && (
                    <div style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 'bold' }}>
                      +{worker.overtime_hours} hrs OT
                    </div>
                  )}
                  {worker.check_in && (
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                      In: {new Date(worker.check_in).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => openEditModal(worker)}
                  title="Correct Attendance or Set Overtime Details"
                >
                  <Edit3 size={15} />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Edit Worker Details Modal */}
      {selectedWorker && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={`Attendance Details: ${selectedWorker.name}`}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveSingleWorker as any} disabled={editSaving}>
                {editSaving ? 'Saving...' : 'Save Correction'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSaveSingleWorker} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {editError && <div className="login-error"><span>{editError}</span></div>}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-status">Attendance Status</label>
                <select
                  id="edit-status"
                  className="form-input form-select"
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as any)}
                >
                  <option value="PRESENT">Present (Full Day)</option>
                  <option value="ABSENT">Absent</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="LATE">Late Check In</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="UNMARKED">Unmarked (Delete Log)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-shift">Shift Type</label>
                <select
                  id="edit-shift"
                  className="form-input form-select"
                  value={editShift}
                  onChange={e => setEditShift(e.target.value as any)}
                >
                  <option value="GENERAL">General Shift</option>
                  <option value="DAY">Day Shift</option>
                  <option value="NIGHT">Night Shift</option>
                </select>
              </div>
            </div>

            {['PRESENT', 'LATE', 'HALF_DAY'].includes(editStatus) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-checkin">Check-In Time</label>
                  <input
                    id="edit-checkin"
                    type="time"
                    className="form-input"
                    value={editCheckIn}
                    onChange={e => setEditCheckIn(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-checkout">Check-Out Time</label>
                  <input
                    id="edit-checkout"
                    type="time"
                    className="form-input"
                    value={editCheckOut}
                    onChange={e => setEditCheckOut(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="edit-ot">Overtime Hours (OT)</label>
              <input
                id="edit-ot"
                type="number"
                step="0.5"
                min="0"
                max="12"
                className="form-input"
                value={editOT}
                onChange={e => setEditOT(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-notes">Verification Remarks / Notes</label>
              <input
                id="edit-notes"
                type="text"
                className="form-input"
                placeholder="Reason for late check-in or correction notes"
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
              />
            </div>

          </form>
        </Modal>
      )}

    </div>
  );
}

function StatusButton({
  active,
  color,
  onClick,
  children
}: {
  active: boolean;
  color: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="btn btn-sm"
      style={{
        padding: 'var(--space-2) var(--space-3)',
        borderRadius: 'var(--radius-md)',
        fontSize: '11px',
        fontWeight: 'bold',
        transition: 'all 0.2s',
        border: `1px solid ${color}`,
        background: active ? color : 'transparent',
        color: active ? '#fff' : color,
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
