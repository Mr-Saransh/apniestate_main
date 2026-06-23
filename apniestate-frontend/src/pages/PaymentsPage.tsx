import { useState, useEffect, type FormEvent } from 'react';
import { paymentsApi, type Payment } from '@/api/payments';
import { vendorsApi, type Vendor } from '@/api/vendors';
import { contractorsApi, type Contractor } from '@/api/contractors';
import { invoicesApi, type Invoice } from '@/api/invoices';
import Modal from '@/components/shared/Modal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { Plus, Search, Calendar, CreditCard, Edit2, Trash2, IndianRupee } from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formAmount, setFormAmount] = useState(0);
  const [formVendorId, setFormVendorId] = useState('');
  const [formContractorId, setFormContractorId] = useState('');
  const [formInvoiceId, setFormInvoiceId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formMethod, setFormMethod] = useState<Payment['method']>('BANK_TRANSFER');
  const [formStatus, setFormStatus] = useState<Payment['status']>('COMPLETED');
  const [formReference, setFormReference] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const fetchData = async () => {
    try {
      const [paymentsRes, vendorsRes, contractorsRes, invoicesRes] = await Promise.all([
        paymentsApi.getPayments(),
        vendorsApi.getVendors(),
        contractorsApi.getContractors(),
        invoicesApi.getInvoices()
      ]);
      if (paymentsRes.data) setPayments(paymentsRes.data);
      if (vendorsRes.data) setVendors(vendorsRes.data);
      if (contractorsRes.data) setContractors(contractorsRes.data);
      if (invoicesRes.data) setInvoices(invoicesRes.data);
    } catch (err) {
      console.error('Failed to fetch payment page data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const data = {
        amount: Number(formAmount),
        vendor_id: formVendorId || null,
        contractor_id: formContractorId || null,
        invoice_id: formInvoiceId || null,
        date: new Date(formDate).toISOString(),
        method: formMethod,
        status: formStatus,
        reference: formReference || null,
        notes: formNotes || null
      };

      await paymentsApi.createPayment(data);
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to record payment transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;
    setFormError('');
    setSubmitting(true);

    try {
      const data = {
        amount: Number(formAmount),
        vendor_id: formVendorId || null,
        contractor_id: formContractorId || null,
        invoice_id: formInvoiceId || null,
        date: new Date(formDate).toISOString(),
        method: formMethod,
        status: formStatus,
        reference: formReference || null,
        notes: formNotes || null
      };

      await paymentsApi.updatePayment(selectedPayment.id, data);
      setShowEditModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return;
    try {
      await paymentsApi.deletePayment(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete payment', err);
    }
  };

  const openEditModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setFormAmount(payment.amount);
    setFormVendorId(payment.vendor_id || '');
    setFormContractorId(payment.contractor_id || '');
    setFormInvoiceId(payment.invoice_id || '');
    setFormDate(payment.date.split('T')[0]);
    setFormMethod(payment.method);
    setFormStatus(payment.status);
    setFormReference(payment.reference || '');
    setFormNotes(payment.notes || '');
    setShowEditModal(true);
  };

  const resetForm = () => {
    setSelectedPayment(null);
    setFormAmount(0);
    setFormVendorId('');
    setFormContractorId('');
    setFormInvoiceId('');
    setFormDate('');
    setFormMethod('BANK_TRANSFER');
    setFormStatus('COMPLETED');
    setFormReference('');
    setFormNotes('');
    setFormError('');
  };

  const filtered = payments.filter(p => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = 
      (p.reference && p.reference.toLowerCase().includes(term)) ||
      (p.vendor?.name && p.vendor.name.toLowerCase().includes(term)) ||
      (p.contractor?.name && p.contractor.name.toLowerCase().includes(term)) ||
      (p.invoice?.number && p.invoice.number.toLowerCase().includes(term));
    
    const matchesMethod = !methodFilter || p.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  // Stats
  const totalAmount = payments.reduce((acc, p) => acc + p.amount, 0);
  const completedAmount = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((acc, p) => acc + p.amount, 0);
  const pendingAmount = payments
    .filter(p => ['PENDING', 'PROCESSING'].includes(p.status))
    .reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payment Registers</h1>
          <p className="page-subtitle">Track outbound transaction records, bank transfers, cheques, and cash transactions</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }} id="add-payment-btn">
          <Plus size={18} />
          Record Payment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard
          icon={<IndianRupee size={20} />}
          label="Total Disbursed"
          value={`₹${totalAmount.toLocaleString('en-IN')}`}
          color="#3B82F6"
          bgColor="rgba(59, 130, 246, 0.1)"
        />
        <StatCard
          icon={<IndianRupee size={20} />}
          label="Cleared Transactions"
          value={`₹${completedAmount.toLocaleString('en-IN')}`}
          color="#10B981"
          bgColor="rgba(16, 185, 129, 0.1)"
        />
        <StatCard
          icon={<IndianRupee size={20} />}
          label="Pending Clearance"
          value={`₹${pendingAmount.toLocaleString('en-IN')}`}
          color="#F59E0B"
          bgColor="rgba(245, 158, 11, 0.1)"
        />
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', maxWidth: '600px' }}>
        <div className="card-body" style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-3)' }}>
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search reference, vendor, invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="search-payments"
            />
          </div>
          <select
            className="form-input form-select"
            style={{ width: '160px' }}
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="">All Methods</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CASH">Cash</option>
            <option value="CHEQUE">Cheque</option>
            <option value="UPI">UPI</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Payments List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<CreditCard size={36} />}
          title="No payments logged"
          description="Log outbound payments against vendor invoices or subcontractor claims to clear balances"
          action={
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={18} /> Record Payment
            </button>
          }
        />
      ) : (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Payee</th>
                    <th>Payment Date</th>
                    <th>Method</th>
                    <th>Ref / Txn ID</th>
                    <th>Invoice / Claim</th>
                    <th>Status</th>
                    <th>Amount Paid (₹)</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(payment => (
                    <tr key={payment.id} className="hover-row">
                      <td>
                        <span style={{ fontWeight: '500' }}>
                          {payment.vendor?.name || payment.contractor?.name || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Direct Expense</span>}
                        </span>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                          {payment.vendor ? 'Vendor Supplier' : payment.contractor ? 'Subcontractor' : 'Unlinked'}
                        </div>
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-sm)' }}>
                          <Calendar size={14} style={{ opacity: 0.5 }} />
                          {new Date(payment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500' }}>{payment.method.replace('_', ' ')}</span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)' }}>{payment.reference || '—'}</td>
                      <td>
                        {payment.invoice ? (
                          <span style={{ background: '#EFF6FF', color: '#1E40AF', padding: '2px 6px', borderRadius: '4px', fontSize: 'var(--font-size-xs)', fontFamily: 'monospace' }}>
                            {payment.invoice.number}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <StatusBadge status={payment.status} />
                      </td>
                      <td style={{ fontWeight: 'bold', color: 'var(--color-success)' }}>
                        ₹{payment.amount.toLocaleString('en-IN')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => openEditModal(payment)}
                            title="Edit Payment"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon btn-sm text-danger"
                            onClick={() => handleDelete(payment.id)}
                            title="Delete Payment"
                          >
                            <Trash2 size={15} color="#EF4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        title="Record Payment"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleCreate as any}
              disabled={submitting || !formAmount || !formDate || !formMethod}
              id="submit-record-payment"
            >
              {submitting ? 'Recording...' : 'Record Payment'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {formError && <div className="login-error"><span>{formError}</span></div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="pay-amt">Amount Paid (₹) *</label>
              <input id="pay-amt" type="number" className="form-input" value={formAmount} onChange={(e) => setFormAmount(Number(e.target.value))} required min={1} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pay-date">Payment Date *</label>
              <input id="pay-date" type="date" className="form-input" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="pay-method">Payment Method *</label>
              <select id="pay-method" className="form-input form-select" value={formMethod} onChange={(e) => setFormMethod(e.target.value as Payment['method'])}>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="UPI">UPI</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pay-status">Status</label>
              <select id="pay-status" className="form-input form-select" value={formStatus} onChange={(e) => setFormStatus(e.target.value as Payment['status'])}>
                <option value="COMPLETED">Completed (Cleared)</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="pay-ref">Reference ID / Txn Hash / Cheque No.</label>
            <input id="pay-ref" type="text" className="form-input" placeholder="e.g. TXN-1234567" value={formReference} onChange={(e) => setFormReference(e.target.value)} />
          </div>

          <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Link Transaction To (Optional)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="pay-vendor">Vendor</label>
              <select id="pay-vendor" className="form-input form-select" value={formVendorId} onChange={(e) => { setFormVendorId(e.target.value); setFormContractorId(''); }}>
                <option value="">Unlinked Vendor</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pay-contractor">Contractor</label>
              <select id="pay-contractor" className="form-input form-select" value={formContractorId} onChange={(e) => { setFormContractorId(e.target.value); setFormVendorId(''); }}>
                <option value="">Unlinked Contractor</option>
                {contractors.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="pay-invoice">Linked Invoice</label>
            <select id="pay-invoice" className="form-input form-select" value={formInvoiceId} onChange={(e) => setFormInvoiceId(e.target.value)}>
              <option value="">Unlinked Invoice</option>
              {invoices.filter(i => !formVendorId || i.vendor_id === formVendorId).map(i => (
                <option key={i.id} value={i.id}>{i.number} (Total: ₹{i.total})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="pay-notes">Description / Notes</label>
            <textarea id="pay-notes" className="form-input" placeholder="Additional details..." rows={2} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
          </div>
        </form>
      </Modal>

      {/* Edit Payment Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); resetForm(); }}
        title="Edit Payment"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setShowEditModal(false); resetForm(); }}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleUpdate as any}
              disabled={submitting || !formAmount || !formDate || !formMethod}
              id="submit-edit-payment"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {formError && <div className="login-error"><span>{formError}</span></div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-pay-amt">Amount Paid (₹) *</label>
              <input id="edit-pay-amt" type="number" className="form-input" value={formAmount} onChange={(e) => setFormAmount(Number(e.target.value))} required min={1} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-pay-date">Payment Date *</label>
              <input id="edit-pay-date" type="date" className="form-input" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-pay-method">Payment Method *</label>
              <select id="edit-pay-method" className="form-input form-select" value={formMethod} onChange={(e) => setFormMethod(e.target.value as Payment['method'])}>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="UPI">UPI</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-pay-status">Status</label>
              <select id="edit-pay-status" className="form-input form-select" value={formStatus} onChange={(e) => setFormStatus(e.target.value as Payment['status'])}>
                <option value="COMPLETED">Completed (Cleared)</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-pay-ref">Reference ID / Txn Hash / Cheque No.</label>
            <input id="edit-pay-ref" type="text" className="form-input" value={formReference} onChange={(e) => setFormReference(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-pay-vendor">Vendor</label>
              <select id="edit-pay-vendor" className="form-input form-select" value={formVendorId} onChange={(e) => { setFormVendorId(e.target.value); setFormContractorId(''); }}>
                <option value="">Unlinked Vendor</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-pay-contractor">Contractor</label>
              <select id="edit-pay-contractor" className="form-input form-select" value={formContractorId} onChange={(e) => { setFormContractorId(e.target.value); setFormVendorId(''); }}>
                <option value="">Unlinked Contractor</option>
                {contractors.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-pay-invoice">Linked Invoice</label>
            <select id="edit-pay-invoice" className="form-input form-select" value={formInvoiceId} onChange={(e) => setFormInvoiceId(e.target.value)}>
              <option value="">Unlinked Invoice</option>
              {invoices.map(i => (
                <option key={i.id} value={i.id}>{i.number} (Total: ₹{i.total})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-pay-notes">Description / Notes</label>
            <textarea id="edit-pay-notes" className="form-input" rows={2} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
