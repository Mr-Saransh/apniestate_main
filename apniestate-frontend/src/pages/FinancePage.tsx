import { useState, useEffect, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Wallet, Plus, Calendar, Tag, MapPin, DollarSign, TrendingUp } from 'lucide-react';
import { apiClient } from '@/api/client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Modal from '@/components/shared/Modal';
import {
  PrimaryCard,
  SecondaryCard,
  StatCard,
  EmptyState,
  Badge,
  Button,
  Input,
  Select,
  TextArea
} from '@/components/design-system';
import PieChart from '@/components/charts/PieChart';

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
  const location = useLocation();
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [formError, setFormError] = useState('');

  // Form states
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Materials');
  const [description, setDescription] = useState('');
  const [siteId, setSiteId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const loadFinanceData = async () => {
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
  };

  useEffect(() => {
    loadFinanceData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      setShowModal(true);
    }
  }, [location.search]);

  const resetForm = () => {
    setAmount('');
    setCategory('Materials');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    if (sites.length > 0) setSiteId(sites[0].id);
    setFormError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
    navigate('/finance', { replace: true });
  };

  const handleCreateExpense = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setFormError('Amount must be a positive number.');
      return;
    }

    setSaving(true);
    setFormError('');
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
        handleCloseModal();
      }
    } catch (err: any) {
      console.error('Failed to log expense', err);
      setFormError(err.response?.data?.message || 'Error logging expense. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = activeCategory === 'All'
    ? expenses
    : expenses.filter(e => e.category === activeCategory);

  const totalSpent = filtered.reduce((acc, curr) => acc + curr.amount, 0);

  const getStatusVariant = (status: string): 'success' | 'primary' | 'danger' | 'warning' => {
    switch (status) {
      case 'PAID': return 'success';
      case 'APPROVED': return 'primary';
      case 'REJECTED': return 'danger';
      default: return 'warning';
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Financials & Expenses</h1>
          <p className="page-subtitle">Track payments, purchase costs, and bills across project sites.</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <StatCard
            icon={<TrendingUp size={20} />}
            label={`Total Spent (${activeCategory})`}
            value={`₹${totalSpent.toLocaleString('en-IN')}`}
            color="#0A3D91"
            bgColor="rgba(10, 61, 145, 0.08)"
          />
          <StatCard
            icon={<Wallet size={20} />}
            label="Logged Ledger Items"
            value={`${expenses.length} records`}
            color="#16A34A"
            bgColor="rgba(22, 163, 74, 0.08)"
          />
        </div>

        <PrimaryCard style={{ minHeight: '280px' }}>
          {expenses.length > 0 ? (() => {
            const catTotals = CATEGORIES.filter(c => c !== 'All').map(cat => ({
              name: cat,
              total: expenses.filter(e => e.category === cat).reduce((acc, curr) => acc + curr.amount, 0)
            })).filter(c => c.total > 0);

            return (
              <PieChart 
                title="Expense Breakdown by Category"
                labels={catTotals.map(c => c.name)}
                data={catTotals.map(c => c.total)}
              />
            );
          })() : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
              <EmptyState 
                icon={<Wallet size={24} />} 
                title="No financial data" 
                description="Your expense visualization will appear here."
              />
            </div>
          )}
        </PrimaryCard>
      </div>

      {/* Category filters */}
      <div className="filter-bar">
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
          icon={<Wallet size={36} />}
          title="No expenses logged"
          description="Log procurement invoices, supervisor payouts, or rental costs to review."
          action={<Button size="sm" onClick={() => setShowModal(true)}>Log Your First Expense</Button>}
        />
      ) : (
        <PrimaryCard style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="hide-scrollbar" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '12px', textTransform: 'uppercase', color: '#6B7280' }}>
                  <th style={{ padding: '14px 20px' }}>Date</th>
                  <th style={{ padding: '14px 20px' }}>Category</th>
                  <th style={{ padding: '14px 20px' }}>Site Location</th>
                  <th style={{ padding: '14px 20px' }}>Description</th>
                  <th style={{ padding: '14px 20px' }}>Status</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(exp => (
                  <tr key={exp.id} className="hover-row" style={{ borderBottom: '1px solid #E2E8F0', fontSize: '14px' }}>
                    <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111827' }}>
                        <Calendar size={14} style={{ color: '#6B7280' }} />
                        <span>{new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0A3D91' }}>
                        <Tag size={14} />
                        <span>{exp.category}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#374151' }}>
                        <MapPin size={14} style={{ color: '#6B7280' }} />
                        <span>{exp.site?.name || 'Central Headquarter'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#374151' }}>
                      {exp.description || 'N/A'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <Badge variant={getStatusVariant(exp.status)}>{exp.status}</Badge>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 700, color: '#111827' }}>
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PrimaryCard>
      )}


      {/* Record Expense Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title="Record Project Expense"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleCreateExpense as any} 
              disabled={saving || !amount}
              id="submit-log-expense"
            >
              {saving ? 'Saving...' : 'Log Expense'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateExpense} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && <div className="login-error"><span>{formError}</span></div>}

          <Input
            id="expense-amount"
            label="Expense Amount (INR) *"
            type="number"
            step="0.01"
            placeholder="e.g. 5000"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
            autoFocus
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Select
              id="expense-category"
              label="Category *"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="Materials">Materials</option>
              <option value="Workforce">Workforce</option>
              <option value="Equipment">Equipment</option>
              <option value="Permits">Permits</option>
              <option value="Fuel">Fuel</option>
              <option value="Others">Others</option>
            </Select>

            <Input
              id="expense-date"
              label="Expense Date *"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>

          <Select
            id="expense-site"
            label="Associated Site Location"
            value={siteId}
            onChange={e => setSiteId(e.target.value)}
          >
            <option value="">Central Office / Corporate</option>
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>

          <TextArea
            id="expense-desc"
            label="Memo / Description"
            placeholder="e.g. Paid concrete supplier invoice #204"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
          />
        </form>
      </Modal>
    </div>
  );
}
