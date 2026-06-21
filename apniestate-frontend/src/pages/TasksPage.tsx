import { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Circle,
} from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { tasksApi, type Task, type TaskStatus } from '@/api/tasks';

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
  const [activeFilter, setActiveFilter] = useState('All');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTasks() {
      try {
        const res = await tasksApi.getAll();
        if (res.data) {
          setTasks(res.data);
        }
      } catch (err) {
        console.error('Failed to load tasks', err);
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, []);

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

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">
            {todayCount} in progress · {pendingCount} pending
          </p>
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
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {filtered.map((task) => {
            const StatusIcon = statusConfig[task.status].icon;
            return (
              <div key={task.id} className="list-card" id={`task-${task.id}`}>
                <div style={{
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <StatusIcon size={22} color={statusConfig[task.status].color} />
                </div>
                <div className="list-card-content">
                  <div className="list-card-title">{task.title}</div>
                  <div className="list-card-subtitle">
                    {task.assignee?.name || 'Unassigned'} {task.site?.name ? `· ${task.site.name}` : ''}
                  </div>
                </div>
                <div className="list-card-meta">
                  <div style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: priorityColors[task.priority] || priorityColors.LOW,
                    marginBottom: 4,
                  }} />
                  <div className="list-card-date">
                    {task.due_date ? new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'No due date'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <button className="fab animate-pop-in" aria-label="New Task" id="fab-new-task">
        <Plus size={24} />
      </button>
    </div>
  );
}
