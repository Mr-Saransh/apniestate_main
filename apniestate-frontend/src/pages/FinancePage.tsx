import React, { useState, useEffect, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, X, Truck, FileText, TrendingUp, IndianRupee } from 'lucide-react';
import { apiClient } from '@/api/client';
import { expensesApi, type Expense } from '@/api/expenses';
import { useProject } from '@/context/ProjectContext';

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
  entries: CashbookEntry[];
}

interface FinanceSummary {
  total_budget: number;
  total_spent: number;
  budget_variance: number;
  cash_flow: number;
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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [cashRes, summaryRes, expRes] = await Promise.all([
        apiClient.get<CashbookData>(`/cashbook?project_id=${activeProjectId}`),
        apiClient.get<FinanceSummary>(`/finance/summary?project_id=${activeProjectId}`),
        expensesApi.getExpenses(activeProjectId)
      ]);
      if (cashRes.data) setData(cashRes.data);
      if (summaryRes.data) setSummary(summaryRes.data);
      if (expRes.data) setExpenses(expRes.data.slice(0, 5));
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
          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Plus size={20} />, label: "Add Entry", style: { backgroundColor: "#2648E7" }, textClass: "text-white", onClick: () => setShowModal(true) },
              { icon: <FileText size={20} />, label: "Upload Invoice", cls: "bg-white border border-border opacity-50", textClass: "text-foreground", onClick: () => {} },
            ].map(({ icon, label, style, cls, textClass, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className={`rounded-2xl p-4 flex justify-center items-center gap-2 font-bold text-sm text-center shadow-sm hover:shadow-md transition-shadow ${cls ?? ""} ${textClass}`}
                style={style}
              >
                {icon}{label}
              </button>
            ))}
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
    </div>
  );
}
