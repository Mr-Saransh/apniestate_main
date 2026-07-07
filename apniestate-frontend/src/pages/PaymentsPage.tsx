import React, { useState, useEffect, type FormEvent } from 'react';
import { Plus, X, CreditCard, AlertTriangle } from 'lucide-react';
import { paymentsApi, type Payment } from '@/api/payments';
import { vendorsApi, type Vendor } from '@/api/vendors';
import { contractorsApi, type Contractor } from '@/api/contractors';
import { invoicesApi, type Invoice } from '@/api/invoices';
import { PH, Card, KPI, Chip, SrchBar } from '@/components/shared/FigmaComponents';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formAmount, setFormAmount] = useState(0);
  const [formVendorId, setFormVendorId] = useState('');
  const [formContractorId, setFormContractorId] = useState('');
  const [formInvoiceId, setFormInvoiceId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
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

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setFormAmount(0);
    setFormVendorId('');
    setFormContractorId('');
    setFormInvoiceId('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormMethod('BANK_TRANSFER');
    setFormStatus('COMPLETED');
    setFormReference('');
    setFormNotes('');
    setFormError('');
  };

  const openPaymentModal = (vendorId?: string) => {
    resetForm();
    if (vendorId) setFormVendorId(vendorId);
    setShowCreateModal(true);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await paymentsApi.createPayment({
        amount: Number(formAmount),
        vendor_id: formVendorId || null,
        contractor_id: formContractorId || null,
        invoice_id: formInvoiceId || null,
        date: new Date(formDate).toISOString(),
        method: formMethod,
        status: formStatus,
        reference: formReference || null,
        notes: formNotes || null
      });
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to record payment transaction');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate outstanding amounts for vendors based on invoices and payments
  const vendorStats = vendors.map(v => {
    const vInvoices = invoices.filter(inv => inv.vendor_id === v.id && inv.status !== 'CANCELLED');
    const vPayments = payments.filter(p => p.vendor_id === v.id && p.status === 'COMPLETED');
    
    const totalInvoiced = vInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = vPayments.reduce((sum, p) => sum + p.amount, 0);
    const outstanding = Math.max(0, totalInvoiced - totalPaid);
    
    // Simplistic overdue calculation (assuming invoices past due date are overdue if unpaid)
    const overdueInvoices = vInvoices.filter(inv => inv.due_date && new Date(inv.due_date) < new Date() && inv.status !== 'PAID');
    const overdue = Math.max(0, overdueInvoices.reduce((sum, inv) => sum + inv.total, 0));
    
    const lastPaid = vPayments.length > 0 
      ? new Date(Math.max(...vPayments.map(p => new Date(p.date).getTime()))).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Never';

    return { ...v, outstanding, overdue, lastPaid };
  }).filter(v => v.outstanding > 0 || v.lastPaid !== 'Never'); // Show only active vendors

  const filteredStats = vendorStats.filter(v => 
    !search || v.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalOutstanding = vendorStats.reduce((sum, v) => sum + v.outstanding, 0);
  const totalOverdue = vendorStats.reduce((sum, v) => sum + v.overdue, 0);

  if (loading && vendors.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const formatMoney = (val: number) => {
    if (val === 0) return '₨0';
    if (val >= 10000000) return `₨${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₨${(val / 100000).toFixed(2)}L`;
    if (val >= 1000) return `₨${(val / 1000).toFixed(1)}K`;
    return `₨${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start">
        <PH title="Vendor Payments" sub="Accounts payable — credit health" />
        <button 
          onClick={() => openPaymentModal()}
          className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-3 h-3" /> Payment
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <KPI label="Total Outstanding" value={formatMoney(totalOutstanding)} icon={CreditCard} trend={{ up: false, v: "–8.2%" }} />
        <KPI label="Overdue Balance" value={formatMoney(totalOverdue)} icon={AlertTriangle} />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1" onChange={(e: any) => setSearch(e.target.value)}>
          <SrchBar placeholder="Search vendors..." />
        </div>
      </div>

      <Card noPad>
        {filteredStats.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No active vendors found</div>
        ) : (
          filteredStats.map((v, i) => (
            <div key={v.id || i} className={`px-4 py-3 ${i < filteredStats.length - 1 ? "border-b border-border" : ""}`}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">{v.name}</p>
                  <p className="text-[10px] text-muted-foreground">Last paid: {v.lastPaid}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-foreground">{formatMoney(v.outstanding)}</p>
                  {v.overdue > 0 && <p className="text-[10px] text-red-500">OD: {formatMoney(v.overdue)}</p>}
                </div>
              </div>
              <div className="flex justify-end">
                {v.outstanding > 0 && (
                  <button onClick={() => openPaymentModal(v.id)} className="text-[10px] bg-secondary text-primary px-2.5 py-1 rounded font-semibold hover:bg-primary/10 transition-colors">Record Payment</button>
                )}
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-sm font-bold">Record Payment</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-4 overflow-y-auto space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs">{formError}</div>}
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Amount (₨) *</label>
                    <input type="number" required min="1" step="0.01" className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary font-medium" value={formAmount || ''} onChange={e => setFormAmount(Number(e.target.value))} placeholder="0.00" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date *</label>
                    <input type="date" required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formDate} onChange={e => setFormDate(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pay To (Vendor) *</label>
                  <select required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formVendorId} onChange={e => setFormVendorId(e.target.value)}>
                    <option value="">Select Vendor</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Method *</label>
                    <select required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formMethod} onChange={e => setFormMethod(e.target.value as any)}>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="CASH">Cash</option>
                      <option value="ONLINE">Online</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status *</label>
                    <select required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formStatus} onChange={e => setFormStatus(e.target.value as any)}>
                      <option value="PENDING">Pending</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Reference / Transaction ID</label>
                  <input type="text" className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formReference} onChange={e => setFormReference(e.target.value)} placeholder="Txn ID or Cheque No" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Notes (Optional)</label>
                  <textarea className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" rows={2} value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Payment details..." />
                </div>
              </div>
              
              <div className="border-t border-border flex gap-2 -mx-4 -mb-4 pt-4 px-4 bg-muted/30 rounded-b-2xl pb-4 mt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium flex justify-center items-center hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
