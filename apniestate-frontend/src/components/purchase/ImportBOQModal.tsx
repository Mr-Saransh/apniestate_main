import React, { useState } from 'react';
import {
  X, UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2,
  Download, HelpCircle, ArrowRight, Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { purchaseApi } from '@/api/purchase';

interface ImportBOQModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
}

// Canonical known attributes for BOQ items and their Revit / Tekla / Excel common headers
const ALIAS_MAP: Record<string, string[]> = {
  name: ['item', 'name', 'item name', 'material', 'material name', 'description', 'item description', 'family and type', 'family & type', 'part', 'part mark', 'profile', 'specification'],
  planned: ['quantity', 'qty', 'count', 'planned', 'planned quantity', 'volume', 'area', 'length', 'weight', 'total qty', 'planned qty', 'boq qty'],
  unit: ['unit', 'uom', 'unit of measure', 'units', 'dimension'],
  rate: ['rate', 'unit rate', 'unit price', 'price', 'material rate', 'cost/unit', 'estimated rate', 'cost per unit', 'amount/unit'],
  category: ['category', 'discipline', 'trade', 'phase', 'work package', 'boq category', 'head', 'subhead', 'classification'],
  code: ['code', 'item code', 'mark', 'part number', 'omniclass', 'uniformat', 'assembly code', 'ref']
};

export default function ImportBOQModal({ isOpen, onClose, onSuccess, projectId }: ImportBOQModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({
    name: '',
    planned: '',
    unit: '',
    rate: '',
    category: '',
    code: ''
  });
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  if (!isOpen) return null;

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
    setImportedCount(null);

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

        if (!rawData || rawData.length === 0) {
          setError('The uploaded sheet has no rows. Please verify your file.');
          return;
        }

        const headers = Object.keys(rawData[0]);
        setRawHeaders(headers);
        setRawRows(rawData);

        // Auto-detect mappings
        const detectedMappings: Record<string, string> = {
          name: '',
          planned: '',
          unit: '',
          rate: '',
          category: '',
          code: ''
        };

        headers.forEach(h => {
          const match = matchCanonicalField(h);
          if (match && !detectedMappings[match]) {
            detectedMappings[match] = h;
          }
        });

        setMappings(detectedMappings);
        setStep('mapping');
      } catch (err: any) {
        setError(`Failed to parse file: ${err.message}`);
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleDownloadSample = () => {
    const sampleData = [
      {
        'Item Description': 'M25 Grade Ready Mix Concrete',
        'Quantity': 120,
        'Unit': 'cum',
        'Rate': 4800,
        'Category': 'Civil Works',
        'Code': 'CONC-01'
      },
      {
        'Item Description': 'Fe 500 TMT Steel Rebar',
        'Quantity': 15,
        'Unit': 'ton',
        'Rate': 58000,
        'Category': 'Steel Reinforcement',
        'Code': 'STL-01'
      },
      {
        'Item Description': 'Solid Concrete Blocks 8x8x16',
        'Quantity': 4500,
        'Unit': 'nos',
        'Rate': 45,
        'Category': 'Masonry',
        'Code': 'BLK-01'
      },
      {
        'Item Description': 'Ultratech PPC Cement',
        'Quantity': 600,
        'Unit': 'bags',
        'Rate': 380,
        'Category': 'Masonry',
        'Code': 'CEM-01'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample_BOQ');
    XLSX.writeFile(wb, 'ApniEstate_Sample_BOQ.xlsx');
  };

  // Compile validated items based on current mappings
  const compiledItems = rawRows.map((row, idx) => {
    const rawName = mappings.name ? String(row[mappings.name] || '').trim() : '';
    const rawQty = mappings.planned ? parseFloat(String(row[mappings.planned] || '0').replace(/[^0-9.]/g, '')) : 0;
    const rawUnit = mappings.unit ? String(row[mappings.unit] || '').trim() : 'nos';
    const rawRate = mappings.rate ? parseFloat(String(row[mappings.rate] || '0').replace(/[^0-9.]/g, '')) : 0;
    const rawCategory = mappings.category ? String(row[mappings.category] || '').trim() : 'General';
    const rawCode = mappings.code ? String(row[mappings.code] || '').trim() : '';

    const isValid = rawName.length > 0 && !isNaN(rawQty) && rawQty > 0;

    return {
      rowIndex: idx + 1,
      name: rawName || `Unnamed Item #${idx + 1}`,
      planned: isNaN(rawQty) ? 0 : rawQty,
      unit: rawUnit || 'nos',
      rate: isNaN(rawRate) ? 0 : rawRate,
      category: rawCategory || 'General',
      code: rawCode,
      isValid
    };
  });

  const validItems = compiledItems.filter(i => i.isValid);
  const invalidItems = compiledItems.filter(i => !i.isValid);

  const handleImport = async () => {
    if (validItems.length === 0) {
      setError('No valid items found to import.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Chunk items to avoid massive request payloads if necessary
      const payloadItems = validItems.map(item => ({
        name: item.name,
        planned: item.planned,
        unit: item.unit,
        rate: item.rate,
        category: item.category,
        code: item.code
      }));

      await purchaseApi.performAction('CREATE_BOQ_ITEM', {
        projectId,
        items: payloadItems
      });

      setImportedCount(validItems.length);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to import BOQ items');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-[#2648E7]/10 text-[#2648E7] flex items-center justify-center font-bold">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                Import BOQ (Bill of Quantities)
              </h2>
              <p className="text-xs text-muted-foreground">Import schedule data from Revit, Tekla, or Excel/CSV</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-xl transition-colors">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-medium">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {importedCount !== null ? (
            <div className="py-12 text-center flex flex-col items-center">
              <div className="size-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-lg font-bold text-foreground">Import Successful!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Successfully added {importedCount} items into your project BOQ.
              </p>
            </div>
          ) : step === 'upload' ? (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-border hover:border-[#2648E7] rounded-2xl p-8 text-center transition-colors bg-muted/20">
                <UploadCloud size={44} className="mx-auto text-muted-foreground/60 mb-3" />
                <p className="text-sm font-bold text-foreground">Click to upload or drag & drop schedule file</p>
                <p className="text-xs text-muted-foreground mt-1">Supports Excel (.xlsx, .xls) and CSV (.csv)</p>
                <label className="mt-4 inline-block px-5 py-2.5 bg-[#2648E7] hover:bg-[#2648E7]/90 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm transition-colors">
                  Choose File
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <div className="bg-[#2648E7]/5 border border-[#2648E7]/20 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-[#2648E7]/10 text-[#2648E7] flex items-center justify-center shrink-0">
                    <FileSpreadsheet size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Need a starting template?</p>
                    <p className="text-[11px] text-muted-foreground">Download our pre-formatted sample Excel file with standard headers.</p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadSample}
                  className="px-3 py-1.5 bg-white border border-border hover:bg-muted text-foreground text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
                >
                  <Download size={13} /> Sample File
                </button>
              </div>
            </div>
          ) : step === 'mapping' ? (
            <div className="space-y-5">
              <div className="bg-muted/40 p-3.5 rounded-xl text-xs text-muted-foreground flex items-center justify-between">
                <span>File: <strong className="text-foreground">{file?.name}</strong> ({rawRows.length} rows detected)</span>
                <button onClick={() => setStep('upload')} className="text-[#2648E7] font-bold hover:underline">Change File</button>
              </div>

              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Column Mapping</h4>
                <p className="text-xs text-muted-foreground mb-3">Map columns from your Revit/Tekla/Excel export to Apni Estate BOQ fields:</p>
                
                <div className="space-y-3">
                  {[
                    { key: 'name', label: 'Item / Material Description', required: true },
                    { key: 'planned', label: 'Planned Quantity', required: true },
                    { key: 'unit', label: 'Unit of Measure', required: false },
                    { key: 'rate', label: 'Unit Rate (₹)', required: false },
                    { key: 'category', label: 'Category / Trade', required: false },
                    { key: 'code', label: 'Item / Assembly Code', required: false },
                  ].map(({ key, label, required }) => (
                    <div key={key} className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center p-2.5 rounded-xl border border-border bg-white">
                      <div>
                        <span className="text-xs font-bold text-foreground">{label}</span>
                        {required && <span className="text-red-500 font-bold ml-1">*</span>}
                      </div>
                      <select
                        value={mappings[key] || ''}
                        onChange={e => setMappings({ ...mappings, [key]: e.target.value })}
                        className="w-full text-xs font-medium bg-muted/40 border border-border rounded-lg p-2 focus:outline-none focus:border-[#2648E7]"
                      >
                        <option value="">-- Not Mapped (Use default) --</option>
                        {rawHeaders.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Preview Step */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mr-2">
                    {validItems.length} Valid Items
                  </span>
                  {invalidItems.length > 0 && (
                    <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      {invalidItems.length} Skipped
                    </span>
                  )}
                </div>
                <button onClick={() => setStep('mapping')} className="text-[#2648E7] font-bold hover:underline">
                  Adjust Mapping
                </button>
              </div>

              <div className="border border-border rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted text-muted-foreground sticky top-0">
                    <tr>
                      <th className="p-2.5 font-bold">Item Description</th>
                      <th className="p-2.5 font-bold">Category</th>
                      <th className="p-2.5 font-bold">Qty</th>
                      <th className="p-2.5 font-bold">Unit</th>
                      <th className="p-2.5 font-bold">Rate</th>
                      <th className="p-2.5 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {compiledItems.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className={row.isValid ? "hover:bg-muted/20" : "bg-red-50/50 opacity-60"}>
                        <td className="p-2.5 font-medium text-foreground truncate max-w-[180px]">{row.name}</td>
                        <td className="p-2.5 text-muted-foreground">{row.category}</td>
                        <td className="p-2.5 font-bold text-foreground">{row.planned}</td>
                        <td className="p-2.5 text-muted-foreground">{row.unit}</td>
                        <td className="p-2.5 text-foreground">{row.rate > 0 ? `₹${row.rate}` : '--'}</td>
                        <td className="p-2.5">
                          {row.isValid ? (
                            <span className="text-emerald-600 font-bold text-[10px]">Valid</span>
                          ) : (
                            <span className="text-red-500 font-bold text-[10px]">Invalid Qty/Name</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {compiledItems.length > 50 && (
                <p className="text-[11px] text-muted-foreground text-center">
                  Showing first 50 of {compiledItems.length} items. All valid rows will be imported.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {importedCount === null && (
          <div className="px-6 py-3.5 bg-muted/20 border-t border-border flex items-center justify-between">
            {step !== 'upload' ? (
              <button
                onClick={() => setStep(step === 'preview' ? 'mapping' : 'upload')}
                className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
              >
                Back
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
              >
                Cancel
              </button>

              {step === 'mapping' && (
                <button
                  disabled={!mappings.name || !mappings.planned}
                  onClick={() => setStep('preview')}
                  className="px-5 py-2 bg-[#2648E7] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-[#2648E7]/90 transition-colors flex items-center gap-1.5"
                >
                  Preview Mapping <ArrowRight size={13} />
                </button>
              )}

              {step === 'preview' && (
                <button
                  disabled={loading || validItems.length === 0}
                  onClick={handleImport}
                  className="px-5 py-2 bg-[#2648E7] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-[#2648E7]/90 transition-colors flex items-center gap-1.5"
                >
                  {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Confirm Import ({validItems.length} Items)
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
