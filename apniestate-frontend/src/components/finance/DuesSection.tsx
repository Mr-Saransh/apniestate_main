import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  User,
  ArrowUpRight,
  Receipt,
  X,
  Calendar,
  Wallet,
} from 'lucide-react';
import { duesApi, type FinanceDue, type DuesSummary } from '@/api/dues';
import { vendorsApi, type Vendor } from '@/api/vendors';
import { useProject } from '@/context/ProjectContext';

export default function DuesSection() {
  const { activeProjectId } = useProject();
  const [dues, setDues] = useState<FinanceDue[]>([]);
  const [summary, setSummary] = useState<DuesSummary | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PARTIAL' | 'PAID'>('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [isAddDueOpen, setIsAddDueOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [selectedDue, setSelectedDue] = useState<FinanceDue | null>(null);

  // Add Due Form State
  const [partyType, setPartyType] = useState<'VENDOR' | 'PERSON'>('VENDOR');
  const [vendorId, setVendorId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [partyPhone, setPartyPhone] = useState('');
  const [dueTitle, setDueTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // Pay Form State
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('UPI');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');

  const loadDues = async () => {
    try {
      if (dues.length === 0) setLoading(true);
      const res = await duesApi.getDues({
        project_id: activeProjectId || undefined,
        status: statusFilter,
        search: search || undefined,
      });

      if (res.data) {
        setDues(res.data.dues || []);
        setSummary(res.data.summary || null);
      }
    } catch (err) {
      console.error('Failed to load dues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDues();
  }, [activeProjectId, statusFilter]);

  useEffect(() => {
    vendorsApi.getVendors().then((res) => {
      if (res.data) {
        setVendors(res.data);
        if (res.data.length > 0 && !vendorId) {
          setVendorId(res.data[0].id);
          setPartyName(res.data[0].name);
        }
      }
    }).catch(() => {});
  }, []);

  const handleOpenPay = (due: FinanceDue) => {
    setSelectedDue(due);
    setPayAmount(due.remaining_amount.toString());
    setPayMethod('UPI');
    setPayRef('');
    setPayNotes('');
    setPayError('');
    setIsPayOpen(true);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDue) return;

    const amountNum = parseFloat(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setPayError('Please enter a valid payment amount greater than zero.');
      return;
    }

    if (amountNum > selectedDue.remaining_amount + 0.01) {
      setPayError(
        `Payment cannot exceed the remaining due amount of ₹${selectedDue.remaining_amount.toLocaleString('en-IN')}.`
      );
      return;
    }

    setPayLoading(true);
    setPayError('');

    try {
      await duesApi.payDue(selectedDue.id, {
        amount: amountNum,
        payment_method: payMethod,
        reference: payRef.trim() || undefined,
        notes: payNotes.trim() || undefined,
      });

      setIsPayOpen(false);
      setSelectedDue(null);
      await loadDues();
    } catch (err: any) {
      setPayError(err.message || 'Failed to record payment');
    } finally {
      setPayLoading(false);
    }
  };

  const handleAddDueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedParty = partyType === 'VENDOR' ? (vendors.find((v) => v.id === vendorId)?.name || 'Vendor') : partyName.trim();
    const amountNum = parseFloat(totalAmount);

    if (!resolvedParty) {
      setAddError('Please specify the party or vendor name.');
      return;
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      setAddError('Please enter a valid total due amount.');
      return;
    }

    if (!dueTitle.trim()) {
      setAddError('Please enter a title / purpose for this due.');
      return;
    }

    setAddLoading(true);
    setAddError('');

    try {
      await duesApi.createDue({
        project_id: activeProjectId || undefined,
        vendor_id: partyType === 'VENDOR' ? vendorId : undefined,
        party_name: resolvedParty,
        party_phone: partyPhone.trim() || undefined,
        party_type: partyType,
        due_type: partyType === 'VENDOR' ? 'VENDOR_PURCHASE' : 'MANUAL_DUE',
        title: dueTitle.trim(),
        total_amount: amountNum,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        notes: notes.trim() || undefined,
      });

      setIsAddDueOpen(false);
      setDueTitle('');
      setTotalAmount('');
      setPartyPhone('');
      setNotes('');
      setDueDate('');
      await loadDues();
    } catch (err: any) {
      setAddError(err.message || 'Failed to create due');
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-base font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
            Due & Payables Ledger
          </h2>
          <p className="text-xs text-muted-foreground">
            Track vendor purchase dues & party obligations. Select and pay partial or full amounts.
          </p>
        </div>
        <button
          onClick={() => {
            setAddError('');
            setIsAddDueOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all active:scale-95 shrink-0 cursor-pointer"
          style={{ backgroundColor: '#2648E7' }}
        >
          <Plus size={14} /> Add New Due
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3 sm:p-4 rounded-2xl bg-red-50/80 border border-red-200/80 shadow-sm">
          <span className="text-[10px] sm:text-xs font-bold text-red-700 uppercase tracking-wider">
            Total Outstanding
          </span>
          <p className="text-lg sm:text-2xl font-black text-red-700 mt-1 truncate">
            ₹{(summary?.total_due_amount || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-red-600/80 mt-0.5 truncate">
            {summary?.count_pending || 0} pending payment{summary?.count_pending === 1 ? '' : 's'}
          </p>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 shadow-sm">
          <span className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider">
            Total Settled
          </span>
          <p className="text-lg sm:text-2xl font-black text-emerald-700 mt-1 truncate">
            ₹{(summary?.total_paid_amount || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-emerald-600/80 mt-0.5 truncate">Settled to date</p>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 shadow-sm">
          <span className="text-[10px] sm:text-xs font-bold text-[#2648E7] uppercase tracking-wider">
            Total Accrued
          </span>
          <p className="text-lg sm:text-2xl font-black text-[#2648E7] mt-1 truncate">
            ₹{(summary?.total_accrued_amount || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-blue-600/80 mt-0.5 truncate">{summary?.count_total || 0} total dues</p>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
          <span className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">
            Settlement Rate
          </span>
          <p className="text-lg sm:text-2xl font-black text-slate-800 mt-1 truncate">
            {summary?.total_accrued_amount
              ? `${Math.round(((summary.total_paid_amount || 0) / summary.total_accrued_amount) * 100)}%`
              : '0%'}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5 truncate">Dues cleared</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-border">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['ALL', 'UNPAID', 'PARTIAL', 'PAID'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === st
                  ? 'bg-[#2648E7] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Dues' : st === 'UNPAID' ? 'Unpaid' : st === 'PARTIAL' ? 'Partially Paid' : 'Fully Paid'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search vendor or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadDues()}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-border rounded-xl text-xs focus:outline-none focus:border-[#2648E7]"
          />
        </div>
      </div>

      {/* Dues List */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="size-8 rounded-full border-4 border-[#2648E7] border-t-transparent animate-spin" />
          </div>
        ) : dues.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Receipt size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-foreground">No due records found</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Purchases from procurement or new manual dues will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {dues.map((d) => {
              const isSettled = d.status === 'PAID';
              const isPartial = d.status === 'PARTIAL';
              const progressPct = d.total_amount > 0 ? Math.round((d.paid_amount / d.total_amount) * 100) : 0;

              return (
                <div key={d.id} className="p-4 hover:bg-slate-50/70 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Left: Info */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground">{d.title}</span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md uppercase tracking-wider ${
                            isSettled
                              ? 'bg-emerald-100 text-emerald-700'
                              : isPartial
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {isSettled ? 'Fully Paid' : isPartial ? 'Partially Paid' : 'Unpaid'}
                        </span>
                        {d.purchase_order && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-[#2648E7] border border-blue-200/60">
                            Procurement PO
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          {d.party_type === 'VENDOR' ? <Building2 size={13} className="text-[#2648E7]" /> : <User size={13} className="text-purple-600" />}
                          {d.party_name}
                        </span>
                        {d.party_phone && <span>· {d.party_phone}</span>}
                        {d.due_date && (
                          <span>
                            · Due on {new Date(d.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>

                      {d.notes && <p className="text-xs text-slate-500 italic mt-0.5 truncate max-w-lg">{d.notes}</p>}
                    </div>

                    {/* Right: Numbers & Action */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-3 sm:gap-5 shrink-0 pt-2.5 md:pt-0 border-t md:border-t-0 border-border/60">
                      <div className="flex items-center justify-between sm:block text-left md:text-right">
                        <div className="flex items-baseline md:justify-end gap-1.5">
                          <span className="text-xs text-muted-foreground font-semibold">Remaining Due:</span>
                          <span className="text-base sm:text-lg font-black text-red-700">
                            ₹{d.remaining_amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                          Paid: ₹{d.paid_amount.toLocaleString('en-IN')} / Total: ₹{d.total_amount.toLocaleString('en-IN')} ({progressPct}%)
                        </p>
                      </div>

                      {!isSettled ? (
                        <button
                          type="button"
                          onClick={() => handleOpenPay(d)}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                          style={{ backgroundColor: '#2648E7' }}
                        >
                          <IndianRupee size={13} /> Pay Due
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-600 px-3 py-1.5 bg-emerald-50 rounded-xl">
                          <CheckCircle2 size={14} /> Settled
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-300 ${isSettled ? 'bg-emerald-500' : 'bg-[#2648E7]'}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pay Due Modal */}
      {isPayOpen && selectedDue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl shadow-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-[#2648E7]/10 flex items-center justify-center text-[#2648E7]">
                  <IndianRupee size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Record Due Payment</h3>
                  <p className="text-[11px] text-muted-foreground truncate max-w-xs">{selectedDue.title}</p>
                </div>
              </div>
              <button onClick={() => setIsPayOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg text-muted-foreground cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {payError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-red-500" />
                  <span>{payError}</span>
                </div>
              )}

              {/* Due Summary Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Payee / Party:</span>
                  <span className="font-bold text-foreground">{selectedDue.party_name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Total Incurred:</span>
                  <span className="font-bold text-foreground">₹{selectedDue.total_amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Already Paid:</span>
                  <span className="font-bold text-emerald-600">₹{selectedDue.paid_amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-px bg-slate-200 my-1" />
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-red-700">Remaining Balance Due:</span>
                  <span className="font-black text-red-700 text-sm">
                    ₹{selectedDue.remaining_amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Amount Input: User can pay partial or full, but not exceeding due */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Payment Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setPayAmount(selectedDue.remaining_amount.toString())}
                    className="text-[11px] font-bold text-[#2648E7] hover:underline"
                  >
                    Pay Full (₹{selectedDue.remaining_amount.toLocaleString('en-IN')})
                  </button>
                </div>
                <input
                  type="number"
                  required
                  min="0.01"
                  max={selectedDue.remaining_amount}
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full p-2.5 border border-border rounded-xl text-base font-extrabold text-foreground focus:outline-none focus:border-[#2648E7]"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  You can enter any amount up to ₹{selectedDue.remaining_amount.toLocaleString('en-IN')} (partial payments allowed).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Payment Method
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full p-2.5 bg-white border border-border rounded-xl text-xs font-semibold focus:outline-none focus:border-[#2648E7]"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Ref / Cheque #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TXN-8921"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-xl text-xs focus:outline-none focus:border-[#2648E7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cleared via petty cash"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full p-2.5 border border-border rounded-xl text-xs focus:outline-none focus:border-[#2648E7]"
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayOpen(false)}
                  disabled={payLoading}
                  className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#2648E7' }}
                >
                  {payLoading && <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Due Modal (Vendors or New People) */}
      {isAddDueOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-[#2648E7]/10 flex items-center justify-center text-[#2648E7]">
                  <Plus size={18} />
                </div>
                <h3 className="font-bold text-base text-foreground">Add New Due Entry</h3>
              </div>
              <button onClick={() => setIsAddDueOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg text-muted-foreground cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddDueSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {addError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-red-500" />
                  <span>{addError}</span>
                </div>
              )}

              {/* Party Type Toggle: Vendor vs New Person */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPartyType('VENDOR')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    partyType === 'VENDOR' ? 'bg-white text-[#2648E7] shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  Registered Vendor
                </button>
                <button
                  type="button"
                  onClick={() => setPartyType('PERSON')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    partyType === 'PERSON' ? 'bg-white text-purple-600 shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  New Person / Entity
                </button>
              </div>

              {partyType === 'VENDOR' ? (
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Select Vendor <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={vendorId}
                    onChange={(e) => {
                      setVendorId(e.target.value);
                      const found = vendors.find((v) => v.id === e.target.value);
                      if (found) setPartyName(found.name);
                    }}
                    className="w-full p-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-[#2648E7]"
                  >
                    <option value="" disabled>Choose vendor...</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} ({v.phone || 'No phone'})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Person / Entity Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suresh Carpenter / Shivam Hardware"
                      value={partyName}
                      onChange={(e) => setPartyName(e.target.value)}
                      className="w-full p-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-[#2648E7]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={partyPhone}
                      onChange={(e) => setPartyPhone(e.target.value)}
                      className="w-full p-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-[#2648E7]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Due Title / Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brick Supply batch 2 / Plumbing contract balance"
                  value={dueTitle}
                  onChange={(e) => setDueTitle(e.target.value)}
                  className="w-full p-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-[#2648E7]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Due Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder="0.00"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-xl text-sm font-bold focus:outline-none focus:border-[#2648E7]"
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
                  Additional Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Payment due after site engineer inspection"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-[#2648E7]"
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDueOpen(false)}
                  disabled={addLoading}
                  className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#2648E7' }}
                >
                  {addLoading && <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Save Due
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
