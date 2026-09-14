import React, { useState, useEffect } from 'react';
import { X, IndianRupee, Building2, CheckCircle2, Users, AlertCircle } from 'lucide-react';
import { crmApi, type CrmLead, type ChannelPartner, type CrmProperty } from '@/api/crm';

interface AddDealModalProps {
  lead: CrmLead | null;
  leads?: CrmLead[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddDealModal({
  lead,
  leads = [],
  isOpen,
  onClose,
  onSuccess,
}: AddDealModalProps) {
  const [selectedLeadId, setSelectedLeadId] = useState(lead?.id || '');
  const [customerName, setCustomerName] = useState(lead?.name || '');
  const [propertyName, setPropertyName] = useState(lead?.project?.name || '');
  const [properties, setProperties] = useState<CrmProperty[]>([]);
  const [partners, setPartners] = useState<ChannelPartner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [referralCode, setReferralCode] = useState<string>('');
  
  // Financial amounts
  const [dealValue, setDealValue] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  const [commission, setCommission] = useState('');

  const [paymentMode, setPaymentMode] = useState('UPI');
  const [transactionId, setTransactionId] = useState('');
  const [dealDate, setDealDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        crmApi.getChannelPartners().catch(() => ({ data: [] })),
        crmApi.getProperties().catch(() => ({ data: [] })),
      ]).then(([partRes, propRes]) => {
        if (partRes.data) setPartners(partRes.data);
        if (propRes.data) setProperties(propRes.data);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (lead) {
      setSelectedLeadId(lead.id);
      setCustomerName(lead.name);
      setPropertyName(lead.project?.name || '');
    } else if (leads.length > 0 && !selectedLeadId) {
      setSelectedLeadId(leads[0].id);
      setCustomerName(leads[0].name);
    }
  }, [lead, leads]);

  // Handle partner selection and auto-calculate commission
  const handlePartnerSelect = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    if (!partnerId) {
      setReferralCode('');
      return;
    }
    const found = partners.find((p) => p.id === partnerId);
    if (found) {
      setReferralCode(found.referral_code);
      if (found.commission_rate && dealValue) {
        const val = parseFloat(dealValue) || 0;
        const comm = Math.round((val * found.commission_rate) / 100);
        setCommission(comm.toString());
      }
    }
  };

  // Re-calculate commission when deal value changes if partner is selected
  const handleDealValueChange = (val: string) => {
    setDealValue(val);
    const num = parseFloat(val) || 0;
    if (selectedPartnerId) {
      const found = partners.find((p) => p.id === selectedPartnerId);
      if (found && found.commission_rate) {
        const comm = Math.round((num * found.commission_rate) / 100);
        setCommission(comm.toString());
      }
    }
  };

  const parsedDealValue = parseFloat(dealValue) || 0;
  const parsedReceived = parseFloat(amountReceived) || 0;
  const calculatedDue = Math.max(0, parsedDealValue - parsedReceived);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !customerName.trim()) {
      setError('Please select a lead and customer name');
      return;
    }

    if (parsedDealValue <= 0) {
      setError('Please enter a valid total deal / property value');
      return;
    }

    if (parsedReceived > parsedDealValue) {
      setError('Amount received cannot be greater than the total property deal value');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await crmApi.createDeal({
        lead_id: selectedLeadId,
        customer_name: customerName.trim(),
        property_name: propertyName.trim() || undefined,
        deal_value: parsedDealValue,
        amount_received: parsedReceived,
        due_amount: calculatedDue,
        commission: parseFloat(commission) || 0,
        channel_partner_id: selectedPartnerId || undefined,
        referral_code: referralCode.trim() || undefined,
        payment_mode: paymentMode,
        transaction_id: transactionId.trim() || undefined,
        deal_date: new Date(dealDate).toISOString(),
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Failed to record deal');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to record deal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10">
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Record Customer Deal</h2>
              <p className="text-xs text-white/80">Track property sale, customer payments, due balance & CP referral</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-3 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          {!lead && leads.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Lead</label>
              <select
                value={selectedLeadId}
                onChange={(e) => {
                  setSelectedLeadId(e.target.value);
                  const found = leads.find((l) => l.id === e.target.value);
                  if (found) {
                    setCustomerName(found.name);
                    setPropertyName(found.project?.name || '');
                  }
                }}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600"
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.phone || 'No phone'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Property / Unit Done</label>
              <input
                type="text"
                required
                list="property-suggestions"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                placeholder="e.g. Skyline Tower A - 402"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600"
              />
              <datalist id="property-suggestions">
                {properties.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.price ? `₹${p.price}` : p.type || 'Property'})
                  </option>
                ))}
              </datalist>
            </div>
          </div>

          {/* Channel Partner Suggestion / Referral Code */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <Users size={14} className="text-amber-700" />
              <span>Channel Partner / Referral Code</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">
                  Select Partner
                </label>
                <select
                  value={selectedPartnerId}
                  onChange={(e) => handlePartnerSelect(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-200 rounded-lg focus:outline-none focus:border-amber-600"
                >
                  <option value="">Direct / No Channel Partner</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.referral_code}) {p.commission_rate ? `- ${p.commission_rate}%` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">
                  Referral Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. CP-RAJ-8421"
                  value={referralCode}
                  onChange={(e) => {
                    const code = e.target.value.toUpperCase();
                    setReferralCode(code);
                    const matched = partners.find((p) => p.referral_code.toUpperCase() === code);
                    if (matched) {
                      setSelectedPartnerId(matched.id);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-amber-200 rounded-lg focus:outline-none focus:border-amber-600 uppercase"
                />
              </div>
            </div>
          </div>

          {/* Financial Amounts with Paid vs Due Calculation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Property Value (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={dealValue}
                onChange={(e) => handleDealValueChange(e.target.value)}
                placeholder="2000000"
                className="w-full px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Total agreed deal</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer Paid (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="200000"
                className="w-full px-3 py-2 text-sm font-bold text-emerald-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Token / initial payment</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CP Commission (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                placeholder="40000"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Brokerage fee</span>
            </div>
          </div>

          {/* Live Calculation Banner */}
          {parsedDealValue > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="text-xs">
                <span className="text-muted-foreground font-medium">Customer Paid: </span>
                <span className="font-extrabold text-emerald-700">₹{parsedReceived.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground font-medium">Customer Due Balance: </span>
                <span className="font-extrabold text-red-700">₹{calculatedDue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600"
              >
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Direct Transfer">NEFT / RTGS / Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Ref / Cheque #</label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. TXN-99823412"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Deal Date</label>
            <input
              type="date"
              required
              value={dealDate}
              onChange={(e) => setDealDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Terms</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Booking token received. Agreement signing on 15th."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Record Deal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
