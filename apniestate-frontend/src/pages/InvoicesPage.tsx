import { useState, useEffect, type FormEvent } from 'react';
import { invoicesApi, type Invoice } from '@/api/invoices';
import { vendorsApi, type Vendor } from '@/api/vendors';
import Modal from '@/components/shared/Modal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { Plus, Search, FileText, Calendar, Edit2, Trash2, IndianRupee } from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formNumber, setFormNumber] = useState('');
  const [formVendorId, setFormVendorId] = useState('');
  const [formAmount, setFormAmount] = useState(0);
  const [formTaxAmount, setFormTaxAmount] = useState(0);
  const [formDueDate, setFormDueDate] = useState('');
  const [formStatus, setFormStatus] = useState<Invoice['status']>('DRAFT');
  const [formNotes, setFormNotes] = useState('');

  const fetchData = async () => {
    try {
      const [invoicesRes, vendorsRes] = await Promise.all([
        invoicesApi.getInvoices(),
        vendorsApi.getVendors()
      ]);
      if (invoicesRes.data) setInvoices(invoicesRes.data);
      if (vendorsRes.data) setVendors(vendorsRes.data);
    } catch (err) {
      console.error('Failed to fetch invoice data', err);
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
        number: formNumber,
        vendor_id: formVendorId,
        amount: Number(formAmount),
        tax_amount: Number(formTaxAmount),
        total: Number(formAmount) + Number(formTaxAmount),
        due_date: new Date(formDueDate).toISOString(),
        status: formStatus,
        notes: formNotes || null
      };

      await invoicesApi.createInvoice(data);
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to generate invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setFormError('');
    setSubmitting(true);

    try {
      const data = {
        number: formNumber,
        vendor_id: formVendorId,
        amount: Number(formAmount),
        tax_amount: Number(formTaxAmount),
        total: Number(formAmount) + Number(formTaxAmount),
        due_date: new Date(formDueDate).toISOString(),
        status: formStatus,
        notes: formNotes || null
      };

      await invoicesApi.updateInvoice(selectedInvoice.id, data);
      setShowEditModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await invoicesApi.deleteInvoice(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete invoice', err);
    }
  };

  const openEditModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setFormNumber(invoice.number);
    setFormVendorId(invoice.vendor_id);
    setFormAmount(invoice.amount);
    setFormTaxAmount(invoice.tax_amount || 0);
    setFormDueDate(invoice.due_date.split('T')[0]);
    setFormStatus(invoice.status);
    setFormNotes(invoice.notes || '');
    setShowEditModal(true);
  };

  const resetForm = () => {
    setSelectedInvoice(null);
    setFormNumber('');
    setFormVendorId('');
    setFormAmount(0);
    setFormTaxAmount(0);
    setFormDueDate('');
    setFormStatus('DRAFT');
    setFormNotes('');
    setFormError('');
  };

  const filtered = invoices.filter(inv => {
    const matchesSearch = inv.number.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (inv.vendor?.name && inv.vendor.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = !statusFilter || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const outstandingAmount = invoices
    .filter(inv => ['SENT', 'OVERDUE'].includes(inv.status))
    .reduce((acc, inv) => acc + inv.total, 0);
  const paidAmount = invoices
    .filter(inv => inv.status === 'PAID')
    .reduce((acc, inv) => acc + inv.total, 0);
  const taxCollected = invoices.reduce((acc, inv) => acc + (inv.tax_amount || 0), 0);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoice Registry</h1>
          <p className="page-subtitle">Record and trace contractor bills, material vendor invoices, and tax totals</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }} id="add-invoice-btn">
          <Plus size={18} />
          Record Invoice
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard
          icon={<IndianRupee size={20} />}
          label="Pending Payables"
          value={`₹${outstandingAmount.toLocaleString('en-IN')}`}
          color="#EF4444"
          bgColor="rgba(239, 68, 68, 0.1)"
        />
        <StatCard
          icon={<IndianRupee size={20} />}
          label="Total Paid"
          value={`₹${paidAmount.toLocaleString('en-IN')}`}
          color="#10B981"
          bgColor="rgba(16, 185, 129, 0.1)"
        />
        <StatCard
          icon={<FileText size={20} />}
          label="Tax Value (GST)"
          value={`₹${taxCollected.toLocaleString('en-IN')}`}
          color="#8B5CF6"
          bgColor="rgba(139, 92, 246, 0.1)"
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
              placeholder="Search by invoice number or vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="search-invoices"
            />
          </div>
          <select
            className="form-input form-select"
            style={{ width: '160px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent (Unpaid)</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invoices List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText size={36} />}
          title="No invoices listed"
          description="Log contractor billing invoices or vendor purchase bills to track payment schedules"
          action={
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={18} /> Record Invoice
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
                    <th>Invoice No.</th>
                    <th>Vendor / Contractor</th>
                    <th>Subtotal (₹)</th>
                    <th>Tax (₹)</th>
                    <th>Total Payable (₹)</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(invoice => (
                    <tr key={invoice.id} className="hover-row">
                      <td style={{ fontWeight: '600', fontFamily: 'monospace' }}>
                        {invoice.number}
                      </td>
                      <td>
                        <span style={{ fontWeight: '500' }}>{invoice.vendor?.name || 'Unknown Vendor'}</span>
                      </td>
                      <td>₹{invoice.amount.toLocaleString('en-IN')}</td>
                      <td>₹{(invoice.tax_amount || 0).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 'bold' }}>₹{invoice.total.toLocaleString('en-IN')}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-sm)' }}>
                          <Calendar size={14} style={{ opacity: 0.5 }} />
                          {new Date(invoice.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => openEditModal(invoice)}
                            title="Edit Invoice"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon btn-sm text-danger"
                            onClick={() => handleDelete(invoice.id)}
                            title="Delete Invoice"
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

      {/* Record Invoice Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        title="Record Invoice"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleCreate as any}
              disabled={submitting || !formNumber || !formVendorId || !formAmount || !formDueDate}
              id="submit-record-invoice"
            >
              {submitting ? 'Recording...' : 'Record Invoice'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {formError && <div className="login-error"><span>{formError}</span></div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="inv-num">Invoice Number *</label>
              <input id="inv-num" type="text" className="form-input" placeholder="e.g. INV-2026-001" value={formNumber} onChange={(e) => setFormNumber(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="inv-vendor">Vendor / Supplier *</label>
              <select id="inv-vendor" className="form-input form-select" value={formVendorId} onChange={(e) => setFormVendorId(e.target.value)} required>
                <option value="">Select Vendor...</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="inv-amount">Subtotal Amount (₹) *</label>
              <input id="inv-amount" type="number" className="form-input" value={formAmount} onChange={(e) => setFormAmount(Number(e.target.value))} required min={1} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="inv-tax">Tax Amount (₹)</label>
              <input id="inv-tax" type="number" className="form-input" value={formTaxAmount} onChange={(e) => setFormTaxAmount(Number(e.target.value))} min={0} />
            </div>
          </div>

          <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
            Total Value: ₹{(Number(formAmount) + Number(formTaxAmount)).toLocaleString('en-IN')}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="inv-due">Due Date *</label>
              <input id="inv-due" type="date" className="form-input" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="inv-status">Status</label>
              <select id="inv-status" className="form-input form-select" value={formStatus} onChange={(e) => setFormStatus(e.target.value as Invoice['status'])}>
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent (Unpaid)</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="inv-notes">Description / Notes</label>
            <textarea id="inv-notes" className="form-input" placeholder="Invoice details, payment terms, etc." rows={2} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
          </div>
        </form>
      </Modal>

      {/* Edit Invoice Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); resetForm(); }}
        title="Edit Invoice"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setShowEditModal(false); resetForm(); }}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleUpdate as any}
              disabled={submitting || !formNumber || !formVendorId || !formAmount || !formDueDate}
              id="submit-edit-invoice"
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
              <label className="form-label" htmlFor="edit-inv-num">Invoice Number *</label>
              <input id="edit-inv-num" type="text" className="form-input" value={formNumber} onChange={(e) => setFormNumber(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-inv-vendor">Vendor / Supplier *</label>
              <select id="edit-inv-vendor" className="form-input form-select" value={formVendorId} onChange={(e) => setFormVendorId(e.target.value)} required>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-inv-amount">Subtotal Amount (₹) *</label>
              <input id="edit-inv-amount" type="number" className="form-input" value={formAmount} onChange={(e) => setFormAmount(Number(e.target.value))} required min={1} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-inv-tax">Tax Amount (₹)</label>
              <input id="edit-inv-tax" type="number" className="form-input" value={formTaxAmount} onChange={(e) => setFormTaxAmount(Number(e.target.value))} min={0} />
            </div>
          </div>

          <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
            Total Value: ₹{(Number(formAmount) + Number(formTaxAmount)).toLocaleString('en-IN')}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-inv-due">Due Date *</label>
              <input id="edit-inv-due" type="date" className="form-input" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-inv-status">Status</label>
              <select id="edit-inv-status" className="form-input form-select" value={formStatus} onChange={(e) => setFormStatus(e.target.value as Invoice['status'])}>
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent (Unpaid)</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-inv-notes">Description / Notes</label>
            <textarea id="edit-inv-notes" className="form-input" rows={2} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
