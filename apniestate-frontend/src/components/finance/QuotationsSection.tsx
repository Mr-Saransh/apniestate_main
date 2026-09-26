import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Download, Trash2, Edit3, CheckCircle2, 
  X, Eye, Send, Printer, User, Phone, Mail, Calendar, Percent, Camera
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { useProject } from '@/context/ProjectContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ChallanCameraUpload from '@/components/shared/ChallanCameraUpload';

export interface QuotationItem {
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface ClientQuotation {
  id: string;
  quotation_number: string;
  project_id?: string;
  company_id?: string;
  created_by_name?: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  date: string;
  valid_until?: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  items: QuotationItem[];
  subtotal: number;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  grand_total: number;
  terms?: string;
  notes?: string;
  attachment_url?: string;
  created_at: string;
}

export default function QuotationsSection() {
  const { activeProjectId, activeProject } = useProject();
  const [quotations, setQuotations] = useState<ClientQuotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [previewQuote, setPreviewQuote] = useState<ClientQuotation | null>(null);
  const [editingQuote, setEditingQuote] = useState<ClientQuotation | null>(null);

  // Form state
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');
  const [status, setStatus] = useState<ClientQuotation['status']>('DRAFT');
  const [items, setItems] = useState<QuotationItem[]>([
    { description: 'Foundation Excavation & PCC', quantity: 1200, unit: 'sqft', rate: 45, amount: 54000 }
  ]);
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('FIXED');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(18);
  const [terms, setTerms] = useState('1. 50% advance along with work order.\n2. 40% running payment on stage completion.\n3. 10% on final handover.\n4. Quote valid for 15 days.');
  const [notes, setNotes] = useState('Thank you for choosing Apni Estate ERP.');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const q = activeProjectId ? `?project_id=${activeProjectId}` : '';
      const res = await apiClient.get<ClientQuotation[]>(`/finance/quotations${q}`);
      if (res.data) setQuotations(res.data);
    } catch (err) {
      console.error('Failed to load quotations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [activeProjectId]);

  const resetForm = () => {
    setEditingQuote(null);
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setClientAddress('');
    setQuoteDate(new Date().toISOString().split('T')[0]);
    setValidUntil('');
    setStatus('DRAFT');
    setItems([{ description: '', quantity: 1, unit: 'sqft', rate: 0, amount: 0 }]);
    setDiscountType('FIXED');
    setDiscountValue(0);
    setTaxRate(18);
    setTerms('1. 50% advance along with work order.\n2. 40% running payment on stage completion.\n3. 10% on final handover.\n4. Quote valid for 15 days.');
    setNotes('Thank you for choosing Apni Estate ERP.');
    setAttachmentFile(null);
    setAttachmentUrl('');
    setFormError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (q: ClientQuotation) => {
    setEditingQuote(q);
    setClientName(q.client_name);
    setClientEmail(q.client_email || '');
    setClientPhone(q.client_phone || '');
    setClientAddress(q.client_address || '');
    setQuoteDate(q.date ? new Date(q.date).toISOString().split('T')[0] : '');
    setValidUntil(q.valid_until ? new Date(q.valid_until).toISOString().split('T')[0] : '');
    setStatus(q.status);
    setItems(q.items.length > 0 ? q.items : [{ description: '', quantity: 1, unit: 'sqft', rate: 0, amount: 0 }]);
    setDiscountType(q.discount_type || 'FIXED');
    setDiscountValue(q.discount_value || 0);
    setTaxRate(q.tax_rate ?? 18);
    setTerms(q.terms || '');
    setNotes(q.notes || '');
    setAttachmentFile(null);
    setAttachmentUrl(q.attachment_url || '');
    setShowModal(true);
  };

  const handleItemChange = (index: number, field: keyof QuotationItem, val: any) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: val };
    const q = Number(current.quantity) || 0;
    const r = Number(current.rate) || 0;
    current.amount = q * r;
    updated[index] = current;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { description: '', quantity: 1, unit: 'sqft', rate: 0, amount: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  // Calculations
  const subtotal = items.reduce((sum: number, it: QuotationItem) => sum + (Number(it.quantity || 0) * Number(it.rate || 0)), 0);
  const discountAmount = discountType === 'PERCENT' ? (subtotal * (discountValue / 100)) : discountValue;
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxable * taxRate) / 100;
  const grandTotal = taxable + taxAmount;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      setFormError('Client name is required.');
      return;
    }
    const validItems = items.filter((it: QuotationItem) => it.description.trim());
    if (validItems.length === 0) {
      setFormError('Please add at least one line item with description.');
      return;
    }

    setSaving(true);
    setFormError('');

    let finalAttachmentUrl = attachmentUrl;
    if (attachmentFile) {
      try {
        const uploadData = new FormData();
        uploadData.append('file', attachmentFile);
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const API_BASE = import.meta.env.VITE_API_URL || '/api';
        const uploadRes = await fetch(`${API_BASE}/cloudinary/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: uploadData,
        });
        if (uploadRes.ok) {
          const cloudJson = await uploadRes.json();
          finalAttachmentUrl = cloudJson.result?.secure_url || finalAttachmentUrl;
        }
      } catch (uploadErr) {
        console.warn('Failed to upload quotation document to Cloudinary:', uploadErr);
      }
    }

    const payload = {
      project_id: activeProjectId,
      client_name: clientName.trim(),
      client_email: clientEmail.trim() || undefined,
      client_phone: clientPhone.trim() || undefined,
      client_address: clientAddress.trim() || undefined,
      date: quoteDate,
      valid_until: validUntil || undefined,
      status,
      items: validItems,
      discount_type: discountType,
      discount_value: discountValue,
      tax_rate: taxRate,
      terms,
      notes,
      attachment_url: finalAttachmentUrl || undefined,
    };

    try {
      if (editingQuote) {
        await apiClient.put(`/finance/quotations/${editingQuote.id}`, payload);
      } else {
        await apiClient.post('/finance/quotations', payload);
      }
      setShowModal(false);
      resetForm();
      fetchQuotations();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save quotation');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return;
    try {
      await apiClient.delete(`/finance/quotations/${id}`);
      fetchQuotations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (q: ClientQuotation, newStatus: ClientQuotation['status']) => {
    try {
      await apiClient.put(`/finance/quotations/${q.id}`, { status: newStatus });
      fetchQuotations();
    } catch (err) {
      console.error(err);
    }
  };

  // Generate Branded PDF using jsPDF + autoTable
  const generatePDF = async (q: ClientQuotation) => {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [38, 72, 231]; // #2648E7

    // Header Background Accent Bar
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 8, 'F');

    // Company Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('APNI ESTATE ERP', 14, 24);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Smart Construction & Project Management', 14, 29);
    doc.text(`Project: ${activeProject?.name || 'Commercial Infrastructure'}`, 14, 34);

    // Document Title & Number
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('QUOTATION', 145, 24);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Quote #: ${q.quotation_number}`, 145, 30);
    doc.text(`Date: ${new Date(q.date).toLocaleDateString('en-GB')}`, 145, 35);
    if (q.valid_until) {
      doc.text(`Valid Until: ${new Date(q.valid_until).toLocaleDateString('en-GB')}`, 145, 40);
    }

    // Divider
    doc.setDrawColor(220, 220, 225);
    doc.line(14, 46, 196, 46);

    // Bill To Section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('QUOTATION PREPARED FOR:', 14, 54);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(q.client_name, 14, 60);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 90, 90);
    let billY = 65;
    if (q.client_phone) {
      doc.text(`Phone: ${q.client_phone}`, 14, billY);
      billY += 5;
    }
    if (q.client_email) {
      doc.text(`Email: ${q.client_email}`, 14, billY);
      billY += 5;
    }
    if (q.client_address) {
      doc.text(`Address: ${q.client_address}`, 14, billY);
      billY += 5;
    }

    // Items Table
    const tableData = q.items.map((it, idx) => [
      idx + 1,
      it.description,
      it.quantity.toLocaleString(),
      it.unit,
      `₹${it.rate.toLocaleString('en-IN')}`,
      `₹${it.amount.toLocaleString('en-IN')}`
    ]);

    autoTable(doc, {
      startY: Math.max(billY + 4, 76),
      head: [['#', 'Description', 'Qty', 'Unit', 'Rate (₹)', 'Amount (₹)']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 9,
        cellPadding: 3.5,
        textColor: [40, 40, 40]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 90 },
        2: { cellWidth: 20, halign: 'right' },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
      }
    });

    // Summary calculations block
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    const rightMargin = 196;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);

    doc.text('Subtotal:', 140, finalY);
    doc.text(`₹${q.subtotal.toLocaleString('en-IN')}`, rightMargin, finalY, { align: 'right' });

    let curY = finalY + 6;
    if (q.discount_amount > 0) {
      doc.text(`Discount (${q.discount_type === 'PERCENT' ? `${q.discount_value}%` : 'Flat'}):`, 140, curY);
      doc.text(`-₹${q.discount_amount.toLocaleString('en-IN')}`, rightMargin, curY, { align: 'right' });
      curY += 6;
    }

    if (q.tax_rate > 0) {
      doc.text(`GST / Tax (${q.tax_rate}%):`, 140, curY);
      doc.text(`₹${q.tax_amount.toLocaleString('en-IN')}`, rightMargin, curY, { align: 'right' });
      curY += 6;
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(140, curY, rightMargin, curY);
    curY += 6;

    // Grand Total
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Grand Total:', 140, curY);
    doc.text(`₹${q.grand_total.toLocaleString('en-IN')}`, rightMargin, curY, { align: 'right' });

    // Terms & Conditions Block on the left
    if (q.terms) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text('Terms & Conditions:', 14, finalY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      const splitTerms = doc.splitTextToSize(q.terms, 115);
      doc.text(splitTerms, 14, finalY + 5);
    }

    // Signature Area
    const pageHeight = doc.internal.pageSize.height;
    doc.setDrawColor(200, 200, 200);
    doc.line(140, pageHeight - 30, rightMargin, pageHeight - 30);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('Authorized Signatory', 168, pageHeight - 25, { align: 'center' });
    doc.text('Thank you for your business!', 14, pageHeight - 15);

    // If an attachment/challan/bill photo is present, render it onto an attached page in the PDF
    if (q.attachment_url) {
      doc.addPage();
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      // Top Accent Bar
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageW, 8, 'F');

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('ATTACHED QUOTATION DOCUMENT / BILL PHOTO', 14, 22);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Reference for Quotation #: ${q.quotation_number} (${q.client_name})`, 14, 28);
      doc.text(`Attached on: ${new Date(q.created_at || Date.now()).toLocaleDateString('en-GB')}`, 14, 33);

      doc.setDrawColor(220, 220, 225);
      doc.line(14, 37, pageW - 14, 37);

      try {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = q.attachment_url;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });

        const maxWidth = pageW - 28;
        const maxHeight = pageH - 65;
        const scale = Math.min(maxWidth / (img.width || 1), maxHeight / (img.height || 1));
        const width = (img.width || 100) * scale;
        const height = (img.height || 100) * scale;

        doc.addImage(img, 'JPEG', 14, 45, width, height);

        // Verification stamp
        doc.setFontSize(8);
        doc.setTextColor(140, 140, 140);
        doc.text("Official document photo verified and attached via Apni Estate ERP", 14, pageH - 12);
      } catch (err) {
        console.error("Failed to render attachment onto quotation PDF:", err);
      }
    }

    // Save PDF
    doc.save(`${q.quotation_number}_${q.client_name.replace(/\s+/g, '_')}.pdf`);
  };

  const statusColors: Record<ClientQuotation['status'], { bg: string; text: string; border: string }> = {
    DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
    SENT: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    ACCEPTED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    REJECTED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
            Client Quotations & Estimates
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create professional branded client proposals with line items, GST, discounts & PDF export.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-2 bg-[#2648E7] hover:bg-[#2648E7]/90 text-white text-xs font-bold rounded-xl transition-all shadow-sm inline-flex items-center gap-1.5"
        >
          <Plus size={14} /> New Quotation
        </button>
      </div>

      {/* Quotations List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="size-8 rounded-full border-4 border-[#2648E7] border-t-transparent animate-spin" />
        </div>
      ) : quotations.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-border">
          <FileText size={40} className="mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm font-bold text-foreground">No Quotations Created</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Draft client estimates with custom line items, print professional PDFs, and track client approvals.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-[#2648E7] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            Create First Quotation
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {quotations.map((q: ClientQuotation) => {
            const sc = statusColors[q.status] || statusColors.DRAFT;
            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-border p-4 shadow-sm hover:border-[#2648E7]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#2648E7]">{q.quotation_number}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${sc.bg} ${sc.text} ${sc.border}`}>
                      {q.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(q.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-foreground truncate">{q.client_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {q.items.length} line item{q.items.length !== 1 ? 's' : ''}
                    {q.client_phone && ` · ${q.client_phone}`}
                    {q.valid_until && ` · Valid till: ${new Date(q.valid_until).toLocaleDateString('en-GB')}`}
                  </p>
                  {q.attachment_url && (
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        <Camera size={11} /> Photo / Challan Attached (In PDF)
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-bold text-foreground">
                      ₹{q.grand_total.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Grand Total</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Status quick switch */}
                    <select
                      value={q.status}
                      onChange={(e) => handleUpdateStatus(q, e.target.value as any)}
                      className="text-[10px] font-semibold bg-muted/60 border border-border rounded-lg px-2 py-1.5 focus:outline-none"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="SENT">Sent</option>
                      <option value="ACCEPTED">Accepted</option>
                      <option value="REJECTED">Rejected</option>
                    </select>

                    {/* PDF Download */}
                    <button
                      onClick={() => generatePDF(q)}
                      title="Download Branded PDF"
                      className="p-2 text-[#2648E7] bg-[#2648E7]/8 hover:bg-[#2648E7]/15 rounded-xl transition-colors"
                    >
                      <Download size={15} />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEdit(q)}
                      title="Edit Quotation"
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
                    >
                      <Edit3 size={15} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(q.id)}
                      title="Delete"
                      className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create / Edit Quotation */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl border border-border overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gray-50/70">
              <div>
                <h3 className="text-base font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                  {editingQuote ? 'Edit Quotation' : 'Create Client Quotation'}
                </h3>
                <p className="text-xs text-muted-foreground">Fill in client information and items to generate quote</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-muted rounded-xl text-muted-foreground transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold">
                  {formError}
                </div>
              )}

              {/* Client Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Client / Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Enterprises"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-[#2648E7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-[#2648E7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="client@example.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-[#2648E7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Client Site / Address
                  </label>
                  <input
                    type="text"
                    placeholder="Sector 42, Gurgaon"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-[#2648E7]"
                  />
                </div>
              </div>

              {/* Dates & Status */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Quote Date
                  </label>
                  <input
                    type="date"
                    required
                    value={quoteDate}
                    onChange={(e) => setQuoteDate(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-[#2648E7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-[#2648E7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-[#2648E7]"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="SENT">Sent</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Scope & Line Items ({items.length})
                  </label>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs font-bold text-[#2648E7] hover:underline flex items-center gap-1"
                  >
                    <Plus size={13} /> Add Item
                  </button>
                </div>

                <div className="space-y-2.5">
                  {items.map((it: QuotationItem, idx: number) => (
                    <div key={idx} className="p-3 bg-muted/40 border border-border rounded-xl space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground">Item #{idx + 1}</span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="text-muted-foreground hover:text-red-600 p-1"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Description (e.g. Brick masonry 9-inch wall in CM 1:6)"
                        value={it.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="w-full p-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-[#2648E7]"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            placeholder="Qty"
                            value={it.quantity || ''}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-full p-2 border border-border rounded-lg text-sm bg-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <select
                            value={it.unit}
                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                            className="w-full p-2 border border-border rounded-lg text-sm bg-white focus:outline-none"
                          >
                            <option value="sqft">sqft</option>
                            <option value="cft">cft</option>
                            <option value="cum">cum</option>
                            <option value="bags">bags</option>
                            <option value="kg">kg</option>
                            <option value="m">m</option>
                            <option value="nos">nos</option>
                            <option value="lumpsum">lumpsum</option>
                          </select>
                        </div>
                        <div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            placeholder="Rate (₹)"
                            value={it.rate || ''}
                            onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                            className="w-full p-2 border border-border rounded-lg text-sm bg-white font-semibold focus:outline-none"
                          />
                        </div>
                      </div>
                      <p className="text-right text-xs font-bold text-foreground">
                        Total: ₹{(Number(it.quantity || 0) * Number(it.rate || 0)).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount, Tax & Summary */}
              <div className="p-4 bg-muted/40 border border-border rounded-2xl space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Discount
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as any)}
                        className="w-24 p-2 bg-white border border-border rounded-lg text-xs font-semibold focus:outline-none"
                      >
                        <option value="FIXED">Flat (₹)</option>
                        <option value="PERCENT">Percent (%)</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                        className="flex-1 p-2 bg-white border border-border rounded-lg text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      GST / Tax Rate (%)
                    </label>
                    <select
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-border rounded-lg text-xs font-semibold focus:outline-none"
                    >
                      <option value={0}>0% (Exempt)</option>
                      <option value={5}>5% GST</option>
                      <option value={12}>12% GST</option>
                      <option value={18}>18% GST (Standard)</option>
                      <option value={28}>28% GST</option>
                    </select>
                  </div>
                </div>

                {/* Final Calculation Summary */}
                <div className="pt-2 border-t border-border/80 space-y-1 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-foreground">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Discount:</span>
                      <span className="font-semibold text-red-600">-₹{discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {taxRate > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tax ({taxRate}%):</span>
                      <span className="font-semibold text-foreground">₹{taxAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-[#2648E7] pt-1 border-t border-border">
                    <span>Grand Total:</span>
                    <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Terms & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Terms & Conditions
                  </label>
                  <textarea
                    rows={3}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-xl text-xs focus:outline-none focus:border-[#2648E7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Notes / Remarks
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-xl text-xs focus:outline-none focus:border-[#2648E7]"
                  />
                </div>
              </div>

              {/* Quotation Challan / Bill Document Camera Upload */}
              <div className="pt-2">
                <ChallanCameraUpload
                  label="Quotation Slip / Bill / Reference Drawing (Optional)"
                  helperText="Snap a photo using your device camera or upload a file to attach directly to this Quotation and print inside the generated PDF"
                  value={attachmentFile}
                  currentUrl={attachmentUrl}
                  onChange={(file, previewUrl) => {
                    setAttachmentFile(file);
                    if (!file && !previewUrl) setAttachmentUrl('');
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: '#2648E7' }}
                >
                  {saving ? 'Saving...' : editingQuote ? 'Update Quotation' : 'Create Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
