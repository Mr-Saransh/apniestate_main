import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  subcontractorsApi,
  type SubContractorAssignment,
  type SubContractorExpense,
  type SubContractorTask,
} from '@/api/subcontractors';
import { useProject } from '@/context/ProjectContext';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  IndianRupee,
  Calendar,
  Eye,
  Copy,
  Check,
  ChevronRight,
  ArrowLeft,
  FileText,
  AlertCircle,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { toast } from 'sonner';

const WORK_TYPE_SUGGESTIONS = [
  'Painting',
  'Electrical',
  'Plumbing',
  'Flooring',
  'False Ceiling',
  'Waterproofing',
  'Masonry',
  'Interior Work',
];

function fmtINR(val: number | null | undefined): string {
  if (val === null || val === undefined) return '₹0';
  return `₹${val.toLocaleString('en-IN')}`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
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

export default function SubContractorsPage() {
  const { projects } = useProject();
  const location = useLocation();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState<SubContractorAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

  // Active detail tab
  const [activeTab, setActiveTab] = useState<'expenses' | 'tasks'>('expenses');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState<string | null>(null);
  const [billModalTitle, setBillModalTitle] = useState('');

  // Rejection modal state for expense
  const [rejectingExpenseId, setRejectingExpenseId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Credentials Share Modal after creation
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password: string;
    project: string;
    workType: string;
    budget: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Form states for Create Sub Contractor
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formWorkType, setFormWorkType] = useState('');
  const [formBudget, setFormBudget] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form states for Assign Existing Sub Contractor
  const [assignProjectId, setAssignProjectId] = useState('');
  const [assignWorkType, setAssignWorkType] = useState('');
  const [assignBudget, setAssignBudget] = useState('');

  const loadSubContractors = async () => {
    try {
      setLoading(true);
      const res = await subcontractorsApi.getAll();
      if (res.success && res.data) {
        setAssignments(res.data);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load sub contractors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubContractors();
  }, []);

  // Check URL query parameters for deep linking e.g. /sub-contractors?assignmentId=xxx
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const linkedId = params.get('assignmentId');
    if (linkedId) {
      setSelectedAssignmentId(linkedId);
    }
  }, [location.search]);

  // Selected assignment detail
  const selectedAssignment = assignments.find((a) => a.id === selectedAssignmentId) || null;

  // Filtered list
  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch =
      a.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.work_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.project?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = projectFilter === 'ALL' || a.project_id === projectFilter;
    return matchesSearch && matchesProject;
  });



  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormPassword(pwd);
  };

  const handleCreateSubContractor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim() || !formProjectId || !formWorkType.trim() || !formBudget) {
      toast.error('Please fill in all required fields');
      return;
    }

    const budgetNum = parseFloat(formBudget);
    if (isNaN(budgetNum) || budgetNum < 0) {
      toast.error('Please enter a valid allocated budget');
      return;
    }

    try {
      setSubmitting(true);
      const res = await subcontractorsApi.create({
        name: formName.trim(),
        email: formEmail.trim(),
        password: formPassword.trim(),
        project_id: formProjectId,
        work_type: formWorkType.trim(),
        allocated_budget: budgetNum,
        phone: formPhone.trim() || undefined,
      });

      if (res.success && res.data) {
        toast.success('Sub Contractor account created successfully!');
        const projName = projects.find((p) => p.id === formProjectId)?.name || 'Assigned Project';

        setCreatedCredentials({
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword.trim(),
          project: projName,
          workType: formWorkType.trim(),
          budget: budgetNum,
        });

        // Reset Form
        setFormName('');
        setFormEmail('');
        setFormPassword('');
        setFormProjectId('');
        setFormWorkType('');
        setFormBudget('');
        setFormPhone('');
        setShowAddModal(false);

        await loadSubContractors();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create sub contractor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignToProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !assignProjectId || !assignWorkType.trim() || !assignBudget) {
      toast.error('Please fill in all required fields');
      return;
    }

    const budgetNum = parseFloat(assignBudget);
    if (isNaN(budgetNum) || budgetNum < 0) {
      toast.error('Please enter a valid allocated budget');
      return;
    }

    try {
      setSubmitting(true);
      const res = await subcontractorsApi.assignToProject({
        user_id: selectedAssignment.user_id,
        project_id: assignProjectId,
        work_type: assignWorkType.trim(),
        allocated_budget: budgetNum,
      });

      if (res.success) {
        toast.success('Assigned to project successfully!');
        setAssignProjectId('');
        setAssignWorkType('');
        setAssignBudget('');
        setShowAssignModal(false);
        await loadSubContractors();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign to project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewExpense = async (expenseId: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    try {
      const res = await subcontractorsApi.reviewExpense(expenseId, {
        status,
        rejection_reason: reason,
      });
      if (res.success) {
        toast.success(`Expense ${status.toLowerCase()} successfully`);
        setRejectingExpenseId(null);
        setRejectionReason('');
        await loadSubContractors();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to review expense');
    }
  };

  const handleReviewTask = async (taskId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await subcontractorsApi.reviewTask(taskId, action);
      if (res.success) {
        toast.success(action === 'APPROVE' ? 'Task approved!' : 'Task returned for revision');
        await loadSubContractors();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to review task');
    }
  };

  const copyCredentialsText = () => {
    if (!createdCredentials) return;
    const text = `Apni Estate - Sub Contractor Login Credentials\n\nName: ${createdCredentials.name}\nProject: ${createdCredentials.project}\nWork: ${createdCredentials.workType}\nBudget: ${fmtINR(createdCredentials.budget)}\n\nLogin ID / Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\n\nLogin at: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Credentials copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-[#2648E7]/10 text-[#2648E7] flex items-center justify-center shadow-sm">
            <Briefcase size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Sub Contractors
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage specialized trade contractors, project budgets, expenses, and task approvals
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (projects.length > 0 && !formProjectId) {
              setFormProjectId(projects[0].id);
            }
            generatePassword();
            setShowAddModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2648E7] hover:bg-[#1e3bbd] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <Plus size={16} />
          <span>Add Sub Contractor</span>
        </button>
      </div>


      {/* ─── Detail View OR Main List ─── */}
      {selectedAssignment ? (
        /* DETAIL WORKSPACE */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Back button & Assignment Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedAssignmentId(null);
                navigate('/sub-contractors', { replace: true });
              }}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to all Sub Contractors</span>
            </button>

            <button
              onClick={() => {
                if (projects.length > 0) setAssignProjectId(projects[0].id);
                setAssignWorkType(selectedAssignment.work_type);
                setAssignBudget('');
                setShowAssignModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-bold text-foreground hover:bg-muted/50 transition-colors"
            >
              <Plus size={14} />
              <span>Assign to Another Project</span>
            </button>
          </div>

          {/* Sub Contractor Summary Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-border shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-black text-foreground">{selectedAssignment.user?.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#2648E7]/10 text-[#2648E7] border border-[#2648E7]/20">
                    {selectedAssignment.work_type}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span>Project: <strong className="text-foreground">{selectedAssignment.project?.name}</strong></span>
                  <span>•</span>
                  <span>Email: {selectedAssignment.user?.email}</span>
                  {selectedAssignment.user?.phone && (
                    <>
                      <span>•</span>
                      <span>Phone: {selectedAssignment.user?.phone}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Progress utilization gauge */}
              <div className="text-right sm:min-w-[180px]">
                <div className="text-xs font-bold text-muted-foreground">
                  Budget Utilization: {selectedAssignment.allocated_budget > 0 ? Math.round((selectedAssignment.used_budget / selectedAssignment.allocated_budget) * 100) : 0}%
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 mt-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, selectedAssignment.allocated_budget > 0 ? (selectedAssignment.used_budget / selectedAssignment.allocated_budget) * 100 : 0)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Budget numbers row */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Allocated Budget</span>
                <span className="text-base sm:text-lg font-black text-foreground">{fmtINR(selectedAssignment.allocated_budget)}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Used (Approved)</span>
                <span className="text-base sm:text-lg font-black text-emerald-700">{fmtINR(selectedAssignment.used_budget)}</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Remaining Budget</span>
                <span className="text-base sm:text-lg font-black text-amber-700">{fmtINR(selectedAssignment.remaining_budget)}</span>
              </div>
            </div>
          </div>

          {/* Detail Tabs */}
          <div className="flex gap-2 border-b border-border pb-2">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'expenses'
                  ? 'bg-[#2648E7] text-white shadow-sm'
                  : 'bg-white text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              Expenses & Bills ({selectedAssignment.expenses?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'tasks'
                  ? 'bg-[#2648E7] text-white shadow-sm'
                  : 'bg-white text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              Tasks & Approvals ({selectedAssignment.tasks?.length || 0})
            </button>
          </div>

          {/* TAB 1: EXPENSES */}
          {activeTab === 'expenses' && (
            <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Submitted Expenses & Bills</h3>
                  <p className="text-xs text-muted-foreground">Review reported expenditure against allocated project budget</p>
                </div>
              </div>

              {!selectedAssignment.expenses || selectedAssignment.expenses.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No expenses submitted yet by this sub contractor.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Bill Receipt</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Approval Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedAssignment.expenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground">
                            {formatDate(exp.date || exp.created_at)}
                          </td>
                          <td className="py-3.5 px-4 font-black text-foreground whitespace-nowrap">
                            {fmtINR(exp.amount)}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-foreground max-w-xs truncate">
                            {exp.description || '—'}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {exp.bill_url ? (
                              <button
                                onClick={() => {
                                  setShowBillModal(exp.bill_url!);
                                  setBillModalTitle(`Bill - ${fmtINR(exp.amount)} - ${exp.description || 'Expense'}`);
                                }}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2648E7] hover:underline"
                              >
                                <Eye size={13} />
                                <span>View Bill</span>
                              </button>
                            ) : (
                              <span className="text-muted-foreground text-xs italic">No bill</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {exp.status === 'APPROVED' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={12} /> Approved
                              </span>
                            )}
                            {exp.status === 'PENDING' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock size={12} /> Pending Approval
                              </span>
                            )}
                            {exp.status === 'REJECTED' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200" title={exp.rejection_reason || undefined}>
                                <XCircle size={12} /> Rejected
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-right">
                            {exp.status === 'PENDING' ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleReviewExpense(exp.id, 'APPROVED')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectingExpenseId(exp.id);
                                    setRejectionReason('');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TASKS */}
          {activeTab === 'tasks' && (
            <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Assigned Tasks</h3>
                  <p className="text-xs text-muted-foreground">Track task progress and approve completed deliverables</p>
                </div>
              </div>

              {!selectedAssignment.tasks || selectedAssignment.tasks.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No tasks created yet for this sub contractor.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Deadline</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Completed Date</th>
                        <th className="py-3 px-4 text-right">Approval Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedAssignment.tasks.map((task) => (
                        <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-foreground">
                            {task.description}
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                            {formatDate(task.deadline)}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {task.status === 'OPEN' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                                Open
                              </span>
                            )}
                            {task.status === 'IN_PROGRESS' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                In Progress
                              </span>
                            )}
                            {task.status === 'COMPLETED_PENDING_APPROVAL' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                <span className="size-1.5 rounded-full bg-purple-600 animate-pulse" />
                                Awaiting Approval
                              </span>
                            )}
                            {task.status === 'APPROVED' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={12} /> Approved
                              </span>
                            )}
                            {task.status === 'REJECTED' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                                <XCircle size={12} /> Returned for Revision
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                            {formatDate(task.completed_at)}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-right">
                            {task.status === 'COMPLETED_PENDING_APPROVAL' ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleReviewTask(task.id, 'APPROVE')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReviewTask(task.id, 'REJECT')}
                                  className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 transition-colors"
                                >
                                  Reject / Return
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* MAIN LIST VIEW */
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
              <input
                type="text"
                placeholder="Search by sub contractor name, trade, project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="text-muted-foreground size-4 shrink-0" />
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="bg-white border border-border rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20"
              >
                <option value="ALL">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              <div className="size-6 border-2 border-[#2648E7] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading sub contractors...
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-dashed border-border text-center">
              <Briefcase className="size-10 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="font-bold text-foreground text-sm">No Sub Contractors Found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {searchQuery || projectFilter !== 'ALL'
                  ? 'No sub contractors match your current search or filter criteria.'
                  : 'Start by adding your first specialized sub contractor for trade work like painting, electrical, or plumbing.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssignments.map((assignment) => {
                const utilPct =
                  assignment.allocated_budget > 0
                    ? Math.round((assignment.used_budget / assignment.allocated_budget) * 100)
                    : 0;
                const hasPending =
                  (assignment.pending_expense_amount || 0) > 0 ||
                  assignment.completed_awaiting_approval_count > 0;

                return (
                  <div
                    key={assignment.id}
                    onClick={() => {
                      setSelectedAssignmentId(assignment.id);
                      navigate(`/sub-contractors?assignmentId=${assignment.id}`);
                    }}
                    className="p-5 rounded-2xl bg-white border border-border hover:border-[#2648E7]/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 relative group"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-extrabold text-foreground text-base group-hover:text-[#2648E7] transition-colors">
                            {assignment.user?.name}
                          </h3>
                          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#2648E7]/10 text-[#2648E7] border border-[#2648E7]/20">
                            {assignment.work_type}
                          </span>
                        </div>

                        {hasPending && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-800 animate-pulse">
                            Needs Review
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                        <FolderOpen size={12} className="text-[#2648E7]" />
                        <span className="font-semibold text-foreground">{assignment.project?.name}</span>
                      </p>

                      {/* Budget row */}
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/60 text-center">
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Budget</p>
                          <p className="text-xs font-black text-foreground mt-0.5">{fmtINR(assignment.allocated_budget)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Used</p>
                          <p className="text-xs font-black text-emerald-600 mt-0.5">{fmtINR(assignment.used_budget)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Remaining</p>
                          <p className="text-xs font-black text-amber-600 mt-0.5">{fmtINR(assignment.remaining_budget)}</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, utilPct)}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40">
                      <span>Tasks: {assignment.approved_tasks_count} approved</span>
                      <span className="inline-flex items-center gap-1 font-bold text-[#2648E7] group-hover:translate-x-1 transition-transform">
                        Manage <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL 1: ADD SUB CONTRACTOR ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-border shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-[#2648E7]/10 text-[#2648E7] flex items-center justify-center font-bold">
                  <Briefcase size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-foreground text-base">Add Sub Contractor</h3>
                  <p className="text-xs text-muted-foreground">Create account, assign to project and allocate budget</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubContractor} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Raj Kumar"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Email / Login ID *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. raj@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">Password *</label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-[11px] font-bold text-[#2648E7] hover:underline"
                  >
                    Generate Secure
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter temporary password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Assign Project *</label>
                <select
                  required
                  value={formProjectId}
                  onChange={(e) => setFormProjectId(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7]"
                >
                  <option value="" disabled>Select project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Work Type (Trade) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Painting, Electrical, Plumbing, Flooring..."
                  value={formWorkType}
                  onChange={(e) => setFormWorkType(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7]"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {WORK_TYPE_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setFormWorkType(sug)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors ${
                        formWorkType === sug
                          ? 'bg-[#2648E7] text-white border-[#2648E7]'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Allocated Project Budget (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 250000"
                  value={formBudget}
                  onChange={(e) => setFormBudget(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#2648E7] hover:bg-[#1e3bbd] text-white text-sm font-bold shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Sub Contractor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: CREDENTIALS SHARE DIALOG ─── */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl border border-border shadow-2xl p-6 space-y-5 text-center">
            <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 size={26} />
            </div>

            <div>
              <h3 className="text-lg font-black text-foreground">Sub Contractor Created!</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Share these login details with {createdCredentials.name} so they can access their dedicated portal.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
              <div>
                <span className="text-muted-foreground font-semibold block text-[10px] uppercase">Login Email / ID</span>
                <span className="font-bold text-foreground text-sm font-mono">{createdCredentials.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold block text-[10px] uppercase">Password</span>
                <span className="font-bold text-foreground text-sm font-mono">{createdCredentials.password}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between">
                <span>Project: <strong>{createdCredentials.project}</strong></span>
                <span>Work: <strong>{createdCredentials.workType}</strong></span>
              </div>
              <div>
                <span>Allocated Budget: <strong className="text-emerald-700">{fmtINR(createdCredentials.budget)}</strong></span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyCredentialsText}
                className="flex-1 py-2.5 rounded-xl bg-[#2648E7] hover:bg-[#1e3bbd] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied Details!' : 'Copy Login Details'}</span>
              </button>
              <button
                onClick={() => setCreatedCredentials(null)}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: ASSIGN TO ANOTHER PROJECT ─── */}
      {showAssignModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-extrabold text-foreground text-base">Assign to Another Project</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-muted-foreground text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleAssignToProject} className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Assigning <strong>{selectedAssignment.user?.name}</strong> to an additional project with project-scoped budget.
              </p>

              <div>
                <label className="text-xs font-bold text-foreground">Select Project *</label>
                <select
                  required
                  value={assignProjectId}
                  onChange={(e) => setAssignProjectId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-border rounded-xl text-sm"
                >
                  <option value="" disabled>Choose Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Work Type *</label>
                <input
                  type="text"
                  required
                  value={assignWorkType}
                  onChange={(e) => setAssignWorkType(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Allocated Budget (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={assignBudget}
                  onChange={(e) => setAssignBudget(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-border rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-[#2648E7] text-white text-xs font-bold"
                >
                  {submitting ? 'Assigning...' : 'Assign Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: EXPENSE REJECTION REASON ─── */}
      {rejectingExpenseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-border shadow-2xl p-6 space-y-4">
            <h3 className="font-extrabold text-foreground text-base">Reject Expense</h3>
            <p className="text-xs text-muted-foreground">
              Please enter an optional reason for rejecting this expense. The amount will return to the subcontractor's remaining budget.
            </p>
            <textarea
              placeholder="e.g. Over budget / Incorrect bill attached"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-border rounded-xl text-xs focus:outline-none"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectingExpenseId(null)}
                className="px-3 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReviewExpense(rejectingExpenseId, 'REJECTED', rejectionReason)}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: BILL PREVIEW MODAL ─── */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#2648E7]" />
                <h3 className="font-bold text-foreground text-sm truncate max-w-md">{billModalTitle}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={showBillModal}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg border border-border text-xs font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <ExternalLink size={13} />
                  <span>Open Full</span>
                </a>
                <button
                  onClick={() => setShowBillModal(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-muted-foreground font-bold text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-900/5">
              {showBillModal.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={showBillModal}
                  className="w-full h-[65vh] rounded-xl border border-border"
                  title="PDF Bill Preview"
                />
              ) : (
                <img
                  src={showBillModal}
                  alt="Bill Receipt"
                  className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-md"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
