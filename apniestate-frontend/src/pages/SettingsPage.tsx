import React, { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usersApi } from '@/api/users';
import { companiesApi } from '@/api/companies';
import {
  X,
  LogOut,
  AlertTriangle,
  Building2,
  Shield,
  User,
  Bell,
  CheckCircle2,
  Save,
  Pencil,
  Sparkles,
  IndianRupee,
  MapPin,
  FileText,
  BadgePercent,
  Check,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();

  // Modal control
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  // Profile Form Fields
  const [formName, setFormName] = useState(user?.name || '');
  const [formEmail, setFormEmail] = useState(user?.email || '');
  const [formPhone, setFormPhone] = useState(user?.phone || '');

  // Company Settings Editable State (Indian Business Configuration)
  const [companyName, setCompanyName] = useState('Apni Estate Realty Private Limited');
  const [gstin, setGstin] = useState('27AABCA1234F1Z5');
  const [panCin, setPanCin] = useState('U45200MH2023PTC398214');
  const [regAddress, setRegAddress] = useState('Level 8, BKC Commercial Tower, Bandra Kurla Complex, Mumbai, Maharashtra 400051');
  const [defaultCurrency, setDefaultCurrency] = useState('INR — Indian Rupee (₹)');
  const [gstRate, setGstRate] = useState('18% (CGST 9% + SGST 9%)');
  const [tdsRate, setTdsRate] = useState('1% (Sec 194C) / 2% (Sec 194J)');
  const [poThreshold, setPoThreshold] = useState('5,00,000');
  const [expenseThreshold, setExpenseThreshold] = useState('50,000');
  const [invoiceCeoThreshold, setInvoiceCeoThreshold] = useState('1,00,00,000');

  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormError('');
    setSubmitting(true);

    try {
      const res = await usersApi.update(user.id, {
        name: formName,
        email: formEmail,
        phone: formPhone || undefined,
      });

      if (res.success && res.data) {
        updateUser({
          ...user,
          name: formName,
          email: formEmail,
          phone: formPhone || null,
        });
        setShowEditModal(false);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCompanySettings = () => {
    setIsEditingCompany(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDeleteCompany = async () => {
    if (!user?.company_id) return;
    setSubmitting(true);
    try {
      await companiesApi.deleteCompany(user.company_id);
      window.location.href = '/companies';
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete workspace');
      setSubmitting(false);
    }
  };

  const role =
    user?.role === 'BUILDER' || user?.role === 'ADMIN'
      ? 'Builder (Owner)'
      : (user?.role || 'User').replace(/_/g, ' ');

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 pb-32 animate-in fade-in duration-300">
      {/* Header & Logout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1
            className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Settings & Global Configuration
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
            Personal profile, company identity, tax compliance, and approval limits
          </p>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* Save Toast */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs md:text-sm font-bold flex items-center gap-2.5 shadow-sm animate-in slide-in-from-top-2 duration-300">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>Company configuration settings saved successfully!</span>
        </div>
      )}

      {/* 1. Personal Profile Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-black text-sm uppercase tracking-wider">
            <User size={18} className="text-[#2648E7]" />
            <span>Personal Profile</span>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="text-xs font-bold bg-[#2648E7]/10 text-[#2648E7] hover:bg-[#2648E7]/20 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
          >
            <Pencil size={13} />
            <span>Edit Profile</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2648E7] to-[#4F6DFF] flex items-center justify-center text-white text-xl font-black shrink-0 shadow-md shadow-[#2648E7]/20">
            {user?.name?.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() || 'AS'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900 truncate">{user?.name || 'Aditya Sharma'}</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              <span className="text-[#2648E7] font-bold">{role}</span> · {user?.email || 'admin@gmail.com'}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {user?.phone || '+91-9820112233'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Company Information Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-black text-sm uppercase tracking-wider">
            <Building2 size={18} className="text-[#2648E7]" />
            <span>Company Information</span>
          </div>
          <button
            onClick={() => setIsEditingCompany(!isEditingCompany)}
            className="text-xs font-bold text-slate-600 hover:text-[#2648E7] px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
          >
            <Pencil size={13} />
            <span>{isEditingCompany ? 'Done Editing' : 'Edit Info'}</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-1 sm:gap-4">
            <span className="text-xs font-semibold text-slate-500">Company Name</span>
            {isEditingCompany ? (
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="p-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 w-full sm:w-80 outline-none focus:border-[#2648E7]"
              />
            ) : (
              <span className="text-xs font-bold text-slate-900 text-left sm:text-right">{companyName}</span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-1 sm:gap-4">
            <span className="text-xs font-semibold text-slate-500">Registered GSTIN (India)</span>
            {isEditingCompany ? (
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="p-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 w-full sm:w-80 outline-none focus:border-[#2648E7]"
              />
            ) : (
              <span className="text-xs font-bold text-slate-900 text-left sm:text-right font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">{gstin}</span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-1 sm:gap-4">
            <span className="text-xs font-semibold text-slate-500">Registered PAN / CIN</span>
            {isEditingCompany ? (
              <input
                type="text"
                value={panCin}
                onChange={(e) => setPanCin(e.target.value)}
                className="p-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 w-full sm:w-80 outline-none focus:border-[#2648E7]"
              />
            ) : (
              <span className="text-xs font-bold text-slate-900 text-left sm:text-right font-mono">{panCin}</span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-1 sm:gap-4">
            <span className="text-xs font-semibold text-slate-500">Registered Office Address</span>
            {isEditingCompany ? (
              <input
                type="text"
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
                className="p-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 w-full sm:w-80 outline-none focus:border-[#2648E7]"
              />
            ) : (
              <span className="text-xs font-bold text-slate-900 text-left sm:text-right max-w-md">{regAddress}</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Finance, Tax & Currency (India) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-black text-sm uppercase tracking-wider">
          <Shield size={18} className="text-[#2648E7]" />
          <span>Finance & Tax Configuration</span>
        </div>

        <div className="divide-y divide-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-1 sm:gap-4">
            <span className="text-xs font-semibold text-slate-500">Default Currency</span>
            <span className="text-xs font-bold text-slate-900 text-left sm:text-right flex items-center gap-1">
              <span className="px-2 py-0.5 rounded bg-blue-50 text-[#2648E7] font-extrabold">INR (₹)</span>
              <span>Indian Rupee</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-1 sm:gap-4">
            <span className="text-xs font-semibold text-slate-500">GST Standard Rate</span>
            {isEditingCompany ? (
              <input
                type="text"
                value={gstRate}
                onChange={(e) => setGstRate(e.target.value)}
                className="p-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 w-full sm:w-80 outline-none focus:border-[#2648E7]"
              />
            ) : (
              <span className="text-xs font-bold text-slate-900 text-left sm:text-right">{gstRate}</span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-1 sm:gap-4">
            <span className="text-xs font-semibold text-slate-500">TDS / Withholding Tax (Labor)</span>
            {isEditingCompany ? (
              <input
                type="text"
                value={tdsRate}
                onChange={(e) => setTdsRate(e.target.value)}
                className="p-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 w-full sm:w-80 outline-none focus:border-[#2648E7]"
              />
            ) : (
              <span className="text-xs font-bold text-slate-900 text-left sm:text-right">{tdsRate}</span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Approval Thresholds Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-black text-sm uppercase tracking-wider">
          <Bell size={18} className="text-[#2648E7]" />
          <span>Automated Approval Thresholds</span>
        </div>

        <div className="divide-y divide-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-1 sm:gap-4">
            <span className="text-xs font-semibold text-slate-500">Purchase Order Auto-Approve Below</span>
            {isEditingCompany ? (
              <div className="flex items-center gap-1 w-full sm:w-80">
                <span className="text-xs font-bold text-slate-500">₹</span>
                <input
                  type="text"
                  value={poThreshold}
                  onChange={(e) => setPoThreshold(e.target.value)}
                  className="p-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 flex-1 outline-none focus:border-[#2648E7]"
                />
              </div>
            ) : (
              <span className="text-xs font-bold text-slate-900 text-left sm:text-right font-mono">₹{poThreshold}</span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-1 sm:gap-4">
            <span className="text-xs font-semibold text-slate-500">Expense Auto-Approve Below</span>
            {isEditingCompany ? (
              <div className="flex items-center gap-1 w-full sm:w-80">
                <span className="text-xs font-bold text-slate-500">₹</span>
                <input
                  type="text"
                  value={expenseThreshold}
                  onChange={(e) => setExpenseThreshold(e.target.value)}
                  className="p-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 flex-1 outline-none focus:border-[#2648E7]"
                />
              </div>
            ) : (
              <span className="text-xs font-bold text-slate-900 text-left sm:text-right font-mono">₹{expenseThreshold}</span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-1 sm:gap-4">
            <span className="text-xs font-semibold text-slate-500">Invoice Requires Managing Director Above</span>
            {isEditingCompany ? (
              <div className="flex items-center gap-1 w-full sm:w-80">
                <span className="text-xs font-bold text-slate-500">₹</span>
                <input
                  type="text"
                  value={invoiceCeoThreshold}
                  onChange={(e) => setInvoiceCeoThreshold(e.target.value)}
                  className="p-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 flex-1 outline-none focus:border-[#2648E7]"
                />
              </div>
            ) : (
              <span className="text-xs font-bold text-slate-900 text-left sm:text-right font-mono">₹{invoiceCeoThreshold}</span>
            )}
          </div>
        </div>
      </div>

      {/* Save Button with elevation & clearance */}
      <button
        onClick={handleSaveCompanySettings}
        className="w-full py-4 bg-gradient-to-r from-[#2648E7] to-[#4F6DFF] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#2648E7]/30 hover:shadow-xl hover:shadow-[#2648E7]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
      >
        <Save size={18} />
        <span>Save Company Settings</span>
      </button>

      {/* Danger Zone */}
      {(user?.role === 'BUILDER' || (user?.role as string) === 'COMPANY_ADMIN' || user?.role === 'ADMIN') && (
        <div className="pt-4">
          <div className="p-6 rounded-3xl bg-red-50/50 border border-red-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-red-700 font-black text-sm uppercase tracking-wider">
              <AlertTriangle size={18} />
              <span>Danger Zone</span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-900">Delete Workspace</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Permanently delete this company and all its construction & CRM data. This action is irreversible.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shrink-0"
              >
                Delete Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
                Edit Profile
              </h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-[#2648E7]"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-[#2648E7]"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91-98..."
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-[#2648E7]"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-[#2648E7] text-white text-xs font-bold hover:bg-[#1e3bbd] transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Workspace Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-red-100 bg-red-50/50">
              <h2 className="text-base font-black text-red-600 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <AlertTriangle size={18} /> Delete Workspace
              </h2>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                This will permanently delete the workspace <strong>"{companyName}"</strong> and all its associated data (projects, sites, users, finances). This action <strong>cannot be undone</strong>.
              </p>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Type "{companyName}" to confirm
                </label>
                <input
                  type="text"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-500"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                />
              </div>

              {formError && <div className="text-red-500 text-xs font-medium">{formError}</div>}

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCompany}
                  disabled={submitting || deleteConfirmationText !== companyName}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
