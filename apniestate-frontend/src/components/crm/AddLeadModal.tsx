import React, { useState, useEffect } from 'react';
import {
  X, UserPlus, Phone, Mail, MapPin, Tag, Building2, UserCheck,
  UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2, Download,
  Info, Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { crmApi, type CrmLead, type CrmTeamMember } from '@/api/crm';
import { useProject } from '@/context/ProjectContext';
import { useAuth } from '@/context/AuthContext';
import { getUserCrmRole } from '@/config/crm-permissions';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (lead?: CrmLead) => void;
  initialMode?: 'MANUAL' | 'BULK';
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

export default function AddLeadModal({ isOpen, onClose, onSuccess, initialMode = 'MANUAL' }: AddLeadModalProps) {
  const { projects, activeProjectId } = useProject();
  const { user } = useAuth();
  const crmRole = getUserCrmRole(user);
  const isManagerOrBuilder = crmRole === 'BUILDER' || crmRole === 'CRM_MANAGER' || user?.role === 'BUILDER' || user?.role === 'ADMIN';

  const [entryMode, setEntryMode] = useState<'MANUAL' | 'BULK'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<CrmTeamMember[]>([]);

  // ─── Manual Form State ───
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    type: 'BUYER' as 'BUYER' | 'SELLER' | 'INVESTOR' | 'RENTER',
    status: 'NEW' as 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'SITE_VISIT' | 'NEGOTIATION' | 'BOOKED' | 'LOST',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    budget: '',
    city: '',
    source: 'Website',
    project_id: activeProjectId || '',
    assigned_to: '',
    tagInput: '',
    tags: [] as string[],
    notes: '',
  });

  // ─── Bulk Import State ───
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [detectedColumns, setDetectedColumns] = useState<{ mapped: string[]; extra: string[] }>({ mapped: [], extra: [] });
  const [importStats, setImportStats] = useState<{ created: number; updated: number; skipped: number; total: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEntryMode(initialMode);
      setError(null);
      setImportStats(null);
      setParsedRows([]);
      setFile(null);
      if (isManagerOrBuilder) {
        crmApi.getTeam().then((res) => {
          if (res.success && res.data) {
            setTeamMembers(res.data.members.filter((m) => m.status === 'ACTIVE' && m.crm_role !== 'BUILDER'));
          }
        }).catch(() => {});
      }
    }
  }, [isOpen, initialMode, isManagerOrBuilder]);

  if (!isOpen) return null;

  // ─── Manual Form Handlers ───
  const handleAddTag = () => {
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: '',
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove),
    }));
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Lead name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await crmApi.createLead({
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        type: formData.type,
        status: formData.status,
        priority: formData.priority,
        budget: formData.budget.trim() || undefined,
        city: formData.city.trim() || undefined,
        source: formData.source,
        project_id: formData.project_id || undefined,
        assigned_to: isManagerOrBuilder ? (formData.assigned_to || undefined) : undefined,
        tags: formData.tags,
        notes: formData.notes.trim() || undefined,
      });

      if (res.success && res.data) {
        onSuccess(res.data);
        onClose();
      } else {
        setError(res.error?.message || 'Failed to create lead');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong while creating the lead');
    } finally {
      setLoading(false);
    }
  };

  // ─── Bulk Import Handlers ───
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

        const firstRow = rawData[0];
        const headers = Object.keys(firstRow);
        const mappedSet = new Set<string>();
        const extraSet = new Set<string>();

        const columnMapping: Record<string, string> = {};
        headers.forEach(h => {
          const canonical = matchCanonicalField(h);
          if (canonical) {
            columnMapping[h] = canonical;
            mappedSet.add(canonical);
          } else {
            extraSet.add(h);
          }
        });

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
              leadObj.extra_attributes[header] = strVal;
            }
          }

          return leadObj;
        }).filter(r => r.name);

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
        'Full Name': 'Amit Verma',
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

  const handleBulkImportSubmit = async () => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Segmented Choice Switcher */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-9 rounded-xl bg-[#2648E7] text-white flex items-center justify-center shadow-sm shrink-0">
              {entryMode === 'MANUAL' ? <UserPlus size={18} /> : <UploadCloud size={18} />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {entryMode === 'MANUAL' ? 'Add New Lead' : 'Bulk Import Leads'}
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                {entryMode === 'MANUAL'
                  ? 'Add single lead manually with custom details'
                  : 'Import multiple leads from Excel or CSV file'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            {/* Mode Switcher Tabs */}
            <div className="flex p-1 bg-slate-200/80 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => { setEntryMode('MANUAL'); setError(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                  entryMode === 'MANUAL'
                    ? 'bg-white text-[#2648E7] shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus size={13} />
                <span>Add Manually</span>
              </button>

              <button
                type="button"
                onClick={() => { setEntryMode('BULK'); setError(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                  entryMode === 'BULK'
                    ? 'bg-white text-[#2648E7] shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UploadCloud size={13} />
                <span>Bulk Import</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors shrink-0"
              title="Close"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* ─── OPTION 1: MANUAL LEAD ENTRY FORM ───────────────────────────── */}
        {entryMode === 'MANUAL' && (
          <form onSubmit={handleManualSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Name & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Email & City */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. ramesh@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Location / City</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Mumbai, Sector 15"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Assign to Telecaller (Builder / Manager Only) */}
            {isManagerOrBuilder && (
              <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200/60">
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <UserCheck size={14} className="text-[#2648E7]" />
                  <span>Assign to Telecaller / Sales Executive</span>
                </label>
                <select
                  value={formData.assigned_to}
                  onChange={e => setFormData({ ...formData, assigned_to: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs font-semibold bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
                >
                  <option value="">⚠️ Unassigned Pool (Leave for Smart Distribution)</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.crm_role === 'CRM_MANAGER' ? 'Manager' : 'Executive'}) — {m.assigned_leads_count} current leads
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Type, Status, Priority */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lead Type</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
                >
                  <option value="BUYER">Buyer</option>
                  <option value="SELLER">Seller</option>
                  <option value="INVESTOR">Investor</option>
                  <option value="RENTER">Renter</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
                >
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="SITE_VISIT">Site Visit</option>
                  <option value="NEGOTIATION">Negotiation</option>
                  <option value="BOOKED">Booked</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
                >
                  <option value="HIGH">🔥 Hot (High)</option>
                  <option value="MEDIUM">⚡ Warm (Med)</option>
                  <option value="LOW">🌱 Cold (Low)</option>
                </select>
              </div>
            </div>

            {/* Budget & Source */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Budget Range</label>
                <input
                  type="text"
                  value={formData.budget}
                  onChange={e => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="e.g. ₹60L - ₹80L"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lead Source</label>
                <select
                  value={formData.source}
                  onChange={e => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
                >
                  <option value="Website">Website Form</option>
                  <option value="MagicBricks">MagicBricks</option>
                  <option value="99acres">99acres</option>
                  <option value="Housing.com">Housing.com</option>
                  <option value="Meta Ads">Facebook / Instagram Ads</option>
                  <option value="Google Ads">Google Ads</option>
                  <option value="Referral">Customer Referral</option>
                  <option value="Walk-in">Walk-in Inquiry</option>
                  <option value="Channel Partner">Channel Partner (Broker)</option>
                  <option value="Cold Call">Cold Outreach</option>
                </select>
              </div>
            </div>

            {/* Project Association */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Building2 size={13} className="text-slate-400" />
                <span>Associated Property Project</span>
              </label>
              <select
                value={formData.project_id}
                onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
              >
                <option value="">General Inquiry (No Specific Project)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Tag size={13} className="text-slate-400" />
                <span>Tags / Keywords</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.tagInput}
                  onChange={e => setFormData({ ...formData, tagInput: e.target.value })}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="e.g. 3BHK, Urgent, NRI (Press Enter to add)"
                  className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2648E7]"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Add Tag
                </button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.tags.map(t => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-[#2648E7] border border-blue-100"
                    >
                      <span>{t}</span>
                      <button type="button" onClick={() => handleRemoveTag(t)} className="hover:opacity-75">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Initial Notes</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g. Inquired for 3BHK east facing on 5th floor..."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7] transition-all"
              />
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-bold text-white bg-[#2648E7] hover:bg-[#1e3bbd] rounded-xl shadow-md shadow-[#2648E7]/20 disabled:opacity-50 transition-all flex items-center gap-1.5 active:scale-95"
              >
                {loading ? 'Creating...' : 'Create Lead'}
              </button>
            </div>
          </form>
        )}

        {/* ─── OPTION 2: BULK IMPORT LEADS (CSV / EXCEL) ────────────────── */}
        {entryMode === 'BULK' && (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {error && (
              <div className="p-3 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Statistics Banner */}
            {importStats ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 size={20} className="text-emerald-600" />
                  <span>Bulk Import Completed Successfully!</span>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-1 text-center text-xs">
                  <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-slate-400 font-bold block">Created</span>
                    <span className="text-base font-extrabold text-emerald-700">{importStats.created}</span>
                  </div>
                  <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-slate-400 font-bold block">Updated</span>
                    <span className="text-base font-extrabold text-blue-700">{importStats.updated}</span>
                  </div>
                  <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-slate-400 font-bold block">Skipped</span>
                    <span className="text-base font-extrabold text-slate-500">{importStats.skipped}</span>
                  </div>
                  <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-slate-400 font-bold block">Total</span>
                    <span className="text-base font-extrabold text-slate-900">{importStats.total}</span>
                  </div>
                </div>
                <p className="text-[11px] text-emerald-700 italic">
                  Duplicate phone numbers were safely synchronized without creating duplicate lead entries.
                </p>
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                  >
                    Done & View Leads
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Guidance & Sample Download Banner */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900">
                  <div className="flex items-center gap-2">
                    <Info size={16} className="text-[#2648E7] shrink-0" />
                    <span>Need a starting spreadsheet template? Download our sample.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadSample}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#2648E7] hover:bg-[#1e3bbd] shadow-sm flex items-center gap-1.5 shrink-0 ml-2 active:scale-95"
                  >
                    <Download size={13} /> Sample .xlsx
                  </button>
                </div>

                {/* Upload Dropzone */}
                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-6 text-center hover:border-[#2648E7] transition-colors bg-slate-50/50">
                  <FileSpreadsheet className="w-10 h-10 text-[#2648E7] mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-bold text-slate-800">Upload your Lead Spreadsheet</p>
                  <p className="text-xs text-slate-500 mt-0.5 mb-4">
                    Supports Excel (<code>.xlsx</code>, <code>.xls</code>) or <code>.csv</code> files
                  </p>

                  <label className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#2648E7] rounded-xl hover:bg-[#1e3bbd] cursor-pointer shadow-sm active:scale-95 transition-all">
                    <UploadCloud size={16} /> Choose File
                    <input
                      type="file"
                      accept=".csv, .xlsx, .xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {file && <p className="text-xs font-semibold text-slate-700 mt-3">Selected file: <strong>{file.name}</strong></p>}
                </div>

                {/* Smart Attribute Handling Indicator */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                  <p className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" /> Smart Lead Recognition:
                  </p>
                  <ul className="text-slate-600 list-disc list-inside space-y-0.5 text-[11px]">
                    <li><strong>Flexible Columns:</strong> Standard headers like Name, Phone, Email, Budget, City, Priority are recognized automatically.</li>
                    <li><strong>Extra Columns:</strong> Custom columns (e.g. <em>Requirement, Facing, Possession</em>) are automatically retained in lead notes.</li>
                    <li><strong>Role Ownership:</strong> Telecaller imports are automatically attributed to the telecaller; Builder imports enter the company workspace.</li>
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
                          +{detectedColumns.extra.length} extra columns saved to notes
                        </span>
                      )}
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto text-xs shadow-inner">
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
                          {parsedRows.slice(0, 6).map((row, idx) => (
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
                    {parsedRows.length > 6 && (
                      <p className="text-[11px] text-slate-400 italic">Showing first 6 of {parsedRows.length} leads in file.</p>
                    )}
                  </div>
                )}

                {/* Footer Actions for Bulk Import */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={loading || parsedRows.length === 0}
                    onClick={handleBulkImportSubmit}
                    className="px-5 py-2 text-xs font-bold text-white bg-[#2648E7] hover:bg-[#1e3bbd] rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2 active:scale-95"
                  >
                    {loading ? (
                      <>
                        <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Importing...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={15} />
                        <span>Import {parsedRows.length} Leads</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
