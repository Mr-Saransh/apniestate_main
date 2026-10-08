import React, { useState, useEffect } from 'react';
import {
  subcontractorsApi,
  type SubContractorAssignment,
  type SubContractorTask,
  type TaskStatus,
} from '@/api/subcontractors';
import {
  ListTodo,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Pencil,
  Sparkles,
  Play,
  RotateCcw,
  Check,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'No deadline';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function SubContractorTasksPage() {
  const [assignments, setAssignments] = useState<SubContractorAssignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<SubContractorTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<SubContractorTask | null>(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await subcontractorsApi.getMyAssignments();
      if (res.success && res.data && res.data.length > 0) {
        setAssignments(res.data);
        const activeId = selectedAssignmentId || res.data[0].id;
        setSelectedAssignmentId(activeId);
        await loadTasksForAssignment(activeId);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadTasksForAssignment = async (assignmentId: string) => {
    try {
      const taskRes = await subcontractorsApi.getTasks(assignmentId);
      if (taskRes.success && taskRes.data) {
        setTasks(taskRes.data);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load task list');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeAssignment = assignments.find((a) => a.id === selectedAssignmentId) || assignments[0] || null;

  const handleAssignmentChange = async (newId: string) => {
    setSelectedAssignmentId(newId);
    await loadTasksForAssignment(newId);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignment || !taskDescription.trim()) {
      toast.error('Task description is required');
      return;
    }

    try {
      setSubmitting(true);
      if (editingTask) {
        const res = await subcontractorsApi.updateTask(editingTask.id, {
          description: taskDescription.trim(),
          deadline: taskDeadline || null,
        });
        if (res.success) {
          toast.success('Task updated successfully');
        }
      } else {
        const res = await subcontractorsApi.createTask({
          assignment_id: activeAssignment.id,
          description: taskDescription.trim(),
          deadline: taskDeadline || null,
        });
        if (res.success) {
          toast.success('Task created successfully');
        }
      }

      setShowModal(false);
      setEditingTask(null);
      setTaskDescription('');
      setTaskDeadline('');
      await loadTasksForAssignment(activeAssignment.id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusTransition = async (task: SubContractorTask, newStatus: 'IN_PROGRESS' | 'COMPLETED_PENDING_APPROVAL') => {
    try {
      const res = await subcontractorsApi.updateTask(task.id, { status: newStatus });
      if (res.success) {
        if (newStatus === 'COMPLETED_PENDING_APPROVAL') {
          toast.success('Task submitted for Builder approval!');
        } else {
          toast.success('Task status updated to In Progress');
        }
        await loadTasksForAssignment(activeAssignment!.id);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update task status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="size-8 border-3 border-[#2648E7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!activeAssignment) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <h2 className="text-lg font-bold text-foreground">No Project Assigned</h2>
        <p className="text-xs text-muted-foreground">You do not have any active project assignment.</p>
      </div>
    );
  }

  const openTasks = tasks.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
  const awaitingApproval = tasks.filter((t) => t.status === 'COMPLETED_PENDING_APPROVAL');
  const approvedTasks = tasks.filter((t) => t.status === 'APPROVED');
  const returnedTasks = tasks.filter((t) => t.status === 'REJECTED');

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            My Project Tasks
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your work items, mark completed for sign-off, and track approvals
          </p>
        </div>

        <div className="flex items-center gap-3">
          {assignments.length > 1 && (
            <select
              value={activeAssignment.id}
              onChange={(e) => handleAssignmentChange(e.target.value)}
              className="bg-white border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none"
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.project?.name} ({a.work_type})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => {
              setEditingTask(null);
              setTaskDescription('');
              setTaskDeadline('');
              setShowModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#2648E7] hover:bg-[#1e3bbd] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Plus size={16} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* ─── Returned Tasks Alert (if any) ─── */}
      {returnedTasks.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-black text-sm">
              {returnedTasks.length} Task{returnedTasks.length > 1 ? 's' : ''} Returned for Revision
            </h4>
            <p className="text-xs text-red-700 mt-0.5">
              Your Builder reviewed these tasks and requested changes. Please check the feedback and click "Resume Work" or re-submit when ready.
            </p>
          </div>
        </div>
      )}

      {/* ─── Task Counts Summary ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white rounded-xl border border-border">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Open</p>
          <p className="text-lg font-black text-foreground mt-0.5">{openTasks.length}</p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-border">
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Awaiting Sign-off</p>
          <p className="text-lg font-black text-amber-700 mt-0.5">{awaitingApproval.length}</p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-border">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Approved</p>
          <p className="text-lg font-black text-emerald-700 mt-0.5">{approvedTasks.length}</p>
        </div>
        <div className="p-3 bg-white rounded-xl border border-border">
          <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Returned</p>
          <p className="text-lg font-black text-rose-700 mt-0.5">{returnedTasks.length}</p>
        </div>
      </div>

      {/* ─── Task List ─── */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-dashed border-border text-center">
            <ListTodo className="size-10 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-bold text-foreground text-sm">No Tasks Added Yet</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Add your work milestones (e.g. "Complete exterior wall painting – Block A") and mark them complete as you finish.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-border hover:border-slate-300 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-foreground text-sm sm:text-base leading-snug">
                      {task.description}
                    </h3>

                    {/* Status Badge */}
                    {task.status === 'OPEN' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
                        Open
                      </span>
                    )}
                    {task.status === 'IN_PROGRESS' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                        In Progress
                      </span>
                    )}
                    {task.status === 'COMPLETED_PENDING_APPROVAL' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                        <span className="size-1.5 rounded-full bg-purple-600 animate-pulse" />
                        Awaiting Builder Approval
                      </span>
                    )}
                    {task.status === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={11} /> Approved
                      </span>
                    )}
                    {task.status === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-50 text-red-700 border border-red-200">
                        <XCircle size={11} /> Returned for Revision
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      Deadline: <strong className="text-foreground">{formatDate(task.deadline)}</strong>
                    </span>
                    {task.completed_at && (
                      <span>• Marked Completed: {formatDate(task.completed_at)}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                  {task.status !== 'APPROVED' && (
                    <button
                      onClick={() => {
                        setEditingTask(task);
                        setTaskDescription(task.description);
                        setTaskDeadline(task.deadline ? task.deadline.slice(0, 10) : '');
                        setShowModal(true);
                      }}
                      className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors"
                      title="Edit Task"
                    >
                      <Pencil size={15} />
                    </button>
                  )}

                  {task.status === 'OPEN' && (
                    <button
                      onClick={() => handleStatusTransition(task, 'IN_PROGRESS')}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors border border-blue-200"
                    >
                      <Play size={12} />
                      <span>Start Work</span>
                    </button>
                  )}

                  {(task.status === 'OPEN' || task.status === 'IN_PROGRESS' || task.status === 'REJECTED') && (
                    <button
                      onClick={() => handleStatusTransition(task, 'COMPLETED_PENDING_APPROVAL')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                    >
                      <Check size={13} />
                      <span>Mark Complete</span>
                    </button>
                  )}

                  {task.status === 'COMPLETED_PENDING_APPROVAL' && (
                    <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
                      Pending Builder Review
                    </span>
                  )}

                  {task.status === 'APPROVED' && (
                    <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
                      <CheckCircle2 size={14} /> Completed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── MODAL: ADD / EDIT TASK ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-extrabold text-foreground text-base">
                {editingTask ? 'Edit Task' : 'Add Task'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground">Task Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Complete exterior wall painting – Block A"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Deadline (Optional)</label>
                <input
                  type="date"
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#2648E7] hover:bg-[#1e3bbd] text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
