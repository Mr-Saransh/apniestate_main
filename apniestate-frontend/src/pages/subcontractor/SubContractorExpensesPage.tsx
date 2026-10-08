import React, { useState, useEffect, useCallback } from 'react';
import {
  subcontractorsApi,
  type SubContractorAssignment,
  type SubContractorExpense,
} from '@/api/subcontractors';
import { apiClient } from '@/api/client';
import {
  Receipt,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Upload,
  AlertCircle,
  FileText,
  ExternalLink,
  Camera,
  IndianRupee,
  Calendar,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

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

export default function SubContractorExpensesPage() {
  const [assignments, setAssignments] = useState<SubContractorAssignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<SubContractorExpense[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [billFile, setBillFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Bill Preview Modal
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  const loadExpensesForAssignment = useCallback(async (assignmentId: string) => {
    try {
      const expRes = await subcontractorsApi.getExpenses(assignmentId);
      if (expRes.success && expRes.data) {
        setExpenses(expRes.data);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load expenses');
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await subcontractorsApi.getMyAssignments();
      if (res.success && res.data && res.data.length > 0) {
        setAssignments(res.data);
        const activeId = selectedAssignmentId || res.data[0].id;
        setSelectedAssignmentId(activeId);
        await loadExpensesForAssignment(activeId);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load project expenses');
    } finally {
      setLoading(false);
    }
  }, [selectedAssignmentId, loadExpensesForAssignment]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeAssignment = assignments.find((a) => a.id === selectedAssignmentId) || assignments[0] || null;

  const handleAssignmentChange = async (newId: string) => {
    setSelectedAssignmentId(newId);
    await loadExpensesForAssignment(newId);
  };

  const remainingBudget = activeAssignment?.remaining_budget ?? 0;

  // Real-time validation
  const handleAmountChange = (val: string) => {
    setAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > remainingBudget) {
      setValidationError(`Expense exceeds your remaining allocated budget of ₹${remainingBudget.toLocaleString('en-IN')}.`);
    } else {
      setValidationError(null);
    }
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignment) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid expense amount');
      return;
    }

    if (numAmount > remainingBudget) {
      setValidationError(`Expense exceeds your remaining allocated budget of ₹${remainingBudget.toLocaleString('en-IN')}.`);
      toast.error(`Expense exceeds your remaining allocated budget of ₹${remainingBudget.toLocaleString('en-IN')}.`);
      return;
    }

    if (!description.trim()) {
      toast.error('Please provide a description of the expense');
      return;
    }

    try {
      setSubmitting(true);
      let billUrl: string | null = null;

      // Upload bill if attached
      if (billFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', billFile);
        const uploadRes = await apiClient.upload<any>('/documents/upload', formData);
        if (uploadRes.data?.file_url) {
          billUrl = uploadRes.data.file_url;
        }
        setUploading(false);
      }

      const res = await subcontractorsApi.submitExpense({
        assignment_id: activeAssignment.id,
        amount: numAmount,
        description: description.trim(),
        bill_url: billUrl,
      });

      if (res.success) {
        toast.success('Expense submitted successfully and pending approval!');
        setShowSubmitModal(false);
        setAmount('');
        setDescription('');
        setBillFile(null);
        setValidationError(null);

        // Reload data to refresh remaining budget calculation
        await loadData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit expense');
    } finally {
      setSubmitting(false);
      setUploading(false);
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            My Expenses & Bills
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Report project expenditures and upload bill receipts for Builder approval
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
              setValidationError(null);
              setShowSubmitModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#2648E7] hover:bg-[#1e3bbd] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Plus size={16} />
            <span>Submit Expense</span>
          </button>
        </div>
      </div>

      {/* ─── Live Budget Summary Card ─── */}
      <div className="p-5 rounded-2xl bg-white border border-border shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Project & Work</span>
            <p className="text-base font-black text-foreground">{activeAssignment.project?.name} — <span className="text-[#2648E7]">{activeAssignment.work_type}</span></p>
          </div>
          <span className="text-xs text-muted-foreground font-medium">Date: Today, {formatDate(new Date().toISOString())}</span>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-4 text-center sm:text-left">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Allocated Budget</span>
            <span className="text-base sm:text-lg font-black text-foreground">{fmtINR(activeAssignment.allocated_budget)}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">Amount Used (Approved)</span>
            <span className="text-base sm:text-lg font-black text-emerald-700">{fmtINR(activeAssignment.used_budget)}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100">
            <span className="text-[10px] font-bold text-amber-800 uppercase block">Remaining Budget</span>
            <span className="text-base sm:text-lg font-black text-amber-700">{fmtINR(activeAssignment.remaining_budget)}</span>
          </div>
        </div>
      </div>

      {/* ─── Expense Table / List ─── */}
      <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-sm text-foreground">Submitted Expenses ({expenses.length})</h3>
        </div>

        {expenses.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            <Receipt className="size-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="font-bold text-foreground">No expenses recorded yet</p>
            <p className="text-xs text-muted-foreground mt-1">Click "Submit Expense" above to record expenditure with a bill receipt.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Bill Receipt</th>
                  <th className="py-3 px-4">Approval Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground">
                      {formatDate(exp.date || exp.created_at)}
                    </td>
                    <td className="py-3.5 px-4 font-black text-foreground whitespace-nowrap">
                      {fmtINR(exp.amount)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-foreground max-w-sm">
                      {exp.description || '—'}
                      {exp.status === 'REJECTED' && exp.rejection_reason && (
                        <p className="text-[11px] text-red-600 mt-0.5">Note: {exp.rejection_reason}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {exp.bill_url ? (
                        <button
                          onClick={() => {
                            setPreviewUrl(exp.bill_url!);
                            setPreviewTitle(`Bill - ${fmtINR(exp.amount)} - ${exp.description || ''}`);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2648E7] hover:underline"
                        >
                          <Eye size={13} />
                          <span>View Bill</span>
                        </button>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">No file attached</span>
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
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                          <XCircle size={12} /> Rejected
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODAL: SUBMIT EXPENSE ─── */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-border shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-[#2648E7]/10 text-[#2648E7] flex items-center justify-center font-bold">
                  <Receipt size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-foreground text-base">Submit Expense</h3>
                  <p className="text-xs text-muted-foreground">Report expenditure against {activeAssignment.work_type}</p>
                </div>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Remaining budget indicator */}
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between text-xs">
              <span className="text-amber-800 font-semibold">Available Remaining Budget:</span>
              <strong className="text-amber-900 font-black text-sm">{fmtINR(remainingBudget)}</strong>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground">Amount Used (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="e.g. 25000"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className={`w-full mt-1 px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-black focus:outline-none focus:ring-2 ${
                    validationError
                      ? 'border-red-500 focus:ring-red-200 text-red-700'
                      : 'border-border focus:ring-[#2648E7]/20 focus:border-[#2648E7]'
                  }`}
                />
                {validationError && (
                  <p className="text-xs font-bold text-red-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle size={13} />
                    {validationError}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Description *</label>
                <textarea
                  required
                  placeholder="e.g. Purchased 20L primer and paint rollers for Block A exterior"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Bill / Receipt (Image or PDF)</label>
                <div className="mt-1 flex items-center gap-3">
                  <label className="flex-1 border-2 border-dashed border-border hover:border-[#2648E7] rounded-xl p-3.5 text-center cursor-pointer transition-colors bg-slate-50/50">
                    <Upload size={18} className="mx-auto text-muted-foreground mb-1" />
                    <span className="text-xs font-bold text-foreground block">
                      {billFile ? billFile.name : 'Choose File or Camera Photo'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">PNG, JPG, or PDF supported</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setBillFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {billFile && (
                    <button
                      type="button"
                      onClick={() => setBillFile(null)}
                      className="text-xs font-bold text-red-600 hover:underline p-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground pt-1">
                * Date is automatically set to today. Expense will be submitted as <strong>Pending Approval</strong>.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading || Boolean(validationError)}
                  className="px-5 py-2.5 rounded-xl bg-[#2648E7] hover:bg-[#1e3bbd] text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {uploading ? 'Uploading Bill...' : submitting ? 'Submitting...' : 'Submit Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: BILL PREVIEW ─── */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#2648E7]" />
                <h3 className="font-bold text-foreground text-sm truncate max-w-md">{previewTitle}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg border border-border text-xs font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <ExternalLink size={13} />
                  <span>Open Full</span>
                </a>
                <button
                  onClick={() => setPreviewUrl(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-muted-foreground font-bold text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-900/5">
              {previewUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[65vh] rounded-xl border border-border"
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Bill"
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
