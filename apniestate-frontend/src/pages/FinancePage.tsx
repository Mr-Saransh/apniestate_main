import React, { useState, useEffect, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, X, Truck, FileText, TrendingUp, IndianRupee, ArrowDownLeft, ArrowUpRight, Wallet, PieChart } from 'lucide-react';
import { apiClient } from '@/api/client';
import { expensesApi, type Expense } from '@/api/expenses';
import { duesApi, type DuesSummary } from '@/api/dues';
import { useProject } from '@/context/ProjectContext';
import UploadInvoiceModal from '@/components/finance/UploadInvoiceModal';

interface CashbookEntry {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  category: string;
  description?: string;
  reference?: string;
  date: string;
  recorderName?: string;
}

interface CashbookData {
  openingBalance: number;
  cashReceived: number;
  cashSpent: number;
  currentBalance: number;
  categoryBreakdown?: Record<string, number>;
  entries: CashbookEntry[];
}

interface FinanceSummary {
  total_budget: number;
  total_spent: number;
  budget_variance: number;
  cash_flow: number;
  cash_in?: number;
  cash_out?: number;
  breakdown?: {
    materials: number;
    labour: number;
    equipment: number;
    directExpenses: number;
  };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{children}</p>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-border ${className}`}>{children}</div>
  );
}

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function FinancePage() {
  const { activeProjectId } = useProject();
  const location = useLocation();
  const navigate = useNavigate();

  const [data, setData] = useState<CashbookData | null>(null);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [duesSummary, setDuesSummary] = useState<DuesSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  
  const [type, setType] = useState<'CREDIT' | 'DEBIT'>('DEBIT');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Materials');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    if (!activeProjectId) {
      setData(null);
      setSummary(null);
      setDuesSummary(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [cashRes, summaryRes, expRes, duesRes] = await Promise.all([
        apiClient.get<CashbookData>(`/cashbook?project_id=${activeProjectId}`),
        apiClient.get<FinanceSummary>(`/finance/summary?project_id=${activeProjectId}`),
        expensesApi.getExpenses(activeProjectId),
        duesApi.getDues({ project_id: activeProjectId }).catch(() => ({ data: null }))
      ]);
      if (cashRes.data) setData(cashRes.data);
      if (summaryRes.data) setSummary(summaryRes.data);
      if (expRes.data) setExpenses(expRes.data.slice(0, 5));
      if (duesRes.data?.summary) setDuesSummary(duesRes.data.summary);
    } catch (err) {
      console.error('Failed to load finance data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [activeProjectId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      setShowModal(true);
    }
  }, [location.search]);

  const handleCloseModal = () => {
    setShowModal(false);
    setType('DEBIT');
    setAmount('');
    setCategory('Materials');
    setDescription('');
    setReference('');
    setDate(new Date().toISOString().split('T')[0]);
    setFormError('');
    navigate('/finance', { replace: true });
  };

  const handleCreateEntry = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setFormError('Amount must be a positive number.');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/cashbook', {
        amount: parseFloat(amount),
        type,
        category,
        description: description || null,
        reference: reference || null,
        date
      });
      handleCloseModal();
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create entry');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-[#2648E7] border-t-transparent animate-spin" />
      </div>
    );
  }

  const currentBal = data?.currentBalance || 0;
  const budget = summary?.total_budget || 0;
  const spend = summary?.total_spent || 0;
  const available = summary?.budget_variance || 0;
  const moneyIn = data?.cashReceived ?? (summary?.cash_in || 0);
  const moneyOut = data?.cashSpent ?? (summary?.cash_out || 0);
  const netBalance = data?.currentBalance ?? (summary?.cash_flow || 0);

  // Category outflow breakdown
  const materialsCost = summary?.breakdown?.materials || 0;
  const labourCost = summary?.breakdown?.labour || 0;
  const equipmentCost = summary?.breakdown?.equipment || 0;
  const directExpensesCost = summary?.breakdown?.directExpenses || expenses.reduce((s, e) => s + e.amount, 0);
  const totalOutflow = materialsCost + labourCost + equipmentCost + directExpensesCost || (moneyOut > 0 ? moneyOut : 1);
  const categories = [
    { label: "Materials & Procurement", amount: materialsCost, color: "bg-blue-600", dotColor: "bg-blue-600" },
    { label: "Labour & Wages", amount: labourCost, color: "bg-amber-500", dotColor: "bg-amber-500" },
    { label: "Equipment & Machinery", amount: equipmentCost, color: "bg-purple-600", dotColor: "bg-purple-600" },
    { label: "Direct & Site Expenses", amount: directExpensesCost, color: "bg-emerald-600", dotColor: "bg-emerald-600" },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Hero */}
      <div className="px-4 py-6 text-white shrink-0" style={{ backgroundColor: "#2648E7" }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-end mb-1">
            <div>
              <p className="text-sm text-blue-200 font-medium mb-1">Project Budget</p>
              <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{fmt(budget)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-200 font-medium mb-1">Cash in Hand</p>
              <p className="text-xl font-bold">{fmt(currentBal)}</p>
            </div>
          </div>
          <p className="text-sm text-blue-200 mb-5">As of {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { val: fmt(spend), label: "Total Accrued Spend" },
              { val: fmt(available), label: "Remaining Budget" },
            ].map((s) => (
              <div key={s.label} className="bg-white/12 rounded-xl p-3">
                <p className="text-xl font-bold">{s.val}</p>
                <p className="text-xs text-blue-200 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-5 space-y-6">
          {/* Prominent Money In, Money Out, Net Balance */}
          <div>
            <SectionLabel>Cash Flow Overview</SectionLabel>
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700">Money In</span>
                  <div className="size-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <ArrowDownLeft size={13} />
                  </div>
                </div>
                <div>
                  <p className="text-sm sm:text-base font-bold text-emerald-800" style={{ fontFamily: "var(--font-display)" }}>
                    +{fmt(moneyIn)}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-medium">Credits / Receipts</p>
                </div>
              </div>

              <div className="bg-red-50/80 border border-red-200/80 rounded-2xl p-3.5 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-red-700">Money Out</span>
                  <div className="size-6 rounded-full bg-red-100 flex items-center justify-center text-red-700">
                    <ArrowUpRight size={13} />
                  </div>
                </div>
                <div>
                  <p className="text-sm sm:text-base font-bold text-red-800" style={{ fontFamily: "var(--font-display)" }}>
                    -{fmt(moneyOut)}
                  </p>
                  <p className="text-[10px] text-red-600 font-medium">Debits / Outflow</p>
                </div>
              </div>

              <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-3.5 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#2648E7]">Balance</span>
                  <div className="size-6 rounded-full bg-blue-100 flex items-center justify-center text-[#2648E7]">
                    <Wallet size={13} />
                  </div>
                </div>
                <div>
                  <p className={`text-sm sm:text-base font-bold ${netBalance >= 0 ? 'text-[#2648E7]' : 'text-red-600'}`} style={{ fontFamily: "var(--font-display)" }}>
                    {fmt(netBalance)}
                  </p>
                  <p className="text-[10px] text-blue-600 font-medium">Net Available</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="rounded-2xl p-4 flex justify-center items-center gap-2 font-bold text-sm text-center shadow-sm hover:shadow-md transition-shadow text-white"
              style={{ backgroundColor: "#2648E7" }}
            >
              <Plus size={20} /> Add Entry
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="rounded-2xl p-4 flex justify-center items-center gap-2 font-bold text-sm text-center shadow-sm hover:shadow-md transition-shadow bg-white border border-border hover:border-[#2648E7] text-[#2648E7]"
            >
              <FileText size={20} /> Upload Invoice
            </button>
          </div>

          {/* Outstanding Dues Banner */}
          {duesSummary && duesSummary.total_due_amount > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                  <IndianRupee size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-800 uppercase tracking-wider">Outstanding Dues</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-200/80 text-red-800">
                      {duesSummary.count_pending} pending
                    </span>
                  </div>
                  <p className="text-lg font-extrabold text-red-700">
                    ₹{duesSummary.total_due_amount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-red-600/80">
                    Settled to date: ₹{duesSummary.total_paid_amount.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/finance?tab=dues')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-95 transition-all shrink-0 bg-red-600 flex items-center gap-1"
              >
                View & Pay Dues <ArrowUpRight size={13} />
              </button>
            </div>
          )}

          {/* Where Did The Money Go? Category Outflow Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <SectionLabel>Category Outflow Breakdown</SectionLabel>
              <span className="text-[11px] font-semibold text-muted-foreground">
                Total: {fmt(totalOutflow > 1 ? totalOutflow : 0)}
              </span>
            </div>
            <Card className="p-4 space-y-3">
              {/* Multi-segment stacked bar */}
              <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden flex">
                {categories.map((cat, i) => {
                  const pct = totalOutflow > 1 ? (cat.amount / totalOutflow) * 100 : 0;
                  if (pct <= 0) return null;
                  return (
                    <div
                      key={i}
                      className={`${cat.color} transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                      title={`${cat.label}: ${pct.toFixed(1)}%`}
                    />
                  );
                })}
              </div>

              {/* Category list items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {categories.map((cat, i) => {
                  const pct = totalOutflow > 1 ? Math.round((cat.amount / totalOutflow) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/50">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`size-2 rounded-full ${cat.dotColor} shrink-0`} />
                        <span className="text-xs font-semibold text-foreground truncate">{cat.label}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-foreground">{fmt(cat.amount)}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Transactions */}
          <div>
            <SectionLabel>Recent Expenses</SectionLabel>
            <Card className="overflow-hidden">
              {expenses.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm font-semibold">No expenses found</div>
              ) : (
                expenses.map((e, i) => (
                  <div key={e.id}>
                    {i > 0 && <div className="h-px bg-border mx-4" />}
                    <div className="px-4 py-3.5 flex items-center gap-3">
                      <div className="size-9 rounded-xl flex items-center justify-center shrink-0 bg-red-50">
                        <IndianRupee size={15} className="text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{e.description || e.category}</p>
                        <p className="text-xs text-muted-foreground truncate">{new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {e.category}</p>
                      </div>
                      <p className="font-bold text-sm shrink-0 text-foreground">
                        {fmt(e.amount)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </Card>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-border shadow-xl">
            <div className="flex justify-between items-center p-5 border-b border-border">
              <h2 className="font-bold text-foreground text-lg" style={{ fontFamily: "var(--font-display)" }}>Add Transaction</h2>
              <button onClick={handleCloseModal} className="p-1.5 hover:bg-muted rounded-xl transition-colors">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>
            
            <form onSubmit={handleCreateEntry} className="p-5">
              {formError && <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">{formError}</div>}
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 cursor-pointer transition-colors ${type === 'CREDIT' ? 'border-emerald-500 bg-emerald-50' : 'border-border hover:bg-muted'}`}>
                    <input type="radio" name="entrytype" checked={type === 'CREDIT'} onChange={() => setType('CREDIT')} className="hidden" />
                    <span className="text-xs font-bold text-emerald-600">Money In</span>
                  </label>
                  <label className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 cursor-pointer transition-colors ${type === 'DEBIT' ? 'border-red-500 bg-red-50' : 'border-border hover:bg-muted'}`}>
                    <input type="radio" name="entrytype" checked={type === 'DEBIT'} onChange={() => setType('DEBIT')} className="hidden" />
                    <span className="text-xs font-bold text-red-500">Money Out</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Amount (₨)</label>
                  <input type="number" required min="1" step="0.01" className="w-full p-3 border border-border rounded-xl text-sm outline-none focus:border-[#2648E7] font-bold" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Date</label>
                    <input type="date" required className="w-full p-3 border border-border rounded-xl text-sm outline-none focus:border-[#2648E7] font-medium" value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Category</label>
                    <select required className="w-full p-3 border border-border rounded-xl text-sm outline-none focus:border-[#2648E7] font-medium bg-white" value={category} onChange={e => setCategory(e.target.value)}>
                      {type === 'DEBIT' ? (
                        <>
                          <option>Materials</option>
                          <option>Labor Wages</option>
                          <option>Fuel/Logistics</option>
                          <option>Petty Cash</option>
                          <option>Other Expense</option>
                        </>
                      ) : (
                        <>
                          <option>Client Payment</option>
                          <option>Loan/Advance</option>
                          <option>Scrap Sale</option>
                          <option>Other Income</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Description</label>
                  <input type="text" className="w-full p-3 border border-border rounded-xl text-sm outline-none focus:border-[#2648E7] font-medium" value={description} onChange={e => setDescription(e.target.value)} placeholder="What was this for?" />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2" style={{ backgroundColor: "#2648E7" }}>
                  {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <UploadInvoiceModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => { loadData(); }}
        projectId={activeProjectId}
      />
    </div>
  );
}
