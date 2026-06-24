import { useState, useEffect, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Wallet, Plus, Calendar, Tag, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { apiClient } from '@/api/client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Modal from '@/components/shared/Modal';
import {
  PrimaryCard,
  StatCard,
  EmptyState,
  Badge,
  Button,
  Input,
  Select,
  TextArea
} from '@/components/design-system';

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
  const location = useLocation();
  const navigate = useNavigate();

  const [data, setData] = useState<CashbookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Form states
  const [type, setType] = useState<'CREDIT' | 'DEBIT'>('DEBIT');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Materials');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const loadCashbook = async () => {
    try {
      const res = await apiClient.get<CashbookData>('/cashbook');
      if (res.data) setData(res.data);
    } catch (err) {
      console.error('Failed to load cashbook data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCashbook();
  }, []);

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
    setFormError('');
    try {
      await apiClient.post('/cashbook', {
        amount: parseFloat(amount),
        type,
        category,
        description: description || null,
        reference: reference || null,
        date: new Date(date).toISOString(),
      });

      handleCloseModal();
      loadCashbook();
    } catch (err: any) {
      console.error('Failed to log cashbook entry', err);
      setFormError(err.response?.data?.message || 'Error logging entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  const entries = data?.entries || [];

  return (
    <div className="animate-fade-in texture-grain" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: 'var(--space-12)' }}>
      
      {/* Header Banner */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Site Cashbook</h1>
          <p className="page-subtitle">Track incoming funds and all site expenses</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={18} /> Add Entry
        </Button>
      </div>

      {/* Dashboard Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)', 
          color: 'white', 
          borderRadius: 'var(--radius-lg)', 
          padding: 'var(--space-4)', 
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.9, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={16} /> Current Balance
          </div>
          <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'bold' }}>₹{data?.currentBalance.toLocaleString('en-IN') || 0}</div>
        </div>

        <StatCard
          icon={<ArrowDownRight size={20} />}
          label="Cash Received (Credit)"
          value={`₹${data?.cashReceived.toLocaleString('en-IN') || 0}`}
          color="#10B981"
          bgColor="rgba(16, 185, 129, 0.1)"
        />
        
        <StatCard
          icon={<ArrowUpRight size={20} />}
          label="Cash Spent (Debit)"
          value={`₹${data?.cashSpent.toLocaleString('en-IN') || 0}`}
          color="#EF4444"
          bgColor="rgba(239, 68, 68, 0.1)"
        />
      </div>

      {/* Ledger */}
      {entries.length === 0 ? (
        <EmptyState
          icon={<Wallet size={36} />}
          title="No cashbook entries"
          description="Log received funds or site expenses here."
          action={<Button size="sm" onClick={() => setShowModal(true)}>Add First Entry</Button>}
        />
      ) : (
        <PrimaryCard style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="hide-scrollbar" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '12px', textTransform: 'uppercase', color: '#6B7280' }}>
                  <th style={{ padding: '14px 20px' }}>Date & Ref</th>
                  <th style={{ padding: '14px 20px' }}>Details</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Credit (In)</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Debit (Out)</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>By</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(exp => (
                  <tr key={exp.id} className="hover-row" style={{ borderBottom: '1px solid #E2E8F0', fontSize: '14px' }}>
                    <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111827', fontWeight: 500 }}>
                        <Calendar size={14} style={{ color: '#6B7280' }} />
                        <span>{new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      {exp.reference && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Ref: {exp.reference}</div>}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 600, color: '#0A3D91', marginBottom: '4px' }}>
                        {exp.category}
                      </div>
                      <div style={{ color: '#4B5563', fontSize: '12px' }}>
                        {exp.description || 'No description'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 600, color: '#10B981' }}>
                      {exp.type === 'CREDIT' ? `₹${exp.amount.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 600, color: '#EF4444' }}>
                      {exp.type === 'DEBIT' ? `₹${exp.amount.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', color: '#6B7280', fontSize: '12px' }}>
                      {exp.recorderName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PrimaryCard>
      )}

      {/* Record Entry Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title="Add Cashbook Entry"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" onClick={handleCreateEntry as any} disabled={saving || !amount} id="submit-log-entry">
              {saving ? 'Saving...' : 'Save Entry'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateEntry} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && <div className="login-error"><span>{formError}</span></div>}

          <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', border: type === 'CREDIT' ? '2px solid #10B981' : '1px solid #E5E7EB', background: type === 'CREDIT' ? '#ECFDF5' : 'white', flex: 1 }}>
              <input type="radio" name="entryType" value="CREDIT" checked={type === 'CREDIT'} onChange={() => setType('CREDIT')} style={{ accentColor: '#10B981' }} />
              <div style={{ fontWeight: 'bold', color: type === 'CREDIT' ? '#065F46' : '#374151' }}>Money IN (Credit)</div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', border: type === 'DEBIT' ? '2px solid #EF4444' : '1px solid #E5E7EB', background: type === 'DEBIT' ? '#FEF2F2' : 'white', flex: 1 }}>
              <input type="radio" name="entryType" value="DEBIT" checked={type === 'DEBIT'} onChange={() => setType('DEBIT')} style={{ accentColor: '#EF4444' }} />
              <div style={{ fontWeight: 'bold', color: type === 'DEBIT' ? '#991B1B' : '#374151' }}>Money OUT (Debit)</div>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              id="entry-amount"
              label="Amount (INR) *"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
            <Input
              id="entry-date"
              label="Date *"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Select
              id="entry-category"
              label="Category *"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {type === 'CREDIT' ? (
                <>
                  <option value="Head Office Transfer">Head Office Transfer</option>
                  <option value="Client Payment">Client Payment</option>
                  <option value="Material Return">Material Return</option>
                  <option value="Other Income">Other Income</option>
                </>
              ) : (
                <>
                  <option value="Materials">Materials</option>
                  <option value="Labour">Labour & Wages</option>
                  <option value="Transport">Transport / Logistics</option>
                  <option value="Food & Utilities">Food & Utilities</option>
                  <option value="Equipment Rent">Equipment Rent</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </>
              )}
            </Select>

            <Input
              id="entry-ref"
              label="Reference / Bill No."
              placeholder="e.g. BILL-1024"
              value={reference}
              onChange={e => setReference(e.target.value)}
            />
          </div>

          <TextArea
            id="entry-desc"
            label="Notes / Description"
            placeholder="Detailed description of the transaction"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
          />
        </form>
      </Modal>
    </div>
  );
}
