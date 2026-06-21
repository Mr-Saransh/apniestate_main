import { useState, useEffect } from 'react';
import {
  UserCheck,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface Worker {
  id: string;
  name: string;
  trade: string;
  status: 'present' | 'absent' | 'unmarked';
  checkIn?: string;
}

export default function AttendancePage() {
  const [date, setDate] = useState(new Date());
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiClient.get<any[]>('/attendance');
        if (res.data) {
          // Map backend data to frontend model
          setWorkers(res.data.map(w => ({
            id: w.id,
            name: w.name || 'Unknown',
            trade: w.role || 'Worker',
            status: w.status === 'PRESENT' ? 'present' : w.status === 'ABSENT' ? 'absent' : 'unmarked',
            checkIn: w.created_at ? new Date(w.created_at).toLocaleTimeString() : undefined
          })));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [date]);

  const present = workers.filter(w => w.status === 'present').length;
  const absent = workers.filter(w => w.status === 'absent').length;
  const unmarked = workers.filter(w => w.status === 'unmarked').length;

  const toggleStatus = async (id: string) => {
    const worker = workers.find(w => w.id === id);
    if (!worker) return;
    
    const nextStatus = worker.status === 'unmarked' ? 'present'
      : worker.status === 'present' ? 'absent'
      : 'unmarked';
      
    // Optimistic UI update
    setWorkers(prev => prev.map(w => w.id === id ? { ...w, status: nextStatus, checkIn: nextStatus === 'present' ? new Date().toLocaleTimeString() : undefined } : w));
    
    try {
      await apiClient.post('/attendance', { 
        worker_id: id, 
        status: nextStatus.toUpperCase() 
      });
    } catch (err) {
      console.error('Failed to update attendance', err);
    }
  };

  const changeDate = (delta: number) => {
    setDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta);
      return d;
    });
  };

  const isToday = date.toDateString() === new Date().toDateString();

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Mark daily workforce attendance</p>
        </div>
      </div>

      {/* Date Selector */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4) var(--space-5)',
        boxShadow: 'var(--shadow-card)',
        marginBottom: 'var(--space-5)',
      }}>
        <button className="btn btn-icon btn-ghost" onClick={() => changeDate(-1)} aria-label="Previous day">
          <ChevronLeft size={20} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 'var(--font-size-md)',
            fontWeight: 'var(--font-weight-semibold)',
          }}>
            {isToday ? 'Today' : date.toLocaleDateString('en-GB', { weekday: 'long' })}
          </div>
          <div style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}>
            {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <button className="btn btn-icon btn-ghost" onClick={() => changeDate(1)} aria-label="Next day">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid-3" style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{
          background: 'var(--color-success-bg)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-success)' }}>{present}</div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-success)', fontWeight: 'var(--font-weight-medium)' }}>Present</div>
        </div>
        <div style={{
          background: 'var(--color-danger-bg)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-danger)' }}>{absent}</div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-danger)', fontWeight: 'var(--font-weight-medium)' }}>Absent</div>
        </div>
        <div style={{
          background: 'var(--color-bg-warm)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-secondary)' }}>{unmarked}</div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>Unmarked</div>
        </div>
      </div>

      {/* Worker List */}
      <div className="section-title">Workers ({workers.length})</div>
      <div className="card" style={{ overflow: 'hidden' }}>
        {workers.map((worker) => (
          <div
            key={worker.id}
            className="list-card"
            onClick={() => toggleStatus(worker.id)}
            id={`worker-${worker.id}`}
            style={{ userSelect: 'none' }}
          >
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: worker.status === 'present'
                ? 'var(--color-success-bg)'
                : worker.status === 'absent'
                ? 'var(--color-danger-bg)'
                : 'var(--color-bg-warm)',
              color: worker.status === 'present'
                ? 'var(--color-success)'
                : worker.status === 'absent'
                ? 'var(--color-danger)'
                : 'var(--color-text-muted)',
              fontWeight: 600,
              fontSize: 'var(--font-size-sm)',
            }}>
              {worker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="list-card-content">
              <div className="list-card-title">{worker.name}</div>
              <div className="list-card-subtitle">{worker.trade}</div>
            </div>
            <div style={{ flexShrink: 0 }}>
              {worker.status === 'present' && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 2,
                }}>
                  <span className="badge badge-active">Present</span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    <Clock size={10} style={{ display: 'inline', marginRight: 2 }} />
                    {worker.checkIn}
                  </span>
                </div>
              )}
              {worker.status === 'absent' && (
                <span className="badge badge-cancelled">Absent</span>
              )}
              {worker.status === 'unmarked' && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                  padding: '0.25rem 0.75rem',
                  background: 'var(--color-bg-warm)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-muted)',
                }}>
                  Tap to mark
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
