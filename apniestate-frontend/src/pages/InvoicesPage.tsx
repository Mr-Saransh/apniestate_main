import React, { useState, useEffect, type FormEvent } from 'react';
import {
  Plus,
  X,
  Clock,
  Edit2,
  Paperclip,
  UploadCloud,
  CheckCircle,
  Trash2,
  Receipt,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { invoicesApi, type Invoice } from '@/api/invoices';
import { vendorsApi, type Vendor } from '@/api/vendors';
import { duesApi } from '@/api/dues';
import { useProject } from '@/context/ProjectContext';
import { PH, Card, Chip, SrchBar } from '@/components/shared/FigmaComponents';
import UploadInvoiceModal from '@/components/finance/UploadInvoiceModal';

export default function InvoicesPage() {
  const { activeProjectId, activeProject } = useProject();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'PAID'>('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadInvoiceId, setUploadInvoiceId] = useState<string | undefined>(undefined);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formNumber, setFormNumber] = useState('');
  const [formVendorId, setFormVendorId] = useState('');
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formTaxAmount, setFormTaxAmount] = useState<number | ''>(0);
  const [formDueDate, setFormDueDate] = useState('');
  const [formStatus, setFormStatus] = useState<Invoice['status']>('DRAFT');
  const [formNotes, setFormNotes] = useState('');

  const fetchData = async () => {
    if (!activeProjectId) {
      setInvoices([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [invoicesRes, vendorsRes] = await Promise.all([
        invoicesApi.getInvoices({ project_id: activeProjectId }),
        vendorsApi.getVendors(),
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
  }, [activeProjectId]);

  const resetForm = () => {
    setFormNumber('');
    setFormVendorId('');
    setFormAmount('');
    setFormTaxAmount(0);
    // Default due date to 15 days from now
    const d = new Date();
    d.setDate(d.getDate() + 15);
    setFormDueDate(d.toISOString().split('T')[0]);
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
    setFormError('');
    setShowEditModal(true);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeProjectId) {
      setFormError('Please select a project before creating an invoice.');
      return;
    }

    const parsedAmount = Number(formAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      setFormError('Please enter a valid invoice amount.');
      return;
    }

    setFormError('');
    setSubmitting(true);
    try {
      const autoNumber = formNumber.trim() || `INV-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const parsedTax = Number(formTaxAmount) || 0;
      const totalAmount = parsedAmount + parsedTax;

      await invoicesApi.createInvoice({
        number: autoNumber,
        vendor_id: formVendorId,
        project_id: activeProjectId,
        amount: parsedAmount,
        tax_amount: parsedTax,
        total: totalAmount,
        due_date: formDueDate ? new Date(formDueDate).toISOString() : new Date().toISOString(),
        status: formStatus,
        notes: formNotes || null,
      });

      // Automatically register Due in Finance for this project
      try {
        const v = vendors.find((ven) => ven.id === formVendorId);
        await duesApi.createDue({
          project_id: activeProjectId,
          vendor_id: formVendorId,
          party_name: v?.name || 'Vendor',
          party_type: 'VENDOR',
          due_type: 'MANUAL_DUE',
          title: `Invoice ${autoNumber} - ${formNotes || v?.name || 'Vendor Due'}`,
          total_amount: totalAmount,
          due_date: formDueDate ? new Date(formDueDate).toISOString() : undefined,
          notes: formNotes || undefined,
        });
      } catch (dueErr) {
        console.error('Failed to auto-register due for invoice:', dueErr);
      }

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

    const parsedAmount = Number(formAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      setFormError('Please enter a valid invoice amount.');
      return;
    }

    setFormError('');
    setSubmitting(true);
    try {
      const parsedTax = Number(formTaxAmount) || 0;
      const totalAmount = parsedAmount + parsedTax;

      await invoicesApi.updateInvoice(selectedInvoice.id, {
        number: formNumber.trim() || selectedInvoice.number,
        vendor_id: formVendorId,
        project_id: activeProjectId || undefined,
        amount: parsedAmount,
        tax_amount: parsedTax,
        total: totalAmount,
        due_date: formDueDate ? new Date(formDueDate).toISOString() : new Date().toISOString(),
        status: formStatus,
        notes: formNotes || null,
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
      await invoicesApi.updateInvoice(id, { status: 'APPROVED' });
      fetchData();
    } catch (e) {
      console.error('Failed to approve invoice:', e);
    }
  };

  const markInvoicePaid = async (id: string) => {
    try {
      await invoicesApi.updateInvoice(id, { status: 'PAID' });
      fetchData();
    } catch (e) {
      console.error('Failed to mark invoice as paid:', e);
    }
  };

  const handleDeleteInvoice = async (id: string, number: string) => {
    if (!window.confirm(`Are you sure you want to delete invoice ${number}? This action cannot be undone.`)) {
      return;
    }
    try {
      await invoicesApi.deleteInvoice(id);
      if (showEditModal) setShowEditModal(false);
      fetchData();
    } catch (e) {
      console.error('Failed to delete invoice:', e);
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      !search ||
      inv.number.toLowerCase().includes(search.toLowerCase()) ||
      inv.vendor?.name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.notes?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'PENDING') {
      return inv.status === 'PENDING' || inv.status === 'DRAFT';
    }
    if (statusFilter === 'APPROVED') {
      return inv.status === 'APPROVED';
    }
    if (statusFilter === 'PAID') {
      return inv.status === 'PAID';
    }
    return true;
  });

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0);
  const pendingInvoices = invoices.filter(
    (inv) => (inv.status as string) === 'PENDING' || inv.status === 'DRAFT'
  );
  const pendingCount = pendingInvoices.length;
  const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0);
  const paidAmount = invoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0);

  const formatMoney = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val.toLocaleString()}`;
  };

  const statusColor: Record<string, 'yellow' | 'blue' | 'green' | 'gray' | 'red'> = {
    DRAFT: 'gray',
    PENDING: 'yellow',
    APPROVED: 'blue',
    PAID: 'green',
    OVERDUE: 'red',
    CANCELLED: 'red',
    SENT: 'blue',
  };

  const calculateTaxPreset = (pct: number) => {
    const amt = Number(formAmount) || 0;
    if (amt > 0) {
      setFormTaxAmount(Math.round((amt * pct) / 100));
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header with Project Context */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-foreground">Project Invoices</h1>
            {activeProject && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <Building2 className="w-3 h-3" />
                {activeProject.name}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {invoices.length === 0
              ? 'No invoices recorded yet for this project'
              : `${invoices.length} invoices registered • ${pendingCount} pending authorization`}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setUploadInvoiceId(undefined);
              setShowUploadModal(true);
            }}
            className="flex-1 sm:flex-initial px-3 py-2 bg-white border border-border text-foreground hover:border-primary text-xs font-semibold flex items-center justify-center gap-1.5 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-primary" /> Upload Bill
          </button>
          <button
            onClick={openCreateModal}
            className="flex-1 sm:flex-initial px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Invoice
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <div className="bg-card border border-border/80 rounded-xl p-3 shadow-xs">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Invoiced</p>
          <p className="text-sm sm:text-base font-bold text-foreground mt-0.5 truncate">{formatMoney(totalInvoiced)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{invoices.length} bills</p>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Pending</p>
            <Clock className="w-3 h-3 text-amber-600" />
          </div>
          <p className="text-sm sm:text-base font-bold text-amber-900 mt-0.5 truncate">{formatMoney(pendingAmount)}</p>
          <p className="text-[10px] text-amber-700 mt-0.5">{pendingCount} awaiting approval</p>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Paid Amount</p>
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          </div>
          <p className="text-sm sm:text-base font-bold text-emerald-900 mt-0.5 truncate">{formatMoney(paidAmount)}</p>
          <p className="text-[10px] text-emerald-700 mt-0.5">Cleared vendor funds</p>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1" onChange={(e: any) => setSearch(e.target.value)}>
          <SrchBar placeholder="Search vendor, invoice #, notes..." />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'PENDING', 'APPROVED', 'PAID'] as const).map((filterKey) => (
            <button
              key={filterKey}
              onClick={() => setStatusFilter(filterKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === filterKey
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {filterKey === 'ALL'
                ? 'All'
                : filterKey === 'PENDING'
                ? 'Pending'
                : filterKey === 'APPROVED'
                ? 'Approved'
                : 'Paid'}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice List / Empty State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 bg-card border border-border rounded-xl">
          <div className="w-7 h-7 rounded-full border-3 border-primary border-t-transparent animate-spin mb-2" />
          <p className="text-xs text-muted-foreground font-medium">Loading project invoices...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <Card noPad>
          <div className="p-8 sm:p-10 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            {search ? (
              <>
                <p className="text-sm font-semibold text-foreground">No invoices match "{search}"</p>
                <p className="text-xs text-muted-foreground mt-1">Try searching for a different vendor or invoice number.</p>
              </>
            ) : statusFilter !== 'ALL' ? (
              <>
                <p className="text-sm font-semibold text-foreground">No {statusFilter.toLowerCase()} invoices</p>
                <p className="text-xs text-muted-foreground mt-1">There are no invoices in this filter category.</p>
              </>
            ) : (
              <>
                <h3 className="text-base font-bold text-foreground">
                  No invoices for {activeProject?.name || 'this project'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-sm">
                  Every project maintains its own isolated invoice register. Real vendor bills and tax invoices created
                  for {activeProject?.name || 'this project'} will appear here.
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => {
                      setUploadInvoiceId(undefined);
                      setShowUploadModal(true);
                    }}
                    className="px-3.5 py-2 bg-primary text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" /> Upload Bill Document
                  </button>
                  <button
                    onClick={openCreateModal}
                    className="px-3.5 py-2 border border-border bg-card hover:bg-muted text-foreground rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Manually
                  </button>
                </div>
              </>
            )}
          </div>
        </Card>
      ) : (
        <Card noPad>
          <div className="divide-y divide-border">
            {filteredInvoices.map((inv) => {
              const dueDate = inv.due_date
                ? new Date(inv.due_date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'N/A';
              const displayStatus =
                inv.status === 'PENDING'
                  ? 'Pending Approval'
                  : inv.status === 'APPROVED'
                  ? 'Approved'
                  : inv.status === 'PAID'
                  ? 'Paid'
                  : inv.status === 'DRAFT'
                  ? 'Draft'
                  : inv.status;
              const hasAttachment = (inv as any).attachments?.length > 0;
              const attachmentUrl = hasAttachment ? (inv as any).attachments[0].secure_url : null;
              const tax = inv.tax_amount || 0;

              return (
                <div
                  key={inv.id}
                  className="p-3.5 sm:p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => openEditModal(inv)}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors">
                          {inv.vendor?.name || 'Vendor Bill'}
                        </span>
                        <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/60">
                          {inv.number}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {inv.notes || 'No description added'}
                      </p>
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0">
                      <p className="text-xs sm:text-sm font-black text-foreground">
                        {formatMoney(inv.total || inv.amount)}
                      </p>
                      {tax > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          Base: {formatMoney(inv.amount)} + GST: {formatMoney(tax)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border/40">
                    <Chip color={statusColor[inv.status] || 'gray'}>{displayStatus}</Chip>
                    <span className="text-[10px] text-muted-foreground">Due: {dueDate}</span>

                    {/* Document link / action */}
                    {hasAttachment ? (
                      <a
                        href={attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-primary hover:underline inline-flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-md"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Paperclip className="w-3 h-3" /> View Doc
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadInvoiceId(inv.id);
                          setShowUploadModal(true);
                        }}
                        className="text-[10px] text-muted-foreground hover:text-primary inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted cursor-pointer"
                      >
                        <UploadCloud className="w-3 h-3" /> Attach Doc
                      </button>
                    )}

                    {/* Inline Quick Action Buttons */}
                    <div className="ml-auto flex items-center gap-1.5">
                      {(inv.status === 'PENDING' || inv.status === 'DRAFT') && (
                        <button
                          onClick={() => approveInvoice(inv.id)}
                          className="text-[10px] bg-primary text-white px-2.5 py-1 rounded-md font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                        >
                          Approve
                        </button>
                      )}
                      {inv.status === 'APPROVED' && (
                        <button
                          onClick={() => markInvoicePaid(inv.id)}
                          className="text-[10px] bg-emerald-600 text-white px-2.5 py-1 rounded-md font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(inv)}
                        title="Edit Invoice"
                        className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted cursor-pointer transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(inv.id, inv.number)}
                        title="Delete Invoice"
                        className="p-1 text-muted-foreground hover:text-red-600 rounded hover:bg-red-50 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Modal for Create/Edit Invoice */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-muted/20">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {showEditModal ? 'Edit Invoice' : 'Create Project Invoice'}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Assigned to <span className="font-semibold text-primary">{activeProject?.name || 'Project'}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                }}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={showEditModal ? handleUpdate : handleCreate}
              className="p-6 overflow-y-auto space-y-4"
            >
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-3.5">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Vendor / Supplier <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full mt-1 p-2.5 bg-muted/50 border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary font-medium"
                    value={formVendorId}
                    onChange={(e) => setFormVendorId(e.target.value)}
                  >
                    <option value="" disabled>
                      Select Registered Vendor
                    </option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Invoice / Bill Number
                    </label>
                    <input
                      type="text"
                      className="w-full mt-1 p-2.5 bg-muted/50 border border-border rounded-lg text-sm font-mono outline-none focus:ring-1 focus:ring-primary"
                      value={formNumber}
                      onChange={(e) => setFormNumber(e.target.value)}
                      placeholder="Auto-generated if left blank"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full mt-1 p-2.5 bg-muted/50 border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Taxable Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      className="w-full mt-1 p-2.5 bg-muted/50 border border-border rounded-lg text-sm font-bold text-foreground outline-none focus:ring-1 focus:ring-primary"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        GST / Tax (₹)
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => calculateTaxPreset(5)}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary font-bold cursor-pointer"
                        >
                          5%
                        </button>
                        <button
                          type="button"
                          onClick={() => calculateTaxPreset(12)}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary font-bold cursor-pointer"
                        >
                          12%
                        </button>
                        <button
                          type="button"
                          onClick={() => calculateTaxPreset(18)}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary font-bold cursor-pointer"
                        >
                          18%
                        </button>
                      </div>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full mt-1 p-2.5 bg-muted/50 border border-border rounded-lg text-sm font-bold text-foreground outline-none focus:ring-1 focus:ring-primary"
                      value={formTaxAmount}
                      onChange={(e) => setFormTaxAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Total computation display */}
                <div className="p-3 bg-muted/40 rounded-xl border border-border flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">Total Payable Amount:</span>
                  <span className="text-base font-black text-foreground">
                    ₹{(Number(formAmount || 0) + Number(formTaxAmount || 0)).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Status
                    </label>
                    <select
                      className="w-full mt-1 p-2.5 bg-muted/50 border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary font-semibold"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PENDING">Pending Approval</option>
                      <option value="APPROVED">Approved</option>
                      <option value="PAID">Paid</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Project
                    </label>
                    <input
                      type="text"
                      disabled
                      value={activeProject?.name || 'Active Project'}
                      className="w-full mt-1 p-2.5 bg-muted/30 border border-border/60 rounded-lg text-sm font-semibold text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Notes / Description
                  </label>
                  <textarea
                    className="w-full mt-1 p-2.5 bg-muted/50 border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Material specs, delivery slip reference, or approval memo..."
                  />
                </div>
              </div>

              <div className="border-t border-border flex items-center justify-between gap-3 pt-4 mt-6">
                {showEditModal && selectedInvoice && (
                  <button
                    type="button"
                    onClick={() => handleDeleteInvoice(selectedInvoice.id, selectedInvoice.number)}
                    className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                    }}
                    className="px-4 py-2 rounded-lg border border-border bg-card text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {submitting ? 'Saving...' : showEditModal ? 'Update Invoice' : 'Create Invoice'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cloudinary Invoice Document Upload Modal */}
      <UploadInvoiceModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setUploadInvoiceId(undefined);
        }}
        onSuccess={fetchData}
        preselectedInvoiceId={uploadInvoiceId}
        projectId={activeProjectId}
      />
    </div>
  );
}
