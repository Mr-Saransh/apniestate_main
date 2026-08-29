import React, { useState } from 'react';
import {
  X, UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2,
  Download, HelpCircle, Info, Sparkles, ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { crmApi } from '@/api/crm';

interface ImportLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Canonical known attributes and their common variations/aliases
const ALIAS_MAP: Record<string, string[]> = {
  name: ['name', 'full name', 'fullname', 'lead name', 'customer', 'customer name', 'client', 'client name', 'contact person', 'prospect'],
  phone: ['phone', 'mobile', 'contact', 'phone number', 'phonenumber', 'mobile number', 'mobilenumber', 'tel', 'cell', 'whatsapp', 'phone no', 'mobile no'],
  email: ['email', 'e-mail', 'email address', 'mail', 'email id', 'emailid'],
  budget: ['budget', 'price', 'max budget', 'cost', 'amount', 'investment', 'budget range', 'target price'],
  city: ['city', 'location', 'area', 'town', 'address', 'locality', 'state', 'preferred location'],
  status: ['status', 'stage', 'lead status', 'pipeline status', 'deal stage'],
  priority: ['priority', 'urgency', 'importance', 'lead priority'],
  type: ['type', 'lead type', 'category', 'interest', 'buyer type'],
  source: ['source', 'lead source', 'channel', 'campaign', 'origin', 'platform'],
  tags: ['tags', 'tag', 'keywords', 'labels', 'category tags'],
  notes: ['notes', 'note', 'remarks', 'comments', 'description', 'requirement', 'requirements', 'preference', 'preferences'],
};

export default function ImportLeadsModal({ isOpen, onClose, onSuccess }: ImportLeadsModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [detectedColumns, setDetectedColumns] = useState<{ mapped: string[]; extra: string[] }>({ mapped: [], extra: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importStats, setImportStats] = useState<{ created: number; updated: number; skipped: number; total: number } | null>(null);

  if (!isOpen) return null;

  // Normalize column header string to find best match
  const matchCanonicalField = (header: string): string | null => {
    const clean = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [canonical, aliases] of Object.entries(ALIAS_MAP)) {
      for (const alias of aliases) {
        if (clean === alias.replace(/[^a-z0-9]/g, '')) {
          return canonical;
        }
      }
    }
    return null;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setError(null);
    setImportStats(null);

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

        if (!rawData || rawData.length === 0) {
          setError('The uploaded sheet is empty. Please check the file.');
          return;
        }

        // Identify headers
        const firstRow = rawData[0];
        const headers = Object.keys(firstRow);
        const mappedSet = new Set<string>();
        const extraSet = new Set<string>();

        const columnMapping: Record<string, string> = {}; // rawHeader -> canonicalField
        headers.forEach(h => {
          const canonical = matchCanonicalField(h);
          if (canonical) {
            columnMapping[h] = canonical;
            mappedSet.add(canonical);
          } else {
            extraSet.add(h);
          }
        });

        // Parse and normalize every row
        const normalizedList = rawData.map(row => {
          const leadObj: Record<string, any> = {
            name: '',
            phone: '',
            email: '',
            budget: '',
            city: '',
            source: 'Import',
            status: 'NEW',
            priority: 'MEDIUM',
            type: 'BUYER',
            tags: [],
            notes: '',
            extra_attributes: {} as Record<string, any>,
          };

          for (const [header, val] of Object.entries(row)) {
            const canonical = columnMapping[header];
            const strVal = String(val).trim();

            if (canonical) {
              if (canonical === 'tags') {
                leadObj.tags = strVal ? strVal.split(/[,;|]/).map(t => t.trim()).filter(Boolean) : [];
              } else {
                leadObj[canonical] = strVal;
              }
            } else if (strVal) {
              // Store unrecognized/extra columns into extra_attributes so no info is lost
              leadObj.extra_attributes[header] = strVal;
            }
          }

          return leadObj;
        }).filter(r => r.name); // Filter out rows without at least a name

        if (normalizedList.length === 0) {
          setError('Could not find valid leads with a Name column in this file. Please verify column headers.');
          return;
        }

        setDetectedColumns({ mapped: Array.from(mappedSet), extra: Array.from(extraSet) });
        setParsedRows(normalizedList);
      } catch (err: any) {
        setError(`Failed to read file: ${err.message}`);
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleDownloadSample = () => {
    const sampleData = [
      {
        'Full Name': 'Vikram Mehra',
        'Phone Number': '9876543210',
        'Email Address': 'vikram@example.com',
        'Budget': '₹85 Lakhs',
        'City': 'Mumbai, Andheri West',
        'Lead Status': 'NEW',
        'Priority': 'HIGH',
        'Lead Type': 'BUYER',
        'Source': 'MagicBricks',
        'Requirement': 'Looking for 3BHK ready to move, sea view preference',
        'Possession Year': '2026',
      },
      {
        'Full Name': 'Sneha Patil',
        'Phone Number': '9123456789',
        'Email Address': 'sneha@example.com',
        'Budget': '₹1.5 Cr',
        'City': 'Pune, Baner',
        'Lead Status': 'SITE_VISIT',
        'Priority': 'MEDIUM',
        'Lead Type': 'INVESTOR',
        'Source': 'Referral',
        'Requirement': 'Commercial office space or penthouse',
        'Possession Year': '2027',
      },
      {
        'Full Name': 'Amit Verma (Minimal Info Example)',
        'Phone Number': '9811223344',
        'Email Address': '',
        'Budget': '₹50 Lakhs',
        'City': 'Delhi NCR',
        'Lead Status': 'NEW',
        'Priority': 'LOW',
        'Lead Type': 'BUYER',
        'Source': 'Walk-in',
        'Requirement': '2BHK affordable housing',
        'Possession Year': '',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample Leads');
    XLSX.writeFile(wb, 'ApniEstate_Sample_Leads_Template.xlsx');
  };

  const handleImportSubmit = async () => {
    if (parsedRows.length === 0) return;

    try {
      setLoading(true);
      setError(null);
      const res = await crmApi.importLeads(parsedRows);
      if (res.success && res.data) {
        setImportStats(res.data as any);
        onSuccess();
      } else {
        setError(res.message || 'Import failed');
      }
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#2648E7] to-[#1e3bbd] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10">
              <UploadCloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Smart Bulk Lead Import</h2>
              <p className="text-xs text-white/80">Upload CSV or Excel (.xlsx) — auto-maps missing & extra columns</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-4 flex-1">
          {error && (
            <div className="p-3 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Statistics */}
          {importStats && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 size={20} className="text-emerald-600" />
                <span>Bulk Import Completed Successfully!</span>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
                <div className="bg-white/80 p-2 rounded-xl">
                  <span className="text-slate-400 font-bold block">Created</span>
                  <span className="text-base font-extrabold text-emerald-700">{importStats.created}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl">
                  <span className="text-slate-400 font-bold block">Updated</span>
                  <span className="text-base font-extrabold text-blue-700">{importStats.updated}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl">
                  <span className="text-slate-400 font-bold block">Skipped</span>
                  <span className="text-base font-extrabold text-slate-500">{importStats.skipped}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl">
                  <span className="text-slate-400 font-bold block">Total</span>
                  <span className="text-base font-extrabold text-slate-900">{importStats.total}</span>
                </div>
              </div>
              <p className="text-[11px] text-emerald-700 italic pt-1">
                Duplicate phone numbers within your company were safely updated without duplicate entries.
              </p>
            </div>
          )}

          {!importStats && (
            <>
              {/* Guidance & Sample Download Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-[#2648E7] shrink-0" />
                  <span>Have questions on formatting? Download our pre-configured template.</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#2648E7] hover:bg-[#1e3bbd] shadow-sm flex items-center gap-1 shrink-0 ml-2"
                >
                  <Download size={13} /> Sample .xlsx
                </button>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-[#2648E7] transition-colors bg-slate-50/50">
                <FileSpreadsheet className="w-10 h-10 text-[#2648E7] mx-auto mb-2 opacity-80" />
                <p className="text-sm font-bold text-slate-800">Drag & Drop your Lead Spreadsheet</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Supports Excel (<code>.xlsx</code>, <code>.xls</code>) or <code>.csv</code> format
                </p>

                <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#2648E7] rounded-xl hover:bg-[#1e3bbd] cursor-pointer shadow-sm active:scale-95 transition-all">
                  <UploadCloud size={16} /> Choose File
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {file && <p className="text-xs font-semibold text-slate-700 mt-3">Selected: {file.name}</p>}
              </div>

              {/* Robust Attribute Handling Indicator */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" /> Smart Attribute Handling:
                </p>
                <ul className="text-slate-600 list-disc list-inside space-y-0.5 text-[11px]">
                  <li><strong>Fewer attributes?</strong> Missing fields (status, priority, budget, type) auto-fill with standard defaults.</li>
                  <li><strong>More attributes?</strong> Extra fields (e.g. <em>Requirement, Remarks, Possession Year</em>) are automatically saved into the lead notes.</li>
                  <li><strong>Duplicates?</strong> Matches existing leads by phone number and updates details instead of creating duplicates.</li>
                </ul>
              </div>

              {/* Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Preview: {parsedRows.length} valid leads detected
                    </span>
                    {detectedColumns.extra.length > 0 && (
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                        +{detectedColumns.extra.length} extra columns merged to notes
                      </span>
                    )}
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto text-xs shadow-inner">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="p-2">Name</th>
                          <th className="p-2">Phone</th>
                          <th className="p-2">Email</th>
                          <th className="p-2">Budget</th>
                          <th className="p-2">City</th>
                          <th className="p-2">Priority</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.slice(0, 8).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-slate-900">{row.name}</td>
                            <td className="p-2 text-slate-600 font-semibold">{row.phone || '—'}</td>
                            <td className="p-2 text-slate-600">{row.email || '—'}</td>
                            <td className="p-2 text-slate-600 font-semibold">{row.budget || '—'}</td>
                            <td className="p-2 text-slate-600">{row.city || '—'}</td>
                            <td className="p-2">
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                                {row.priority || 'MEDIUM'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedRows.length > 8 && (
                    <p className="text-[11px] text-slate-400 italic">Showing first 8 of {parsedRows.length} rows.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            {importStats ? 'Close' : 'Cancel'}
          </button>
          {!importStats && (
            <button
              type="button"
              disabled={loading || parsedRows.length === 0}
              onClick={handleImportSubmit}
              className="px-5 py-2 text-sm font-bold text-white bg-[#2648E7] hover:bg-[#1e3bbd] rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2 active:scale-95"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <UploadCloud size={16} />
              )}
              Import {parsedRows.length} Leads
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
