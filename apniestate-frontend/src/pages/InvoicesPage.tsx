import React, { useState, useEffect, type FormEvent } from 'react';
import { Plus, X, Clock, Edit2 } from 'lucide-react';
import { invoicesApi, type Invoice } from '@/api/invoices';
import { vendorsApi, type Vendor } from '@/api/vendors';
import { PH, Card, Chip, SrchBar } from '@/components/shared/FigmaComponents';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setFormNumber('');
    setFormVendorId('');
    setFormAmount(0);
    setFormTaxAmount(0);
    setFormDueDate('');
    setFormStatus('DRAFT');
    setFormNotes('');
    setFormError('');
    setSelectedInvoice(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setFormNumber(invoice.number);
    setFormVendorId(invoice.vendor_id);
    setFormAmount(invoice.amount);
    setFormTaxAmount(invoice.tax_amount || 0);
    setFormDueDate(invoice.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : '');
    setFormStatus(invoice.status);
    setFormNotes(invoice.notes || '');
    setShowEditModal(true);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await invoicesApi.createInvoice({
        number: formNumber,
        vendor_id: formVendorId,
        amount: Number(formAmount),
        tax_amount: Number(formTaxAmount),
        total: Number(formAmount) + Number(formTaxAmount),
        due_date: formDueDate ? new Date(formDueDate).toISOString() : new Date().toISOString(),
        status: formStatus,
        notes: formNotes || null
      });
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
      await invoicesApi.updateInvoice(selectedInvoice.id, {
        number: formNumber,
        vendor_id: formVendorId,
        amount: Number(formAmount),
        tax_amount: Number(formTaxAmount),
        total: Number(formAmount) + Number(formTaxAmount),
        due_date: formDueDate ? new Date(formDueDate).toISOString() : new Date().toISOString(),
        status: formStatus,
        notes: formNotes || null
      });
      setShowEditModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const approveInvoice = async (id: string) => {
    try {
      await invoicesApi.updateInvoice(id, { status: 'APPROVED' } as any);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    !search || 
    inv.number.toLowerCase().includes(search.toLowerCase()) ||
    inv.vendor?.name.toLowerCase().includes(search.toLowerCase())
  );

  const pendingInvoices = invoices.filter(inv => (inv.status as string) === 'PENDING' || inv.status === 'DRAFT');
  const pendingCount = pendingInvoices.length;
  const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0);

  if (loading && invoices.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const formatMoney = (val: number) => {
    if (val >= 10000000) return `₨${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₨${(val / 100000).toFixed(2)}L`;
    if (val >= 1000) return `₨${(val / 1000).toFixed(1)}K`;
    return `₨${val.toLocaleString()}`;
  };

  const statusColor: Record<string, "yellow"|"blue"|"green"|"gray"|"red"> = { 
    "DRAFT": "gray", 
    "PENDING": "yellow", 
    "APPROVED": "blue", 
    "PAID": "green",
    "CANCELLED": "red" 
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start">
        <PH title="Invoices" sub={`${pendingCount} invoices pending executive clearance`} />
        <button 
          onClick={openCreateModal}
          className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-3 h-3" /> New Invoice
        </button>
      </div>

      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 shadow-sm">
          <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-800">{pendingCount} invoices require approval</p>
            <p className="text-[10px] text-amber-600 mt-0.5">Total pending authorization: {formatMoney(pendingAmount)}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1" onChange={(e: any) => setSearch(e.target.value)}>
          <SrchBar placeholder="Search invoices..." />
        </div>
      </div>

      <Card noPad>
        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No invoices found</div>
        ) : (
          filteredInvoices.map((inv, i) => {
            const dueDate = inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
            const displayStatus = (inv.status as string) === 'PENDING' ? 'Pending Approval' : inv.status;
            
            return (
              <div key={inv.id || i} className={`px-4 py-3 ${i < filteredInvoices.length - 1 ? "border-b border-border" : ""}`}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0 cursor-pointer hover:underline" onClick={() => openEditModal(inv)}>
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                      {inv.vendor?.name || 'Unknown Vendor'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{inv.number} · {inv.notes || 'No description'}</p>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <p className="text-xs font-bold text-foreground">{formatMoney(inv.total)}</p>
                    <Edit2 className="w-3 h-3 text-muted-foreground opacity-50 cursor-pointer mt-1" onClick={() => openEditModal(inv)} />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Chip color={statusColor[inv.status] || "gray"}>{displayStatus}</Chip>
                  <span className="text-[10px] text-muted-foreground">Due: {dueDate}</span>
                  {((inv.status as string) === "PENDING" || inv.status === "DRAFT") && (
                    <button 
                      onClick={() => approveInvoice(inv.id)}
                      className="ml-auto text-[10px] bg-primary text-white px-2.5 py-1 rounded font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Approve
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </Card>

      {/* Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-sm font-bold">{showEditModal ? 'Edit Invoice' : 'New Invoice'}</h2>
              <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={showEditModal ? handleUpdate : handleCreate} className="p-4 overflow-y-auto space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs">{formError}</div>}
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Invoice Number *</label>
                  <input type="text" required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formNumber} onChange={e => setFormNumber(e.target.value)} placeholder="INV-0001" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vendor *</label>
                  <select required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formVendorId} onChange={e => setFormVendorId(e.target.value)}>
                    <option value="">Select Vendor</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Amount (₨) *</label>
                    <input type="number" required min="0" step="0.01" className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary font-medium" value={formAmount || ''} onChange={e => setFormAmount(Number(e.target.value))} placeholder="0.00" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tax Amount (₨)</label>
                    <input type="number" min="0" step="0.01" className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary font-medium" value={formTaxAmount || ''} onChange={e => setFormTaxAmount(Number(e.target.value))} placeholder="0.00" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Due Date *</label>
                    <input type="date" required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status *</label>
                    <select required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formStatus} onChange={e => setFormStatus(e.target.value as any)}>
                      <option value="DRAFT">Draft</option>
                      <option value="PENDING">Pending Approval</option>
                      <option value="APPROVED">Approved</option>
                      <option value="PAID">Paid</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Notes / Description (Optional)</label>
                  <textarea className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" rows={2} value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Invoice details..." />
                </div>
              </div>
              
              <div className="border-t border-border flex gap-2 -mx-4 -mb-4 pt-4 px-4 bg-muted/30 rounded-b-2xl pb-4 mt-4">
                <button type="button" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} className="flex-1 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium flex justify-center items-center hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
