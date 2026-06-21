import { useState, useEffect, type FormEvent } from 'react';
import { Wallet, Plus, Loader2, Sparkles, TrendingUp, Calendar, Tag, MapPin, DollarSign } from 'lucide-react';
import { apiClient } from '@/api/client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description?: string;
  site_id?: string;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  site?: { name: string };
  user?: { name: string };
}

interface Site {
  id: string;
  name: string;
}

const CATEGORIES = ['All', 'Workforce', 'Materials', 'Equipment', 'Permits', 'Fuel', 'Others'];

export default function FinancePage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  // Form states
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Materials');
  const [description, setDescription] = useState('');
  const [siteId, setSiteId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    async function loadFinanceData() {
      try {
        const [financeRes, sitesRes] = await Promise.all([
          apiClient.get<Expense[]>('/finance'),
          apiClient.get<Site[]>('/sites')
        ]);
        if (financeRes.data) setExpenses(financeRes.data);
        if (sitesRes.data) {
          setSites(sitesRes.data);
          if (sitesRes.data.length > 0) setSiteId(sitesRes.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load finance data', err);
      } finally {
        setLoading(false);
      }
    }
    loadFinanceData();
  }, []);

  const handleCreateExpense = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount)) || !category) return;

    setSaving(true);
    try {
      const res = await apiClient.post<Expense>('/finance', {
        amount: parseFloat(amount),
        category,
        description: description || null,
        site_id: siteId || null,
        date: new Date(date).toISOString(),
        status: 'PAID'
      });

      if (res.data) {
        setExpenses(prev => [res.data!, ...prev]);
        setShowModal(false);
        // Reset form
        setAmount('');
        setCategory('Materials');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
      }
    } catch (err) {
      console.error('Failed to log expense', err);
      alert('Error logging expense.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = activeCategory === 'All'
    ? expenses
    : expenses.filter(e => e.category === activeCategory);

  const totalSpent = filtered.reduce((acc, curr) => acc + curr.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'var(--color-success)';
      case 'APPROVED': return 'var(--color-info)';
      case 'REJECTED': return 'var(--color-danger)';
      default: return 'var(--color-warning)';
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fade-in texture-grain" style={{ paddingBottom: 'var(--space-12)' }}>
      {/* Header Banner with illustration */}
      <div className="page-header-row-with-img animate-fade-in">
        <div className="page-header-text-block">
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Wallet size={24} color="var(--color-primary)" /> Financials & Expenses
          </h1>
          <p className="page-subtitle" style={{ marginTop: 0 }}>Track payments, purchase costs, and bills</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            className="btn btn-primary btn-3d btn-3d-primary animate-pop-in" 
            onClick={() => setShowModal(true)}
            id="btn-add-expense"
            style={{ minHeight: '40px', padding: '0 16px' }}
          >
            <Plus size={16} /> Log Expense
          </button>
          <div className="page-header-illust-wrap">
            <img src="/images/finance_friendly.png" alt="Finance Ledger" className="page-header-illust-img" />
          </div>
        </div>
      </div>

      {/* Overview Cards (Tactile 3D) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-5)', marginBottom: 'var(--space-8)' }}>
        <div className="card-3d card-3d-primary">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', opacity: 0.9 }}>Total Expenses ({activeCategory})</span>
            <TrendingUp size={20} />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 'var(--font-weight-bold)', marginTop: '8px' }}>
            ₹{totalSpent.toLocaleString('en-IN')}
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', opacity: 0.8, marginTop: '4px' }}>
            Based on current filters
          </p>
        </div>

        <div className="card-3d">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-secondary)' }}>
            <span style={{ fontSize: 'var(--font-size-sm)' }}>Active Accounts</span>
            <Wallet size={20} color="var(--color-primary)" />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 'var(--font-weight-bold)', marginTop: '8px' }}>
            ₹{expenses.length} transactions
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Total logged logs
          </p>
        </div>
      </div>

      {/* Category filters */}
      <div className="filter-bar" style={{ marginBottom: 'var(--space-6)' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`filter-chip ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Expenses Ledger */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Wallet size={40} />}
          title="No expenses recorded"
          description="Log procurement invoices, supervisor payouts, or rental costs."
        />
      ) : (
        <div className="card-3d" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="hide-scrollbar" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-warm)', borderBottom: '1px solid var(--color-border)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                  <th style={{ padding: 'var(--space-4) var(--space-5)' }}>Date</th>
                  <th style={{ padding: 'var(--space-4) var(--space-5)' }}>Category</th>
                  <th style={{ padding: 'var(--space-4) var(--space-5)' }}>Site</th>
                  <th style={{ padding: 'var(--space-4) var(--space-5)' }}>Description</th>
                  <th style={{ padding: 'var(--space-4) var(--space-5)' }}>Status</th>
                  <th style={{ padding: 'var(--space-4) var(--space-5)', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(exp => (
                  <tr key={exp.id} style={{ borderBottom: '1px solid var(--color-border-light)', fontSize: 'var(--font-size-sm)', transition: 'background 150ms' }}>
                    <td style={{ padding: 'var(--space-4) var(--space-5)', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} className="text-muted" />
                        <span>{new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--font-weight-medium)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Tag size={14} color="var(--color-primary-light)" />
                        <span>{exp.category}</span>
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} className="text-muted" />
                        <span>{exp.site?.name || 'Central Headquarter'}</span>
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>
                      {exp.description || 'N/A'}
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: getStatusColor(exp.status) }}>
                        {exp.status}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)', textAlign: 'right', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3D Glassmorphic Modal */}
      {showModal && (
        <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="panel-glass card-3d animate-pop-in" style={{ width: '90%', maxWidth: '460px', padding: 'var(--space-6)', background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)' }}>
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="var(--color-cta)" /> Record Project Expense
            </h2>
            <form onSubmit={handleCreateExpense} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              
              <div className="form-group">
                <label className="form-label">Expense Amount (INR)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <DollarSign size={18} style={{ position: 'absolute', left: '12px', color: 'var(--color-text-secondary)' }} />
                  <input
                    type="number"
                    step="0.01"
                    className="form-input premium-input"
                    style={{ paddingLeft: '32px' }}
                    placeholder="Enter amount"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-input premium-input"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    <option value="Materials">Materials</option>
                    <option value="Workforce">Workforce</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Permits">Permits</option>
                    <option value="Fuel">Fuel</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Expense Date</label>
                  <input
                    type="date"
                    className="form-input premium-input"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Associated Site Location</label>
                <select
                  className="form-input premium-input"
                  value={siteId}
                  onChange={e => setSiteId(e.target.value)}
                >
                  <option value="">Central Office / Corporate</option>
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Memo / Description</label>
                <textarea
                  className="form-input premium-input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  placeholder="e.g. Paid concrete supplier invoice #204"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-3d btn-3d-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-3d btn-3d-primary"
                  disabled={saving}
                >
                  {saving ? <Loader2 size={16} className="spinner" /> : 'Log Expense'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
