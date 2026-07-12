import React, { useState, useEffect } from 'react';
import { Receipt, Calendar, CreditCard, Plus, X } from 'lucide-react';
import { PH, Card, Chip, SrchBar } from '@/components/shared/FigmaComponents';
import { expensesApi, type Expense } from '@/api/expenses';
import { useProject } from '@/context/ProjectContext';

export default function ExpensesPage() {
  const { activeProjectId } = useProject();
  const [search, setSearch] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Materials');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeProjectId) {
      fetchExpenses();
    }
  }, [activeProjectId]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await expensesApi.getExpenses(activeProjectId!);
      setExpenses(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = expenses.filter(e => 
    e.description?.toLowerCase().includes(search.toLowerCase()) || 
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  const formatMoney = (val: number) => `₨ ${val.toLocaleString()}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectId) return;
    try {
      setSubmitting(true);
      await expensesApi.createExpense({
        amount: Number(amount),
        category,
        description,
        date,
        project_id: activeProjectId
      });
      setShowModal(false);
      fetchExpenses();
      
      // Reset form
      setAmount('');
      setDescription('');
    } catch (err) {
      console.error(err);
      alert('Failed to log expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <PH title="Expenses" sub="Track operational costs and reimbursements" />
      
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1" onChange={(e: any) => setSearch(e.target.value)}>
          <SrchBar placeholder="Search expenses..." />
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} /> Log Expense
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-border">
          <Receipt className="mx-auto text-muted-foreground opacity-50 mb-3" size={32} />
          <h3 className="font-bold text-foreground">No expenses found</h3>
          <p className="text-xs text-muted-foreground mt-1">Start tracking your petty cash and reimbursements</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(e => (
            <Card key={e.id} noPad>
              <div className="p-4 flex flex-col h-full gap-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-foreground leading-snug">{e.description || 'General Expense'}</h3>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{e.category}</p>
                  </div>
                  <Chip color={e.status === 'APPROVED' ? 'green' : e.status === 'REJECTED' ? 'red' : 'yellow'}>
                    {e.status}
                  </Chip>
                </div>
                
                <div className="text-lg font-black text-foreground">
                  {formatMoney(e.amount)}
                </div>
                
                <div className="mt-auto pt-3 border-t border-border flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                  <div className="flex items-center gap-1"><Calendar size={12} /> {new Date(e.date).toLocaleDateString()}</div>
                  <div className="flex-1" />
                  <div className="flex items-center gap-1"><CreditCard size={12} /> Cash</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Log Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-foreground">Log Expense</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-black/5 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Amount (₨)</label>
                <input required type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-white border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold" placeholder="0" />
              </div>
              
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-white border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                  <option>Materials</option>
                  <option>Fuel</option>
                  <option>Meals</option>
                  <option>Tools</option>
                  <option>Maintenance</option>
                  <option>Travel</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Description</label>
                <input required type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-white border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="e.g. Site Office Fuel" />
              </div>
              
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Date</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-white border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold" />
              </div>

              <button type="submit" disabled={submitting} className="w-full py-3 mt-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-70">
                {submitting ? 'Saving...' : 'Save Expense'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
