import { useState, useEffect, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Circle,
  Calendar,
  User,
  Trash2,
  CheckCircle,
  Hourglass,
  StopCircle
} from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Modal from '@/components/shared/Modal';
import { tasksApi, type Task, type TaskStatus } from '@/api/tasks';
import { apiClient } from '@/api/client';

const statusFilters = ['All', 'To Do', 'In Progress', 'Done', 'Blocked'];

const statusConfig: Record<TaskStatus, { icon: typeof Circle; color: string; label: string }> = {
  TODO: { icon: Circle, color: 'var(--color-text-muted)', label: 'To Do' },
  IN_PROGRESS: { icon: Clock, color: 'var(--color-primary)', label: 'In Progress' },
  DONE: { icon: CheckCircle2, color: 'var(--color-success)', label: 'Done' },
  BLOCKED: { icon: AlertCircle, color: 'var(--color-danger)', label: 'Blocked' },
};

const priorityColors: Record<string, string> = {
  HIGH: 'var(--color-danger)',
  URGENT: 'var(--color-danger)',
  MEDIUM: 'var(--color-warning)',
  LOW: 'var(--color-success)',
};

export default function TasksPage() {
  const location = useLocation();
  const [activeFilter, setActiveFilter] = useState('All');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Metadata dropdown lists
  const [projects, setProjects] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Form states
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [projectId, setProjectId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [reminderDays, setReminderDays] = useState(1);
  const [formError, setFormError] = useState('');

  const loadTasks = async () => {
    try {
      const res = await tasksApi.getAll();
      if (res.data) {
        setTasks(res.data);
      }
    } catch (err) {
      console.error('Failed to load tasks', err);
    }
  };

  const loadMetadata = async () => {
    try {
      const projRes = await apiClient.get<any[]>('/projects').catch(() => ({ data: [] }));
      const sitesRes = await apiClient.get<any[]>('/sites').catch(() => ({ data: [] }));
      const usersRes = await apiClient.get<any[]>('/users').catch(() => ({ data: [] }));
      
      setProjects(projRes.data || []);
      setSites(sitesRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error('Failed to load tasks metadata', err);
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadTasks(), loadMetadata()]);
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      setShowCreateModal(true);
    }
  }, [location]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setFormError('');
    setCreating(true);

    try {
      const payload = {
        title,
        description: desc || undefined,
        project_id: projectId || undefined,
        site_id: siteId || undefined,
        assignee_id: assigneeId || undefined,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        reminder_days: Number(reminderDays),
        status: 'TODO' as TaskStatus
      };

      await tasksApi.create(payload);
      setShowCreateModal(false);
      resetForm();
      await loadTasks();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDesc('');
    setProjectId('');
    setSiteId('');
    setAssigneeId('');
    setPriority('MEDIUM');
    setDueDate('');
    setReminderDays(1);
    setFormError('');
  };

  const toggleTaskStatus = async (id: string, currentStatus: TaskStatus) => {
    const nextStatusMap: Record<TaskStatus, TaskStatus> = {
      TODO: 'IN_PROGRESS',
      IN_PROGRESS: 'DONE',
      DONE: 'BLOCKED',
      BLOCKED: 'TODO'
    };
    const nextStatus = nextStatusMap[currentStatus];
    try {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t));
      await tasksApi.update(id, { status: nextStatus });
    } catch (err) {
      console.error('Failed to toggle status', err);
      loadTasks();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      setTasks(prev => prev.filter(t => t.id !== id));
      await tasksApi.delete(id);
    } catch (err) {
      console.error('Failed to delete task', err);
      loadTasks();
    }
  };

  const filterMap: Record<string, TaskStatus> = {
    'To Do': 'TODO',
    'In Progress': 'IN_PROGRESS',
    'Done': 'DONE',
    'Blocked': 'BLOCKED',
  };

  const filtered = activeFilter === 'All'
    ? tasks
    : tasks.filter((t) => t.status === filterMap[activeFilter]);

  const todayCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const pendingCount = tasks.filter((t) => t.status === 'TODO').length;

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  // Filter sites based on selected project
  const filteredSites = sites.filter(s => !projectId || s.project_id === projectId);

  return (
    <div className="animate-fade-in texture-grain" style={{ paddingBottom: 'var(--space-12)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Tasks Ledger</h1>
            <p className="page-subtitle">
              {todayCount} in progress · {pendingCount} pending
            </p>
          </div>
          <button className="btn btn-primary btn-3d btn-3d-primary" onClick={() => { resetForm(); setShowCreateModal(true); }} id="btn-add-task">
            <Plus size={18} /> New Task
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="filter-bar" style={{ marginBottom: 'var(--space-5)' }}>
        {statusFilters.map((filter) => (
          <button
            key={filter}
            className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Task List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={36} />}
          title="No tasks found"
          description="Adjust your filters or create a new task"
          action={
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={18} /> Create Task
            </button>
          }
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {filtered.map((task) => {
            const StatusIcon = statusConfig[task.status].icon;
            return (
              <div key={task.id} className="list-card hover-row" id={`task-${task.id}`}>
                <div 
                  style={{
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleTaskStatus(task.id, task.status)}
                  title="Click to cycle status"
                >
                  <StatusIcon size={22} color={statusConfig[task.status].color} />
                </div>
                <div className="list-card-content" style={{ cursor: 'pointer' }} onClick={() => toggleTaskStatus(task.id, task.status)}>
                  <div className="list-card-title" style={{ textDecoration: task.status === 'DONE' ? 'line-through' : 'none', color: task.status === 'DONE' ? 'var(--color-text-muted)' : 'var(--color-text)' }}>
                    {task.title}
                  </div>
                  <div className="list-card-subtitle">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <User size={12} /> {task.assignee?.name || 'Unassigned'}
                    </span>
                    {task.site?.name && (
                      <>
                        <span style={{ margin: '0 6px' }}>·</span>
                        <span>{task.site.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="list-card-meta" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: priorityColors[task.priority] || priorityColors.LOW,
                      marginBottom: 4,
                    }} title={`Priority: ${task.priority}`} />
                    <div className="list-card-date">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'No due date'}
                    </div>
                  </div>
                  <button 
                    className="btn btn-ghost btn-sm text-danger btn-icon" 
                    onClick={() => handleDelete(task.id)}
                    title="Delete Task"
                    style={{ padding: '4px' }}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* Task Creation Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        title="Create New Task"
        footer={
          <>
            <button className="btn btn-secondary btn-3d btn-3d-secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</button>
            <button 
              className="btn btn-primary btn-3d btn-3d-primary"
              onClick={handleCreate as any}
              disabled={creating || !title}
              id="submit-create-task"
            >
              {creating ? 'Saving...' : 'Save Task'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {formError && <div className="login-error"><span>{formError}</span></div>}

          <div className="form-group">
            <label className="form-label" htmlFor="task-title">Task Title *</label>
            <input 
              id="task-title"
              type="text"
              className="form-input premium-input"
              placeholder="e.g. Lay bricks on second floor"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-desc">Description</label>
            <textarea 
              id="task-desc"
              className="form-input premium-input"
              placeholder="Provide specifications, material instructions..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="task-project">Project</label>
              <select 
                id="task-project"
                className="form-input form-select"
                value={projectId}
                onChange={(e) => { setProjectId(e.target.value); setSiteId(''); }}
              >
                <option value="">Select Project...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="task-site">Site Location</label>
              <select 
                id="task-site"
                className="form-input form-select"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                disabled={!projectId}
              >
                <option value="">Select Site...</option>
                {filteredSites.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="task-assignee">Assign User</label>
              <select 
                id="task-assignee"
                className="form-input form-select"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role.replace(/_/g, ' ')})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="task-priority">Priority</label>
              <select 
                id="task-priority"
                className="form-input form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="task-due">Due Date</label>
              <input 
                id="task-due"
                type="date"
                className="form-input premium-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="task-reminder">Reminder (Days Before)</label>
              <input 
                id="task-reminder"
                type="number"
                min="0"
                className="form-input premium-input"
                value={reminderDays}
                onChange={(e) => setReminderDays(Number(e.target.value))}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
