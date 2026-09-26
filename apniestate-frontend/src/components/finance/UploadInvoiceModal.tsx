import React, { useState, useEffect } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { invoicesApi, type Invoice } from '@/api/invoices';
import { vendorsApi, type Vendor } from '@/api/vendors';
import { duesApi } from '@/api/dues';
import { apiClient } from '@/api/client';
import ChallanCameraUpload from '@/components/shared/ChallanCameraUpload';

interface UploadInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedInvoiceId?: string;
  projectId?: string | null;
}

export default function UploadInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedInvoiceId,
  projectId
}: UploadInvoiceModalProps) {
  const [mode, setMode] = useState<'EXISTING' | 'NEW'>('NEW');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(preselectedInvoiceId || '');
  
  // Simplified invoice fields: keep ONLY amount, vendor/party, date, notes
  const [vendorId, setVendorId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [isCustomParty, setIsCustomParty] = useState(false);
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (preselectedInvoiceId) {
        setMode('EXISTING');
        setSelectedInvoiceId(preselectedInvoiceId);
      }
      Promise.all([
        invoicesApi.getInvoices({ project_id: projectId || undefined }).catch(() => ({ data: [] })),
        vendorsApi.getVendors().catch(() => ({ data: [] }))
      ]).then(([invRes, venRes]) => {
        if (invRes.data) setInvoices(invRes.data);
        if (venRes.data) {
          setVendors(venRes.data);
          if (venRes.data.length > 0 && !vendorId) {
            setVendorId(venRes.data[0].id);
            setPartyName(venRes.data[0].name);
          }
        }
      });
    }
  }, [isOpen, preselectedInvoiceId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError('');

    if (selected.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(selected));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an invoice document (PDF or image).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Upload to Cloudinary
      const uploadData = new FormData();
      uploadData.append('file', file);
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_URL || '/api';

      const uploadRes = await fetch(`${API_BASE}/cloudinary/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadData
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        throw new Error(`Cloudinary upload failed: ${errText || uploadRes.statusText}`);
      }

      const cloudData = await uploadRes.json();
      const uploadedResult = cloudData.result || cloudData;
      const secureUrl = uploadedResult.secure_url;
      const publicId = uploadedResult.public_id;

      let targetInvoiceId = selectedInvoiceId;
      const parsedAmount = parseFloat(amount);

      // 2. If new invoice mode, create the invoice first
      if (mode === 'NEW') {
        const resolvedPartyName = isCustomParty ? partyName.trim() : (vendors.find(v => v.id === vendorId)?.name || 'Vendor');
        const resolvedVendorId = isCustomParty ? (vendors[0]?.id || '') : vendorId;

        if (!resolvedPartyName || !parsedAmount || parsedAmount <= 0) {
          throw new Error('Please fill in Vendor / Party Name and a valid Amount.');
        }

        // Auto-generate invoice number (no user input needed)
        const autoNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;

        const invPayload = {
          number: autoNumber,
          vendor_id: resolvedVendorId,
          project_id: projectId || undefined,
          amount: parsedAmount,
          tax_amount: 0,
          total: parsedAmount,
          due_date: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
          status: 'DRAFT' as const,
          notes: notes ? `${notes} [Party: ${resolvedPartyName}]` : `Invoice for ${resolvedPartyName}`
        };

        const createRes = await invoicesApi.createInvoice(invPayload);
        const createdInvoice = (createRes as any).data || createRes;
        targetInvoiceId = createdInvoice.id;

        // Automatically register as a Due in Finance as well
        try {
          await duesApi.createDue({
            project_id: projectId || undefined,
            vendor_id: isCustomParty ? undefined : vendorId,
            party_name: resolvedPartyName,
            party_type: isCustomParty ? 'PERSON' : 'VENDOR',
            due_type: 'MANUAL_DUE',
            title: `Invoice ${autoNumber} - ${notes || resolvedPartyName}`,
            total_amount: parsedAmount,
            due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
            notes: notes || `Attached invoice: ${file.name}`
          });
        } catch (dueErr) {
          console.error('Failed to auto-register due for invoice:', dueErr);
        }
      }

      if (!targetInvoiceId) {
        throw new Error('Target invoice could not be resolved.');
      }

      // 3. Create Attachment linked to Invoice
      await apiClient.post('/attachments', {
        entity_type: 'INVOICE',
        entity_id: targetInvoiceId,
        category: 'Invoice Document',
        file_name: file.name,
        original_name: file.name,
        mime_type: file.type || 'application/pdf',
        file_size: file.size,
        secure_url: secureUrl,
        cloudinary_public_id: publicId
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Invoice upload error:', err);
      setError(err.message || 'Failed to upload invoice.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gray-50/70">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-[#2648E7]/10 flex items-center justify-center text-[#2648E7]">
              <UploadCloud size={18} />
            </div>
            <h2 className="font-bold text-base text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
              Upload Vendor Invoice
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg text-muted-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Switch */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
            <button
              type="button"
              onClick={() => setMode('NEW')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'NEW' ? 'bg-white text-[#2648E7] shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              + Create New Invoice
            </button>
            <button
              type="button"
              onClick={() => setMode('EXISTING')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'EXISTING' ? 'bg-white text-[#2648E7] shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Attach to Existing
            </button>
          </div>

          {/* File & Camera input area */}
          <div>
            <ChallanCameraUpload
              label="Invoice / Bill Document (PDF or Photo)"
              helperText="Snap a photo of the vendor bill using your camera or choose a file from your device"
              value={file}
              onChange={(newFile, preview) => {
                setFile(newFile);
                setError('');
                if (preview) {
                  setPreviewUrl(preview);
                } else if (newFile && newFile.type.startsWith('image/')) {
                  setPreviewUrl(URL.createObjectURL(newFile));
                } else {
                  setPreviewUrl(null);
                }
              }}
            />
          </div>

          {mode === 'EXISTING' ? (
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Select Existing Invoice <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
                className="w-full p-2.5 bg-white border border-border rounded-xl text-sm font-medium focus:outline-none focus:border-[#2648E7]"
              >
                <option value="" disabled>Choose an invoice...</option>
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.number} — {inv.vendor?.name || 'Vendor'} (₹{inv.total.toLocaleString()}) [{inv.status}]
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {isCustomParty ? 'Party / Person Name' : 'Vendor'} <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomParty(!isCustomParty)}
                    className="text-[11px] font-bold text-[#2648E7] hover:underline"
                  >
                    {isCustomParty ? '← Select Existing Vendor' : '+ New Person / Other'}
                  </button>
                </div>

                {isCustomParty ? (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar / Sharma Electricals"
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-[#2648E7]"
                  />
                ) : (
                  <select
                    required
                    value={vendorId}
                    onChange={(e) => {
                      setVendorId(e.target.value);
                      const found = vendors.find(v => v.id === e.target.value);
                      if (found) setPartyName(found.name);
                    }}
                    className="w-full p-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-[#2648E7]"
                  >
                    <option value="" disabled>Select vendor...</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:border-[#2648E7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-[#2648E7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Notes / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Material supply for Foundation Phase"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-[#2648E7]"
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: '#2648E7' }}
            >
              {loading && <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Uploading...' : 'Save & Attach Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
