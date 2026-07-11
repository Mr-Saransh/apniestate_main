import React, { useState, useEffect, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { apiClient } from '@/api/client';
import { PH, Card, Chip, SrchBar } from '@/components/shared/FigmaComponents';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
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

export default function FinancePage() {
  const { activeProjectId } = useProject();
  const location = useLocation();
  const navigate = useNavigate();

  const [data, setData] = useState<CashbookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');

  // Form states
  const [type, setType] = useState<'CREDIT' | 'DEBIT'>('DEBIT');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Materials');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const loadCashbook = async () => {
    if (!activeProjectId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get<CashbookData>(`/cashbook?project_id=${activeProjectId}`);
      if (res.data) setData(res.data);
    } catch (err) {
      console.error('Failed to load cashbook data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCashbook();
  }, [activeProjectId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      setShowModal(true);
    }
  }, [location.search]);

  const resetForm = () => {
    setType('DEBIT');
    setAmount('');
    setCategory('Materials');
    setDescription('');
    setReference('');
    setDate(new Date().toISOString().split('T')[0]);
    setFormError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
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
      loadCashbook();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create entry');
    } finally {
      setSaving(false);
    }
  };

  const entries = data?.entries || [];
  const filtered = entries.filter(e => 
    !search || 
    e.description?.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  const cashFlow = [
    { day: "23 Jun", balance: 180000 }, { day: "24 Jun", balance: 165000 },
    { day: "25 Jun", balance: 220000 }, { day: "26 Jun", balance: 195000 },
    { day: "27 Jun", balance: 175000 }, { day: "28 Jun", balance: 210000 },
    { day: "29 Jun", balance: 240000 }, { day: "30 Jun", balance: 190000 },
    { day: "1 Jul", balance: 340000 }, { day: "2 Jul", balance: 310000 },
    { day: "3 Jul", balance: 295000 }, { day: "4 Jul", balance: 265000 },
    { day: "5 Jul", balance: 255000 }, { day: "6 Jul", balance: data?.currentBalance || 245000 },
  ];

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const currentBal = data?.currentBalance || 0;
  const inflow = data?.cashReceived || 0;
  const outflow = data?.cashSpent || 0;

  const formatBal = (val: number) => {
    const isNeg = val < 0;
    const absVal = Math.abs(val);
    let str = `₨${absVal}`;
    if (absVal >= 100000) str = `₨${(absVal / 100000).toFixed(2)}L`;
    else if (absVal >= 1000) str = `₨${(absVal / 1000).toFixed(1)}K`;
    return isNeg ? `-${str}` : str;
  };

  const profitability = inflow - outflow;
  const profitMargin = inflow > 0 ? (profitability / inflow) * 100 : 0;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex justify-between items-start">
        <PH title="Cashbook" sub="Petty cash & daily transactions" />
        <button 
          onClick={() => setShowModal(true)}
          className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} /> New Entry
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-2">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 shadow-sm text-center">
          <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1">Money In</p>
          <p className="text-lg font-bold text-emerald-600">{formatBal(inflow)}</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 shadow-sm text-center">
          <p className="text-[10px] font-bold text-red-800 uppercase tracking-wider mb-1">Money Out</p>
          <p className="text-lg font-bold text-red-600">{formatBal(outflow)}</p>
        </div>
      </div>
      <div className="rounded-xl p-3 border border-border bg-white mb-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Total Profitability</p>
          <div className="flex items-baseline gap-2">
            <p className="text-lg font-bold text-foreground">{formatBal(profitability)}</p>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${profitMargin >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {profitMargin >= 0 ? '+' : ''}{profitMargin.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Net Balance</p>
          <p className="text-sm font-bold text-foreground">{formatBal(currentBal)}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1" onChange={(e: any) => setSearch(e.target.value)}>
          <SrchBar placeholder="Search entries..." />
        </div>
      </div>

      <Card noPad>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No transactions found</div>
        ) : (
          <div className="flex flex-col">
            {filtered.map((e, i) => (
              <div key={e.id} className={`flex items-center justify-between p-4 ${i < filtered.length - 1 ? "border-b border-border" : ""}`}>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-bold text-foreground">{e.description || e.category}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(e.date).toLocaleDateString()} • {e.category}
                  </p>
                </div>
                <div className={`text-sm font-bold ${e.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {e.type === 'CREDIT' ? '+' : '-'}{formatBal(e.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-xl border border-border shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="font-bold text-foreground">Add Entry</h2>
              <button onClick={handleCloseModal} className="p-1 hover:bg-muted rounded-md transition-colors"><X size={18} className="text-muted-foreground" /></button>
            </div>
            
            <form onSubmit={handleCreateEntry} className="p-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs">{formError}</div>}
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-2 rounded border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                    <input type="radio" name="entrytype" checked={type === 'CREDIT'} onChange={() => setType('CREDIT')} className="text-primary" />
                    <span className="text-xs font-bold text-emerald-600">Money In (Credit)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                    <input type="radio" name="entrytype" checked={type === 'DEBIT'} onChange={() => setType('DEBIT')} className="text-primary" />
                    <span className="text-xs font-bold text-red-500">Money Out (Debit)</span>
                  </label>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Amount (₨) *</label>
                  <input type="number" required min="1" step="0.01" className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary font-medium" value={amount || ''} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date *</label>
                    <input type="date" required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Category *</label>
                    <select required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={category} onChange={e => setCategory(e.target.value)}>
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
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                  <input type="text" className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={description} onChange={e => setDescription(e.target.value)} placeholder="What was this for?" />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
                  {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
